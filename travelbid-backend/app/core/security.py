"""
app/core/security.py
Password hashing (bcrypt) + JWT access/refresh token helpers.
Mirrors Supabase auth behaviour:
  - access token  : short-lived (1h), carries user id + user_type
  - refresh token : long-lived (7d), used to mint new access tokens
"""
from datetime import datetime, timedelta, timezone
from typing import Literal
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ─── Password ────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Return a bcrypt hash string."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode(), salt).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ─── JWT ─────────────────────────────────────────────────────────────────────

TokenType = Literal["access", "refresh"]


def _create_token(
    user_id: str | UUID,
    user_type: str,
    token_type: TokenType,
    expires_delta: timedelta,
) -> str:
    payload = {
        "sub": str(user_id),
        "user_type": user_type,          # "traveler" | "agency"
        "type": token_type,
        "iat": datetime.now(tz=timezone.utc),
        "exp": datetime.now(tz=timezone.utc) + expires_delta,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: str | UUID, user_type: str) -> str:
    return _create_token(
        user_id, user_type, "access",
        timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str | UUID, user_type: str) -> str:
    return _create_token(
        user_id, user_type, "refresh",
        timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT.
    Raises JWTError on invalid/expired tokens.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as e:
        raise e