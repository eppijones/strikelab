"""Rounds router — sync from iOS Caddie + read on web."""
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.caddie import Round, RoundShot
from app.schemas.caddie import (
    RoundCreate,
    RoundResponse,
    RoundUpdate,
    RoundShotCreate,
    RoundShotResponse,
)
from app.routers.realtime import broadcast_round_event
from app.services.auth import get_current_user
from app.services.media import audio_response_from_metadata, store_audio

router = APIRouter()


def _get(d: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in d and d[key] is not None:
            return d[key]
    return None


def _parse_uuid(value: Any) -> UUID | None:
    if value is None:
        return None
    try:
        return UUID(str(value))
    except ValueError:
        return None


def _parse_dt(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None


def _round_holes(payload: dict[str, Any]) -> list[dict[str, Any]]:
    holes = payload.get("holes") if isinstance(payload.get("holes"), list) else []
    out: list[dict[str, Any]] = []
    for raw in holes:
        if not isinstance(raw, dict):
            continue
        gross = _get(raw, "gross_strokes", "grossStrokes") or 0
        strokes_received = _get(raw, "strokes_received", "strokesReceived") or 0
        out.append(
            {
                "hole_number": _get(raw, "hole_number", "holeNumber") or 0,
                "par": _get(raw, "par") or 0,
                "handicap_index": _get(raw, "handicap_index", "handicapIndex") or 0,
                "strokes_received": strokes_received,
                "gross_strokes": gross,
                "net_strokes": _get(raw, "net_strokes", "netStrokes") or (gross - strokes_received if gross else 0),
                "putts": _get(raw, "putts") or 0,
                "fairway_hit": _get(raw, "fairway_hit", "fairwayHit"),
                "green_in_regulation": _get(raw, "green_in_regulation", "greenInRegulation"),
                "notes": _get(raw, "notes"),
            }
        )
    return out


def _coordinate(raw: Any) -> tuple[float | None, float | None]:
    if not isinstance(raw, dict):
        return None, None
    lat = _get(raw, "latitude", "lat")
    lon = _get(raw, "longitude", "lon", "lng")
    return lat, lon


def _shot_payload(raw: dict[str, Any], index: int) -> dict[str, Any]:
    start_lat, start_lon = _coordinate(_get(raw, "start_location", "startLocation"))
    end_lat, end_lon = _coordinate(_get(raw, "end_location", "endLocation"))
    hr = _get(raw, "heart_rate", "heartRate")
    heart_rate_at_shot = _get(hr, "heart_rate", "heartRate") if isinstance(hr, dict) else None
    return {
        "id": _parse_uuid(_get(raw, "id")) or UUID(int=0),
        "hole_number": _get(raw, "hole_number", "holeNumber") or 1,
        "shot_number": index,
        "club": _get(raw, "club") or "Unknown",
        "timestamp": _parse_dt(_get(raw, "timestamp")) or datetime.now(timezone.utc),
        "start_lat": start_lat,
        "start_lon": start_lon,
        "end_lat": end_lat,
        "end_lon": end_lon,
        "distance_yards": _get(raw, "distance_yards", "distanceYards"),
        "distance_meters": _get(raw, "distance_meters", "distanceMeters"),
        "confidence": _get(raw, "confidence"),
        "is_manual": bool(_get(raw, "is_manual", "isManual") or False),
        "motion_data": _get(raw, "motion", "motion_data", "motionData"),
        "heart_rate_at_shot": heart_rate_at_shot,
        "heart_rate_variability": _get(hr, "hrv") if isinstance(hr, dict) else None,
        "biometric_data": hr if isinstance(hr, dict) else None,
    }


def _totals(holes: list[dict[str, Any]]) -> tuple[int, int, int]:
    played = [h for h in holes if (h.get("gross_strokes") or 0) > 0]
    total_par = sum(int(h.get("par") or 0) for h in holes)
    total_gross = sum(int(h.get("gross_strokes") or 0) for h in played)
    total_net = sum(int(h.get("net_strokes") or 0) for h in played)
    return total_par, total_gross, total_net


@router.get("", response_model=list[RoundResponse])
def list_rounds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Round)
        .filter(Round.user_id == current_user.id)
        .order_by(Round.date.desc())
        .all()
    )


