from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class SupportCreate(BaseModel):
    user_id: Optional[UUID]
    user_name: Optional[str]
    user_email: Optional[EmailStr]
    subject: str
    message: str


class SupportResponse(SupportCreate):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True