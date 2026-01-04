from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.user import User, FriendLink
from app.schemas.user import FriendResponse
from app.services.auth import get_current_user

router = APIRouter()


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
    # Verify friendship
    friend_link = db.query(FriendLink).filter(
        FriendLink.user_id == current_user.id,
        FriendLink.friend_id == friend_id,
        FriendLink.status == "accepted"
    ).first()
    
    if not friend_link:
        raise HTTPException(status_code=404, detail="Friend not found")
    
    friend = db.query(User).filter(User.id == friend_id).first()
    
    # Get comparison metrics (stub)
    # In real implementation, would aggregate from MetricSnapshots
    return {
        "user": {
            "display_name": current_user.display_name,
            "handicap": current_user.handicap_index,
            "strike_score": 78,  # Stub data
            "driver_carry": 245,
            "seven_iron_carry": 165,
        },
        "friend": {
            "display_name": friend.display_name,
            "handicap": friend.handicap_index,
            "strike_score": 82,  # Stub data
            "driver_carry": 252,
            "seven_iron_carry": 172,
        },
    }
