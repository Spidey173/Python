from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Python Quest API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Security & Auth
    SECRET_KEY: str = "python-quest-super-secret-cyber-key-change-in-production-2025"
    CSRF_SECRET_KEY: str = "python-quest-csrf-secret-key-production-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30-minute short-lived access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7-day refresh token
    COOKIE_SECURE: bool = False           # Set True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Optional[str] = None

    # CORS Allowed Origins
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./python_quest.db"

    # Redis (Optional shared rate limiter)
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL", None)

    # AI Integration (Groq / Gemini / OpenAI / GitHub Copilot compatible)
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    COPILOT_API_KEY: Optional[str] = os.getenv("COPILOT_API_KEY") or os.getenv("GITHUB_TOKEN")
    COPILOT_API_BASE: str = os.getenv("COPILOT_API_BASE", "https://api.github.com")
    COPILOT_MODEL: str = os.getenv("COPILOT_MODEL", "gpt-4o-mini")

    # Execution Sandbox Constraints
    SANDBOX_TIMEOUT_SECONDS: float = 3.0
    SANDBOX_MAX_OUTPUT_BYTES: int = 65536  # 64KB
    SANDBOX_MAX_MEMORY_MB: int = 128

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
