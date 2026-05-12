from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class RangeSessionListItem(BaseModel):
    id: UUID
    shot_count: int
    start_time: datetime | None
    location: str | None
    schema_version: int
    updated_at: datetime

    class Config:
        from_attributes = True


class RangeSessionListResponse(BaseModel):
    sessions: list[RangeSessionListItem]
    total: int


class RangeSessionDetailResponse(BaseModel):
    id: UUID
    shot_count: int
    start_time: datetime | None
    location: str | None
    schema_version: int
    created_at: datetime
    updated_at: datetime
    payload: dict[str, Any]


class RangeSessionSyncResponse(BaseModel):
    id: UUID
    shot_count: int
    start_time: datetime | None
    updated_at: datetime
    created: bool = Field(description="True when inserted, False when updated")
