"""
app/modules/bid/bid_service.py
Business logic for Bid CRUD + listing with filters/pagination.

Rules enforced:
  - One bid per agency per trip (no duplicate bids)
  - Only the agency that placed the bid can edit/delete it
  - Bid amounts/messages are hidden from other agencies (enforced in router)
  - Traveler can see all bids on their own trip
  - Agencies can only see their own bid on any trip
  - unlock_bid: marks is_unlocked=True (called after payment)
"""
import math
import re
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.modules.bid.bid_model import Bid
from app.modules.bid.bid_schema import (
    BidCreate,
    BidFilters,
    BidResponse,
    BidStats,
    BidUpdate,
    PaginatedBidResponse,
)
from app.modules.trip.trip_request_model import TripRequest
from app.modules.agency.agency_model import AgencyProfile
from app.modules.user.user_model import UserProfile

# ─── Helpers ─────────────────────────────────────────────────────────────────

def _to_response(bid: Bid) -> BidResponse:
    return BidResponse.model_validate(bid)


def _get_or_404(bid_id: UUID, db: Session) -> Bid:
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    return bid


def _extract_numeric(amount_str: str) -> float | None:
    """Extract numeric value from text like '₹85,000' → 85000.0"""
    if not amount_str:
        return None
    cleaned = re.sub(r"[^\d.]", "", amount_str)
    try:
        return float(cleaned)
    except ValueError:
        return None


# ─── CREATE ───────────────────────────────────────────────────────────────────

