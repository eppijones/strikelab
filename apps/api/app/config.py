from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/strikelab"
    secret_key: str = "dev-secret-key-change-in-production"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    debug: bool = True
    
    # JWT Settings
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"
    
    class Config:
        env_file = ".env"
        extra = "ignore"
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
