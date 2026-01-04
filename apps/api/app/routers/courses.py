from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.course import Course, TeeTime
from app.schemas.course import (
    CourseCreate,
    CourseResponse,
    TeeTimeCreate,
    TeeTimeResponse,
)
from app.services.auth import get_current_user

router = APIRouter()


# === TEE TIMES (must come before /{course_id} to avoid route conflicts) ===

@router.get("/tee-times", response_model=list[TeeTimeResponse])
def list_tee_times(
    upcoming_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime
    
    query = db.query(TeeTime).filter(TeeTime.user_id == current_user.id)
    
    if upcoming_only:
        query = query.filter(TeeTime.tee_time >= datetime.utcnow())
    
    tee_times = query.order_by(TeeTime.tee_time).all()
    
    responses = []
    for tt in tee_times:
        response = TeeTimeResponse.model_validate(tt)
        if tt.course:
            response.course = CourseResponse.model_validate(tt.course)
        responses.append(response)
    
    return responses


@router.post("/tee-times", response_model=TeeTimeResponse)
def create_tee_time(
    data: TeeTimeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tee_time = TeeTime(
        user_id=current_user.id,
        **data.model_dump(),
    )
    db.add(tee_time)
    db.commit()
    db.refresh(tee_time)
    
    response = TeeTimeResponse.model_validate(tee_time)
    if tee_time.course:
        response.course = CourseResponse.model_validate(tee_time.course)
    
    return response


@router.delete("/tee-times/{tee_time_id}")
def delete_tee_time(
    tee_time_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tee_time = db.query(TeeTime).filter(
        TeeTime.id == tee_time_id,
        TeeTime.user_id == current_user.id
    ).first()
    
    if not tee_time:
        raise HTTPException(status_code=404, detail="Tee time not found")
    
    db.delete(tee_time)
    db.commit()
    
    return {"message": "Tee time deleted"}


# === COURSES ===

@router.get("/search", response_model=list[CourseResponse])
def search_courses(
    q: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Course)
    
    if q:
        query = query.filter(Course.name.ilike(f"%{q}%"))
    
    if country:
        query = query.filter(Course.country == country)
    
    courses = query.limit(limit).all()
    return [CourseResponse.model_validate(c) for c in courses]


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: UUID,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return CourseResponse.model_validate(course)


@router.post("", response_model=CourseResponse)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    
    return CourseResponse.model_validate(course)
