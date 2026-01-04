from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, sessions, logs, connectors, coach, courses, friends, equipment

settings = get_settings()

app = FastAPI(
    title="StrikeLab API",
    description="Golf performance lab API - Get Dialed In.",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
app.include_router(logs.router, prefix="/log", tags=["Session Logs"])
app.include_router(connectors.router, prefix="/connectors", tags=["Connectors"])
app.include_router(coach.router, prefix="/coach", tags=["Coach"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(friends.router, prefix="/friends", tags=["Friends"])
app.include_router(equipment.router, prefix="/equipment", tags=["Equipment"])


@app.get("/")
def root():
    return {
        "name": "StrikeLab API",
        "version": "0.1.0",
        "status": "operational",
        "tagline": "Get Dialed In.",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
