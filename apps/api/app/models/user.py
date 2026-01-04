import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    handicap_index = Column(Float, nullable=True)
    goal_handicap = Column(Float, nullable=True)  # Season target handicap
    dream_handicap = Column(Float, nullable=True)  # Long-term milestone goal (e.g., scratch)
    practice_frequency = Column(String(20), nullable=True)  # daily, weekly, 2-3x_week, occasional
    onboarding_completed = Column(Boolean, default=False)
    language = Column(String(5), default="en")
    units = Column(String(10), default="yards")  # yards or meters
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    training_plans = relationship("TrainingPlan", back_populates="user", cascade="all, delete-orphan")
    swing_videos = relationship("SwingVideo", back_populates="user", cascade="all, delete-orphan")
    tee_times = relationship("TeeTime", back_populates="user", cascade="all, delete-orphan")
    invites = relationship("Invite", foreign_keys="Invite.creator_id", back_populates="creator", cascade="all, delete-orphan")
    
    # Friend relationships (both directions)
    friends_sent = relationship(
        "FriendLink",
        foreign_keys="FriendLink.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    friends_received = relationship(
        "FriendLink",
        foreign_keys="FriendLink.friend_id",
        back_populates="friend",
        cascade="all, delete-orphan"
    )
    
    # Equipment
    bags = relationship("UserBag", back_populates="user", cascade="all, delete-orphan")


class FriendLink(Base):
    __tablename__ = "friend_links"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    friend_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, blocked
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="friends_sent")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="friends_received")


class Invite(Base):
    __tablename__ = "invites"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    used = Column(Boolean, default=False)
    used_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    creator = relationship("User", foreign_keys=[creator_id], back_populates="invites")
    used_by = relationship("User", foreign_keys=[used_by_id])
