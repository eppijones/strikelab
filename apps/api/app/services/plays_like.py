"""Golf-specific plays-like yardage helpers.

The service is intentionally deterministic so it can run both in production
and in demo/offline fallbacks. It is not a replacement for player Shot DNA;
personal data can be layered on top by authenticated caddie endpoints.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class PlaysLikeInput:
    distance_m: float
    elevation_delta_m: float = 0.0
    wind_ms: Optional[float] = None
    wind_angle_deg: Optional[float] = None
    temp_c: Optional[float] = None
    lie: Optional[str] = None


@dataclass
class PlaysLikeResult:
    base_m: float
    plays_like_m: float
    adjustment_m: float
    elevation_m: float
    wind_m: float
    temperature_m: float
    lie_m: float
    notes: list[str]


def calculate_plays_like(payload: PlaysLikeInput) -> PlaysLikeResult:
    """Estimate playing distance from public conditions.

    Rules are conservative:
    - uphill adds roughly one metre per elevation metre
    - direct head/tailwind adjusts up to 12% at 10 m/s
    - cold air adds distance, warm air subtracts a little
    - rough/wet lies add a small carry premium
    """
    base = max(1.0, payload.distance_m)
    notes: list[str] = []

    elevation_adj = payload.elevation_delta_m * 1.0
    if abs(elevation_adj) >= 2:
        notes.append("uphill" if elevation_adj > 0 else "downhill")

    wind_adj = 0.0
    if payload.wind_ms is not None:
        angle = payload.wind_angle_deg if payload.wind_angle_deg is not None else 0.0
        # 0=headwind, 180=tailwind. Crosswind contributes little to distance.
        import math

        headwind_component = math.cos(math.radians(angle)) * payload.wind_ms
        wind_adj = base * max(-0.12, min(0.12, headwind_component / 10.0 * 0.08))
        if headwind_component > 1.5:
            notes.append("headwind")
        elif headwind_component < -1.5:
            notes.append("tailwind")

    temp_adj = 0.0
    if payload.temp_c is not None:
        temp_adj = base * max(-0.04, min(0.06, (15.0 - payload.temp_c) * 0.003))
        if payload.temp_c < 8:
            notes.append("cold air")

    lie_adj = 0.0
    lie = (payload.lie or "").lower()
    if lie in {"rough", "wet_rough"}:
        lie_adj = base * 0.04
        notes.append("rough lie")
    elif lie in {"wet", "soft", "wet_fairway"}:
        lie_adj = base * 0.02
        notes.append("soft turf")

    adjustment = elevation_adj + wind_adj + temp_adj + lie_adj
    plays_like = max(1.0, base + adjustment)
    return PlaysLikeResult(
        base_m=round(base, 1),
        plays_like_m=round(plays_like, 1),
        adjustment_m=round(adjustment, 1),
        elevation_m=round(elevation_adj, 1),
        wind_m=round(wind_adj, 1),
        temperature_m=round(temp_adj, 1),
        lie_m=round(lie_adj, 1),
        notes=notes,
    )
