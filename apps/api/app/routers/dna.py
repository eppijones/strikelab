"""Player Shot DNA — read + recompute.

Phase 1 baseline: per-club average carry, dispersion left/right, and a
top-level consistency score.

Phase 4 extension: when a club has ≥3 shots with BOTH a captured motion
blob AND a measured `distance_yards`, fit a linear regression of carry
on hand speed (m/s × arm length) and store the coefficients alongside
the per-club aggregates so the iOS Swing Card and watch HUD can pull
authoritative numbers from the server.

Phase 5 (TODO in 008_dna_signatures): also store tempo_signature,
plane_signature, pressure_response.
"""
from collections import defaultdict
from datetime import datetime
from math import sqrt
from statistics import mean, median, pstdev

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.caddie import PlayerShotDNA, Round, RoundShot
from app.schemas.caddie import PlayerDNAResponse
from app.services.auth import get_current_user

router = APIRouter()

# Default arm length (m). Mirrors `defaultArmLengthMeters` in iOS
# SwingAnalytics. The recompute endpoint accepts an override via the
# user's profile in the future; for now this constant matches the iOS
# default so server- and client-side numbers agree.
DEFAULT_ARM_LENGTH_M = 0.70

# Per-club lever ratios. Mirror iOS `SwingLeverRatio.ratio(for:)`.
LEVER_RATIO_BY_GROUP = {
    "driver": 3.20,
    "wood": 3.00,
    "hybrid": 2.90,
    "iron": 2.70,
    "wedge": 2.40,
    "putt": 1.00,
}


def _club_group(name: str) -> str:
    """Coarse classification used to look up the lever ratio. Mirrors
    iOS Club.group casefold-ish grouping.
    """
    n = name.lower()
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
    # Wedges + degree wedges
    return "wedge"


def _hand_speed_mph(motion: dict | None) -> float | None:
    """Convert peakRotationRate (rad/s) → hand speed (mph) using the
    default arm length. Returns None when the motion blob is missing
    or doesn't carry a sensible peak.
    """
    if not motion:
        return None
    peak = motion.get("peakRotationRate")
    if peak is None or peak <= 0:
        return None
    return float(peak) * DEFAULT_ARM_LENGTH_M * 2.23694


def _fit_linear(samples: list[tuple[float, float]], lam: float = 0.5) -> dict | None:
    """Ridge-regularised linear regression. `samples` is a list of
    (x = hand_mph, y = carry_yards). Returns the coefficient dict
    consumed by iOS `ClubModel`.
    """
    n = len(samples)
    if n < 3:
        return None
    xs = [s[0] for s in samples]
    ys = [s[1] for s in samples]
    mx = mean(xs)
    my = mean(ys)
    sxx = sum((x - mx) ** 2 for x in xs)
    sxy = sum((x - mx) * (y - my) for x, y in samples)
    alpha = sxy / max(0.0001, sxx + lam)
    gamma = my - alpha * mx
    sse = sum((y - (alpha * x + gamma)) ** 2 for x, y in samples)
    dof = max(1.0, n - 2.0)
    sigma = sqrt(sse / dof)
    return {
        "alpha": alpha,
        "gamma": gamma,
        "sigma": sigma,
        "sample_count": n,
        "median_hand_mph": median(xs),
    }


