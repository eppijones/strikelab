"""Weather + course-conditions service for StrikeLab Tee.

Norway-first: tries Met.no's Locationforecast API (free, attribution required)
for any course inside Norway, falls back to OpenMeteo for the rest of the
world. Both responses are normalized into the `course_conditions.hourly` JSON
shape used everywhere downstream:

    [{ "h": 14, "t": 22, "w": 5, "dir": "SW", "sun": 0.92, "cloud": 0.1, "rain": 0.0,
       "gust": 8, "humidity": 62, "uv": 3, "apparent": 21 }, ...]

Caches into the `course_conditions` table with a 30-minute TTL so repeated
recommender runs don't hammer the upstream APIs.

The service degrades gracefully: if both upstreams are unavailable, it returns
a deterministic synthesized forecast so the UI keeps working in offline /
demo mode (this is what makes the seed script reliable in CI).
"""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.models.booking import CourseConditions
from app.models.course import Course

logger = logging.getLogger(__name__)


CACHE_TTL_MIN = 30
USER_AGENT = "StrikeLab-Tee/1.0 (https://strikelab.golf; ops@strikelab.golf)"
METNO_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
OPENMETEO_URL = "https://api.open-meteo.com/v1/forecast"
SUNRISESUNSET_URL = "https://api.sunrise-sunset.org/json"


@dataclass
class HourSample:
    h: int
    t: float
    w: float
    dir: Optional[str]
    sun: float
    cloud: float
    rain: float
    gust: Optional[float] = None
    humidity: Optional[float] = None
    uv: Optional[float] = None
    apparent: Optional[float] = None


