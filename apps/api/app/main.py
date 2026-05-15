from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    auth,
    sessions,
    logs,
    connectors,
    coach,
    courses,
    friends,
    equipment,
    rounds,
    caddie,
    dna,
    training,
    booking,
    catalog,
    public,
    range_sessions,
    realtime,
)

settings = get_settings()
dev_origin_regex = (
    r"^http://("
    r"localhost|127\.0\.0\.1|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r"):\d+$"
    if settings.debug
    else None
)

app = FastAPI(
    title="StrikeLab API",
    description="StrikeLab — A precision instrument for the serious player.",
    version="0.2.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=dev_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core authoring + analytics
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
app.include_router(logs.router, prefix="/log", tags=["Session Logs"])
app.include_router(connectors.router, prefix="/connectors", tags=["Connectors"])
app.include_router(coach.router, prefix="/coach", tags=["Coach"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(friends.router, prefix="/friends", tags=["Friends"])
app.include_router(equipment.router, prefix="/equipment", tags=["Equipment"])
app.include_router(training.router, prefix="/training", tags=["Training"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
app.include_router(public.router, prefix="/public", tags=["Open Golf API"])
app.include_router(range_sessions.router, prefix="/range-sessions", tags=["Range Sessions"])

# On-course / Caddie / Booking
app.include_router(rounds.router, prefix="/rounds", tags=["Rounds"])
app.include_router(caddie.router, prefix="/caddie", tags=["Caddie"])
app.include_router(dna.router, prefix="/dna", tags=["Shot DNA"])
app.include_router(booking.router, prefix="/booking", tags=["Booking"])

# Realtime fanout — keep the web/iOS surfaces in sync with phone-driven writes.
app.include_router(realtime.router, tags=["Realtime"])


@app.get("/")
def root():
    return {
        "name": "StrikeLab API",
        "version": "0.2.0",
        "status": "operational",
        "tagline": "Get dialed in.",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
