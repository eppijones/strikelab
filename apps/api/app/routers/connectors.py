from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.schemas.connector import ConnectorResponse, ImportResponse
from app.services.auth import get_current_user

router = APIRouter()

# Available connectors definition
CONNECTORS = [
    {
        "id": "trackman",
        "name": "TrackMan",
        "description": "Premium radar launch monitor with comprehensive ball and club data",
        "status": "available",
        "capabilities": ["ball_flight", "club_data", "face_data", "impact_location"],
    },
    {
        "id": "topgolf",
        "name": "Topgolf",
        "description": "Entertainment venue data from Toptracer Range systems",
        "status": "available",
        "capabilities": ["ball_flight", "basic_metrics"],
    },
    {
        "id": "foresight",
        "name": "Foresight",
        "description": "Camera-based launch monitor (GCQuad, GC3)",
        "status": "available",
        "capabilities": ["ball_flight", "club_data", "face_data", "impact_location"],
    },
    {
        "id": "stack",
        "name": "Stack System",
        "description": "Speed training protocol integration",
        "status": "coming_soon",
        "capabilities": ["speed_training", "protocol_tracking"],
    },
    {
        "id": "csv",
        "name": "CSV Import",
        "description": "Universal fallback for any launch monitor data",
        "status": "available",
        "capabilities": ["ball_flight", "club_data"],
    },
]


@router.get("", response_model=list[ConnectorResponse])
def list_connectors(
    current_user: User = Depends(get_current_user),
):
    # In a real implementation, we'd check connection status from DB
    return [
        ConnectorResponse(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            status=c["status"],
            connected=False,  # Would check DB for user's connections
            capabilities=c["capabilities"],
        )
        for c in CONNECTORS
    ]


@router.post("/{connector_id}/connect")
def connect_connector(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    connector = next((c for c in CONNECTORS if c["id"] == connector_id), None)
    
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    if connector["status"] == "coming_soon":
        raise HTTPException(status_code=400, detail="Connector not yet available")
    
    # Stub: In real implementation, would initiate OAuth or API key flow
    return {
        "message": f"Connection to {connector['name']} initiated",
        "status": "pending",
        "next_step": "oauth_redirect" if connector_id != "csv" else "ready",
    }


@router.post("/{connector_id}/disconnect")
def disconnect_connector(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Stub: Would remove connection from DB
    return {"message": f"Disconnected from connector {connector_id}"}


@router.post("/import/connector/{connector_id}", response_model=ImportResponse)
def import_from_connector(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    connector = next((c for c in CONNECTORS if c["id"] == connector_id), None)
    
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    if connector_id == "csv":
        raise HTTPException(
            status_code=400, 
            detail="Use /sessions/import/csv endpoint for CSV imports"
        )
    
    # Stub: Would fetch data from connector API
    return ImportResponse(
        success=True,
        session_id=None,
        shots_imported=0,
        errors=[],
        warnings=["This is a stub. Real connector import not yet implemented."],
    )
