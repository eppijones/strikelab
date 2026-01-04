from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class CoachReportCreate(BaseModel):
    session_id: UUID
    report_type: str = "session"
    language: str = "en"


class CoachReportResponse(BaseModel):
    id: UUID
    session_id: UUID
    user_id: UUID
    diagnosis: Optional[str]
    interpretation: Optional[str]
    prescription: Optional[str]
    validation: Optional[str]
    next_best_move: Optional[str]
    linked_metrics: Optional[dict[str, Any]]
    report_type: str
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str
    session_id: Optional[UUID] = None
    context: Optional[dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    user_id: UUID
    session_id: Optional[UUID]
    role: str
    content: str
    context: Optional[dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
