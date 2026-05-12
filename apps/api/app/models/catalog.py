"""Reference catalogs: brands, club models, connectors.

These tables are read-mostly and seeded via app.seed.catalog. They power
the My Bag editor, Connectors page, and any future catalog browser.
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Brand(Base):
    """An equipment manufacturer (Titleist, TaylorMade, ...)."""

    __tablename__ = "brands"

    # Stable string id (matches frontend brand_id used on UserClub)
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)

    country = Column(String(80), nullable=True)
    founded = Column(Integer, nullable=True)
    color = Column(String(20), nullable=True)
    primary_category = Column(String(20), nullable=False, default="clubs")
    categories = Column(String(120), nullable=True)
    logo_path = Column(String(200), nullable=True)
    website = Column(String(300), nullable=True)
    description = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    models = relationship(
        "ClubModel", back_populates="brand", cascade="all, delete-orphan"
    )


class ClubModel(Base):
    """A specific club model produced by a brand (TaylorMade Qi35 Driver, ...)."""

    __tablename__ = "club_models"

    id = Column(String(120), primary_key=True)
    brand_id = Column(String(50), ForeignKey("brands.id"), nullable=False, index=True)

    name = Column(String(160), nullable=False)
    club_type = Column(String(30), nullable=False, index=True)
    year = Column(Integer, nullable=True)

    default_loft = Column(Float, nullable=True)
    default_lie = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    brand = relationship("Brand", back_populates="models")


class Connector(Base):
    """A data source / launch-monitor / venue integration."""

    __tablename__ = "connectors"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(String(20), default="available", nullable=False)
    capabilities = Column(String(400), nullable=True)
    color = Column(String(20), nullable=True)
    logo_path = Column(String(200), nullable=True)
    website = Column(String(300), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
