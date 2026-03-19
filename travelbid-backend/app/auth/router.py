"""
app/auth/router.py
All authentication endpoints — mirrors Supabase auth API surface.

POST /auth/signup/traveler
POST /auth/signup/agency
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
"""
import secrets
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, CurrentUser
from app.auth.schemas import (
    AgencySignupRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    TravelerSignupRequest,
    UserMeResponse,
)
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import AgencyProfile, UserProfile
from jose import JWTError

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory store for password-reset tokens.
# In production → store in Redis or a DB table with expiry.
_reset_tokens: dict[str, dict] = {}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _email_taken(db: Session, email: str) -> bool:
    traveler = db.query(UserProfile).filter(UserProfile.email == email).first()
    agency   = db.query(AgencyProfile).filter(AgencyProfile.email == email).first()
    return bool(traveler or agency)


def _build_token_response(user: UserProfile | AgencyProfile) -> TokenResponse:
    is_agency = isinstance(user, AgencyProfile)
    display   = user.agency_name if is_agency else user.full_name
    utype     = "agency" if is_agency else "traveler"
    return TokenResponse(
        access_token=create_access_token(user.id, utype),
        refresh_token=create_refresh_token(user.id, utype),
        user_id=user.id,
        user_type=utype,
        display_name=display or "",
    )


# ─── Signup — Traveler ────────────────────────────────────────────────────────

@router.post("/signup/traveler", response_model=TokenResponse, status_code=201)
def signup_traveler(payload: TravelerSignupRequest, db: Session = Depends(get_db)):
    if _email_taken(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = UserProfile(
        full_name=payload.full_name,
        email=payload.email.lower(),
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        user_type="traveler",
        membership_plan="Free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_token_response(user)


# ─── Signup — Agency ─────────────────────────────────────────────────────────

@router.post("/signup/agency", response_model=TokenResponse, status_code=201)
def signup_agency(payload: AgencySignupRequest, db: Session = Depends(get_db)):
    if _email_taken(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    agency = AgencyProfile(
        agency_name=payload.agency_name,
        email=payload.email.lower(),
        phone=payload.phone,
        gst_number=payload.gst_number,
        pan_number=payload.pan_number,
        address=payload.address,
        website=payload.website,
        hashed_password=hash_password(payload.password),
        user_type="agency",
        membership_plan="Free",
    )
    db.add(agency)
    db.commit()
    db.refresh(agency)
    return _build_token_response(agency)


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()

    # Check traveler first, then agency
    user: UserProfile | AgencyProfile | None = (
        db.query(UserProfile).filter(UserProfile.email == email).first()
        or db.query(AgencyProfile).filter(AgencyProfile.email == email).first()
    )

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return _build_token_response(user)


# ─── Refresh Token ────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not a refresh token",
        )

    user_id   = UUID(data["sub"])
    user_type = data["user_type"]

    if user_type == "agency":
        user = db.query(AgencyProfile).filter(AgencyProfile.id == user_id).first()
    else:
        user = db.query(UserProfile).filter(UserProfile.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return _build_token_response(user)


# ─── Logout (client-side only — invalidate on frontend) ──────────────────────

@router.post("/logout", response_model=MessageResponse)
def logout(_: CurrentUser = Depends(get_current_user)):
    """
    Stateless JWT — just instruct the client to discard tokens.
    For true server-side invalidation, store a token denylist in Redis.
    """
    return {"message": "Logged out successfully. Please discard your tokens."}


# ─── Get Current User ─────────────────────────────────────────────────────────

@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    is_agency = isinstance(current_user, AgencyProfile)
    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        user_type="agency" if is_agency else "traveler",
        display_name=current_user.agency_name if is_agency else current_user.full_name,
        phone=current_user.phone,
        membership_plan=current_user.membership_plan,
    )


# ─── Forgot Password ──────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = (
        db.query(UserProfile).filter(UserProfile.email == email).first()
        or db.query(AgencyProfile).filter(AgencyProfile.email == email).first()
    )

    # Always return 200 — don't leak whether email exists
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    token  = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(hours=1)

    _reset_tokens[token] = {
        "user_id":   str(user.id),
        "user_type": user.user_type,
        "expires":   expiry,
    }

    # TODO: Send email with reset link:
    # reset_url = f"https://checktravelprice.in/reset-password?token={token}"
    # send_email(to=email, subject="Reset your password", body=f"Click: {reset_url}")
    print(f"[DEV] Password reset token for {email}: {token}")  # remove in production

    return {"message": "If that email exists, a reset link has been sent."}


# ─── Reset Password ───────────────────────────────────────────────────────────

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = _reset_tokens.get(payload.token)

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.utcnow() > record["expires"]:
        _reset_tokens.pop(payload.token, None)
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user_id   = UUID(record["user_id"])
    user_type = record["user_type"]

    if user_type == "agency":
        user = db.query(AgencyProfile).filter(AgencyProfile.id == user_id).first()
    else:
        user = db.query(UserProfile).filter(UserProfile.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    _reset_tokens.pop(payload.token, None)   # single-use token

    return {"message": "Password updated successfully. Please log in again."}