"""
app/auth/schemas.py
Pydantic schemas for all auth endpoints.
"""
import re
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


# ─── Traveler Signup ─────────────────────────────────────────────────────────

class TravelerSignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Enter a valid 10-digit Indian mobile number")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
        if not re.match(pattern, v):
            raise ValueError(
                "Password must be at least 8 characters with uppercase, "
                "lowercase, number and special character"
            )
        return v


# ─── Agency Signup ───────────────────────────────────────────────────────────

class AgencySignupRequest(BaseModel):
    agency_name: str
    email: EmailStr
    phone: str
    gst_number: str
    pan_number: str
    address: str
    website: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Enter a valid 10-digit Indian mobile number")
        return v

    @field_validator("gst_number")
    @classmethod
    def validate_gst(cls, v: str) -> str:
        if not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", v.upper()):
            raise ValueError("Enter a valid 15-character GST number")
        return v.upper()

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v: str) -> str:
        if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", v.upper()):
            raise ValueError("Enter a valid 10-character PAN number")
        return v.upper()

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Website is required")
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
        if not re.match(pattern, v):
            raise ValueError(
                "Password must be at least 8 characters with uppercase, "
                "lowercase, number and special character"
            )
        return v


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Token Refresh ────────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Password Reset ───────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$"
        if not re.match(pattern, v):
            raise ValueError("Password does not meet requirements")
        return v


# ─── Responses ────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: UUID
    user_type: str                  # "traveler" | "agency"
    display_name: str               # full_name or agency_name


class UserMeResponse(BaseModel):
    id: UUID
    email: Optional[str]
    user_type: str
    display_name: str
    phone: Optional[str]
    membership_plan: Optional[str]

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str