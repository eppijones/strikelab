from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.user import User, FriendLink
from app.models.equipment import ClubStats
from app.schemas.user import FriendResponse
from app.services.auth import get_current_user

router = APIRouter()


def _player_compare_payload(db: Session, user: User) -> dict:
    """Public-comparison payload for a single user. Real numbers only —
    if a stat isn't computed yet, the field is `None` so the client can
    render an honest empty cell instead of a fabricated number.
    """
    driver = (
        db.query(ClubStats)
        .filter(
            ClubStats.user_id == user.id,
            ClubStats.club_label.ilike("%driver%"),
        )
        .order_by(ClubStats.last_updated.desc())
        .first()
    )
    seven = (
        db.query(ClubStats)
        .filter(
            ClubStats.user_id == user.id,
            ClubStats.club_label.in_(["7i", "7 Iron", "7iron", "7-Iron"]),
        )
        .order_by(ClubStats.last_updated.desc())
        .first()
    )
    return {
        "id": str(user.id),
        "display_name": user.display_name,
        "handicap": user.handicap_index,
        "driver_carry": driver.avg_carry if driver else None,
        "seven_iron_carry": seven.avg_carry if seven else None,
    }


@router.get("", response_model=list[FriendResponse])
def list_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get all friend links where user is involved
    friend_links = db.query(FriendLink).filter(
        FriendLink.user_id == current_user.id,
        FriendLink.status == "accepted"
    ).all()
    
    friends = []
    for link in friend_links:
        friend_user = db.query(User).filter(User.id == link.friend_id).first()
        if friend_user:
            friends.append(FriendResponse(
                id=friend_user.id,
                display_name=friend_user.display_name,
                handicap_index=friend_user.handicap_index,
                status=link.status,
            ))
    
    return friends


@router.delete("/{friend_id}")
def remove_friend(
    friend_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Remove both directions of friend link
    db.query(FriendLink).filter(
        FriendLink.user_id == current_user.id,
        FriendLink.friend_id == friend_id
    ).delete()
    
    db.query(FriendLink).filter(
        FriendLink.user_id == friend_id,
        FriendLink.friend_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"message": "Friend removed"}


@router.get("/compare/{friend_id}")
def compare_with_friend(
    friend_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Side-by-side compare for the Home and Friends pages.

    Returns real data only — handicap from the user record and
    average carry pulled from `club_stats`. Fields are `None` when
    the corresponding stat hasn't been computed yet, so the UI can
    render an empty cell instead of a fabricated number.
    """
    friend_link = db.query(FriendLink).filter(
        FriendLink.user_id == current_user.id,
        FriendLink.friend_id == friend_id,
        FriendLink.status == "accepted",
    ).first()

    if not friend_link:
        raise HTTPException(status_code=404, detail="Friend not found")

    friend = db.query(User).filter(User.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")

    return {
        "user": _player_compare_payload(db, current_user),
        "friend": _player_compare_payload(db, friend),
    }
