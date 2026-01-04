from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConnectorResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str  # available, connected, coming_soon
    connected: bool = False
    last_sync: Optional[datetime] = None
    capabilities: list[str] = []


class CSVImportRequest(BaseModel):
    session_name: Optional[str] = None
    session_type: str = "range"
    notes: Optional[str] = None


class ImportResponse(BaseModel):
    success: bool
    session_id: Optional[str] = None
    shots_imported: int = 0
    errors: list[str] = []
    warnings: list[str] = []
