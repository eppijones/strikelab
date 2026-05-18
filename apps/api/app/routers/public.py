"""StrikeLab Open Golf API — public read-only endpoints."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Brand, ClubModel, Course, CourseGeometry, DataSource, TeeSheet
from app.schemas.booking import CourseConditionsResponse
from app.schemas.catalog import BrandResponse, ClubModelResponse
from app.schemas.public import (
    PublicApiIndexResponse,
    PublicAttribution,
    PublicCourseConditionSourcesResponse,
    PublicCourseGeometryResponse,
    PublicCourseResponse,
    PublicDataSourceResponse,
    PublicProviderSearchResponse,
    PublicProviderStatus,
    PublicTeeSheetSlotSummary,
    PublicTeeSheetSummaryResponse,
)
from app.services.providers import golfcourseapi
from app.services.weather import get_conditions
from app.services.plays_like import PlaysLikeInput, calculate_plays_like


router = APIRouter()

def _cache(response: Response, seconds: int = 300) -> None:
    response.headers["Cache-Control"] = f"public, max-age={seconds}, stale-while-revalidate=1800"


def _source_to_attr(source: DataSource | None) -> PublicAttribution | None:
    if not source:
        return None
    return PublicAttribution(
        source_id=source.id,
        name=source.name,
        license_name=source.license_name,
        license_url=source.license_url,
        attribution=source.attribution,
        source_url=source.source_url,
    )


def _sources_for_course(db: Session, course: Course, geometry: CourseGeometry | None = None) -> list[PublicAttribution]:
    ids = ["ngf-public-directory"]
    if course.osm_id or geometry:
        ids.append("openstreetmap")
    rows = db.query(DataSource).filter(DataSource.id.in_(ids)).all()
    by_id = {row.id: row for row in rows}
    return [attr for source_id in ids if (attr := _source_to_attr(by_id.get(source_id)))]


def _ensure_norway_catalog_seeded(db: Session) -> None:
    norway_courses = db.query(func.count(Course.id)).filter(Course.country_code == "NO").scalar() or 0
    if norway_courses:
        return

    from app.seed.catalog import seed_catalog

    seed_catalog(db)


def _sources_for_conditions(db: Session, source: str | None, *, has_daylight: bool = True) -> list[PublicAttribution]:
    ids: list[str] = []
    source_id = {
        "met.no": "met-no",
        "met-no": "met-no",
        "open-meteo": "open-meteo",
        "synthesized": "strikelab-synthesized-conditions",
    }.get((source or "").lower())
    if source_id:
        ids.append(source_id)
    if has_daylight:
        ids.append("sunrise-sunset")

    rows = db.query(DataSource).filter(DataSource.id.in_(ids)).all() if ids else []
    by_id = {row.id: row for row in rows}
    return [attr for source_id in ids if (attr := _source_to_attr(by_id.get(source_id)))]


def _set_attribution_headers(response: Response, sources: list[PublicAttribution]) -> None:
    if not sources:
        return
    response.headers["X-StrikeLab-Attribution"] = "; ".join(s.attribution for s in sources)
    response.headers["X-StrikeLab-Sources"] = ",".join(s.source_id for s in sources)


def _conditions_to_response(c) -> CourseConditionsResponse | None:
    if not c:
        return None
    return CourseConditionsResponse(
        course_id=c.course_id,
        captured_at=c.captured_at,
        for_date=c.for_date,
        hourly=c.hourly,
        green_speed=c.green_speed,
        fairway_state=c.fairway_state,
        rough_state=c.rough_state,
        mowed_hrs_ago=c.mowed_hrs_ago,
        wind_ms=c.wind_ms,
        temp_c=c.temp_c,
        sun_pct=c.sun_pct,
        cloud_pct=c.cloud_pct,
        rain_pct=c.rain_pct,
        sunrise=c.sunrise,
        sunset=c.sunset,
        golden_start=c.golden_start,
        source=c.source,
    )


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


def _course_to_public(db: Session, course: Course, geometry: CourseGeometry | None = None) -> PublicCourseResponse:
    return PublicCourseResponse(
        id=course.id,
        name=course.name,
        city=course.city,
        region=course.region,
        country=course.country,
        country_code=course.country_code,
        course_type=course.course_type,
        par=course.par,
        holes_count=course.holes_count,
        slope_rating=course.slope_rating,
        course_rating=course.course_rating,
        total_meters=course.total_meters,
        holes=course.holes,
        latitude=course.latitude,
        longitude=course.longitude,
        has_driving_range=course.has_driving_range,
        has_practice_area=course.has_practice_area,
        has_putting_green=course.has_putting_green,
        has_par3_course=course.has_par3_course,
        has_simulator=course.has_simulator,
        facilities=course.facilities,
        website=course.website,
        ngf_club_id=course.ngf_club_id,
        osm_id=course.osm_id,
        golfcourseapi_id=course.golfcourseapi_id,
        is_verified=course.is_verified,
        geometry_summary=geometry.summary if geometry else None,
        data_sources=_sources_for_course(db, course, geometry),
        updated_at=course.updated_at,
    )


def _catalog_provider_search(db: Session, q: str, limit: int) -> list[PublicCourseResponse]:
    _ensure_norway_catalog_seeded(db)
    like = f"%{q}%"
    rows = (
        db.query(Course)
        .filter(Course.is_verified.is_(True))
        .filter(
            or_(
                Course.name.ilike(like),
                Course.city.ilike(like),
                Course.region.ilike(like),
                Course.country.ilike(like),
            )
        )
        .order_by((Course.country_code == "NO").desc(), Course.name)
        .limit(limit)
        .all()
    )
    return [_course_to_public(db, course, _latest_geometry(db, course.id)) for course in rows]


def _course_dedupe_key(course: PublicCourseResponse) -> str:
    if course.golfcourseapi_id:
        return f"golfcourseapi:{course.golfcourseapi_id}"
    return f"course:{course.id}"


def _merge_catalog_and_provider_courses(
    catalog_courses: list[PublicCourseResponse],
    provider_courses: list[PublicCourseResponse],
    limit: int,
) -> list[PublicCourseResponse]:
    merged: list[PublicCourseResponse] = []
    seen: set[str] = set()

    for course in [*catalog_courses, *provider_courses]:
        key = _course_dedupe_key(course)
        if key in seen:
            continue
        seen.add(key)
        merged.append(course)
        if len(merged) >= limit:
            break
    return merged


def _latest_geometry(db: Session, course_id: UUID) -> CourseGeometry | None:
    return (
        db.query(CourseGeometry)
        .filter(CourseGeometry.course_id == course_id)
        .order_by(CourseGeometry.updated_at.desc())
        .first()
    )


def _resolve_date(raw: Optional[str]) -> date:
    if not raw:
        return datetime.utcnow().date()
    try:
        return date.fromisoformat(raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid date: {raw}") from exc


@router.get("", response_model=PublicApiIndexResponse)
def public_index(response: Response):
    _cache(response, 3600)
    return PublicApiIndexResponse(
        endpoints=[
            "GET /public/courses",
            "GET /public/courses/{id}",
            "GET /public/courses/{id}/geometry",
            "GET /public/courses/{id}/conditions",
            "GET /public/courses/{id}/condition-sources",
            "GET /public/courses/{id}/tee-sheet-summary",
            "GET /public/regions",
            "GET /public/equipment/brands",
            "GET /public/equipment/club-models",
            "GET /public/plays-like",
            "GET /public/providers/golfcourseapi/status",
            "GET /public/providers/golfcourseapi/search",
            "POST /public/providers/golfcourseapi/import/{id}",
            "GET /public/sources",
        ],
        terms="Public read-only factual golf data. Attribute upstream sources and do not mix public course facts with private player data.",
    )


@router.get("/sources", response_model=list[PublicDataSourceResponse])
def list_sources(response: Response, category: Optional[str] = None, db: Session = Depends(get_db)):
    _cache(response, 3600)
    query = db.query(DataSource)
    if category:
        query = query.filter(DataSource.category == category)
    return query.order_by(DataSource.category, DataSource.name).all()


@router.get("/providers/golfcourseapi/status", response_model=PublicProviderStatus)
def golfcourseapi_status(response: Response):
    _cache(response, 60)
    if not golfcourseapi.configured():
        return PublicProviderStatus(
            provider="golfcourseapi",
            configured=False,
            rate_limit_plan_hint="Free tier advertises 300 requests/day.",
            recommendation="Configure GOLFCOURSEAPI_KEY server-side before using this provider. Keep Norway-first data on NGF/OSM until provider coverage improves.",
        )
    authenticated = None
    sample_count = None
    norway_count = None
    recommendation = "Provider is configured. Use as global/US enrichment; keep NGF/OSM as Norway source of truth."
    try:
        sample_count = len(golfcourseapi.search("pebble beach", limit=5))
        norway_count = len(golfcourseapi.search("oslo", limit=5))
        authenticated = True
        if norway_count == 0:
            recommendation = "Authenticated, but Norway sample returned zero courses. Do not upgrade for Norway coverage yet; use it for US/global enrichment only."
    except golfcourseapi.GolfCourseAPIError as exc:
        authenticated = False
        recommendation = f"Provider check failed: {exc}"
    return PublicProviderStatus(
        provider="golfcourseapi",
        configured=True,
        authenticated=authenticated,
        sample_query="pebble beach",
        sample_count=sample_count,
        norway_sample_count=norway_count,
        rate_limit_plan_hint="Free: 300/day, Pro: 10,000/day, Enterprise: 100,000/day.",
        recommendation=recommendation,
    )


@router.get("/providers/golfcourseapi/search", response_model=PublicProviderSearchResponse)
def golfcourseapi_search(
    response: Response,
    q: str = Query(..., min_length=2),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    _cache(response, 300)
    catalog_courses = _catalog_provider_search(db, q, limit)
    if not golfcourseapi.configured():
        return PublicProviderSearchResponse(
            provider="strikelab-catalog",
            query=q,
            count=len(catalog_courses),
            courses=catalog_courses,
            note="Golf Course API is not configured; returned StrikeLab open catalog results.",
        )

    try:
        rows = golfcourseapi.search(q, limit=limit)
    except golfcourseapi.GolfCourseAPIError as exc:
        if catalog_courses:
            return PublicProviderSearchResponse(
                provider="strikelab-catalog",
                query=q,
                count=len(catalog_courses),
                courses=catalog_courses,
                note=f"Golf Course API unavailable ({exc}); returned StrikeLab open catalog results.",
            )
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    provider_courses = []
    for row in rows:
        try:
            detailed = golfcourseapi.get_course(row.id)
            provider_courses.append(golfcourseapi.to_public_course(detailed))
        except golfcourseapi.GolfCourseAPIError:
            provider_courses.append(golfcourseapi.to_public_course(row))
    courses = _merge_catalog_and_provider_courses(catalog_courses, provider_courses, limit)
    note = None
    if catalog_courses and provider_courses:
        note = "Returned StrikeLab open catalog results first, followed by Golf Course API enrichment results."
    elif catalog_courses:
        note = "Returned StrikeLab open catalog results; Golf Course API had no additional matches."
    elif q.lower() in {"oslo", "miklagard", "norway", "norge"}:
        note = "Golf Course API returned no Norwegian courses for this query; use StrikeLab NGF/OSM Norway catalog."
    return PublicProviderSearchResponse(
        provider="strikelab-catalog+golfcourseapi" if catalog_courses else "golfcourseapi",
        query=q,
        count=len(courses),
        courses=courses,
        note=note,
    )


@router.post("/providers/golfcourseapi/import/{provider_id}", response_model=PublicCourseResponse)
def golfcourseapi_import(provider_id: str, response: Response, db: Session = Depends(get_db)):
    _cache(response, 60)
    try:
        provider_course = golfcourseapi.get_course(provider_id)
        course = golfcourseapi.upsert_course(db, provider_course)
    except golfcourseapi.GolfCourseAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return _course_to_public(db, course, _latest_geometry(db, course.id))


@router.get("/health")
def public_health(response: Response, db: Session = Depends(get_db)):
    _cache(response, 60)
    _ensure_norway_catalog_seeded(db)
    sources = db.query(func.count(DataSource.id)).scalar() or 0
    norway_courses = db.query(func.count(Course.id)).filter(Course.country_code == "NO").scalar() or 0
    geometries = db.query(func.count(CourseGeometry.id)).scalar() or 0
    latest_geometry = db.query(func.max(CourseGeometry.updated_at)).scalar()
    return {
        "status": "operational",
        "scope": "NO",
        "sources": sources,
        "norway_courses": norway_courses,
        "course_geometries": geometries,
        "latest_geometry_at": latest_geometry,
        "private_player_data_exposed": False,
    }


@router.get("/regions", response_model=list[dict])
def list_regions(response: Response, country_code: Optional[str] = "NO", db: Session = Depends(get_db)):
    _cache(response, 900)
    query = db.query(Course.region, func.count(Course.id).label("count")).filter(Course.region.isnot(None))
    if country_code:
        query = query.filter(Course.country_code == country_code)
    rows = query.group_by(Course.region).order_by(Course.region).all()
    return [{"region": r, "count": c} for r, c in rows]


@router.get("/courses", response_model=list[PublicCourseResponse])
def list_courses(
    response: Response,
    q: Optional[str] = None,
    country_code: Optional[str] = "NO",
    region: Optional[str] = None,
    course_type: Optional[str] = None,
    has_driving_range: Optional[bool] = None,
    has_practice_area: Optional[bool] = None,
    has_simulator: Optional[bool] = None,
    holes_count: Optional[int] = None,
    verified_only: bool = True,
    limit: int = Query(default=80, ge=1, le=250),
    db: Session = Depends(get_db),
):
    _cache(response)
    if country_code in {None, "NO"}:
        _ensure_norway_catalog_seeded(db)
    query = db.query(Course)
    if verified_only:
        query = query.filter(Course.is_verified.is_(True))
    if country_code:
        query = query.filter(Course.country_code == country_code)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Course.name.ilike(like), Course.city.ilike(like), Course.region.ilike(like)))
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

    courses = query.order_by(Course.is_verified.desc(), Course.name).limit(limit).all()
    course_ids = [c.id for c in courses]
    geometry_by_course = {}
    if course_ids:
        geometry_by_course = {
            row.course_id: row
            for row in db.query(CourseGeometry).filter(CourseGeometry.course_id.in_(course_ids)).all()
        }
    return [_course_to_public(db, course, geometry_by_course.get(course.id)) for course in courses]


@router.get("/courses/{course_id}", response_model=PublicCourseResponse)
def get_course(course_id: UUID, response: Response, db: Session = Depends(get_db)):
    _cache(response)
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _course_to_public(db, course, _latest_geometry(db, course.id))


@router.get("/courses/{course_id}/geometry", response_model=PublicCourseGeometryResponse)
def get_course_geometry(course_id: UUID, response: Response, db: Session = Depends(get_db)):
    _cache(response)
    geometry = _latest_geometry(db, course_id)
    if not geometry:
        raise HTTPException(status_code=404, detail="Course geometry not found")
    return PublicCourseGeometryResponse(
        course_id=geometry.course_id,
        geometry_version=geometry.geometry_version,
        features=geometry.features,
        summary=geometry.summary,
        validation=geometry.validation,
        confidence=geometry.confidence,
        attribution=geometry.attribution,
        captured_at=geometry.captured_at,
        updated_at=geometry.updated_at,
        source=_source_to_attr(geometry.source),
    )


@router.get("/courses/{course_id}/conditions", response_model=CourseConditionsResponse)
def get_public_conditions(
    course_id: UUID,
    response: Response,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    _cache(response, 1800)
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    conditions = get_conditions(db, course, _resolve_date(date))
    res = _conditions_to_response(conditions)
    if not res:
        raise HTTPException(status_code=404, detail="Conditions unavailable")
    sources = _sources_for_conditions(
        db,
        conditions.source,
        has_daylight=bool(conditions.sunrise or conditions.sunset or conditions.golden_start),
    )
    _set_attribution_headers(response, sources)
    return res


@router.get("/courses/{course_id}/condition-sources", response_model=PublicCourseConditionSourcesResponse)
def get_public_condition_sources(
    course_id: UUID,
    response: Response,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    _cache(response, 1800)
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    conditions = get_conditions(db, course, _resolve_date(date))
    sources = _sources_for_conditions(
        db,
        conditions.source,
        has_daylight=bool(conditions.sunrise or conditions.sunset or conditions.golden_start),
    )
    _set_attribution_headers(response, sources)
    return PublicCourseConditionSourcesResponse(
        course_id=course.id,
        source=conditions.source,
        data_sources=sources,
    )


@router.get("/courses/{course_id}/tee-sheet-summary", response_model=PublicTeeSheetSummaryResponse)
def get_tee_sheet_summary(
    course_id: UUID,
    response: Response,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    _cache(response)
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    target = _resolve_date(date)
    sheet = db.query(TeeSheet).filter(TeeSheet.course_id == course_id, TeeSheet.date == target).first()
    conditions = get_conditions(db, course, target)
    if not sheet:
        return PublicTeeSheetSummaryResponse(
            course_id=course.id,
            course_name=course.name,
            date=target,
            provider=course.booking_provider,
            currency="NOK",
            slots=[],
            conditions=_conditions_to_response(conditions),
            data_sources=_sources_for_course(db, course, _latest_geometry(db, course.id)),
        )
    return PublicTeeSheetSummaryResponse(
        course_id=course.id,
        course_name=course.name,
        date=target,
        provider=sheet.provider,
        currency=sheet.currency,
        slots=[
            PublicTeeSheetSlotSummary(
                tee_time=slot.tee_time,
                players_total=slot.players_total,
                available=max(0, slot.players_total - slot.players_taken),
                price_amount=slot.price_amount,
                currency=slot.currency,
                peak=slot.peak,
                golden=slot.golden,
                twilight=slot.twilight,
            )
            for slot in sheet.slots
            if not slot.is_blocked
        ],
        conditions=_conditions_to_response(conditions),
        data_sources=_sources_for_course(db, course, _latest_geometry(db, course.id)),
    )


@router.get("/equipment/brands", response_model=list[BrandResponse])
def public_brands(response: Response, category: Optional[str] = None, db: Session = Depends(get_db)):
    _cache(response, 3600)
    rows = db.query(Brand).filter(Brand.is_active.is_(True)).order_by(Brand.sort_order, Brand.name).all()
    out = [_brand_to_response(b) for b in rows]
    if category:
        out = [b for b in out if b.categories and category in b.categories]
    return out


@router.get("/equipment/club-models", response_model=list[ClubModelResponse])
def public_club_models(
    response: Response,
    brand_id: Optional[str] = None,
    club_type: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    _cache(response, 3600)
    query = db.query(ClubModel).filter(ClubModel.is_active.is_(True))
    if brand_id:
        query = query.filter(ClubModel.brand_id == brand_id)
    if club_type:
        query = query.filter(ClubModel.club_type == club_type)
    if year:
        query = query.filter(ClubModel.year == year)
    return query.order_by(ClubModel.year.desc().nullslast(), ClubModel.name).all()


@router.get("/plays-like")
def public_plays_like(
    response: Response,
    distance_m: float = Query(..., ge=1, le=700),
    elevation_delta_m: float = Query(default=0.0, ge=-100, le=100),
    wind_ms: Optional[float] = Query(default=None, ge=0, le=40),
    wind_angle_deg: Optional[float] = Query(default=None, ge=0, le=360),
    temp_c: Optional[float] = Query(default=None, ge=-30, le=50),
    lie: Optional[str] = Query(default=None),
):
    _cache(response, 60)
    result = calculate_plays_like(
        PlaysLikeInput(
            distance_m=distance_m,
            elevation_delta_m=elevation_delta_m,
            wind_ms=wind_ms,
            wind_angle_deg=wind_angle_deg,
            temp_c=temp_c,
            lie=lie,
        )
    )
    return {
        "base_m": result.base_m,
        "plays_like_m": result.plays_like_m,
        "adjustment_m": result.adjustment_m,
        "components": {
            "elevation_m": result.elevation_m,
            "wind_m": result.wind_m,
            "temperature_m": result.temperature_m,
            "lie_m": result.lie_m,
        },
        "notes": result.notes,
    }
