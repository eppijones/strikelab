"""Pydantic schemas for the Caddie / on-course surface."""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RoundHole(BaseModel):
    hole_number: int
    par: int
    handicap_index: int
    strokes_received: int = 0
    gross_strokes: int = 0
    net_strokes: int = 0
    putts: int = 0
    fairway_hit: bool | None = None
    green_in_regulation: bool | None = None
    notes: str | None = None


class RoundShotCreate(BaseModel):
    hole_number: int
    shot_number: int
    club: str
    timestamp: datetime | None = None
    start_lat: float | None = None
    start_lon: float | None = None
    end_lat: float | None = None
    end_lon: float | None = None
    distance_yards: float | None = None
    distance_meters: float | None = None
    confidence: float | None = None
    is_manual: bool = False
    is_distance_manual: bool = False
    motion_data: dict[str, Any] | None = None
    heart_rate_at_shot: float | None = None
    heart_rate_variability: float | None = None
    biometric_data: dict[str, Any] | None = None
    weather: dict[str, Any] | None = None
    outcome: str | None = None
    miss_direction: str | None = None
    lie_type: str | None = None
    shot_context: dict[str, Any] | None = None


class RoundShotResponse(RoundShotCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    round_id: UUID
    created_at: datetime


class PlannedRoundShot(BaseModel):
    id: UUID
    hole_number: int
    order: int
    club: str
    target_position: dict[str, Any]
    start_position: dict[str, Any] | None = None
    expected_distance: float | None = None
    notes: str | None = None


class RoundCreate(BaseModel):
    course_id: UUID | None = None
    course_name: str
    date: datetime | None = None
    selected_tee: str | None = None
    play_format: str = "full18"
    play_format_raw: str | None = None
    total_par: int = 72
    holes: list[RoundHole] = []
    planned_shots: list[PlannedRoundShot] = []
    player_handicap_index: float | None = None
    course_handicap: int | None = None


class RoundUpdate(BaseModel):
    is_complete: bool | None = None
    current_hole_number: int | None = None
    play_format: str | None = None
    play_format_raw: str | None = None
    total_gross: int | None = None
    total_net: int | None = None
    holes: list[RoundHole] | None = None
    planned_shots: list[PlannedRoundShot] | None = None


class RoundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    course_id: UUID | None
    course_name: str
    date: datetime
    selected_tee: str | None
    is_complete: bool
    current_hole_number: int
    play_format: str = "full18"
    total_par: int
    total_gross: int
    total_net: int
    holes: list[dict[str, Any]] | None
    planned_shots: list[dict[str, Any]] | None = None
    player_handicap_index: float | None
    course_handicap: int | None
    created_at: datetime
    updated_at: datetime
    shots: list[RoundShotResponse] = []
    # Optimistic-concurrency token. Clients should echo this back as the
    # `If-Match` header on PATCH to detect stale writes.
    version: int = 1


class CaddieAdviceRequest(BaseModel):
    distance_yards: float
    elevation_change_feet: float | None = None
    wind_speed_mph: float | None = None
    wind_direction_deg: float | None = None
    lie: str | None = None
    hole_number: int | None = None
    round_id: UUID | None = None


class CaddieAdviceResponse(BaseModel):
    suggested_club: str
    confidence: float
    commit_phrase: str
    rationale: str
    feel_target: int = 7


class ClubDNA(BaseModel):
    club: str
    average_carry: float | None = None
    carry_sigma: float | None = None
    dispersion_left_pct: float | None = None
    dispersion_right_pct: float | None = None
    total_shots: int = 0


class PlayerDNAResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    last_updated: datetime
    total_shots: int
    consistency_score: float | None
    club_profiles: dict[str, dict[str, Any]] | None
    common_mistakes: list[str] | None
