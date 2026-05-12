"""Public read-mostly catalog endpoints.

Powers:
- My Bag editor (brands + club models picker)
- Connectors page (real logos + descriptions)
- Course browser (filters by country / type)
"""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Brand, ClubModel, Connector
from app.schemas.catalog import (
    BrandResponse,
    ClubModelResponse,
    ConnectorCatalogResponse,
)


router = APIRouter()


def _split_csv(value: Optional[str]) -> Optional[list[str]]:
    if not value:
        return None
    return [v.strip() for v in value.split(",") if v.strip()]


def _brand_to_response(brand: Brand) -> BrandResponse:
    return BrandResponse(
        id=brand.id,
        name=brand.name,
        slug=brand.slug,
        country=brand.country,
        founded=brand.founded,
        color=brand.color,
        primary_category=brand.primary_category or "clubs",
        categories=_split_csv(brand.categories),
        logo_path=brand.logo_path,
        website=brand.website,
        description=brand.description,
        is_active=brand.is_active,
        sort_order=brand.sort_order,
    )


def _connector_to_response(c: Connector) -> ConnectorCatalogResponse:
    return ConnectorCatalogResponse(
        id=c.id,
        name=c.name,
        description=c.description,
        status=c.status,
        capabilities=_split_csv(c.capabilities),
        color=c.color,
        logo_path=c.logo_path,
        website=c.website,
    )


@router.get("/brands", response_model=list[BrandResponse])
def list_brands(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all active equipment brands. Optionally filter by category."""
    query = db.query(Brand).filter(Brand.is_active.is_(True))
    brands = query.order_by(Brand.sort_order, Brand.name).all()
    out = [_brand_to_response(b) for b in brands]
    if category:
        out = [b for b in out if b.categories and category in b.categories]
    return out


@router.get("/brands/{brand_id}", response_model=BrandResponse)
def get_brand(
    brand_id: str,
    db: Session = Depends(get_db),
):
    brand = db.get(Brand, brand_id)
    if not brand:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Brand not found")
    return _brand_to_response(brand)


@router.get("/club-models", response_model=list[ClubModelResponse])
def list_club_models(
    brand_id: Optional[str] = None,
    club_type: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List all club models in the catalog with optional filters."""
    query = db.query(ClubModel).filter(ClubModel.is_active.is_(True))
    if brand_id:
        query = query.filter(ClubModel.brand_id == brand_id)
    if club_type:
        query = query.filter(ClubModel.club_type == club_type)
    if year:
        query = query.filter(ClubModel.year == year)

    models = query.order_by(ClubModel.year.desc().nullslast(), ClubModel.name).all()
    return [ClubModelResponse.model_validate(m) for m in models]


@router.get("/connectors", response_model=list[ConnectorCatalogResponse])
def list_connectors(db: Session = Depends(get_db)):
    """List all integration connectors (TrackMan, Foresight, ...)."""
    rows = (
        db.query(Connector)
        .filter(Connector.is_active.is_(True))
        .order_by(Connector.sort_order, Connector.name)
        .all()
    )
    return [_connector_to_response(c) for c in rows]