@router.get("/{round_id}", response_model=RoundResponse)
def get_round(
    round_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    return rnd


@router.post("", response_model=RoundResponse, status_code=status.HTTP_201_CREATED)
def create_round(
    payload: RoundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = Round(
        user_id=current_user.id,
        course_id=payload.course_id,
        course_name=payload.course_name,
        date=payload.date,
        selected_tee=payload.selected_tee,
        total_par=payload.total_par,
        holes=[h.model_dump() for h in payload.holes],
        player_handicap_index=payload.player_handicap_index,
        course_handicap=payload.course_handicap,
    )
    db.add(rnd)
    db.commit()
    db.refresh(rnd)
    broadcast_round_event(current_user.id, "round.created", rnd.id)
    return rnd


@router.put("/sync", response_model=RoundResponse)
def sync_ios_round(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Idempotently mirror the full offline-first iPhone round, including active rounds."""
    round_id = _parse_uuid(_get(payload, "id", "ID"))
    if round_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing or invalid round id")

    course = _get(payload, "course")
    holes = _round_holes(payload)
    total_par, total_gross, total_net = _totals(holes)
    selected_tee = _get(payload, "selected_tee", "selectedTee")

    row = db.query(Round).filter(Round.id == round_id, Round.user_id == current_user.id).first()
    created = row is None
    if row is None:
        row = Round(id=round_id, user_id=current_user.id)
        db.add(row)

    row.course_id = _parse_uuid(_get(course, "id")) if isinstance(course, dict) else None
    row.course_name = str(_get(course, "name") or "Unknown course") if isinstance(course, dict) else "Unknown course"
    row.date = _parse_dt(_get(payload, "date")) or datetime.now(timezone.utc)
    row.selected_tee = str(_get(selected_tee, "name") or selected_tee or "") or None
    row.is_complete = bool(_get(payload, "is_complete", "isComplete") or False)
    row.current_hole_number = int(_get(payload, "current_hole_number", "currentHoleNumber") or 1)
    row.total_par = total_par
    row.total_gross = total_gross
    row.total_net = total_net
    row.holes = holes
    player = _get(payload, "player")
    row.player_handicap_index = _get(player, "handicap_index", "handicapIndex") if isinstance(player, dict) else None
    row.course_handicap = None
    row.version = (row.version or 0) + 1

    shots_raw = payload.get("shots") if isinstance(payload.get("shots"), list) else []
    existing = {s.id: s for s in row.shots}
    seen: set[UUID] = set()
    for index, raw in enumerate(shots_raw, start=1):
        if not isinstance(raw, dict):
            continue
        shot_data = _shot_payload(raw, index)
        shot_id = shot_data.pop("id")
        if shot_id.int == 0:
            continue
        seen.add(shot_id)
        shot = existing.get(shot_id)
        if shot is None:
            shot = RoundShot(id=shot_id, round_id=row.id)
            db.add(shot)
        for key, value in shot_data.items():
            setattr(shot, key, value)

    for shot_id, shot in existing.items():
        if shot_id not in seen:
            db.delete(shot)

    db.commit()
    db.refresh(row)
    broadcast_round_event(current_user.id, "round.created" if created else "round.updated", row.id, version=row.version)
    return row


@router.patch("/{round_id}", response_model=RoundResponse)
def update_round(
    round_id: UUID,
    payload: RoundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    if_match: str | None = Header(default=None, alias="If-Match"),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")

    # Optimistic concurrency: when the client passes If-Match, it asserts
    # which `version` it last saw. Anything stale gets a 409 so the client
    # can refetch and merge rather than overwriting another device's edits.
    if if_match is not None:
        try:
            expected = int(if_match.strip().strip('"'))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="If-Match must be an integer version",
            )
        if expected != rnd.version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stale round version (server={rnd.version}, client={expected})",
            )

    data = payload.model_dump(exclude_unset=True)
    if "holes" in data and data["holes"] is not None:
        data["holes"] = [h if isinstance(h, dict) else h.model_dump() for h in data["holes"]]
    for k, v in data.items():
        setattr(rnd, k, v)

    rnd.version = (rnd.version or 1) + 1

    db.commit()
    db.refresh(rnd)
    broadcast_round_event(
        current_user.id,
        "round.updated",
        rnd.id,
        version=rnd.version,
    )
    return rnd


@router.delete("/{round_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_round(
    round_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    db.delete(rnd)
    db.commit()
    broadcast_round_event(current_user.id, "round.deleted", round_id)


# ---- Round shots ----

@router.get("/{round_id}/shots", response_model=list[RoundShotResponse])
def list_round_shots(
    round_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    return rnd.shots


@router.post(
    "/{round_id}/shots",
    response_model=RoundShotResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_round_shot(
    round_id: UUID,
    payload: RoundShotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    shot = RoundShot(round_id=rnd.id, **payload.model_dump())
    db.add(shot)
    rnd.version = (rnd.version or 1) + 1
    db.commit()
    db.refresh(shot)
    broadcast_round_event(
        current_user.id,
        "round.shot.added",
        rnd.id,
        shot_id=str(shot.id),
        version=rnd.version,
    )
    return shot


@router.post(
    "/{round_id}/shots/bulk",
    response_model=list[RoundShotResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_round_shots_bulk(
    round_id: UUID,
    payload: list[RoundShotCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    shots = [RoundShot(round_id=rnd.id, **p.model_dump()) for p in payload]
    db.add_all(shots)
    rnd.version = (rnd.version or 1) + 1
    db.commit()
    for s in shots:
        db.refresh(s)
    broadcast_round_event(
        current_user.id,
        "round.shots.added",
        rnd.id,
        count=len(shots),
        version=rnd.version,
    )
    return shots


@router.post("/{round_id}/shots/{shot_id}/audio")
async def upload_round_shot_audio(
    round_id: UUID,
    shot_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    shot = next((s for s in rnd.shots if s.id == shot_id), None)
    if shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round shot not found")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Audio file is empty")
    stored = await store_audio("rounds", current_user.id, round_id, shot_id, Path(file.filename or "").suffix, data, file.content_type)
    shot.shot_context = {
        **(shot.shot_context or {}),
        "audio": {
            "url": stored.url or f"/rounds/{round_id}/shots/{shot_id}/audio",
            "content_type": stored.content_type,
            "byte_count": stored.byte_count,
        },
    }
    db.commit()
    return {"round_id": round_id, "shot_id": shot_id, "url": shot.shot_context["audio"]["url"]}


@router.get("/{round_id}/shots/{shot_id}/audio")
def get_round_shot_audio(
    round_id: UUID,
    shot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rnd = (
        db.query(Round)
        .filter(Round.id == round_id, Round.user_id == current_user.id)
        .first()
    )
    if not rnd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Round not found")
    shot = next((s for s in rnd.shots if s.id == shot_id), None)
    audio = shot.shot_context.get("audio") if shot and isinstance(shot.shot_context, dict) else None
    return audio_response_from_metadata(audio, "rounds", current_user.id, round_id, shot_id)
