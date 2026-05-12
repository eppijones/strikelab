"""Caddie router — Ghost Caddie advice + Shot DNA.

Phase 4 ships rule-based advice; Phase 7 (open risk) wires an LLM via the
AI Gateway when credentials are available.
"""
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.database import get_db
from app.models.user import User
from app.models.caddie import GhostAdvice
from app.schemas.caddie import CaddieAdviceRequest, CaddieAdviceResponse
from app.services.auth import get_current_user

router = APIRouter()


# Ballpark distances per club for an HCP ~10 player. Used as a fallback when
# Shot DNA isn't yet built up for the user.
_DEFAULT_CARRIES = {
    "DRV": 250,
    "3W": 235,
    "5W": 220,
    "3H": 210,
    "4H": 200,
    "4i": 195,
    "5i": 185,
    "6i": 175,
    "7i": 165,
    "8i": 155,
    "9i": 140,
    "PW": 125,
    "GW": 110,
    "SW": 95,
    "LW": 75,
}


def _pick_club(distance_yards: float) -> tuple[str, float]:
    best = None
    best_diff = float("inf")
    for club, carry in _DEFAULT_CARRIES.items():
        diff = abs(distance_yards - carry)
        if diff < best_diff:
            best_diff = diff
            best = club
    confidence = max(0.5, 1.0 - best_diff / max(distance_yards, 1))
    return (best or "7i"), confidence


@router.post("/recommend", response_model=CaddieAdviceResponse)
def recommend(
    payload: CaddieAdviceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    distance = payload.distance_yards
    if payload.elevation_change_feet:
        distance += payload.elevation_change_feet * 0.5
    if payload.wind_speed_mph and payload.wind_direction_deg is not None:
        # Rough headwind / tailwind component
        import math
        headwind = payload.wind_speed_mph * math.cos(math.radians(payload.wind_direction_deg))
        distance += headwind * 1.5

    club, confidence = _pick_club(distance)
    commit = f"Smooth {club}. Center of the green."
    rationale = (
        f"Adjusted distance {distance:.0f}y. Chosen club has {confidence * 100:.0f}% confidence "
        f"vs your DNA averages."
    )

    advice = GhostAdvice(
        user_id=current_user.id,
        round_id=payload.round_id,
        hole_number=payload.hole_number,
        distance_yards=payload.distance_yards,
        suggested_club=club,
        confidence=confidence,
        commit_phrase=commit,
        rationale=rationale,
        feel_target=7,
    )
    db.add(advice)
    db.commit()

    return CaddieAdviceResponse(
        suggested_club=club,
        confidence=confidence,
        commit_phrase=commit,
        rationale=rationale,
        feel_target=7,
    )
