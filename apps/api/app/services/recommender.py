"""Recommendation engine for StrikeLab Tee.

Rule-based scorer that ranks `(course, slot)` pairs against a user's
`BookingPreferences`, current weather, friend playmate overlap, and
proximity. Phase 2 swaps this for a learned model trained on historical
booking conversion + cancellation data.

Score components (each in [0, 1] before weighting):
    proximity   — closer is better, cliffs at 50 km then decays
    weather     — sun + calm + temp inside band − rain
    prefs       — band match + course type + walking + solo + ≤max-wind etc.
    friends     — fraction of slot occupants who are playmates
    deal        — twilight/off-peak gives a price discount kicker
    availability — at least 1 spot, prefer slots that match `players` request

Weights are tunable; the defaults below are calibrated against the prototype.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, time
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.booking import (
    BookingPreferences,
    CourseConditions,
    Playmate,
    SlotPlayerLink,
    TeeSheet,
    TeeSheetSlot,
)
from app.models.course import Course
from app.models.user import User
from app.services.weather import hourly_at


WEIGHTS = {
    "weather": 0.32,
    "prefs": 0.24,
    "proximity": 0.18,
    "friends": 0.12,
    "deal": 0.08,
    "availability": 0.06,
}


@dataclass
class Scored:
    score: float
    why: list[str]
    window_label: Optional[str]
    sun_pct: Optional[float]
    wind_ms: Optional[float]
    temp_c: Optional[float]
    rain_pct: Optional[float]


def _haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dphi = math.radians(b_lat - a_lat)
    dlam = math.radians(b_lon - a_lon)
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def estimate_drive_min(km: float) -> int:
    if km < 5:
        return max(5, int(km * 4))
    if km < 30:
        return int(km * 1.6)  # rural Norway-ish average
    return int(km * 1.1) + 10


def time_band(hour: int) -> str:
    if hour < 8:
        return "early"
    if hour < 11:
        return "morning"
    if hour < 14:
        return "midday"
    if hour < 18:
        return "afternoon"
    if hour < 20:
        return "golden"
    return "twilight"


def window_label_for(hour: int) -> Optional[str]:
    if 8 <= hour < 11:
        return "morning-calm"
    if 18 <= hour < 20:
        return "golden"
    if 20 <= hour < 22:
        return "twilight"
    return None


# ─────────────────────────────────────────────────────────────────────


def score_slot(
    *,
    user: User,
    prefs: Optional[BookingPreferences],
    course: Course,
    slot: TeeSheetSlot,
    conditions: Optional[CourseConditions],
    playmate_user_ids: set[UUID],
    slot_user_ids: set[UUID],
) -> Scored:
    """Return a Scored object with explainer reasons."""
    why: list[str] = []
    components: dict[str, float] = {k: 0.0 for k in WEIGHTS}

    # ── availability gate ─────────────────────────────────────────────
    available = max(0, slot.players_total - slot.players_taken)
    if available <= 0 or slot.is_blocked:
        return Scored(
            score=0.0,
            why=["No spots available"],
            window_label=window_label_for(slot.tee_time.hour),
            sun_pct=None,
            wind_ms=None,
            temp_c=None,
            rain_pct=None,
        )
    components["availability"] = min(1.0, available / 4.0)

    # ── weather ──────────────────────────────────────────────────────
    sun_pct = wind_ms = temp_c = rain_pct = None
    weather_score = 0.5
    if conditions:
        h = hourly_at(conditions, slot.tee_time.hour)
        if h:
            sun_pct = float(h.get("sun", 0.0))
            wind_ms = float(h.get("w", 0.0))
            temp_c = float(h.get("t", 18.0))
            rain_pct = float(h.get("rain", 0.0))
            sun_term = sun_pct
            calm_term = max(0.0, 1.0 - wind_ms / 12.0)
            temp_term = max(0.0, min(1.0, (temp_c - 6.0) / 18.0))
            rain_penalty = rain_pct
            weather_score = max(
                0.0,
                min(
                    1.0,
                    0.40 * sun_term
                    + 0.30 * calm_term
                    + 0.20 * temp_term
                    - 0.30 * rain_penalty,
                ),
            )
            if sun_term > 0.7 and rain_penalty < 0.1:
                why.append("Sun on the fairway")
            if calm_term > 0.7:
                why.append("Calm wind")
            if rain_penalty > 0.4:
                why.append("Rain expected")
    components["weather"] = weather_score

    # ── preferences ──────────────────────────────────────────────────
    pref_score = 0.5
    if prefs:
        band = time_band(slot.tee_time.hour)
        bands = prefs.time_bands or []
        if bands:
            if band in bands:
                pref_score += 0.25
                why.append(f"Matches your {band} band")
            else:
                pref_score -= 0.10

        if prefs.course_types:
            if course.course_type and course.course_type in prefs.course_types:
                pref_score += 0.15
                why.append(f"{course.course_type.title()} preferred")
            else:
                pref_score -= 0.05

        if prefs.max_wind_ms is not None and wind_ms is not None:
            if wind_ms <= prefs.max_wind_ms:
                pref_score += 0.05
            else:
                pref_score -= 0.20
                why.append(f"Wind exceeds your {prefs.max_wind_ms} m/s cap")

        if prefs.min_temp_c is not None and temp_c is not None and temp_c < prefs.min_temp_c:
            pref_score -= 0.15
            why.append("Below your temperature cap")

        if prefs.max_rain_pct is not None and rain_pct is not None:
            if rain_pct > prefs.max_rain_pct:
                pref_score -= 0.30

        if prefs.solo_only and slot.players_taken > 0:
            pref_score -= 0.40
            why.append("Slot already shared")

        if prefs.walking_only:
            walking = (course.facilities or {}).get("walking", True)
            if walking is False:
                pref_score -= 0.20

    components["prefs"] = max(0.0, min(1.0, pref_score))

    # ── proximity ────────────────────────────────────────────────────
    prox_score = 0.5
    if (
        user.home_lat is not None
        and user.home_lon is not None
        and course.latitude is not None
        and course.longitude is not None
    ):
        km = _haversine_km(user.home_lat, user.home_lon, course.latitude, course.longitude)
        if km < 20:
            prox_score = 1.0
            why.append(f"{km:.0f} km away")
        elif km < 80:
            prox_score = max(0.0, 1.0 - (km - 20) / 80.0)
        else:
            prox_score = max(0.0, 0.4 - (km - 80) / 200.0)
    components["proximity"] = prox_score

    # ── friends overlap ───────────────────────────────────────────────
    friend_overlap = 0.0
    if slot_user_ids and playmate_user_ids:
        overlap = slot_user_ids & playmate_user_ids
        if overlap:
            friend_overlap = min(1.0, len(overlap) / 4.0)
            why.append(f"{len(overlap)} playmate{'s' if len(overlap) != 1 else ''}")
    components["friends"] = friend_overlap

    # ── deal ─────────────────────────────────────────────────────────
    deal_score = 0.0
    if slot.golden:
        deal_score = 0.6
    elif slot.twilight:
        deal_score = 0.85
        why.append("Twilight rate")
    elif not slot.peak:
        deal_score = 0.55
    components["deal"] = deal_score

    weighted = sum(components[k] * w for k, w in WEIGHTS.items())
    return Scored(
        score=round(weighted, 4),
        why=why[:3],
        window_label=window_label_for(slot.tee_time.hour),
        sun_pct=sun_pct,
        wind_ms=wind_ms,
        temp_c=temp_c,
        rain_pct=rain_pct,
    )


# ─────────────────────────────────────────────────────────────────────
# Convenience helpers used by the router
# ─────────────────────────────────────────────────────────────────────


def fetch_playmate_user_ids(db: Session, user: User) -> set[UUID]:
    rows = (
        db.query(Playmate.friend_user_id)
        .filter(
            Playmate.user_id == user.id,
            Playmate.friend_user_id.isnot(None),
        )
        .all()
    )
    return {r[0] for r in rows}


def fetch_slot_user_ids(db: Session, slot: TeeSheetSlot) -> set[UUID]:
    rows = (
        db.query(SlotPlayerLink.user_id)
        .filter(SlotPlayerLink.slot_id == slot.id)
        .all()
    )
    return {r[0] for r in rows}
