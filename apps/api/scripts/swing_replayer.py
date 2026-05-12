#!/usr/bin/env python3
"""Swing-replayer CLI — regression testing for swing analytics.

Reads exported swing JSON (one file per swing, the format produced by
the iOS SwingInspectorView's "Export as JSON fixture" button) and runs
the same derivations the app does:

  • Tempo ratio (backswing seconds / downswing seconds)
  • Hand speed (mph) — peakRotationRate * arm_length * mph_factor
  • Estimated club speed (mph) — hand × per-club lever ratio
  • Plane axis (principal eigenvector of downswing rotation-rate
    covariance, computed via 32 iterations of the power method)
  • Pressure index — (HR_impact - resting) / (HR_max - resting)

Usage:
    python apps/api/scripts/swing_replayer.py FIXTURE.json [FIXTURE2.json …]
    python apps/api/scripts/swing_replayer.py --check expected.json fixture.json

`--check` mode reads an `expected.json` map of {field: value} and exits
non-zero when any derived value drifts beyond the per-field tolerance.
Used in CI to catch unintended changes to the analytics maths.

Mirrors `apps/ios/StrikeLabCaddie/Models/SwingAnalytics.swift`.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any


# ---- Constants — must mirror SwingAnalytics.swift ----

DEFAULT_ARM_M = 0.70
MPH_PER_MPS = 2.23694
LEVER_RATIO_BY_GROUP = {
    "driver": 3.20,
    "wood": 3.00,
    "hybrid": 2.90,
    "iron": 2.70,
    "wedge": 2.40,
    "putt": 1.00,
}


def club_group(name: str) -> str:
    n = (name or "").lower()
    if n.startswith("driver"):
        return "driver"
    if "wood" in n:
        return "wood"
    if "hybrid" in n:
        return "hybrid"
    if "iron" in n:
        return "iron"
    if "putt" in n:
        return "putt"
    return "wedge"


# ---- Math helpers ----

def magnitude(x: float, y: float, z: float) -> float:
    return math.sqrt(x * x + y * y + z * z)


def power_iteration(cov: list[list[float]], iters: int = 32) -> tuple[float, float, float]:
    # Start from the deterministic seed (1,1,1)/sqrt(3).
    s = 1.0 / math.sqrt(3.0)
    v = [s, s, s]
    for _ in range(iters):
        nx = cov[0][0] * v[0] + cov[0][1] * v[1] + cov[0][2] * v[2]
        ny = cov[1][0] * v[0] + cov[1][1] * v[1] + cov[1][2] * v[2]
        nz = cov[2][0] * v[0] + cov[2][1] * v[1] + cov[2][2] * v[2]
        m = math.sqrt(nx * nx + ny * ny + nz * nz)
        if m < 1e-12:
            break
        v = [nx / m, ny / m, nz / m]
    if v[0] < 0:
        v = [-v[0], -v[1], -v[2]]
    return tuple(v)  # type: ignore[return-value]


# ---- Derivations ----

def derive(event: dict[str, Any]) -> dict[str, Any]:
    motion = event.get("motionData") or {}
    samples: list[dict[str, float]] = motion.get("samples") or []
    phases = motion.get("phases") or {}
    dt = float(motion.get("sampleInterval") or 0.01)
    arm = DEFAULT_ARM_M

    # Tempo
    bw_idx = phases.get("backswingStartIdx")
    top_idx = phases.get("topIdx")
    impact_idx = phases.get("impactIdx")
    finish_idx = phases.get("finishIdx")
    tempo = None
    if None not in (bw_idx, top_idx, impact_idx):
        bw = max(0.0, (top_idx - bw_idx) * dt)
        dw = max(0.0, (impact_idx - top_idx) * dt)
        if bw > 0 and dw > 0.001:
            tempo = bw / dw

    # Speeds
    peak_rotation = float(motion.get("peakRotationRate") or 0)
    hand_mps = peak_rotation * arm
    hand_mph = hand_mps * MPH_PER_MPS
    club_raw = event.get("clubRawValue") or ""
    lever = LEVER_RATIO_BY_GROUP[club_group(club_raw)]
    club_mph = hand_mph * lever

    # Plane axis
    plane = (1.0, 0.0, 0.0)
    if top_idx is not None and impact_idx is not None and impact_idx > top_idx + 1:
        slice_ = samples[top_idx : impact_idx + 1]
        n = len(slice_)
        if n > 1:
            mx = sum(s["gx"] for s in slice_) / n
            my = sum(s["gy"] for s in slice_) / n
            mz = sum(s["gz"] for s in slice_) / n
            c00 = c01 = c02 = c11 = c12 = c22 = 0.0
            for s in slice_:
                vx = s["gx"] - mx
                vy = s["gy"] - my
                vz = s["gz"] - mz
                c00 += vx * vx
                c01 += vx * vy
                c02 += vx * vz
                c11 += vy * vy
                c12 += vy * vz
                c22 += vz * vz
            n = float(n)
            cov = [
                [c00 / n, c01 / n, c02 / n],
                [c01 / n, c11 / n, c12 / n],
                [c02 / n, c12 / n, c22 / n],
            ]
            plane = power_iteration(cov)

    # Pressure
    hr_data = event.get("heartRateData") or {}
    hr_at_impact = float(hr_data.get("heartRate") or 0)
    pressure = None
    if hr_at_impact > 0:
        resting = 60.0
        max_hr = 185.0
        reserve = max(1.0, max_hr - resting)
        frac = (hr_at_impact - resting) / reserve
        pressure = max(0.0, min(1.0, frac))

    return {
        "tempo_ratio": tempo,
        "hand_mph": hand_mph,
        "club_mph": club_mph,
        "plane_axis": plane,
        "phases": {
            "backswing_start": bw_idx,
            "top": top_idx,
            "impact": impact_idx,
            "finish": finish_idx,
        },
        "pressure_index": pressure,
        "club": club_raw,
        "id": event.get("id"),
        "captured_at": (motion.get("capturedAt")),
    }


# ---- CLI ----

def cmd_summary(paths: list[Path]) -> int:
    for path in paths:
        try:
            event = json.loads(path.read_text())
        except Exception as exc:
            print(f"{path}: failed to read ({exc})", file=sys.stderr)
            continue
        d = derive(event)
        print(f"\n=== {path.name} ===")
        print(json.dumps(d, indent=2, default=str))
    return 0


def cmd_check(expected_path: Path, fixture_paths: list[Path]) -> int:
    expected = json.loads(expected_path.read_text())
    tolerances = {
        "tempo_ratio": 0.001,
        "hand_mph": 0.05,
        "club_mph": 0.5,
        "pressure_index": 0.005,
        "plane_axis_dot": 0.001,
    }
    failed = 0
    for path in fixture_paths:
        event = json.loads(path.read_text())
        d = derive(event)
        for key in ("tempo_ratio", "hand_mph", "club_mph", "pressure_index"):
            ev = expected.get(key)
            ac = d.get(key)
            if ev is None or ac is None:
                continue
            if abs(ev - ac) > tolerances[key]:
                print(f"FAIL {path.name}: {key} expected {ev}, got {ac}",
                      file=sys.stderr)
                failed += 1
        # Plane axis: compare via dot product (1.0 = identical direction).
        ev = expected.get("plane_axis")
        ac = d.get("plane_axis")
        if ev is not None and ac is not None:
            dot = ev[0] * ac[0] + ev[1] * ac[1] + ev[2] * ac[2]
            if abs(dot - 1.0) > tolerances["plane_axis_dot"]:
                print(f"FAIL {path.name}: plane_axis dot {dot:.4f}",
                      file=sys.stderr)
                failed += 1
    if failed:
        print(f"\n{failed} mismatches", file=sys.stderr)
        return 1
    print(f"OK — {len(fixture_paths)} fixture(s) matched")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Swing analytics replayer")
    parser.add_argument(
        "--check",
        type=Path,
        help="Path to expected.json. Exits non-zero on drift.",
    )
    parser.add_argument(
        "fixtures",
        type=Path,
        nargs="+",
        help="One or more swing JSON fixtures (the format produced by the iOS SwingInspectorView).",
    )
    args = parser.parse_args()
    if args.check is not None:
        return cmd_check(args.check, args.fixtures)
    return cmd_summary(args.fixtures)


if __name__ == "__main__":
    raise SystemExit(main())
