from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    country: Optional[str] = None
    founded: Optional[int] = None
    color: Optional[str] = None
    primary_category: str = "clubs"
    categories: Optional[List[str]] = None
    logo_path: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class ClubModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    brand_id: str
    name: str
    club_type: str
    year: Optional[int] = None
    default_loft: Optional[float] = None
    default_lie: Optional[float] = None
    is_active: bool = True


class ConnectorCatalogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    status: str = "available"
    capabilities: Optional[List[str]] = None
    color: Optional[str] = None
    logo_path: Optional[str] = None
    website: Optional[str] = None
