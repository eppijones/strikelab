import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)  # county / state / fylke
    country = Column(String(100), nullable=True)
    country_code = Column(String(8), nullable=True)
    course_type = Column(String(40), nullable=True)  # links / parkland / heathland / desert / mountain / resort

    # Course data
    par = Column(Integer, nullable=True)
    holes_count = Column(Integer, nullable=True)  # 9 / 18 / 27 etc.
    slope_rating = Column(Float, nullable=True)
    course_rating = Column(Float, nullable=True)
    total_yards = Column(Integer, nullable=True)
    total_meters = Column(Integer, nullable=True)

    # Hole data (optional)
    holes = Column(JSON, nullable=True)
    # [
    #   {"number": 1, "par": 4, "handicap": 7, "yards": 385},
    #   ...
    # ]

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Facilities — modeled on the way Norges Golfforbund / GolfBox tag clubs.
    # We keep top-level booleans for fast filters and a `facilities` JSON
    # blob for richer details (range bays, indoor sim, short game, etc.).
    has_driving_range = Column(Boolean, nullable=True)
    has_practice_area = Column(Boolean, nullable=True)  # short-game / chipping
    has_putting_green = Column(Boolean, nullable=True)
    has_par3_course = Column(Boolean, nullable=True)
    has_simulator = Column(Boolean, nullable=True)  # indoor / Trackman / GSPro
    facilities = Column(JSON, nullable=True)
    # {
    #   "range_bays": 18,
    #   "covered_bays": 6,
    #   "lit": true,
    #   "indoor_sim_brand": "Trackman",
    #   "club_house": true,
    #   "rentals": true,
    #   "pro_shop": true,
    #   "academy": true
    # }

    # External IDs for booking integrations + open data
    golfbox_id = Column(String(100), nullable=True)
    gimmie_id = Column(String(100), nullable=True)
    teeone_id = Column(String(100), nullable=True)
    ngf_club_id = Column(String(40), nullable=True)  # Norges Golfforbund club id
    osm_id = Column(String(40), nullable=True)  # OpenStreetMap relation/way id

    # Which booking provider owns this course's tee sheet.
    # internal = StrikeLab Tee hosts it directly; otherwise we proxy.
    booking_provider = Column(
        String(40), nullable=False, default="internal", server_default="internal"
    )

    # Metadata
    website = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    designer = Column(String(120), nullable=True)
    established = Column(Integer, nullable=True)

    # Provenance
    created_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    is_verified = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tee_times = relationship("TeeTime", back_populates="course")


class TeeTime(Base):
    __tablename__ = "tee_times"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    
    # Tee time details
    tee_time = Column(DateTime, nullable=False)
    players = Column(JSON, nullable=True)  # ["John", "Jane", ...]
    notes = Column(Text, nullable=True)
    
    # Pre-round prep
    prep_notes = Column(Text, nullable=True)
    focus_areas = Column(JSON, nullable=True)  # ["tempo", "face control"]
    
    # Booking info
    booking_source = Column(String(50), nullable=True)  # golfbox, gimmie, teeone, manual
    booking_reference = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled
    
    # Link to session log (if completed)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="tee_times")
    course = relationship("Course", back_populates="tee_times")
