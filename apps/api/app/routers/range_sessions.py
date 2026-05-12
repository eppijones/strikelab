"""StrikeLab Caddie driving-range sessions — cloud mirror for web analytics."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models.range_session import RangeSession
from app.models.user import User
from app.schemas.range_session import (
    RangeSessionDetailResponse,
    RangeSessionListItem,
    RangeSessionListResponse,
    RangeSessionSyncResponse,
)
from app.services.auth import get_current_user
from app.services.media import audio_response_from_metadata, store_audio

router = APIRouter()


def _get(d: dict[str, Any], *keys: str) -> Any:
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return None


def _unwrap_session_dict(body: dict[str, Any]) -> dict[str, Any]:
    s = _get(body, "session", "Session")
    if isinstance(s, dict):
        return s
    if isinstance(body.get("shots"), list) and body.get("id"):
        return body
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Body must include a `session` object (StrikeLab export) or a raw practice session.",
    )


def _parse_uuid(val: Any, field: str) -> UUID:
    if val is None:
        raise HTTPException(status_code=422, detail=f"Missing {field}")
    try:
        return UUID(str(val))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Invalid UUID for {field}") from e


def _parse_dt(val: Any) -> datetime | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str):
        s = val.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(s)
        except ValueError:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    return None


def _denormalize(body: dict[str, Any], session: dict[str, Any]) -> tuple[int, datetime | None, str | None, int]:
    shots = session.get("shots") or session.get("Shots") or []
    shot_count = len(shots) if isinstance(shots, list) else 0
    start_raw = _get(session, "start_time", "startTime", "StartTime")
    start_time = _parse_dt(start_raw)
    loc = _get(session, "location", "Location")
    location = str(loc) if loc is not None else None
    schema_v = body.get("schema_version", body.get("schemaVersion", 1))
    try:
        schema_version = int(schema_v)
    except (TypeError, ValueError):
        schema_version = 1
    return shot_count, start_time, location, schema_version


def _attach_audio_metadata(row: RangeSession, shot_id: UUID, url: str, content_type: str | None, byte_count: int) -> None:
    payload = row.payload if isinstance(row.payload, dict) else {}
    session = payload.get("session")
    if not isinstance(session, dict):
        return
    shots = session.get("shots")
    if not isinstance(shots, list):
        return
    for shot in shots:
        if not isinstance(shot, dict):
            continue
        if str(_get(shot, "id", "ID")) != str(shot_id):
            continue
        shot["audio"] = {
            "url": url,
            "content_type": content_type or "audio/x-caf",
            "byte_count": byte_count,
        }
        return


@router.put("/sync", response_model=RangeSessionSyncResponse)
def sync_range_session(
    payload: dict[str, Any],
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Idempotent upsert — same session `id` from the phone overwrites the cloud copy."""
    session_dict = _unwrap_session_dict(payload)
    sid = _parse_uuid(_get(session_dict, "id", "ID"), "session.id")
    shot_count, start_time, location, schema_version = _denormalize(payload, session_dict)

    row = db.query(RangeSession).filter(RangeSession.id == sid, RangeSession.user_id == current_user.id).first()
    created = row is None
    now = datetime.now(timezone.utc)
    if row is None:
        row = RangeSession(
            id=sid,
            user_id=current_user.id,
            payload=payload,
            schema_version=schema_version,
            shot_count=shot_count,
            start_time=start_time,
            location=location,
            created_at=now,
            updated_at=now,
        )
        db.add(row)
    else:
        row.payload = payload
        row.schema_version = schema_version
        row.shot_count = shot_count
        row.start_time = start_time
        row.location = location
        row.updated_at = now
    db.commit()
    db.refresh(row)
    return RangeSessionSyncResponse(
        id=row.id,
        shot_count=row.shot_count,
        start_time=row.start_time,
        updated_at=row.updated_at,
        created=created,
    )


@router.get("", response_model=RangeSessionListResponse)
def list_range_sessions(
    limit: int = 50,
    offset: int = 0,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(RangeSession).filter(RangeSession.user_id == current_user.id)
    total = q.count()
    rows = q.order_by(RangeSession.updated_at.desc()).offset(offset).limit(limit).all()
    return RangeSessionListResponse(
        sessions=[RangeSessionListItem.model_validate(r) for r in rows],
        total=total,
    )


@router.get("/{session_id}", response_model=RangeSessionDetailResponse)
def get_range_session(
    session_id: UUID,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(RangeSession)
        .filter(RangeSession.id == session_id, RangeSession.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Range session not found")
    return RangeSessionDetailResponse(
        id=row.id,
        shot_count=row.shot_count,
        start_time=row.start_time,
        location=row.location,
        schema_version=row.schema_version,
        created_at=row.created_at,
        updated_at=row.updated_at,
        payload=row.payload,
    )


@router.post("/{session_id}/shots/{shot_id}/audio")
async def upload_shot_audio(
    session_id: UUID,
    shot_id: UUID,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(RangeSession)
        .filter(RangeSession.id == session_id, RangeSession.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Range session not found")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Audio file is empty")

    stored = await store_audio("range-sessions", current_user.id, session_id, shot_id, Path(file.filename or "").suffix, data, file.content_type)
    audio_url = stored.url or f"/range-sessions/{session_id}/shots/{shot_id}/audio"
    _attach_audio_metadata(row, shot_id, audio_url, stored.content_type, stored.byte_count)
    row.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "session_id": session_id,
        "shot_id": shot_id,
        "url": audio_url,
        "content_type": stored.content_type,
        "byte_count": stored.byte_count,
    }


@router.get("/{session_id}/shots/{shot_id}/audio")
def get_shot_audio(
    session_id: UUID,
    shot_id: UUID,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(RangeSession)
        .filter(RangeSession.id == session_id, RangeSession.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Range session not found")

    payload = row.payload if isinstance(row.payload, dict) else {}
    session = payload.get("session") if isinstance(payload, dict) else None
    audio: dict[str, Any] | None = None
    if isinstance(session, dict) and isinstance(session.get("shots"), list):
        for shot in session["shots"]:
            if isinstance(shot, dict) and str(_get(shot, "id", "ID")) == str(shot_id):
                audio = shot.get("audio") if isinstance(shot.get("audio"), dict) else None
                break
    return audio_response_from_metadata(audio, "range-sessions", current_user.id, session_id, shot_id)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_range_session(
    session_id: UUID,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(RangeSession)
        .filter(RangeSession.id == session_id, RangeSession.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Range session not found")
    db.delete(row)
    db.commit()
    return None
