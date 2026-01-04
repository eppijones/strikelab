import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class UserBag(Base):
    """A user's golf bag containing their equipment"""
    __tablename__ = "user_bags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    name = Column(String(100), nullable=False, default="My Bag")
    is_primary = Column(Integer, default=1)  # 1 = primary bag
    
    # Ball preference
    ball_brand = Column(String(50), nullable=True)
    ball_model = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="bags")
    clubs = relationship("UserClub", back_populates="bag", cascade="all, delete-orphan")


class UserClub(Base):
    """A single club in a user's bag"""
    __tablename__ = "user_clubs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bag_id = Column(UUID(as_uuid=True), ForeignKey("user_bags.id"), nullable=False)
    
    # Club identification
    club_type = Column(String(30), nullable=False)  # driver, 3_wood, 5_wood, hybrid, iron, wedge, putter
    club_label = Column(String(20), nullable=True)  # "Driver", "3 Wood", "7 Iron", "56° Wedge", etc.
    
    # Brand and model
    brand_id = Column(String(50), nullable=False)  # matches frontend brand IDs
    model_name = Column(String(100), nullable=False)
    year = Column(Integer, nullable=True)
    
    # Specifications
    shaft_brand = Column(String(50), nullable=True)
    shaft_model = Column(String(100), nullable=True)
    shaft_flex = Column(String(5), nullable=True)  # X, S, R, A, L
    shaft_weight = Column(Float, nullable=True)  # grams
    
    loft = Column(Float, nullable=True)  # degrees
    lie = Column(Float, nullable=True)  # degrees
    length = Column(Float, nullable=True)  # inches
    swing_weight = Column(String(5), nullable=True)  # D2, D4, etc.
    
    # Optional notes
    notes = Column(Text, nullable=True)
    
    # Ordering in bag
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bag = relationship("UserBag", back_populates="clubs")


class ClubStats(Base):
    """Aggregated statistics for a specific club"""
    __tablename__ = "club_stats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    club_id = Column(UUID(as_uuid=True), ForeignKey("user_clubs.id"), nullable=True)
    
    # Club identification (can work without linked club)
    club_label = Column(String(20), nullable=False)
    
    # Shot counts
    total_shots = Column(Integer, default=0)
    good_shots = Column(Integer, default=0)  # within dispersion target
    
    # Distance stats (in user's preferred units)
    avg_carry = Column(Float, nullable=True)
    max_carry = Column(Float, nullable=True)
    min_carry = Column(Float, nullable=True)
    std_carry = Column(Float, nullable=True)
    
    avg_total = Column(Float, nullable=True)
    
    # Ball flight stats
    avg_ball_speed = Column(Float, nullable=True)
    avg_launch_angle = Column(Float, nullable=True)
    avg_spin_rate = Column(Float, nullable=True)
    avg_peak_height = Column(Float, nullable=True)
    
    # Club delivery stats
    avg_club_speed = Column(Float, nullable=True)
    avg_smash_factor = Column(Float, nullable=True)
    avg_attack_angle = Column(Float, nullable=True)
    avg_club_path = Column(Float, nullable=True)
    avg_face_angle = Column(Float, nullable=True)
    avg_face_to_path = Column(Float, nullable=True)
    
    # Dispersion
    avg_offline = Column(Float, nullable=True)
    dispersion_radius = Column(Float, nullable=True)  # 68% circle radius
    
    # Percentiles (relative to handicap peers)
    distance_percentile = Column(Integer, nullable=True)
    accuracy_percentile = Column(Integer, nullable=True)
    
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="club_stats")
    club = relationship("UserClub", backref="stats")