@router.get("/me", response_model=PlayerDNAResponse)
def get_dna(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dna = db.query(PlayerShotDNA).filter(PlayerShotDNA.user_id == current_user.id).first()
    if not dna:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No DNA computed yet")
    return dna


@router.post("/recompute", response_model=PlayerDNAResponse)
def recompute_dna(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rounds = db.query(Round).filter(Round.user_id == current_user.id).all()
    by_club: dict[str, list[RoundShot]] = defaultdict(list)
    total = 0
    for r in rounds:
        for s in r.shots:
            by_club[s.club].append(s)
            total += 1

    profiles: dict[str, dict] = {}
    for club, shots in by_club.items():
        carries = [s.distance_yards for s in shots if s.distance_yards is not None]
        # Phase 4: collect (hand_mph, carry_yards) samples for the
        # per-club regression. Only shots with BOTH motion data and a
        # measured carry qualify.
        cal_samples: list[tuple[float, float]] = []
        hand_speeds: list[float] = []
        for s in shots:
            hs = _hand_speed_mph(s.motion_data)
            if hs is None:
                continue
            hand_speeds.append(hs)
            if s.distance_yards is not None:
                cal_samples.append((hs, float(s.distance_yards)))

        model = _fit_linear(cal_samples)
        profiles[club] = {
            "club": club,
            "average_carry": mean(carries) if carries else None,
            "carry_sigma": pstdev(carries) if len(carries) > 1 else None,
            "dispersion_left_pct": sum(
                1 for s in shots if s.miss_direction == "left"
            )
            / max(len(shots), 1)
            * 100,
            "dispersion_right_pct": sum(
                1 for s in shots if s.miss_direction == "right"
            )
            / max(len(shots), 1)
            * 100,
            "total_shots": len(shots),
            # Phase 4 enrichments — null for clubs without motion data yet.
            "median_hand_mph": median(hand_speeds) if hand_speeds else None,
            "hand_speed_sigma": pstdev(hand_speeds) if len(hand_speeds) > 1 else None,
            "calibration_model": model,
            "lever_ratio": LEVER_RATIO_BY_GROUP.get(_club_group(club), 1.0),
        }

    consistency = (
        100
        - mean([p["carry_sigma"] for p in profiles.values() if p["carry_sigma"]])
        if profiles
        else None
    )

    # Phase 5 fingerprint: per-club tempo + plane signatures, plus a
    # global pressure-response regression.
    tempo_sig: dict[str, dict] = {}
    plane_sig: dict[str, dict] = {}
    for club, shots in by_club.items():
        ratios: list[float] = []
        planes: list[tuple[float, float, float]] = []
        for s in shots:
            md = s.motion_data or {}
            phases = md.get("phases") or {}
            sample_interval = md.get("sampleInterval") or 0.01
            top = phases.get("topIdx")
            back = phases.get("backswingStartIdx")
            impact = phases.get("impactIdx")
            if top is not None and back is not None and impact is not None:
                bw = max(0.0, (top - back) * sample_interval)
                dw = max(0.0, (impact - top) * sample_interval)
                if bw > 0 and dw > 0.001:
                    ratios.append(bw / dw)
            # Plane axis would be derived on the client; the wire format
            # doesn't pre-compute it. We approximate from the gyro
            # principal direction of the downswing samples here later if
            # needed. Skip for v1.
            _ = planes
        if ratios:
            mr = mean(ratios)
            sd = pstdev(ratios) if len(ratios) > 1 else 0.0
            tempo_sig[club] = {
                "median_ratio": mr,
                "sigma": sd,
                "sample_count": len(ratios),
            }

    # Pressure response — regress (tempo delta vs baseline) on
    # (HR / HR_reserve). Needs HR @ shot AND a tempo ratio AND a
    # baseline tempo for that club. Output is a coarse slope used by
    # the de-stressing caddie to predict tempo drop under given HR.
    pr_samples: list[tuple[float, float]] = []  # (hr_frac, tempo_delta)
    resting = 60.0  # placeholder until we accept profile age/HR
    max_hr = 185.0
    reserve = max(1.0, max_hr - resting)
    for club, shots in by_club.items():
        baseline_ratio = (tempo_sig.get(club) or {}).get("median_ratio")
        if baseline_ratio is None:
            continue
        for s in shots:
            md = s.motion_data or {}
            phases = md.get("phases") or {}
            sample_interval = md.get("sampleInterval") or 0.01
            top = phases.get("topIdx")
            back = phases.get("backswingStartIdx")
            impact = phases.get("impactIdx")
            hr = s.heart_rate_at_shot
            if hr is None or hr <= 0:
                continue
            if top is None or back is None or impact is None:
                continue
            bw = max(0.0, (top - back) * sample_interval)
            dw = max(0.0, (impact - top) * sample_interval)
            if bw <= 0 or dw <= 0.001:
                continue
            ratio = bw / dw
            hr_frac = max(0.0, min(1.0, (hr - resting) / reserve))
            pr_samples.append((hr_frac, ratio - baseline_ratio))

    pressure_response: dict | None = None
    if len(pr_samples) >= 5:
        # Linear regression y = m*x + b on (hr_frac, tempo_delta).
        xs = [p[0] for p in pr_samples]
        ys = [p[1] for p in pr_samples]
        mx = mean(xs)
        my = mean(ys)
        sxx = sum((x - mx) ** 2 for x in xs)
        sxy = sum((x - mx) * (y - my) for x, y in pr_samples)
        slope = sxy / max(0.0001, sxx)
        intercept = my - slope * mx
        pressure_response = {
            "tempo_delta_per_hr_frac": slope,
            "intercept": intercept,
            "sample_count": len(pr_samples),
        }

    dna = db.query(PlayerShotDNA).filter(PlayerShotDNA.user_id == current_user.id).first()
    if not dna:
        dna = PlayerShotDNA(user_id=current_user.id)
        db.add(dna)

    dna.last_updated = datetime.utcnow()
    dna.total_shots = total
    dna.club_profiles = profiles
    dna.consistency_score = consistency
    dna.common_mistakes = []
    dna.tempo_signature = tempo_sig
    dna.plane_signature = plane_sig
    dna.pressure_response = pressure_response

    db.commit()
    db.refresh(dna)
    return dna