def create_bid(
    payload: BidCreate,
    agency: AgencyProfile,
    db: Session,
) -> BidResponse:
    # Trip must exist and be Live
    trip = db.query(TripRequest).filter(TripRequest.id == payload.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status != "Live":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot bid on a trip that is not Live",
        )

    # One bid per agency per trip
    existing = (
        db.query(Bid)
        .filter(Bid.trip_id == payload.trip_id, Bid.agency_id == agency.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already placed a bid on this trip. Use edit to update it.",
        )

    bid = Bid(
        trip_id=payload.trip_id,
        agency_id=agency.id,
        agency_name=agency.agency_name,
        bid_amount=payload.bid_amount,
        message=payload.message,
        viewed=False,
        chat_requested=False,
        is_unlocked=False,
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return _to_response(bid)


# ─── READ ONE ─────────────────────────────────────────────────────────────────

def get_bid(bid_id: UUID, db: Session) -> BidResponse:
    return _to_response(_get_or_404(bid_id, db))


# ─── UPDATE ───────────────────────────────────────────────────────────────────

def update_bid(
    bid_id: UUID,
    payload: BidUpdate,
    agency_id: UUID,
    db: Session,
) -> BidResponse:
    bid = _get_or_404(bid_id, db)

    if bid.agency_id != agency_id:
        raise HTTPException(status_code=403, detail="You can only edit your own bids")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bid, field, value)

    db.commit()
    db.refresh(bid)
    return _to_response(bid)


# ─── DELETE ───────────────────────────────────────────────────────────────────

def delete_bid(bid_id: UUID, agency_id: UUID, db: Session) -> dict:
    bid = _get_or_404(bid_id, db)

    if bid.agency_id != agency_id:
        raise HTTPException(status_code=403, detail="You can only delete your own bids")

    db.delete(bid)
    db.commit()
    return {"message": f"Bid {bid_id} deleted successfully"}


# ─── MARK VIEWED ─────────────────────────────────────────────────────────────

def mark_viewed(bid_id: UUID, db: Session) -> BidResponse:
    """Traveler opens a bid — mark as viewed."""
    bid = _get_or_404(bid_id, db)
    bid.viewed = True
    db.commit()
    db.refresh(bid)
    return _to_response(bid)


# ─── UNLOCK BID (post payment) ────────────────────────────────────────────────

def unlock_bid(bid_id: UUID, traveler_id: UUID, db: Session) -> BidResponse:
    """
    Called after Razorpay payment succeeds.
    Verifies the traveler owns the trip before unlocking.
    """
    bid = _get_or_404(bid_id, db)

    trip = db.query(TripRequest).filter(TripRequest.id == bid.trip_id).first()
    if not trip or trip.user_id != traveler_id:
        raise HTTPException(status_code=403, detail="You don't own this trip")

    bid.is_unlocked = True
    bid.chat_requested = True
    db.commit()
    db.refresh(bid)
    return _to_response(bid)


# ─── LIST with PAGINATION + FILTERS + SEARCH ─────────────────────────────────

def list_bids(filters: BidFilters, db: Session) -> PaginatedBidResponse:
    """
    General bid listing — used by admin or internal queries.
    Supports:
      keyword       : searches agency_name + message (case-insensitive)
      trip_id       : all bids for a specific trip
      agency_id     : all bids from a specific agency
      is_unlocked   : True/False
      chat_requested: True/False
      viewed        : True/False
      created_from/to : date range
      page + limit  : pagination
    """
    q = db.query(Bid)

    # keyword
    if filters.keyword:
        kw = f"%{filters.keyword.lower()}%"
        q = q.filter(
            or_(
                func.lower(Bid.agency_name).like(kw),
                func.lower(Bid.message).like(kw),
            )
        )

    if filters.trip_id:
        q = q.filter(Bid.trip_id == filters.trip_id)

    if filters.agency_id:
        q = q.filter(Bid.agency_id == filters.agency_id)

    if filters.is_unlocked is not None:
        q = q.filter(Bid.is_unlocked == filters.is_unlocked)

    if filters.chat_requested is not None:
        q = q.filter(Bid.chat_requested == filters.chat_requested)

    if filters.viewed is not None:
        q = q.filter(Bid.viewed == filters.viewed)

    if filters.created_from:
        q = q.filter(Bid.created_at >= filters.created_from)

    if filters.created_to:
        q = q.filter(Bid.created_at <= filters.created_to)

    total = q.count()
    q = q.order_by(Bid.created_at.desc())

    offset = (filters.page - 1) * filters.limit
    bids   = q.offset(offset).limit(filters.limit).all()
    pages  = math.ceil(total / filters.limit) if filters.limit else 1

    return PaginatedBidResponse(
        total=total,
        page=filters.page,
        limit=filters.limit,
        pages=pages,
        results=[_to_response(b) for b in bids],
    )


# ─── BIDS FOR A TRIP (traveler view — all bids) ──────────────────────────────

def list_bids_for_trip(
    trip_id: UUID,
    traveler_id: UUID,
    db: Session,
) -> PaginatedBidResponse:
    """
    Returns ALL bids on a trip — only for the traveler who owns it.
    Ordered newest first.
    """
    trip = db.query(TripRequest).filter(TripRequest.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != traveler_id:
        raise HTTPException(status_code=403, detail="You don't own this trip")

    bids = (
        db.query(Bid)
        .filter(Bid.trip_id == trip_id)
        .order_by(Bid.created_at.desc())
        .all()
    )
    return PaginatedBidResponse(
        total=len(bids), page=1, limit=len(bids) or 1, pages=1,
        results=[_to_response(b) for b in bids],
    )


# ─── MY BID on a trip (agency view — only their own bid) ─────────────────────

def get_my_bid_for_trip(
    trip_id: UUID,
    agency_id: UUID,
    db: Session,
) -> BidResponse:
    bid = (
        db.query(Bid)
        .filter(Bid.trip_id == trip_id, Bid.agency_id == agency_id)
        .first()
    )
    if not bid:
        raise HTTPException(status_code=404, detail="You have not bid on this trip")
    return _to_response(bid)


# ─── BID STATS for a trip (avg/min/max — visible to agencies) ────────────────

def get_bid_stats(trip_id: UUID, db: Session) -> BidStats:
    """
    Returns aggregate stats for all bids on a trip.
    Agencies see avg/min/max without seeing individual bids.
    """
    bids = db.query(Bid).filter(Bid.trip_id == trip_id).all()
    amounts = [_extract_numeric(b.bid_amount) for b in bids if b.bid_amount]
    amounts = [a for a in amounts if a is not None]

    return BidStats(
        total_bids=len(bids),
        avg_amount=round(sum(amounts) / len(amounts), 2) if amounts else None,
        min_amount=min(amounts) if amounts else None,
        max_amount=max(amounts) if amounts else None,
    )