"""
Application configuration using Pydantic settings.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://redsubcontinent:redsubcontinent@localhost:5432/redsubcontinent"
    
    # API
    api_title: str = "Red SubContinent API"
    api_description: str = "Historical conflict data for South Asia (1000 CE - Present)"
    api_version: str = "0.1.0"
    api_debug: bool = True
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Pagination
    default_page_size: int = 50
    max_page_size: int = 500

    # Monitoring
    sentry_dsn: Optional[str] = None
    sentry_environment: Optional[str] = None
    sentry_release: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
