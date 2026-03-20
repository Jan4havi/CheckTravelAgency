from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class AgencyBase(BaseModel):
    agency_name: Optional[str]
    phone: Optional[str]
    email: Optional[EmailStr]
    gst_number: Optional[str]
    pan_number: Optional[str]
    address: Optional[str]
    website: Optional[str]


class AgencyCreate(AgencyBase):
    id: UUID


class AgencyUpdate(AgencyBase):
    pass


class AgencyResponse(AgencyBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True