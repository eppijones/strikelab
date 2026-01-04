from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.equipment import UserBag, UserClub, ClubStats
from app.schemas.equipment import (
    BagCreate, BagUpdate, BagResponse, BagListResponse,
    ClubCreate, ClubUpdate, ClubResponse,
    ClubStatsResponse, QuickAddClub
)
from app.services.auth import get_current_user

router = APIRouter()


# ============ BAGS ============

@router.get("/bags", response_model=List[BagListResponse])
def list_bags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all bags for the current user"""
    bags = db.query(UserBag).filter(UserBag.user_id == current_user.id).all()
    
    result = []
    for bag in bags:
        club_count = db.query(UserClub).filter(UserClub.bag_id == bag.id).count()
        result.append(BagListResponse(
            id=bag.id,
            name=bag.name,
            is_primary=bag.is_primary,
            club_count=club_count
        ))
    
    return result


@router.get("/bags/{bag_id}", response_model=BagResponse)
def get_bag(
    bag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific bag with all clubs"""
    bag = db.query(UserBag).filter(
        UserBag.id == bag_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not bag:
        raise HTTPException(status_code=404, detail="Bag not found")
    
    return BagResponse.model_validate(bag)


@router.post("/bags", response_model=BagResponse)
def create_bag(
    data: BagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new bag"""
    # Check if this should be the primary bag
    existing_bags = db.query(UserBag).filter(UserBag.user_id == current_user.id).count()
    
    bag = UserBag(
        user_id=current_user.id,
        name=data.name,
        is_primary=1 if existing_bags == 0 else data.is_primary,
        ball_brand=data.ball_brand,
        ball_model=data.ball_model,
    )
    
    db.add(bag)
    db.commit()
    db.refresh(bag)
    
    # Add initial clubs if provided
    if data.clubs:
        for i, club_data in enumerate(data.clubs):
            club = UserClub(
                bag_id=bag.id,
                sort_order=i,
                **club_data.model_dump()
            )
            db.add(club)
        db.commit()
        db.refresh(bag)
    
    return BagResponse.model_validate(bag)


@router.patch("/bags/{bag_id}", response_model=BagResponse)
def update_bag(
    bag_id: UUID,
    data: BagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a bag"""
    bag = db.query(UserBag).filter(
        UserBag.id == bag_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not bag:
        raise HTTPException(status_code=404, detail="Bag not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bag, field, value)
    
    db.commit()
    db.refresh(bag)
    
    return BagResponse.model_validate(bag)


@router.delete("/bags/{bag_id}")
def delete_bag(
    bag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a bag and all its clubs"""
    bag = db.query(UserBag).filter(
        UserBag.id == bag_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not bag:
        raise HTTPException(status_code=404, detail="Bag not found")
    
    db.delete(bag)
    db.commit()
    
    return {"message": "Bag deleted"}


# ============ CLUBS ============

@router.get("/bags/{bag_id}/clubs", response_model=List[ClubResponse])
def list_clubs(
    bag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all clubs in a bag"""
    # Verify bag ownership
    bag = db.query(UserBag).filter(
        UserBag.id == bag_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not bag:
        raise HTTPException(status_code=404, detail="Bag not found")
    
    clubs = db.query(UserClub).filter(
        UserClub.bag_id == bag_id
    ).order_by(UserClub.sort_order).all()
    
    return [ClubResponse.model_validate(c) for c in clubs]


@router.post("/bags/{bag_id}/clubs", response_model=ClubResponse)
def add_club(
    bag_id: UUID,
    data: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a club to a bag"""
    # Verify bag ownership
    bag = db.query(UserBag).filter(
        UserBag.id == bag_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not bag:
        raise HTTPException(status_code=404, detail="Bag not found")
    
    # Check club limit (14 clubs max per rules of golf)
    club_count = db.query(UserClub).filter(UserClub.bag_id == bag_id).count()
    if club_count >= 14:
        raise HTTPException(status_code=400, detail="Maximum 14 clubs allowed per bag")
    
    club = UserClub(
        bag_id=bag_id,
        **data.model_dump()
    )
    
    db.add(club)
    db.commit()
    db.refresh(club)
    
    return ClubResponse.model_validate(club)


@router.patch("/clubs/{club_id}", response_model=ClubResponse)
def update_club(
    club_id: UUID,
    data: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a club"""
    club = db.query(UserClub).join(UserBag).filter(
        UserClub.id == club_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(club, field, value)
    
    db.commit()
    db.refresh(club)
    
    return ClubResponse.model_validate(club)


@router.delete("/clubs/{club_id}")
def delete_club(
    club_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a club from a bag"""
    club = db.query(UserClub).join(UserBag).filter(
        UserClub.id == club_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    db.delete(club)
    db.commit()
    
    return {"message": "Club deleted"}


# ============ QUICK ADD ============

@router.post("/bags/{bag_id}/quick-add", response_model=List[ClubResponse])
def quick_add_clubs(
    bag_id: UUID,
    clubs: List[QuickAddClub],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quickly add multiple clubs to a bag"""
    # Verify bag ownership
    bag = db.query(UserBag).filter(
        UserBag.id == bag_id,
        UserBag.user_id == current_user.id
    ).first()
    
    if not bag:
        raise HTTPException(status_code=404, detail="Bag not found")
    
    # Get current club count
    current_count = db.query(UserClub).filter(UserClub.bag_id == bag_id).count()
    max_sort = db.query(UserClub).filter(UserClub.bag_id == bag_id).count()
    
    if current_count + len(clubs) > 14:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot add {len(clubs)} clubs. Only {14 - current_count} slots available."
        )
    
    added_clubs = []
    for i, club_data in enumerate(clubs):
        club = UserClub(
            bag_id=bag_id,
            club_type=club_data.club_type,
            club_label=club_data.club_label,
            brand_id=club_data.brand_id,
            model_name=club_data.model_name,
            sort_order=max_sort + i
        )
        db.add(club)
        added_clubs.append(club)
    
    db.commit()
    
    for club in added_clubs:
        db.refresh(club)
    
    return [ClubResponse.model_validate(c) for c in added_clubs]


# ============ CLUB STATS ============

@router.get("/stats", response_model=List[ClubStatsResponse])
def get_club_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated stats for all clubs"""
    stats = db.query(ClubStats).filter(
        ClubStats.user_id == current_user.id
    ).order_by(ClubStats.club_label).all()
    
    return [ClubStatsResponse.model_validate(s) for s in stats]


@router.get("/stats/{club_label}", response_model=ClubStatsResponse)
def get_club_stats_by_label(
    club_label: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get stats for a specific club type"""
    stats = db.query(ClubStats).filter(
        ClubStats.user_id == current_user.id,
        ClubStats.club_label == club_label
    ).first()
    
    if not stats:
        raise HTTPException(status_code=404, detail="No stats found for this club")
    
    return ClubStatsResponse.model_validate(stats)


# ============ PRIMARY BAG HELPER ============

@router.get("/my-bag", response_model=BagResponse)
def get_primary_bag(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the user's primary bag"""
    bag = db.query(UserBag).filter(
        UserBag.user_id == current_user.id,
        UserBag.is_primary == 1
    ).first()
    
    if not bag:
        # Create a default bag if none exists
        bag = UserBag(
            user_id=current_user.id,
            name="My Bag",
            is_primary=1
        )
        db.add(bag)
        db.commit()
        db.refresh(bag)
    
    return BagResponse.model_validate(bag)
