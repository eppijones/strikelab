from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
import csv
import io

from app.database import get_db
from app.models.user import User
from app.models.session import Session as SessionModel
from app.models.shot import Shot
from app.schemas.session import (
    SessionCreate,
    SessionResponse,
    SessionListResponse,
    ShotResponse,
    ShotUpdate,
)
from app.services.auth import get_current_user
from app.services.connectors.csv_importer import CSVImporter

router = APIRouter()


@router.get("", response_model=SessionListResponse)
def list_sessions(
    session_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SessionModel).filter(SessionModel.user_id == current_user.id)
    
    if session_type:
        query = query.filter(SessionModel.session_type == session_type)
    
    total = query.count()
    sessions = query.order_by(SessionModel.session_date.desc()).offset(offset).limit(limit).all()
    
    # Add shot counts
    session_responses = []
    for session in sessions:
        response = SessionResponse.model_validate(session)
        response.shot_count = len(session.shots)
        session_responses.append(response)
    
    return SessionListResponse(sessions=session_responses, total=total)


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    response = SessionResponse.model_validate(session)
    response.shot_count = len(session.shots)
    return response


@router.get("/{session_id}/shots", response_model=list[ShotResponse])
def get_session_shots(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    shots = db.query(Shot).filter(Shot.session_id == session_id).order_by(Shot.shot_number).all()
    return [ShotResponse.model_validate(shot) for shot in shots]


@router.patch("/{session_id}/shots/{shot_id}", response_model=ShotResponse)
def update_shot(
    session_id: UUID,
    shot_id: UUID,
    data: ShotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify session ownership
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    shot = db.query(Shot).filter(
        Shot.id == shot_id,
        Shot.session_id == session_id
    ).first()
    
    if not shot:
        raise HTTPException(status_code=404, detail="Shot not found")
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(shot, key, value)
    
    db.commit()
    db.refresh(shot)
    
    return ShotResponse.model_validate(shot)


@router.delete("/{session_id}")
def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session deleted"}


@router.post("/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    session_name: str = Form(""),
    session_type: str = Form("range"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    
    try:
        importer = CSVImporter()
        result = importer.import_csv(
            content.decode('utf-8'),
            user_id=current_user.id,
            session_name=session_name or file.filename,
            session_type=session_type,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
