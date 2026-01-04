from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class SessionLogTemplateCreate(BaseModel):
    name: str
    language: str = "en"
    description: Optional[str] = None
    structure: dict[str, Any]
    is_default: bool = False


class SessionLogTemplateResponse(BaseModel):
    id: UUID
    name: str
    language: str
    description: Optional[str]
    structure: dict[str, Any]
    is_default: bool
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SessionLogCreate(BaseModel):
    session_id: Optional[UUID] = None
    template_id: Optional[UUID] = None
    tee_time_id: Optional[UUID] = None
    energy_level: Optional[int] = None
    mental_state: Optional[int] = None
    intent: Optional[str] = None
    routine_discipline: Optional[bool] = None
    feel_tags: Optional[list[str]] = None
    shot_blocks: Optional[list[dict[str, Any]]] = None
    what_worked: Optional[str] = None
    take_forward: Optional[str] = None
    dont_overthink: Optional[str] = None
    coach_note: Optional[str] = None
    fatigue_mode: bool = False


class SessionLogResponse(BaseModel):
    id: UUID
    session_id: Optional[UUID]
    template_id: Optional[UUID]
    user_id: UUID
    tee_time_id: Optional[UUID]
    energy_level: Optional[int]
    mental_state: Optional[int]
    intent: Optional[str]
    routine_discipline: Optional[bool]
    feel_tags: Optional[list[str]]
    shot_blocks: Optional[list[dict[str, Any]]]
    what_worked: Optional[str]
    take_forward: Optional[str]
    dont_overthink: Optional[str]
    coach_note: Optional[str]
    fatigue_mode: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
