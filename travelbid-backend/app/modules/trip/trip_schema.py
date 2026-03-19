# ===================== schemas/trip_request.py =====================
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class TripRequestBase(BaseModel):
    title: Optional[str]
    source: Optional[str]
    destination: Optional[str]
    trip_type: Optional[str]
    trip_scope: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    travelers: Optional[int]
    budget: Optional[str]
    preferences: Optional[str]

class TripRequestCreate(TripRequestBase):
    destination: str

class TripRequestUpdate(TripRequestBase):
    status: Optional[str]

class TripRequestResponse(TripRequestBase):
    id: UUID
    status: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class PaginatedTripResponse(BaseModel):
    total: int
    skip: int
    limit: int
    data: List[TripRequestResponse]
