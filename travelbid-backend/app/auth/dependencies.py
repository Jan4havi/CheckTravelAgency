"""
app/auth/dependencies.py
FastAPI dependency that validates the Bearer token and returns the current user.
Works for both travelers (UserProfile) and agencies (AgencyProfile).
"""
from uuid import UUID
from typing import Union

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.modules.agency.agency_model import AgencyProfile
from app.modules.user.user_model import UserProfile
from fastapi import Depends, Request

bearer_scheme = HTTPBearer()

CurrentUser = Union[UserProfile, AgencyProfile]


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> CurrentUser:
    """
    Validates Bearer JWT and returns the UserProfile or AgencyProfile.
    Raises 401 on any auth failure.
    """

    user_id: str = request.state.user_id
    user_type: str = request.state.user_type

    if user_type == "agency":
        user = db.query(AgencyProfile).filter(AgencyProfile.id == user_id).first()
    else:
        user = db.query(UserProfile).filter(UserProfile.id == user_id).first()

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if user is None or not user.is_active:
        raise credentials_exception

    return user


def get_current_traveler(
    current_user: CurrentUser = Depends(get_current_user),
) -> UserProfile:
    """Only allows travelers through."""
    if not isinstance(current_user, UserProfile):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can access this endpoint",
        )
    return current_user


def get_current_agency(
    current_user: CurrentUser = Depends(get_current_user),
) -> AgencyProfile:
    """Only allows agencies through."""
    if not isinstance(current_user, AgencyProfile):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only agencies can access this endpoint",
        )
    return current_user