from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    full_name: Optional[str]
    phone: Optional[str]
    email: Optional[EmailStr]
    user_type: Optional[str] = "traveler"
    membership_plan: Optional[str] = "Free"


class UserCreate(UserBase):
    id: UUID


class UserUpdate(BaseModel):
    full_name: Optional[str]
    phone: Optional[str]
    email: Optional[EmailStr]
    membership_plan: Optional[str]


class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True