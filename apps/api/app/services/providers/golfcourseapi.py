"""Provider client for https://golfcourseapi.com/.

The API key must stay server-side. Web, iPhone, and Watch consume normalized
StrikeLab `/public` responses instead of calling this provider directly.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.config import get_settings
from app.models.course import Course
from app.schemas.public import PublicAttribution, PublicCourseResponse


class GolfCourseAPIError(RuntimeError):
    pass


@dataclass
class ProviderCourse:
    id: str
    club_name: str
    course_name: str
    location: dict[str, Any]
    tees: dict[str, Any] | None = None


def configured() -> bool:
    return bool(get_settings().golfcourseapi_key)


def _headers() -> dict[str, str]:
    key = get_settings().golfcourseapi_key
    if not key:
        raise GolfCourseAPIError("GOLFCOURSEAPI_KEY is not configured")
    return {
        "Authorization": f"Key {key}",
        "Accept": "application/json",
        "User-Agent": "StrikeLab/1.0 (+https://strikelab.golf)",
    }


def _base_url() -> str:
    return get_settings().golfcourseapi_base_url.rstrip("/")


def _unwrap_course(payload: dict[str, Any]) -> dict[str, Any]:
    return payload.get("course") or payload


def search(query: str, *, limit: int = 20) -> list[ProviderCourse]:
    if len(query.strip()) < 2:
        return []
    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.get(
                f"{_base_url()}/search",
                params={"search_query": query.strip()},
                headers=_headers(),
            )
            if res.status_code == 401:
                raise GolfCourseAPIError("Golf Course API key rejected")
            if res.status_code == 429:
                raise GolfCourseAPIError("Golf Course API rate limit exceeded")
            res.raise_for_status()
            rows = res.json().get("courses", [])
    except httpx.HTTPError as exc:
        raise GolfCourseAPIError(str(exc)) from exc
    return [
        ProviderCourse(
            id=str(row.get("id")),
            club_name=row.get("club_name") or "",
            course_name=row.get("course_name") or row.get("club_name") or "",
            location=row.get("location") or {},
        )
        for row in rows[:limit]
        if row.get("id")
    ]


def get_course(provider_id: str) -> ProviderCourse:
    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.get(f"{_base_url()}/courses/{provider_id}", headers=_headers())
            if res.status_code == 401:
                raise GolfCourseAPIError("Golf Course API key rejected")
            if res.status_code == 404:
                raise GolfCourseAPIError("Golf Course API course not found")
            if res.status_code == 429:
                raise GolfCourseAPIError("Golf Course API rate limit exceeded")
            res.raise_for_status()
            row = _unwrap_course(res.json())
    except httpx.HTTPError as exc:
        raise GolfCourseAPIError(str(exc)) from exc
    return ProviderCourse(
        id=str(row.get("id")),
        club_name=row.get("club_name") or "",
        course_name=row.get("course_name") or row.get("club_name") or "",
        location=row.get("location") or {},
        tees=row.get("tees") or {},
    )


def _country_code(country: Optional[str]) -> Optional[str]:
    if not country:
        return None
    normalized = country.strip().lower()
    if normalized in {"united states", "usa", "us"}:
        return "US"
    if normalized in {"norway", "norge"}:
        return "NO"
    if normalized in {"united kingdom", "uk", "great britain"}:
        return "GB"
    if normalized in {"ireland"}:
        return "IE"
    if normalized in {"spain", "españa"}:
        return "ES"
    return None


def _best_tee(tees: dict[str, Any] | None) -> dict[str, Any] | None:
    if not tees:
        return None
    all_tees: list[dict[str, Any]] = []
    for key in ("male", "female"):
        rows = tees.get(key) or []
        if isinstance(rows, list):
            all_tees.extend([r for r in rows if isinstance(r, dict)])
    if not all_tees:
        return None
    return sorted(
        all_tees,
        key=lambda t: t.get("total_meters") or t.get("total_yards") or 0,
        reverse=True,
    )[0]


def _holes(tee: dict[str, Any] | None) -> list[dict[str, Any]] | None:
    if not tee or not isinstance(tee.get("holes"), list):
        return None
    out = []
    for idx, hole in enumerate(tee["holes"], start=1):
        yards = hole.get("yardage")
        meters = hole.get("meters")
        if meters is None and isinstance(yards, (int, float)):
            meters = round(yards * 0.9144)
        out.append(
            {
                "number": idx,
                "par": hole.get("par"),
                "handicap": hole.get("handicap"),
                "yards": yards,
                "meters": meters,
            }
        )
    return out


def to_public_course(provider: ProviderCourse) -> PublicCourseResponse:
    loc = provider.location or {}
    tee = _best_tee(provider.tees)
    holes = _holes(tee)
    name = provider.course_name if provider.course_name == provider.club_name else f"{provider.club_name} - {provider.course_name}"
    return PublicCourseResponse(
        id=_stable_uuid(provider.id),
        name=name.strip(" -") or provider.club_name or f"Golf Course API {provider.id}",
        city=loc.get("city"),
        region=loc.get("state"),
        country=loc.get("country"),
        country_code=_country_code(loc.get("country")),
        course_type=None,
        par=tee.get("par_total") if tee else None,
        holes_count=tee.get("number_of_holes") if tee else (len(holes) if holes else None),
        slope_rating=tee.get("slope_rating") if tee else None,
        course_rating=tee.get("course_rating") if tee else None,
        total_meters=tee.get("total_meters") if tee else None,
        holes=holes,
        latitude=loc.get("latitude"),
        longitude=loc.get("longitude"),
        website=None,
        golfcourseapi_id=provider.id,
        is_verified=True,
        data_sources=[
            PublicAttribution(
                source_id="golfcourseapi",
                name="Golf Course API",
                license_name="Commercial API terms",
                license_url="https://www.golfcourseapi.com/",
                attribution="Course rating and tee data from Golf Course API where available.",
                source_url="https://api.golfcourseapi.com/docs/api/",
            )
        ],
    )


def upsert_course(db, provider: ProviderCourse) -> Course:
    tee = _best_tee(provider.tees)
    holes = _holes(tee)
    loc = provider.location or {}
    existing = db.query(Course).filter(Course.golfcourseapi_id == provider.id).first()
    if existing is None:
        existing = Course(golfcourseapi_id=provider.id, is_verified=True)
        db.add(existing)
    public = to_public_course(provider)
    existing.name = public.name
    existing.city = public.city
    existing.region = public.region
    existing.country = public.country
    existing.country_code = public.country_code
    existing.par = public.par
    existing.holes_count = public.holes_count
    existing.slope_rating = public.slope_rating
    existing.course_rating = public.course_rating
    existing.total_meters = public.total_meters
    existing.holes = holes
    existing.latitude = loc.get("latitude")
    existing.longitude = loc.get("longitude")
    existing.is_verified = True
    db.commit()
    db.refresh(existing)
    return existing


def _stable_uuid(provider_id: str):
    import uuid

    return uuid.uuid5(uuid.NAMESPACE_URL, f"https://api.golfcourseapi.com/v1/courses/{provider_id}")
