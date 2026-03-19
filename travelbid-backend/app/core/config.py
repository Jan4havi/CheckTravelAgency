"""
app/core/config.py
Central configuration — reads from .env
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/checktravelprice"

    # ── JWT ───────────────────────────────────────────
    JWT_SECRET_KEY: str = "CHANGE_ME_USE_openssl_rand_hex_32"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 60          # 1 hour
    JWT_REFRESH_EXPIRE_DAYS: int = 7             # 7 days

    # ── App ───────────────────────────────────────────
    APP_NAME: str = "CheckTravelPrice API"
    APP_ENV: str = "development"                 # development | production
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://checktravelprice.in",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()