from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.session import Session as SessionModel
from app.models.coach import CoachReport, ChatMessage
from app.schemas.coach import (
    CoachReportCreate,
    CoachReportResponse,
    ChatMessageCreate,
    ChatMessageResponse,
)
from app.services.auth import get_current_user
from app.services.coach_engine import CoachEngine

router = APIRouter()


@router.get("/reports", response_model=list[CoachReportResponse])
def list_reports(
    session_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CoachReport).filter(CoachReport.user_id == current_user.id)
    
    if session_id:
        query = query.filter(CoachReport.session_id == session_id)
    
    reports = query.order_by(CoachReport.created_at.desc()).all()
    return [CoachReportResponse.model_validate(r) for r in reports]


@router.get("/reports/{report_id}", response_model=CoachReportResponse)
def get_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(CoachReport).filter(
        CoachReport.id == report_id,
        CoachReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return CoachReportResponse.model_validate(report)


@router.post("/report", response_model=CoachReportResponse)
def generate_report(
    data: CoachReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify session ownership
    session = db.query(SessionModel).filter(
        SessionModel.id == data.session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Generate report using coach engine
    engine = CoachEngine()
    report = engine.generate_report(
        session=session,
        user_id=current_user.id,
        language=data.language,
        db=db,
    )
    
    return CoachReportResponse.model_validate(report)


@router.get("/chat", response_model=list[ChatMessageResponse])
def get_chat_history(
    session_id: Optional[UUID] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    
    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)
    
    messages = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    return [ChatMessageResponse.model_validate(m) for m in reversed(messages)]


@router.post("/chat", response_model=ChatMessageResponse)
def send_chat(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Save user message
    user_message = ChatMessage(
        user_id=current_user.id,
        session_id=data.session_id,
        role="user",
        content=data.content,
        context=data.context,
    )
    db.add(user_message)
    db.commit()
    
    # Generate AI response (stub)
    engine = CoachEngine()
    response_content = engine.generate_chat_response(
        message=data.content,
        context=data.context,
        user_id=current_user.id,
        db=db,
    )
    
    # Save assistant response
    assistant_message = ChatMessage(
        user_id=current_user.id,
        session_id=data.session_id,
        role="assistant",
        content=response_content,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    
    return ChatMessageResponse.model_validate(assistant_message)
