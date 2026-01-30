from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    supabase_url: str
    supabase_service_key: str
    ml_service_port: int = 8000
    cache_ttl_hours: int = 168  # 7 days
    forecast_months: int = 3
    
    # Gemini API (using custom name to avoid system env var conflicts)
    finadvice_gemini_key: str = ""
    finadvice_gemini_model: str = "gemini-1.5-flash"  # Stable model with better quota limits
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
