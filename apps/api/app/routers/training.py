from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.training import TrainingPlan, Drill
from app.schemas.training import (
    TrainingPlanCreate,
    TrainingPlanResponse,
    DrillResponse,
)
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/plans", response_model=list[TrainingPlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == current_user.id)
        .order_by(TrainingPlan.created_at.desc())
        .all()
    )


@router.get("/plans/active", response_model=TrainingPlanResponse | None)
def active_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == current_user.id, TrainingPlan.is_active.is_(True))
        .order_by(TrainingPlan.created_at.desc())
        .first()
    )


@router.post("/plans", response_model=TrainingPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: TrainingPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = TrainingPlan(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        focus_area=payload.focus_area,
        structure=payload.structure,
        drill_ids=[str(d) for d in (payload.drill_ids or [])],
        validation_metrics=payload.validation_metrics,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.id == plan_id, TrainingPlan.user_id == current_user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    db.delete(plan)
    db.commit()


@router.get("/drills", response_model=list[DrillResponse])
def list_drills(
    category: str | None = None,
    focus_area: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Drill)
    if category:
        query = query.filter(Drill.category == category)
    if focus_area:
        query = query.filter(Drill.focus_area == focus_area)
    return query.order_by(Drill.name).all()
