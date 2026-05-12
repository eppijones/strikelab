"""StrikeLab Tee — booking router.

End-to-end booking surface that powers the web + iOS experiences:

    GET  /booking/preferences
    PATCH /booking/preferences

    GET  /booking/discover                     — recommended slots for me
    GET  /booking/courses/{id}/sheet?date=YYYY-MM-DD
    GET  /booking/windows/{id}?date=YYYY-MM-DD — best 3 windows for the day
    GET  /booking/courses/{id}/conditions      — live condition snapshot

    POST /booking/hold                         — persisted hold
    POST /booking/confirm                      — provider + payment + booking
    POST /booking/cancel/{booking_id}

    GET  /booking/passes/{booking_id}          — boarding pass payload
    GET  /booking/passes                       — my upcoming passes
    GET  /booking/playmates                    — recently played with

    GET  /booking/search                       — back-compat for legacy
                                                 calendar UI; returns flat slots
"""
from __future__ import annotations

import logging
from datetime import date, datetime, time as dt_time, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.booking import (
    Booking,
    BookingHold,
    BookingPreferences,
    Playmate,
    SlotPlayerLink,
    TeeSheet,
    TeeSheetSlot,
)
from app.models.course import Course, TeeTime
from app.models.user import User
from app.schemas.booking import (
    BestWindow,
    BookingPreferencesResponse,
    BookingPreferencesUpdate,
    ConfirmRequest,
    ConfirmResponse,
    CourseConditionsResponse,
    DiscoverResponse,
    HoldRequest,
    HoldResponse,
    PassPlayer,
    PassResponse,
    PlaymateResponse,
    RecommendedSlot,
    TeeSheetResponse,
    TeeSheetSlotResponse,
)
from app.services.auth import get_current_user
from app.services.payments import select as select_payment
from app.services.payments.base import PaymentError
from app.services.providers import get_provider
from app.services.providers.base import ProviderError
from app.services.recommender import (
    estimate_drive_min,
    fetch_playmate_user_ids,
    fetch_slot_user_ids,
    score_slot,
    window_label_for,
    _haversine_km,
)
from app.services.weather import best_windows, get_conditions, hourly_at


logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────


def _get_or_create_prefs(db: Session, user: User) -> BookingPreferences:
    prefs = (
        db.query(BookingPreferences)
        .filter(BookingPreferences.user_id == user.id)
        .first()
    )
    if not prefs:
        prefs = BookingPreferences(user_id=user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


def _slot_to_response(
    slot: TeeSheetSlot, occupants: list[dict] | None = None
) -> TeeSheetSlotResponse:
    return TeeSheetSlotResponse(
        id=slot.id,
        tee_time=slot.tee_time,
        players_total=slot.players_total,
        players_taken=slot.players_taken,
        available=max(0, slot.players_total - slot.players_taken),
        price_amount=slot.price_amount,
        currency=slot.currency,
        peak=slot.peak,
        golden=slot.golden,
        twilight=slot.twilight,
        is_blocked=slot.is_blocked,
        provider_ref=slot.provider_ref,
        occupants=occupants or [],
    )


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


def _resolve_date(date_str: Optional[str]) -> date:
    if not date_str:
        return datetime.utcnow().date()
    try:
        return date.fromisoformat(date_str)
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid date: {date_str}"
        ) from exc


def _drive_for(course: Course, user: User) -> tuple[Optional[float], Optional[int]]:
    if (
        user.home_lat is None
        or user.home_lon is None
        or course.latitude is None
        or course.longitude is None
    ):
        return None, None
    km = _haversine_km(user.home_lat, user.home_lon, course.latitude, course.longitude)
    return round(km, 1), estimate_drive_min(km)


# ─────────────────────────────────────────────────────────────────────
# Preferences
# ─────────────────────────────────────────────────────────────────────


@router.get("/preferences", response_model=BookingPreferencesResponse)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_or_create_prefs(db, current_user)


