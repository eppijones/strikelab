from datetime import datetime
import csv
import io
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Course, TeeTime
from app.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseImportResult,
    CourseResponse,
    CourseUpdate,
    TeeTimeCreate,
    TeeTimeResponse,
)
from app.services.auth import get_current_user, get_optional_user


router = APIRouter()


def _parse_holes_json(raw: str) -> Optional[list[dict]]:
    if not raw:
        return None
    raw = raw.strip()
    if not raw:
        return None
    try:
        import json

        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    return None


def _maybe_int(value: Optional[str]) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def _maybe_float(value: Optional[str]) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _maybe_bool(value: Optional[str]) -> Optional[bool]:
    if value is None or value == "":
        return None
    v = value.strip().lower()
    if v in {"1", "true", "yes", "y", "ja"}:
        return True
    if v in {"0", "false", "no", "n", "nei"}:
        return False
    return None


# === TEE TIMES (must come before /{course_id} to avoid route conflicts) ===

@router.get("/tee-times", response_model=list[TeeTimeResponse])
def list_tee_times(
    upcoming_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TeeTime).filter(TeeTime.user_id == current_user.id)

    if upcoming_only:
        query = query.filter(TeeTime.tee_time >= datetime.utcnow())

    tee_times = query.order_by(TeeTime.tee_time).all()

    responses = []
    for tt in tee_times:
        response = TeeTimeResponse.model_validate(tt)
        if tt.course:
            response.course = CourseResponse.model_validate(tt.course)
        responses.append(response)

    return responses