def _wind_dir_compass(deg: Optional[float]) -> Optional[str]:
    if deg is None:
        return None
    dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    idx = int(((deg % 360) + 22.5) // 45) % 8
    return dirs[idx]


def _sun_intensity(hour: int, sunrise_h: int, sunset_h: int, cloud: float) -> float:
    """Synthesize a 0-1 sun intensity index from sunrise/sunset + cloud cover."""
    if hour < sunrise_h or hour > sunset_h:
        return 0.0
    span = max(1, sunset_h - sunrise_h)
    # Smooth half-sine arc with peak at the middle of the daylight band.
    pos = (hour - sunrise_h) / span
    arc = math.sin(pos * math.pi)
    return max(0.0, arc * (1.0 - max(0.0, min(1.0, cloud)) * 0.6))


# ─────────────────────────────────────────────────────────────────────
# Upstream callers
# ─────────────────────────────────────────────────────────────────────


def _fetch_metno(lat: float, lon: float, target_date: date) -> Optional[list[HourSample]]:
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(
                METNO_URL,
                params={"lat": f"{lat:.4f}", "lon": f"{lon:.4f}"},
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            )
            if r.status_code >= 400:
                logger.warning("met.no error %s: %s", r.status_code, r.text[:200])
                return None
            data = r.json()
    except (httpx.HTTPError, ValueError) as exc:  # network / decode
        logger.warning("met.no fetch failed: %s", exc)
        return None

    return _normalize_metno(data, target_date)


def _normalize_metno(data: dict, target_date: date) -> list[HourSample]:
    samples: dict[int, HourSample] = {}
    series = data.get("properties", {}).get("timeseries", [])
    for entry in series:
        try:
            ts = datetime.fromisoformat(entry["time"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            continue
        if ts.date() != target_date:
            continue
        details = entry.get("data", {}).get("instant", {}).get("details", {})
        next_1h = (
            entry.get("data", {}).get("next_1_hours", {}).get("details", {})
        )
        cloud = float(details.get("cloud_area_fraction", 0.0)) / 100.0
        rain_mm = float(next_1h.get("precipitation_amount", 0.0))
        rain_pct = max(0.0, min(1.0, rain_mm / 2.0))
        wind_speed = float(details.get("wind_speed", 0.0))
        wind_dir = _wind_dir_compass(details.get("wind_from_direction"))
        temp_c = float(details.get("air_temperature", 18.0))
        h = ts.hour
        samples[h] = HourSample(
            h=h,
            t=temp_c,
            w=wind_speed,
            dir=wind_dir,
            sun=0.0,  # filled in once we know sunrise/sunset
            cloud=cloud,
            rain=rain_pct,
            gust=details.get("wind_speed_of_gust"),
            humidity=details.get("relative_humidity"),
        )

    # Fill in 5..21 with whatever we have, interpolate gaps from neighbours.
    return _densify(samples)


def _fetch_openmeteo(
    lat: float, lon: float, target_date: date
) -> Optional[list[HourSample]]:
    iso = target_date.isoformat()
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(
                OPENMETEO_URL,
                params={
                    "latitude": f"{lat:.4f}",
                    "longitude": f"{lon:.4f}",
                    "hourly": "temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability,uv_index",
                    "wind_speed_unit": "ms",
                    "start_date": iso,
                    "end_date": iso,
                    "timezone": "auto",
                },
            )
            if r.status_code >= 400:
                logger.warning(
                    "open-meteo error %s: %s", r.status_code, r.text[:200]
                )
                return None
            data = r.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("open-meteo fetch failed: %s", exc)
        return None

    hourly = data.get("hourly", {})
    times: list[str] = hourly.get("time", [])
    samples: dict[int, HourSample] = {}
    for i, t in enumerate(times):
        try:
            ts = datetime.fromisoformat(t)
        except ValueError:
            continue
        if ts.date() != target_date:
            continue
        cloud = float((hourly.get("cloud_cover") or [0])[i]) / 100.0
        rain = float((hourly.get("precipitation_probability") or [0])[i]) / 100.0
        wind = float((hourly.get("wind_speed_10m") or [0])[i])
        wind_dir = _wind_dir_compass(
            (hourly.get("wind_direction_10m") or [None])[i]
        )
        temp = float((hourly.get("temperature_2m") or [18])[i])
        samples[ts.hour] = HourSample(
            h=ts.hour,
            t=temp,
            w=wind,
            dir=wind_dir,
            sun=0.0,
            cloud=cloud,
            rain=rain,
            gust=float((hourly.get("wind_gusts_10m") or [0])[i]),
            humidity=float((hourly.get("relative_humidity_2m") or [0])[i]),
            uv=float((hourly.get("uv_index") or [0])[i]),
            apparent=float((hourly.get("apparent_temperature") or [temp])[i]),
        )
    return _densify(samples)


def _densify(samples: dict[int, HourSample]) -> list[HourSample]:
    """Fill 5..21 with reasonable values, interpolating where gaps exist."""
    out: list[HourSample] = []
    if not samples:
        return out
    keys = sorted(samples.keys())
    for h in range(5, 22):
        if h in samples:
            out.append(samples[h])
            continue
        before = max((k for k in keys if k <= h), default=None)
        after = min((k for k in keys if k > h), default=None)
        if before is not None and after is not None:
            a, b = samples[before], samples[after]
            ratio = (h - before) / max(1, after - before)
            out.append(
                HourSample(
                    h=h,
                    t=a.t + (b.t - a.t) * ratio,
                    w=a.w + (b.w - a.w) * ratio,
                    dir=a.dir,
                    sun=0.0,
                    cloud=a.cloud + (b.cloud - a.cloud) * ratio,
                    rain=a.rain + (b.rain - a.rain) * ratio,
                    gust=_lerp_optional(a.gust, b.gust, ratio),
                    humidity=_lerp_optional(a.humidity, b.humidity, ratio),
                    uv=_lerp_optional(a.uv, b.uv, ratio),
                    apparent=_lerp_optional(a.apparent, b.apparent, ratio),
                )
            )
        elif before is not None:
            out.append(samples[before])
        elif after is not None:
            out.append(samples[after])
    return out


def _lerp_optional(a: Optional[float], b: Optional[float], ratio: float) -> Optional[float]:
    if a is None and b is None:
        return None
    if a is None:
        return b
    if b is None:
        return a
    return a + (b - a) * ratio


def _fetch_sun_times(lat: float, lon: float, target_date: date) -> dict[str, str]:
    try:
        with httpx.Client(timeout=8.0) as client:
            r = client.get(
                SUNRISESUNSET_URL,
                params={
                    "lat": f"{lat:.4f}",
                    "lng": f"{lon:.4f}",
                    "date": target_date.isoformat(),
                    "formatted": 0,
                },
            )
            if r.status_code >= 400:
                return {}
            results = r.json().get("results", {})
            sunrise_iso = results.get("sunrise")
            sunset_iso = results.get("sunset")
            golden_iso = results.get("civil_twilight_end")
            if not (sunrise_iso and sunset_iso):
                return {}
            sr = datetime.fromisoformat(sunrise_iso.replace("Z", "+00:00")).astimezone()
            ss = datetime.fromisoformat(sunset_iso.replace("Z", "+00:00")).astimezone()
            golden_start = ss - timedelta(minutes=80)
            return {
                "sunrise": sr.strftime("%H:%M"),
                "sunset": ss.strftime("%H:%M"),
                "golden_start": golden_start.strftime("%H:%M"),
            }
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("sunrise-sunset fetch failed: %s", exc)
        return {}


# ─────────────────────────────────────────────────────────────────────
# Synthesized fallback (deterministic by lat + date)
# ─────────────────────────────────────────────────────────────────────


def _synthesize(
    lat: float, target_date: date
) -> tuple[list[HourSample], dict[str, str]]:
    """Deterministic offline forecast — used when upstreams fail or in tests."""
    is_north = lat >= 60
    base_temp = 18 if is_north else 22
    samples = []
    for h in range(5, 22):
        sun_factor = math.sin((h - 5) / 16 * math.pi)
        cloud = 0.2 + 0.1 * math.sin(h)
        rain = 0.0
        wind = 4 + (1 if is_north else 0) + 2 * abs(math.sin(h / 4))
        temp = base_temp + sun_factor * 6 - (3 if h < 8 or h > 19 else 0)
        samples.append(
            HourSample(
                h=h,
                t=round(temp, 1),
                w=round(wind, 1),
                dir="SW",
                sun=max(0.0, sun_factor * (1 - cloud * 0.5)),
                cloud=cloud,
                rain=rain,
                gust=round(wind * 1.5, 1),
                humidity=65 if is_north else 55,
                uv=max(0.0, round(sun_factor * 4, 1)),
                apparent=round(temp - max(0.0, wind - 4) * 0.3, 1),
            )
        )
    sun_times = {
        "sunrise": "04:35" if is_north else "06:10",
        "sunset": "21:12" if is_north else "20:30",
        "golden_start": "19:50" if is_north else "19:00",
    }
    return samples, sun_times


# ─────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────


def get_conditions(
    db: Session,
    course: Course,
    target_date: Optional[date] = None,
    *,
    use_cache: bool = True,
) -> CourseConditions:
    """Return a `CourseConditions` row for the course/date, fetching if stale."""
    target_date = target_date or datetime.utcnow().date()

    if use_cache:
        cutoff = datetime.utcnow() - timedelta(minutes=CACHE_TTL_MIN)
        cached = (
            db.query(CourseConditions)
            .filter(
                CourseConditions.course_id == course.id,
                CourseConditions.for_date == target_date,
                CourseConditions.captured_at >= cutoff,
            )
            .order_by(CourseConditions.captured_at.desc())
            .first()
        )
        if cached:
            return cached

    samples: list[HourSample] = []
    source = "synthesized"
    if course.latitude is not None and course.longitude is not None:
        if (course.country_code or "").upper() == "NO":
            res = _fetch_metno(course.latitude, course.longitude, target_date)
            if res:
                samples = res
                source = "met.no"
        if not samples:
            res = _fetch_openmeteo(course.latitude, course.longitude, target_date)
            if res:
                samples = res
                source = "open-meteo"

    sun_times: dict[str, str] = {}
    if course.latitude is not None and course.longitude is not None:
        sun_times = _fetch_sun_times(course.latitude, course.longitude, target_date)

    if not samples or not sun_times:
        synth_samples, synth_times = _synthesize(course.latitude or 60.0, target_date)
        if not samples:
            samples = synth_samples
        if not sun_times:
            sun_times = synth_times

    sunrise_h = int(sun_times.get("sunrise", "06:00").split(":")[0])
    sunset_h = int(sun_times.get("sunset", "20:00").split(":")[0])
    for s in samples:
        s.sun = _sun_intensity(s.h, sunrise_h, sunset_h, s.cloud)

    representative = next((s for s in samples if s.h == 14), samples[len(samples) // 2])
    avg_rain = sum(s.rain for s in samples) / max(1, len(samples))

    conditions = CourseConditions(
        course_id=course.id,
        captured_at=datetime.utcnow(),
        for_date=target_date,
        hourly=[
            {
                "h": s.h,
                "t": round(s.t, 1),
                "w": round(s.w, 1),
                "dir": s.dir,
                "sun": round(s.sun, 3),
                "cloud": round(s.cloud, 3),
                "rain": round(s.rain, 3),
                "gust": round(s.gust, 1) if s.gust is not None else None,
                "humidity": round(s.humidity, 1) if s.humidity is not None else None,
                "uv": round(s.uv, 1) if s.uv is not None else None,
                "apparent": round(s.apparent, 1) if s.apparent is not None else None,
            }
            for s in samples
        ],
        green_speed=10.0,
        fairway_state="firm",
        rough_state="medium",
        mowed_hrs_ago=2,
        wind_ms=round(representative.w, 1),
        temp_c=round(representative.t, 1),
        sun_pct=round(representative.sun, 3),
        cloud_pct=round(representative.cloud, 3),
        rain_pct=round(avg_rain, 3),
        sunrise=sun_times.get("sunrise"),
        sunset=sun_times.get("sunset"),
        golden_start=sun_times.get("golden_start"),
        source=source,
    )
    db.add(conditions)
    db.commit()
    db.refresh(conditions)
    return conditions


def best_windows(conditions: CourseConditions) -> list[dict[str, Any]]:
    """Compute Today's best windows (golden / morning calm / twilight)."""
    if not conditions.hourly:
        return []
    by_hour = {h["h"]: h for h in conditions.hourly}

    def avg(slice_hours: list[int], key: str, default: float = 0.0) -> float:
        vals = [by_hour[h][key] for h in slice_hours if h in by_hour]
        return sum(vals) / len(vals) if vals else default

    out: list[dict[str, Any]] = []
    morning = list(range(8, 11))
    if all(h in by_hour for h in morning):
        out.append(
            {
                "label": "morning-calm",
                "label_no": "Morgenstille",
                "label_en": "Morning calm",
                "start_hour": 8,
                "end_hour": 11,
                "range": "08:00 — 11:00",
                "wind": avg(morning, "w"),
                "temp": avg(morning, "t"),
                "sun": avg(morning, "sun"),
                "rain": avg(morning, "rain"),
                "accent": "moss",
            }
        )

    golden = list(range(18, 21))
    if all(h in by_hour for h in golden):
        out.append(
            {
                "label": "golden",
                "label_no": "Gylden time",
                "label_en": "Golden hour",
                "start_hour": 18,
                "end_hour": 21,
                "range": "18:00 — 21:00",
                "wind": avg(golden, "w"),
                "temp": avg(golden, "t"),
                "sun": avg(golden, "sun"),
                "rain": avg(golden, "rain"),
                "accent": "sun",
            }
        )

    twilight = [20, 21]
    if all(h in by_hour for h in twilight):
        out.append(
            {
                "label": "twilight",
                "label_no": "Tussmørke",
                "label_en": "Twilight",
                "start_hour": 20,
                "end_hour": 21,
                "range": "20:00 — 21:00",
                "wind": avg(twilight, "w"),
                "temp": avg(twilight, "t"),
                "sun": avg(twilight, "sun"),
                "rain": avg(twilight, "rain"),
                "accent": "fjord",
            }
        )

    return out


def hourly_at(conditions: CourseConditions, hour: int) -> Optional[dict[str, Any]]:
    if not conditions.hourly:
        return None
    return next((h for h in conditions.hourly if h["h"] == hour), None)
