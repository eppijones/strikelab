from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class ShotCreate(BaseModel):
    shot_number: int
    club: str
    target_distance: Optional[float] = None
    carry_distance: Optional[float] = None
    total_distance: Optional[float] = None
    ball_speed: Optional[float] = None
    launch_angle: Optional[float] = None
    spin_rate: Optional[float] = None
    spin_axis: Optional[float] = None
    peak_height: Optional[float] = None
    land_angle: Optional[float] = None
    hang_time: Optional[float] = None
    offline_distance: Optional[float] = None
    club_speed: Optional[float] = None
    smash_factor: Optional[float] = None
    attack_angle: Optional[float] = None
    club_path: Optional[float] = None
    face_angle: Optional[float] = None
    face_to_path: Optional[float] = None
    face_to_target: Optional[float] = None
    impact_height: Optional[float] = None
    impact_offset: Optional[float] = None
    is_mishit: bool = False
    mishit_type: Optional[str] = None
    notes: Optional[str] = None


class ShotResponse(BaseModel):
    id: UUID
    session_id: UUID
    shot_number: int
    club: str
    target_distance: Optional[float]
    carry_distance: Optional[float]
    total_distance: Optional[float]
    ball_speed: Optional[float]
    launch_angle: Optional[float]
    spin_rate: Optional[float]
    spin_axis: Optional[float]
    peak_height: Optional[float]
    land_angle: Optional[float]
    hang_time: Optional[float]
    offline_distance: Optional[float]
    club_speed: Optional[float]
    smash_factor: Optional[float]
    attack_angle: Optional[float]
    club_path: Optional[float]
    face_angle: Optional[float]
    face_to_path: Optional[float]
    face_to_target: Optional[float]
    impact_height: Optional[float]
    impact_offset: Optional[float]
    is_mishit: bool
    mishit_type: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ShotUpdate(BaseModel):
    is_mishit: Optional[bool] = None
    mishit_type: Optional[str] = None
    notes: Optional[str] = None


class SessionCreate(BaseModel):
    source: str
    session_type: str = "range"
    name: Optional[str] = None
    notes: Optional[str] = None
    session_date: Optional[datetime] = None
    raw_data: Optional[dict[str, Any]] = None
    shots: Optional[list[ShotCreate]] = None


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    source: str
    session_type: str
    name: Optional[str]
    notes: Optional[str]
    session_date: datetime
    computed_stats: Optional[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    shot_count: int = 0

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]
    total: int
