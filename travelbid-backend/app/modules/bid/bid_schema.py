"""
app/modules/bid/bid_schema.py
Pydantic schemas for Bid CRUD + filtering.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


# ─── Create ───────────────────────────────────────────────────────────────────

class BidCreate(BaseModel):
    trip_id:    UUID
    bid_amount: str
    message:    str

    @field_validator("bid_amount")
    @classmethod
    def amount_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("bid_amount is required")
        return v.strip()

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Proposal message is required")
        return v.strip()


# ─── Update (only amount + message editable) ──────────────────────────────────

class BidUpdate(BaseModel):
    bid_amount: Optional[str] = None
    message:    Optional[str] = None


# ─── Response ─────────────────────────────────────────────────────────────────

class BidResponse(BaseModel):
    id:             UUID
    trip_id:        Optional[UUID]
    agency_id:      Optional[UUID]
    agency_name:    Optional[str]
    bid_amount:     Optional[str]
    message:        Optional[str]
    viewed:         Optional[bool]
    chat_requested: Optional[bool]
    is_unlocked:    Optional[bool]
    created_at:     datetime

    class Config:
        from_attributes = True


# ─── Bid Stats (for traveler to see avg/min/max on their trip) ────────────────

class BidStats(BaseModel):
    total_bids:  int
    avg_amount:  Optional[float]    # average numeric value extracted from bid_amount
    min_amount:  Optional[float]
    max_amount:  Optional[float]


# ─── Paginated Response ───────────────────────────────────────────────────────

class PaginatedBidResponse(BaseModel):
    total:   int
    page:    int
    limit:   int
    pages:   int
    results: list[BidResponse]


# ─── Filters ─────────────────────────────────────────────────────────────────

class BidFilters(BaseModel):
    """All optional — pass as query params."""
    # keyword: searches agency_name + message
    keyword:        Optional[str]  = None

    # exact filters
    trip_id:        Optional[UUID] = None
    agency_id:      Optional[UUID] = None
    is_unlocked:    Optional[bool] = None
    chat_requested: Optional[bool] = None
    viewed:         Optional[bool] = None

    # date range
    created_from:   Optional[datetime] = None
    created_to:     Optional[datetime] = None

    # pagination
    page:  int = 1
    limit: int = 20

    @field_validator("limit")
    @classmethod
    def cap_limit(cls, v: int) -> int:
        return min(v, 100)

    @field_validator("page")
    @classmethod
    def min_page(cls, v: int) -> int:
        return max(v, 1)