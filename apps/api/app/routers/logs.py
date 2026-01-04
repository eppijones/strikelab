from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.log import SessionLogTemplate, SessionLog
from app.schemas.log import (
    SessionLogTemplateCreate,
    SessionLogTemplateResponse,
    SessionLogCreate,
    SessionLogResponse,
)
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/templates", response_model=list[SessionLogTemplateResponse])
def list_templates(
    language: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(SessionLogTemplate)
    
    if language:
        query = query.filter(SessionLogTemplate.language == language)
    
    templates = query.order_by(SessionLogTemplate.is_default.desc()).all()
    return [SessionLogTemplateResponse.model_validate(t) for t in templates]


@router.post("/templates", response_model=SessionLogTemplateResponse)
def create_template(
    data: SessionLogTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = SessionLogTemplate(
        name=data.name,
        language=data.language,
        description=data.description,
        structure=data.structure,
        is_default=data.is_default,
        is_system=False,
        created_by_id=current_user.id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return SessionLogTemplateResponse.model_validate(template)


@router.get("/{session_id}", response_model=SessionLogResponse)
def get_session_log(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(SessionLog).filter(
        SessionLog.session_id == session_id,
        SessionLog.user_id == current_user.id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Session log not found")
    
    return SessionLogResponse.model_validate(log)


@router.post("/submit", response_model=SessionLogResponse)
def submit_log(
    data: SessionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if log already exists for this session
    if data.session_id:
        existing = db.query(SessionLog).filter(
            SessionLog.session_id == data.session_id,
            SessionLog.user_id == current_user.id
        ).first()
        
        if existing:
            # Update existing log
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return SessionLogResponse.model_validate(existing)
    
    # Create new log
    log = SessionLog(
        user_id=current_user.id,
        **data.model_dump(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return SessionLogResponse.model_validate(log)
