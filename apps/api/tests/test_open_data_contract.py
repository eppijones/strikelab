import json
import re
from pathlib import Path
from uuid import uuid4

from app.schemas.public import PublicCourseConditionSourcesResponse, PublicAttribution
from app.schemas.public import PublicCourseResponse
from app.routers.public import _merge_catalog_and_provider_courses
from app.services.plays_like import PlaysLikeInput, calculate_plays_like
from app.services.providers.golfcourseapi import ProviderCourse, to_public_course


REPO_ROOT = Path(__file__).resolve().parents[3]


def _rtf_text(value: str) -> str:
    def decode_hex(match: re.Match[str]) -> str:
        return bytes.fromhex(match.group(1)).decode("cp1252")

    value = re.sub(r"\\'([0-9a-fA-F]{2})", decode_hex, value)
    value = re.sub(r"\\uc0\\u(-?\d+)\s?", lambda m: chr(int(m.group(1))), value)
    return value


def _norway_name_key(value: str) -> str:
    value = value.lower()
    value = value.replace("æ", "ae").replace("ø", "o").replace("å", "aa")
    value = value.split(" - ")[0].split("-")[0]
    value = re.sub(r"\s*\(.*?\)", "", value)
    value = re.sub(r"\b(golfklubb|golf club|gk|golf)\b", "", value)
    value = re.sub(r"\b(og|&)\s+omegn\b", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def test_public_course_response_has_attribution_boundary():
    payload = PublicCourseResponse(
        id=uuid4(),
        name="Oslo Golfklubb",
        country_code="NO",
        is_verified=True,
        data_sources=[],
    )

    assert payload.name == "Oslo Golfklubb"
    assert not hasattr(payload, "created_by_user_id")


def test_provider_search_merges_catalog_before_provider_results():
    catalog = PublicCourseResponse(
        id=uuid4(),
        name="Grønmo Golfklubb",
        city="Oslo",
        country_code="NO",
        is_verified=True,
        data_sources=[],
    )
    provider = PublicCourseResponse(
        id=uuid4(),
        name="Pebble Beach Golf Links",
        golfcourseapi_id="123",
        country_code="US",
        is_verified=True,
        data_sources=[],
    )

    merged = _merge_catalog_and_provider_courses([catalog], [provider], limit=10)

    assert [course.name for course in merged] == ["Grønmo Golfklubb", "Pebble Beach Golf Links"]


def test_norway_rtf_course_list_is_represented_in_seed_data():
    rtf = (REPO_ROOT / "StrikeLabResearch" / "golfclubsNorway.rtf").read_text(encoding="utf-8")
    seed_rows = json.loads(
        (REPO_ROOT / "apps" / "api" / "app" / "seed" / "data" / "norway_clubs.json").read_text(
            encoding="utf-8"
        )
    )
    seed_keys = {_norway_name_key(row["name"]) for row in seed_rows}
    rtf_names = [
        _rtf_text(match).strip()
        for match in re.findall(r"\\strokec2\s+(.+?)\\cb1", rtf)
    ]
    rtf_names = [name for name in rtf_names if name != "Norges Golfforbund"]

    missing = [
        name
        for name in rtf_names
        if _norway_name_key(name) not in seed_keys
    ]

    assert len(seed_rows) >= len(rtf_names)
    assert missing == []


def test_golfcourseapi_provider_course_holes_include_meters():
    public = to_public_course(
        ProviderCourse(
            id="123",
            club_name="Pebble Beach Golf Links",
            course_name="Pebble Beach Golf Links",
            location={"city": "Pebble Beach", "state": "CA", "country": "United States"},
            tees={
                "male": [
                    {
                        "tee_name": "Blue",
                        "number_of_holes": 1,
                        "par_total": 4,
                        "total_yards": 380,
                        "holes": [{"par": 4, "handicap": 7, "yardage": 380}],
                    }
                ]
            },
        )
    )

    assert public.holes == [{"number": 1, "par": 4, "handicap": 7, "yards": 380, "meters": 347}]


def test_public_condition_sources_response_keeps_player_data_out():
    payload = PublicCourseConditionSourcesResponse(
        course_id=uuid4(),
        source="met.no",
        data_sources=[
            PublicAttribution(
                source_id="met-no",
                name="MET Norway Locationforecast",
                license_name="NLOD / CC BY compatible",
                attribution="Weather data from MET Norway",
                source_url="https://api.met.no/weatherapi/locationforecast/2.0/documentation",
            )
        ],
    )

    assert payload.data_sources[0].source_id == "met-no"
    assert not hasattr(payload, "user_id")


def test_plays_like_headwind_adds_distance():
    calm = calculate_plays_like(PlaysLikeInput(distance_m=150, temp_c=15))
    headwind = calculate_plays_like(
        PlaysLikeInput(distance_m=150, wind_ms=8, wind_angle_deg=0, temp_c=15)
    )

    assert headwind.plays_like_m > calm.plays_like_m
    assert "headwind" in headwind.notes
