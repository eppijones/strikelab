from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/strikelab"
    secret_key: str = "dev-secret-key-change-in-production"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    debug: bool = True
    
    # JWT Settings
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # Payments — Vipps eCom v2 (test env defaults so booking flow works in dev)
    vipps_client_id: str = ""
    vipps_client_secret: str = ""
    vipps_subscription_key: str = ""
    vipps_merchant_serial: str = ""
    vipps_base_url: str = "https://apitest.vipps.no"
    vipps_callback_prefix: str = "http://localhost:8000"
    vipps_fallback_url: str = "http://localhost:5173/tee"

    # Stripe (non-NO fallback)
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Public base URL for the web app (used to build pass / share links)
    web_base_url: str = "http://localhost:5173"

    # Local media store for watch impact audio uploaded from Caddie.
    media_root: str = "storage/media"
    media_storage: str = "filesystem"

    # Clerk auth. In production, API requests from web/iOS carry Clerk
    # session JWTs. Empty values keep the legacy local JWT flow working in dev.
    clerk_issuer: str = ""
    clerk_jwks_url: str = ""
    clerk_audience: str = ""
    clerk_secret_key: str = ""

    # Optional durable media store for Vercel deployments.
    blob_read_write_token: str = ""
    public_api_base_url: str = "http://localhost:8000"

    # Optional upstream course database. Never expose this to web/iOS clients;
    # the backend normalizes provider data through /public.
    golfcourseapi_key: str = ""
    golfcourseapi_base_url: str = "https://api.golfcourseapi.com/v1"

    class Config:
        env_file = ".env"
        extra = "ignore"
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