@router.post("/tee-times", response_model=TeeTimeResponse)
def create_tee_time(
    data: TeeTimeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tee_time = TeeTime(
        user_id=current_user.id,
        **data.model_dump(),
    )
    db.add(tee_time)
    db.commit()
    db.refresh(tee_time)

    response = TeeTimeResponse.model_validate(tee_time)
    if tee_time.course:
        response.course = CourseResponse.model_validate(tee_time.course)

    return response


@router.delete("/tee-times/{tee_time_id}")
def delete_tee_time(
    tee_time_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tee_time = db.query(TeeTime).filter(
        TeeTime.id == tee_time_id,
        TeeTime.user_id == current_user.id,
    ).first()

    if not tee_time:
        raise HTTPException(status_code=404, detail="Tee time not found")

    db.delete(tee_time)
    db.commit()

    return {"message": "Tee time deleted"}


# === COURSES ===

@router.get("/search", response_model=list[CourseResponse])
def search_courses(
    q: Optional[str] = None,
    country: Optional[str] = None,
    country_code: Optional[str] = None,
    region: Optional[str] = None,
    course_type: Optional[str] = None,
    has_driving_range: Optional[bool] = None,
    has_practice_area: Optional[bool] = None,
    has_simulator: Optional[bool] = None,
    holes_count: Optional[int] = None,
    mine: bool = False,
    limit: int = 60,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Search the course catalog with optional filters.

    `mine=true` restricts results to courses created by the current user.
    """
    query = db.query(Course)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Course.name.ilike(like),
                Course.city.ilike(like),
                Course.region.ilike(like),
                Course.country.ilike(like),
            )
        )

    if country:
        query = query.filter(Course.country == country)

    if country_code:
        query = query.filter(Course.country_code == country_code)

    if region:
        query = query.filter(Course.region == region)

    if course_type:
        query = query.filter(Course.course_type == course_type)

    if has_driving_range is not None:
        query = query.filter(Course.has_driving_range == has_driving_range)

    if has_practice_area is not None:
        query = query.filter(Course.has_practice_area == has_practice_area)

    if has_simulator is not None:
        query = query.filter(Course.has_simulator == has_simulator)

    if holes_count is not None:
        query = query.filter(Course.holes_count == holes_count)

    if mine and current_user:
        query = query.filter(Course.created_by_user_id == current_user.id)

    courses = (
        query.order_by(Course.is_verified.desc(), Course.name).limit(limit).all()
    )
    return [CourseResponse.model_validate(c) for c in courses]


@router.get("/regions", response_model=list[dict])
def list_regions(
    country_code: Optional[str] = "NO",
    db: Session = Depends(get_db),
):
    """Return distinct regions (counties / fylker) that have at least one
    course in the catalog. Defaults to Norway so the web UI's region picker
    can populate dynamically.
    """
    from sqlalchemy import func

    query = (
        db.query(Course.region, func.count(Course.id).label("count"))
        .filter(Course.region.isnot(None))
    )
    if country_code:
        query = query.filter(Course.country_code == country_code)

    rows = (
        query.group_by(Course.region)
        .order_by(Course.region)
        .all()
    )
    return [{"region": r, "count": c} for r, c in rows]


@router.post("", response_model=CourseResponse)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = data.model_dump()
    course = Course(
        **payload,
        created_by_user_id=current_user.id,
        is_verified=False,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


@router.post("/import", response_model=CourseImportResult)
def import_courses_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk import a CSV of courses. Header row is required.

    Supported columns (case-insensitive, optional unless noted):
      name (required), city, country, country_code, course_type,
      par, slope_rating, course_rating, total_yards, total_meters,
      latitude, longitude, website, phone, designer, established,
      holes (raw JSON list)
    """
    if not file.filename or not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Expected a .csv or .txt file")

    raw = file.file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1", errors="ignore")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV has no header row")

    field_map = {h.lower().strip(): h for h in reader.fieldnames}

    def get(row: dict, key: str) -> Optional[str]:
        col = field_map.get(key)
        return row.get(col, "").strip() if col else None

    imported = 0
    skipped = 0
    errors: list[str] = []

    for idx, row in enumerate(reader, start=2):  # row 1 is header
        name = get(row, "name")
        if not name:
            skipped += 1
            errors.append(f"Row {idx}: missing 'name'")
            continue

        try:
            course = Course(
                name=name,
                city=get(row, "city"),
                region=get(row, "region"),
                country=get(row, "country"),
                country_code=get(row, "country_code"),
                course_type=get(row, "course_type"),
                par=_maybe_int(get(row, "par")),
                holes_count=_maybe_int(get(row, "holes_count")),
                slope_rating=_maybe_float(get(row, "slope_rating")),
                course_rating=_maybe_float(get(row, "course_rating")),
                total_yards=_maybe_int(get(row, "total_yards")),
                total_meters=_maybe_int(get(row, "total_meters")),
                latitude=_maybe_float(get(row, "latitude")),
                longitude=_maybe_float(get(row, "longitude")),
                has_driving_range=_maybe_bool(get(row, "has_driving_range")),
                has_practice_area=_maybe_bool(get(row, "has_practice_area")),
                has_putting_green=_maybe_bool(get(row, "has_putting_green")),
                has_par3_course=_maybe_bool(get(row, "has_par3_course")),
                has_simulator=_maybe_bool(get(row, "has_simulator")),
                website=get(row, "website"),
                phone=get(row, "phone"),
                email=get(row, "email"),
                designer=get(row, "designer"),
                established=_maybe_int(get(row, "established")),
                ngf_club_id=get(row, "ngf_club_id"),
                osm_id=get(row, "osm_id"),
                holes=_parse_holes_json(get(row, "holes") or ""),
                created_by_user_id=current_user.id,
                is_verified=False,
            )
            db.add(course)
            imported += 1
        except Exception as exc:  # pragma: no cover - safety net
            db.rollback()
            skipped += 1
            errors.append(f"Row {idx}: {exc}")

    db.commit()
    return CourseImportResult(imported=imported, skipped=skipped, errors=errors[:25])


# === FAVORITES (must come before /{course_id} dynamic routes) ===

@router.get("/me/favorites", response_model=list[CourseResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return courses the current user has marked as favorites."""
    from sqlalchemy import text

    rows = db.execute(
        text(
            """
            SELECT c.* FROM courses c
            JOIN course_favorites f ON f.course_id = c.id
            WHERE f.user_id = :uid
            ORDER BY c.name
            """
        ),
        {"uid": current_user.id},
    ).mappings().all()

    return [CourseResponse.model_validate(dict(r)) for r in rows]


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: UUID,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return CourseResponse.model_validate(course)


@router.patch("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: UUID,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user-authored course. Verified catalog courses are read-only."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.is_verified and course.created_by_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Verified catalog courses can't be edited. Add a copy instead.",
        )

    if (
        course.created_by_user_id is not None
        and course.created_by_user_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not your course")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


@router.delete("/{course_id}")
def delete_course(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.is_verified or course.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")

    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}


@router.post("/{course_id}/favorite")
def add_favorite(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import text

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.execute(
        text(
            """
            INSERT INTO course_favorites (user_id, course_id)
            VALUES (:uid, :cid)
            ON CONFLICT DO NOTHING
            """
        ),
        {"uid": current_user.id, "cid": course_id},
    )
    db.commit()
    return {"favorited": True}


@router.delete("/{course_id}/favorite")
def remove_favorite(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import text

    db.execute(
        text(
            """
            DELETE FROM course_favorites
            WHERE user_id = :uid AND course_id = :cid
            """
        ),
        {"uid": current_user.id, "cid": course_id},
    )
    db.commit()
    return {"favorited": False}
