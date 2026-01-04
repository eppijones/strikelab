from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class DrillResponse(BaseModel):
    id: UUID
    name: str
    name_no: Optional[str]
    description: Optional[str]
    description_no: Optional[str]
    category: Optional[str]
    focus_area: Optional[str]
    clubs: Optional[list[str]]
    reps: Optional[int]
    duration_minutes: Optional[int]
    instructions: Optional[list[str]]
    instructions_no: Optional[list[str]]
    constraints: Optional[list[str]]
    success_metric: Optional[str]
    success_threshold: Optional[float]
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TrainingPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    focus_area: Optional[str] = None
    structure: Optional[dict[str, Any]] = None
    drill_ids: Optional[list[UUID]] = None
    validation_metrics: Optional[dict[str, Any]] = None


class TrainingPlanResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    focus_area: Optional[str]
    structure: Optional[dict[str, Any]]
    drill_ids: Optional[list[UUID]]
    validation_metrics: Optional[dict[str, Any]]
    week_number: int
    is_active: bool
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    adherence_data: Optional[list[dict[str, Any]]]
    created_at: datetime

    class Config:
        from_attributes = True