@router.patch("/preferences", response_model=BookingPreferencesResponse)
def update_preferences(
    payload: BookingPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = _get_or_create_prefs(db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    db.commit()
    db.refresh(prefs)
    return prefs


# ─────────────────────────────────────────────────────────────────────
# Tee sheet + windows
# ─────────────────────────────────────────────────────────────────────


@router.get("/courses/{course_id}/sheet", response_model=TeeSheetResponse)
def get_tee_sheet(
    course_id: UUID,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    target = _resolve_date(date)
    sheet = (
        db.query(TeeSheet)
        .filter(TeeSheet.course_id == course_id, TeeSheet.date == target)
        .first()
    )
    if not sheet:
        # Empty but well-formed response so the UI can render an empty grid.
        return TeeSheetResponse(
            id=UUID(int=0),
            course_id=course_id,
            course_name=course.name,
            date=target,
            opens_at=dt_time(6, 0),
            closes_at=dt_time(20, 0),
            interval_min=8,
            currency="NOK",
            provider=course.booking_provider,
            slots=[],
            conditions=None,
        )

    conditions = get_conditions(db, course, target)
    prefs_user_ids = fetch_playmate_user_ids(db, current_user)

    slot_responses: list[TeeSheetSlotResponse] = []
    for slot in sheet.slots:
        occupants_raw = (
            db.query(SlotPlayerLink, User)
            .join(User, User.id == SlotPlayerLink.user_id)
            .filter(SlotPlayerLink.slot_id == slot.id)
            .all()
        )
        occupants = []
        for link, occ in occupants_raw:
            initials = "".join(p[0] for p in (occ.display_name or "?").split()[:2]).upper()
            occupants.append(
                {
                    "user_id": str(occ.id) if occ.id != current_user.id else "me",
                    "initials": initials,
                    "is_friend": occ.id in prefs_user_ids,
                    "handicap": occ.whs_handicap or occ.handicap_index,
                }
            )
        slot_responses.append(_slot_to_response(slot, occupants))

    return TeeSheetResponse(
        id=sheet.id,
        course_id=course.id,
        course_name=course.name,
        date=sheet.date,
        opens_at=sheet.opens_at,
        closes_at=sheet.closes_at,
        interval_min=sheet.interval_min,
        currency=sheet.currency,
        provider=sheet.provider,
        slots=slot_responses,
        conditions=_conditions_to_response(conditions),
    )


@router.get("/courses/{course_id}/conditions", response_model=CourseConditionsResponse)
def get_course_conditions(
    course_id: UUID,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    target = _resolve_date(date)
    return _conditions_to_response(get_conditions(db, course, target))


@router.get("/windows/{course_id}", response_model=list[BestWindow])
def get_best_windows(
    course_id: UUID,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    target = _resolve_date(date)
    conditions = get_conditions(db, course, target)
    raw = best_windows(conditions)

    # Annotate each window with a count of free slots in that range.
    sheet = (
        db.query(TeeSheet)
        .filter(TeeSheet.course_id == course_id, TeeSheet.date == target)
        .first()
    )
    out: list[BestWindow] = []
    for w in raw:
        free = 0
        if sheet:
            for s in sheet.slots:
                if w["start_hour"] <= s.tee_time.hour < w["end_hour"]:
                    free += max(0, s.players_total - s.players_taken)
        out.append(
            BestWindow(
                label=w["label"],
                label_no=w["label_no"],
                label_en=w["label_en"],
                start_hour=w["start_hour"],
                end_hour=w["end_hour"],
                range=w["range"],
                conditions_summary=(
                    f"{w['temp']:.0f}\u00B0 \u00B7 {w['wind']:.0f} m/s"
                ),
                free_slots=free,
                accent=w["accent"],
            )
        )
    return out


# ─────────────────────────────────────────────────────────────────────
# Discover (recommendations)
# ─────────────────────────────────────────────────────────────────────


@router.get("/discover", response_model=DiscoverResponse)
def discover(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = _get_or_create_prefs(db, current_user)
    target_today = datetime.utcnow().date()
    target_tomorrow = target_today + timedelta(days=1)

    # Limit to verified courses with a published tee sheet for either day.
    sheets_today: list[TeeSheet] = (
        db.query(TeeSheet)
        .filter(TeeSheet.date == target_today)
        .all()
    )
    sheets_tomorrow: list[TeeSheet] = (
        db.query(TeeSheet)
        .filter(TeeSheet.date == target_tomorrow)
        .all()
    )

    playmate_ids = fetch_playmate_user_ids(db, current_user)
    favorite_id = prefs.favorite_course_id

    def collect(sheets: list[TeeSheet], hour_filter=lambda h: True) -> list[RecommendedSlot]:
        results: list[RecommendedSlot] = []
        for sheet in sheets:
            course = sheet.course
            if not course:
                continue
            conditions = get_conditions(db, course, sheet.date)
            km, drive_min = _drive_for(course, current_user)
            for slot in sheet.slots:
                if slot.is_blocked:
                    continue
                if not hour_filter(slot.tee_time.hour):
                    continue
                if max(0, slot.players_total - slot.players_taken) <= 0:
                    continue
                slot_user_ids = fetch_slot_user_ids(db, slot)
                scored = score_slot(
                    user=current_user,
                    prefs=prefs,
                    course=course,
                    slot=slot,
                    conditions=conditions,
                    playmate_user_ids=playmate_ids,
                    slot_user_ids=slot_user_ids,
                )
                if scored.score <= 0:
                    continue
                results.append(
                    RecommendedSlot(
                        course_id=course.id,
                        course_name=course.name,
                        course_city=course.city,
                        course_region=course.region,
                        course_type=course.course_type,
                        drive_min=drive_min,
                        drive_km=km,
                        slot_id=slot.id,
                        tee_time=slot.tee_time,
                        available=max(0, slot.players_total - slot.players_taken),
                        price_amount=slot.price_amount,
                        currency=slot.currency,
                        score=scored.score,
                        why=scored.why,
                        window_label=scored.window_label,
                        sun_pct=scored.sun_pct,
                        wind_ms=scored.wind_ms,
                        temp_c=scored.temp_c,
                        rain_pct=scored.rain_pct,
                    )
                )
        results.sort(key=lambda r: r.score, reverse=True)
        return results

    now_h = datetime.utcnow().hour
    best_now = collect(sheets_today, lambda h: h >= now_h)[:8]
    today_window = collect(sheets_today, lambda h: 8 <= h < 21)[:6]
    tonight = collect(sheets_today, lambda h: h >= 17)[:6]

    weekend: list[RecommendedSlot] = []
    if datetime.utcnow().weekday() < 5:
        # Look up to 7 days ahead to find next Saturday's sheet.
        for offset in range(0, 8):
            d = target_today + timedelta(days=offset)
            if d.weekday() == 5:
                weekend_sheets = (
                    db.query(TeeSheet).filter(TeeSheet.date == d).all()
                )
                weekend = collect(weekend_sheets, lambda h: 8 <= h < 14)[:6]
                break

    favorites: list[RecommendedSlot] = []
    nearby: list[RecommendedSlot] = []
    if favorite_id:
        fav_sheet = next(
            (s for s in sheets_today + sheets_tomorrow if s.course_id == favorite_id),
            None,
        )
        if fav_sheet:
            favorites = collect([fav_sheet])[:6]
    if best_now:
        # Pick up to 3 nearby (drive_min < 60 minutes) results not already in best_now top 3.
        seen = {r.slot_id for r in best_now[:3]}
        nearby = [
            r
            for r in best_now
            if r.drive_min is not None and r.drive_min <= 60 and r.slot_id not in seen
        ][:6]

    return DiscoverResponse(
        bucket="best-now",
        best_now=best_now,
        today_window=today_window,
        tonight=tonight,
        weekend=weekend,
        favorites=favorites,
        nearby=nearby,
    )


# ─────────────────────────────────────────────────────────────────────
# Hold + Confirm
# ─────────────────────────────────────────────────────────────────────


@router.post("/hold", response_model=HoldResponse)
def hold_slot(
    payload: HoldRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course: Optional[Course] = None
    if payload.course_id:
        course = db.query(Course).filter(Course.id == payload.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

    provider = get_provider(course.booking_provider if course else "internal")
    try:
        held = provider.hold(
            db,
            current_user,
            course or Course(name=payload.course_name),
            payload.slot_id,
            payload.tee_time,
            payload.players,
            payload.provider_ref,
        )
    except ProviderError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    total = (payload.price_amount or 0.0) * max(1, payload.players)
    hold = BookingHold(
        user_id=current_user.id,
        slot_id=held.slot_id,
        course_id=course.id if course else None,
        course_name=payload.course_name,
        tee_time=payload.tee_time,
        players=payload.players,
        player_payload=[p.model_dump(mode="json") for p in (payload.player_payload or [])],
        provider=held.provider,
        provider_ref=held.provider_ref,
        price_amount=payload.price_amount,
        currency=payload.currency,
        total_amount=total or None,
        status="held",
        expires_at=held.expires_at,
    )
    db.add(hold)
    db.commit()
    db.refresh(hold)
    return hold


@router.post("/confirm", response_model=ConfirmResponse)
def confirm_booking(
    payload: ConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hold = (
        db.query(BookingHold)
        .filter(
            BookingHold.id == payload.hold_id,
            BookingHold.user_id == current_user.id,
        )
        .first()
    )
    if not hold:
        raise HTTPException(status_code=404, detail="Hold not found")
    if hold.status != "held":
        raise HTTPException(status_code=409, detail=f"Hold is {hold.status}")
    if hold.expires_at < datetime.utcnow():
        hold.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Hold expired")

    course = (
        db.query(Course).filter(Course.id == hold.course_id).first()
        if hold.course_id
        else None
    )
    provider = get_provider(course.booking_provider if course else "internal")

    # Pull payment intent — Vipps NO default, Stripe otherwise.
    client = select_payment(payload.payment_method, country_code=(course.country_code if course else "NO"))
    payment_status = "captured"
    payment_id: Optional[str] = None
    try:
        if client.name == "vipps":
            init = client.initiate(
                amount_nok=hold.total_amount or hold.price_amount or 0.0,
                order_text=f"StrikeLab Tee — {hold.course_name}",
                booking_id=str(hold.id),
            )
            payment_id = init.payment_id
            captured = client.capture(payment_id, hold.total_amount or 0.0)
            payment_status = captured.status.value
        else:
            init = client.initiate(
                amount=hold.total_amount or 0.0,
                currency=hold.currency,
                booking_id=str(hold.id),
                customer_email=current_user.email,
            )
            payment_id = init.payment_id
            captured = client.capture(
                payment_id, hold.total_amount or 0.0, hold.currency
            )
            payment_status = captured.status.value
    except PaymentError as exc:
        logger.warning("Payment failed for hold %s: %s", hold.id, exc)
        payment_status = "failed"
        if not payload.payment_token:
            raise HTTPException(status_code=402, detail=str(exc)) from exc

    # Provider confirmation (updates slot occupancy).
    try:
        confirmation = provider.confirm(db, current_user, hold, payment_id)
    except ProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # Persist TeeTime so legacy /courses/tee-times still surfaces this.
    tee_time_row = TeeTime(
        user_id=current_user.id,
        course_id=hold.course_id,
        tee_time=hold.tee_time,
        players=[p.get("name") for p in (hold.player_payload or [])],
        booking_source=hold.provider,
        booking_reference=confirmation.provider_ref,
        status="scheduled",
    )
    db.add(tee_time_row)
    db.flush()

    if hold.slot_id:
        link = SlotPlayerLink(
            slot_id=hold.slot_id,
            tee_time_id=tee_time_row.id,
            user_id=current_user.id,
            seat_index=0,
        )
        db.add(link)

    booking = Booking(
        user_id=current_user.id,
        tee_time_id=tee_time_row.id,
        slot_id=hold.slot_id,
        course_id=hold.course_id,
        course_name=hold.course_name,
        tee_time=hold.tee_time,
        players_count=hold.players,
        players_payload=hold.player_payload,
        total_amount=hold.total_amount,
        currency=hold.currency,
        payment_id=payment_id,
        payment_method=client.name,
        payment_status=payment_status,
        split_mode=payload.split_mode,
        check_in_code=confirmation.confirmation_code,
        qr_code=f"strikelab://pass/{tee_time_row.id}",
        status="confirmed",
    )
    db.add(booking)

    hold.status = "confirmed"
    hold.payment_method = client.name
    db.commit()
    db.refresh(booking)

    # Update playmate roster (rounds_together++ for everyone in the group).
    for entry in hold.player_payload or []:
        friend_uuid = entry.get("user_id")
        if not friend_uuid:
            continue
        try:
            fid = UUID(friend_uuid)
        except (TypeError, ValueError):
            continue
        if fid == current_user.id:
            continue
        playmate = (
            db.query(Playmate)
            .filter(
                Playmate.user_id == current_user.id,
                Playmate.friend_user_id == fid,
            )
            .first()
        )
        if playmate is None:
            playmate = Playmate(
                user_id=current_user.id,
                friend_user_id=fid,
                display_name=entry.get("name"),
                handicap=entry.get("handicap"),
                rounds_together=1,
                last_played_at=hold.tee_time,
            )
            db.add(playmate)
        else:
            playmate.rounds_together = (playmate.rounds_together or 0) + 1
            playmate.last_played_at = hold.tee_time
    db.commit()

    return ConfirmResponse(
        booking_id=booking.id,
        tee_time_id=tee_time_row.id,
        course_name=booking.course_name,
        tee_time=booking.tee_time,
        status=booking.status,
        check_in_code=booking.check_in_code,
        payment_method=client.name,
        payment_status=payment_status,
        pass_url=f"/tee/passes/{booking.id}",
    )


# ─────────────────────────────────────────────────────────────────────
# Pass
# ─────────────────────────────────────────────────────────────────────


@router.get("/passes/{booking_id}", response_model=PassResponse)
def get_pass(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    course = booking.course or (
        db.query(Course).filter(Course.id == booking.course_id).first()
        if booking.course_id
        else None
    )

    forecast_temp = forecast_wind = None
    forecast_dir = None
    forecast_state = "dry"
    if course:
        conditions = get_conditions(db, course, booking.tee_time.date())
        h = hourly_at(conditions, booking.tee_time.hour)
        if h:
            forecast_temp = h.get("t")
            forecast_wind = h.get("w")
            forecast_dir = h.get("dir")
            if h.get("rain", 0) > 0.4:
                forecast_state = "rain"
            elif h.get("rain", 0) > 0.15:
                forecast_state = "showers"

    drive_min = None
    if course:
        _, drive_min = _drive_for(course, current_user)

    players: list[PassPlayer] = []
    payload = booking.players_payload or []
    if payload:
        for p in payload:
            name = p.get("name", "Spiller")
            initials = "".join(part[0] for part in name.split()[:2]).upper() or "?"
            players.append(
                PassPlayer(
                    name=name,
                    initials=initials,
                    handicap=p.get("handicap"),
                    is_you=str(p.get("user_id") or "") == str(current_user.id),
                )
            )
    if not players:
        name = current_user.display_name
        players.append(
            PassPlayer(
                name=name,
                initials=name[:1].upper(),
                handicap=current_user.whs_handicap or current_user.handicap_index,
                is_you=True,
            )
        )

    delta = (booking.tee_time - datetime.utcnow()).total_seconds()

    return PassResponse(
        booking_id=booking.id,
        course_id=booking.course_id,
        course_name=booking.course_name,
        course_city=course.city if course else None,
        course_region=course.region if course else None,
        course_type=course.course_type if course else None,
        tee_time=booking.tee_time,
        countdown_seconds=max(0, int(delta)),
        players=players,
        forecast_temp_c=forecast_temp,
        forecast_wind_ms=forecast_wind,
        forecast_wind_dir=forecast_dir,
        forecast_state=forecast_state,
        drive_min=drive_min,
        check_in_code=booking.check_in_code,
        qr_code=booking.qr_code,
        cancel_free_until=booking.tee_time - timedelta(hours=24),
        status=booking.status,
    )


@router.get("/passes", response_model=list[PassResponse])
def list_passes(
    upcoming_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Booking).filter(Booking.user_id == current_user.id)
    if upcoming_only:
        q = q.filter(Booking.tee_time >= datetime.utcnow())
    bookings = q.order_by(Booking.tee_time).all()
    return [_to_pass(b, db, current_user) for b in bookings]


def _to_pass(booking: Booking, db: Session, current_user: User) -> PassResponse:
    course = booking.course
    if not course and booking.course_id:
        course = db.query(Course).filter(Course.id == booking.course_id).first()

    forecast_temp = forecast_wind = None
    forecast_dir = None
    forecast_state = "dry"
    if course:
        conditions = get_conditions(db, course, booking.tee_time.date())
        h = hourly_at(conditions, booking.tee_time.hour)
        if h:
            forecast_temp = h.get("t")
            forecast_wind = h.get("w")
            forecast_dir = h.get("dir")
            if h.get("rain", 0) > 0.4:
                forecast_state = "rain"

    drive_min = None
    if course:
        _, drive_min = _drive_for(course, current_user)

    players: list[PassPlayer] = []
    for p in booking.players_payload or []:
        name = p.get("name", "Spiller")
        initials = "".join(part[0] for part in name.split()[:2]).upper() or "?"
        players.append(
            PassPlayer(
                name=name,
                initials=initials,
                handicap=p.get("handicap"),
                is_you=str(p.get("user_id") or "") == str(current_user.id),
            )
        )
    if not players:
        players.append(
            PassPlayer(
                name=current_user.display_name,
                initials=current_user.display_name[:1].upper(),
                handicap=current_user.whs_handicap or current_user.handicap_index,
                is_you=True,
            )
        )

    delta = (booking.tee_time - datetime.utcnow()).total_seconds()
    return PassResponse(
        booking_id=booking.id,
        course_id=booking.course_id,
        course_name=booking.course_name,
        course_city=course.city if course else None,
        course_region=course.region if course else None,
        course_type=course.course_type if course else None,
        tee_time=booking.tee_time,
        countdown_seconds=max(0, int(delta)),
        players=players,
        forecast_temp_c=forecast_temp,
        forecast_wind_ms=forecast_wind,
        forecast_wind_dir=forecast_dir,
        forecast_state=forecast_state,
        drive_min=drive_min,
        check_in_code=booking.check_in_code,
        qr_code=booking.qr_code,
        cancel_free_until=booking.tee_time - timedelta(hours=24),
        status=booking.status,
    )


@router.post("/cancel/{booking_id}")
def cancel_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        return {"cancelled": True, "already": True}

    booking.status = "cancelled"
    booking.cancelled_at = datetime.utcnow()
    if booking.slot_id:
        slot = (
            db.query(TeeSheetSlot)
            .filter(TeeSheetSlot.id == booking.slot_id)
            .first()
        )
        if slot:
            slot.players_taken = max(0, slot.players_taken - booking.players_count)

    if booking.tee_time_id:
        tt = db.query(TeeTime).filter(TeeTime.id == booking.tee_time_id).first()
        if tt:
            tt.status = "cancelled"

    db.commit()
    return {"cancelled": True}


# ─────────────────────────────────────────────────────────────────────
# Playmates
# ─────────────────────────────────────────────────────────────────────


@router.get("/playmates", response_model=list[PlaymateResponse])
def list_playmates(
    limit: int = 12,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Playmate)
        .filter(Playmate.user_id == current_user.id)
        .order_by(Playmate.last_played_at.desc().nullslast())
        .limit(limit)
        .all()
    )
    out: list[PlaymateResponse] = []
    for p in rows:
        # If this playmate row is just a friend pointer, hydrate display_name.
        display = p.display_name
        if not display and p.friend_user_id:
            friend = db.query(User).filter(User.id == p.friend_user_id).first()
            if friend:
                display = friend.display_name
        out.append(
            PlaymateResponse(
                id=p.id,
                friend_user_id=p.friend_user_id,
                display_name=display,
                handicap=p.handicap,
                last_played_at=p.last_played_at,
                rounds_together=p.rounds_together,
                public_handicap_visible=p.public_handicap_visible,
            )
        )
    return out


# ─────────────────────────────────────────────────────────────────────
# Legacy / back-compat search (kept so the old Calendar page still works)
# ─────────────────────────────────────────────────────────────────────


@router.get("/search")
def search_legacy(
    course_id: Optional[str] = None,
    date: Optional[str] = None,
    players: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = _resolve_date(date)
    course: Optional[Course] = None
    if course_id:
        try:
            course = db.query(Course).filter(Course.id == UUID(course_id)).first()
        except (ValueError, AttributeError):
            course = None

    if course:
        provider = get_provider(course.booking_provider)
        slots = provider.list_slots(db, course, target_date)
        return [
            {
                "course_id": str(course.id),
                "course_name": course.name,
                "tee_time": s.tee_time,
                "players_available": s.available,
                "price_currency": s.currency,
                "price_amount": s.price_amount,
                "provider": course.booking_provider,
                "provider_ref": s.provider_ref,
            }
            for s in slots
        ]

    # No course id: return upcoming tee_times (legacy behaviour).
    booked = (
        db.query(TeeTime)
        .filter(TeeTime.user_id == current_user.id)
        .order_by(TeeTime.tee_time)
        .all()
    )
    return [
        {
            "course_id": str(tt.course_id) if tt.course_id else None,
            "course_name": tt.course.name if tt.course else "Tee time",
            "tee_time": tt.tee_time,
            "players_available": 0,
            "provider": "internal",
            "provider_ref": str(tt.id),
        }
        for tt in booked
    ]
