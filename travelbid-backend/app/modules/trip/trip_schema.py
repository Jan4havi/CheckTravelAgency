"""
app/modules/trip/trip_schemas.py
Pydantic schemas for TripRequest CRUD + filtering.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


# ─── Enums (mirrors frontend dropdowns) ──────────────────────────────────────

VALID_TRIP_TYPES  = {"Leisure","Adventure","Romantic","Family","Pilgrimage","Honeymoon","Business","Educational"}
VALID_TRIP_SCOPES = {"national", "international"}
VALID_STATUSES    = {"Live", "Closed", "Expired"}


# ─── Create ───────────────────────────────────────────────────────────────────

class TripRequestCreate(BaseModel):
    title:       Optional[str] = None
    source:      Optional[str] = None
    destination: str
    trip_type:   Optional[str] = None
    trip_scope:  Optional[str] = None
    start_date:  Optional[datetime] = None
    end_date:    Optional[datetime] = None
    travelers:   Optional[int] = None
    budget:      Optional[str] = None
    preferences: Optional[str] = None

    @field_validator("destination")
    @classmethod
    def destination_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Destination is required")
        return v.strip()

    @field_validator("trip_type")
    @classmethod
    def validate_trip_type(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_TRIP_TYPES:
            raise ValueError(f"trip_type must be one of {VALID_TRIP_TYPES}")
        return v

    @field_validator("trip_scope")
    @classmethod
    def validate_trip_scope(cls, v: Optional[str]) -> Optional[str]:
        if v and v.lower() not in VALID_TRIP_SCOPES:
            raise ValueError(f"trip_scope must be one of {VALID_TRIP_SCOPES}")
        return v.lower() if v else v

    @field_validator("travelers")
    @classmethod
    def travelers_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("travelers must be at least 1")
        return v

    @field_validator("end_date", mode="after")
    @classmethod
    def end_after_start(cls, v: Optional[datetime], info) -> Optional[datetime]:
        start = info.data.get("start_date")
        if v and start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v


# ─── Update (all fields optional) ────────────────────────────────────────────

class TripRequestUpdate(BaseModel):
    title:       Optional[str] = None
    source:      Optional[str] = None
    # destination intentionally excluded — cannot change after posting
    trip_type:   Optional[str] = None
    trip_scope:  Optional[str] = None
    start_date:  Optional[datetime] = None
    end_date:    Optional[datetime] = None
    travelers:   Optional[int] = None
    budget:      Optional[str] = None
    preferences: Optional[str] = None
    status:      Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


# ─── Response ─────────────────────────────────────────────────────────────────

class TripRequestResponse(BaseModel):
    id:          UUID
    user_id:     Optional[UUID]
    title:       Optional[str]
    source:      Optional[str]
    destination: str
    trip_type:   Optional[str]
    trip_scope:  Optional[str]
    start_date:  Optional[datetime]
    end_date:    Optional[datetime]
    travelers:   Optional[int]
    budget:      Optional[str]
    preferences: Optional[str]
    status:      Optional[str]
    created_at:  datetime
    bid_count:   int = 0           # injected by service

    class Config:
        from_attributes = True


# ─── Paginated Response ───────────────────────────────────────────────────────

class PaginatedTripResponse(BaseModel):
    total:   int
    page:    int
    limit:   int
    pages:   int
    results: list[TripRequestResponse]


# ─── Query Filters ────────────────────────────────────────────────────────────

class TripFilters(BaseModel):
    """
    All filter params are optional.
    Pass as query params: /trips?status=Live&trip_type=Adventure&destination=Goa
    """
    # keyword search (searches title + destination + preferences)
    keyword:     Optional[str] = None

    # exact / enum filters
    status:      Optional[str] = None
    trip_type:   Optional[str] = None
    trip_scope:  Optional[str] = None
    destination: Optional[str] = None    # partial match

    # numeric ranges
    travelers_min: Optional[int] = None
    travelers_max: Optional[int] = None

    # date ranges
    start_date_from: Optional[datetime] = None
    start_date_to:   Optional[datetime] = None

    # pagination
    page:  int = 1
    limit: int = 20

    @field_validator("limit")
    @classmethod
    def cap_limit(cls, v: int) -> int:
        return min(v, 100)          # never more than 100 per page

    @field_validator("page")
    @classmethod
    def min_page(cls, v: int) -> int:
        return max(v, 1)