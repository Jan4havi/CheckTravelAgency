"""
app/modules/trip/trip_service.py
Business logic for TripRequest CRUD + listing with filters/pagination.
All DB operations live here — the router just calls these functions.
"""
import math
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from app.modules.trip.trip_request_model import TripRequest
from app.modules.trip.trip_schema import (
    PaginatedTripResponse,
    TripFilters,
    TripRequestCreate,
    TripRequestResponse,
    TripRequestUpdate,
)
from app.modules.user.user_model import UserProfile


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _to_response(trip: TripRequest, db: Session) -> TripRequestResponse:
    """Convert ORM object → Pydantic response, injecting bid_count."""
    # Import here to avoid circular import
    from app.modules.bid.bid_model import Bid  # noqa
    bid_count = db.query(func.count(Bid.id)).filter(Bid.trip_id == trip.id).scalar() or 0
    data = TripRequestResponse.model_validate(trip)
    data.bid_count = bid_count
    return data


def _get_or_404(trip_id: UUID, db: Session) -> TripRequest:
    trip = db.query(TripRequest).filter(TripRequest.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


# ─── CREATE ───────────────────────────────────────────────────────────────────

def create_trip(
    payload: TripRequestCreate,
    traveler_id: UUID,
    db: Session,
) -> TripRequestResponse:
    """
    A traveler can only have ONE active (Live) trip at a time.
    """
    existing = (
        db.query(TripRequest)
        .filter(TripRequest.user_id == traveler_id, TripRequest.status == "Live")
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active trip. Delete or close it before posting a new one.",
        )

    # Auto-generate title if not provided
    title = payload.title or f"{payload.trip_type or 'Trip'} to {payload.destination}"

    trip = TripRequest(
        user_id=traveler_id,
        title=title,
        source=payload.source,
        destination=payload.destination,
        trip_type=payload.trip_type,
        trip_scope=payload.trip_scope,
        start_date=payload.start_date,
        end_date=payload.end_date,
        travelers=payload.travelers,
        budget=payload.budget,
        preferences=payload.preferences,
        status="Live",
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return _to_response(trip, db)


# ─── READ ONE ─────────────────────────────────────────────────────────────────

def get_trip(trip_id: UUID, db: Session) -> TripRequestResponse:
    trip = _get_or_404(trip_id, db)
    return _to_response(trip, db)


# ─── UPDATE ───────────────────────────────────────────────────────────────────

def update_trip(
    trip_id: UUID,
    payload: TripRequestUpdate,
    traveler_id: UUID,
    db: Session,
) -> TripRequestResponse:
    trip = _get_or_404(trip_id, db)

    # Ownership check
    if trip.user_id != traveler_id:
        raise HTTPException(status_code=403, detail="You don't own this trip")

    # Apply only provided fields (partial update)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return _to_response(trip, db)


# ─── DELETE ───────────────────────────────────────────────────────────────────

def delete_trip(trip_id: UUID, traveler_id: UUID, db: Session) -> dict:
    trip = _get_or_404(trip_id, db)

    if trip.user_id != traveler_id:
        raise HTTPException(status_code=403, detail="You don't own this trip")

    db.delete(trip)
    db.commit()
    return {"message": f"Trip {trip_id} deleted successfully"}


# ─── CLOSE / STATUS CHANGE ───────────────────────────────────────────────────

def close_trip(trip_id: UUID, traveler_id: UUID, db: Session) -> TripRequestResponse:
    """Change status to Closed — used when traveler selects an agency."""
    trip = _get_or_404(trip_id, db)

    if trip.user_id != traveler_id:
        raise HTTPException(status_code=403, detail="You don't own this trip")

    trip.status = "Closed"
    db.commit()
    db.refresh(trip)
    return _to_response(trip, db)


# ─── LIST with PAGINATION + FILTERS + SEARCH ─────────────────────────────────

def list_trips(filters: TripFilters, db: Session) -> PaginatedTripResponse:
    """
    Flexible listing for agencies (browse Live trips) and admin.
    Supports:
      - keyword   : searches title + destination + preferences (case-insensitive)
      - status    : exact match (Live / Closed / Expired)
      - trip_type : exact match
      - trip_scope: exact match
      - destination: partial match (ilike)
      - travelers_min / travelers_max : range
      - start_date_from / start_date_to : range
      - page + limit : pagination
    """
    q = db.query(TripRequest)

    # ── Keyword search ────────────────────────────────
    if filters.keyword:
        kw = f"%{filters.keyword.lower()}%"
        q = q.filter(
            or_(
                func.lower(TripRequest.title).like(kw),
                func.lower(TripRequest.destination).like(kw),
                func.lower(TripRequest.preferences).like(kw),
            )
        )

    # ── Exact / enum filters ──────────────────────────
    if filters.status:
        q = q.filter(TripRequest.status == filters.status)

    if filters.trip_type:
        q = q.filter(TripRequest.trip_type == filters.trip_type)

    if filters.trip_scope:
        q = q.filter(TripRequest.trip_scope == filters.trip_scope.lower())

    # ── Destination partial match ─────────────────────
    if filters.destination:
        q = q.filter(
            func.lower(TripRequest.destination).like(f"%{filters.destination.lower()}%")
        )

    # ── Travelers range ───────────────────────────────
    if filters.travelers_min is not None:
        q = q.filter(TripRequest.travelers >= filters.travelers_min)
    if filters.travelers_max is not None:
        q = q.filter(TripRequest.travelers <= filters.travelers_max)

    # ── Start date range ──────────────────────────────
    if filters.start_date_from:
        q = q.filter(TripRequest.start_date >= filters.start_date_from)
    if filters.start_date_to:
        q = q.filter(TripRequest.start_date <= filters.start_date_to)

    # ── Total count (before pagination) ──────────────
    total = q.count()

    # ── Ordering: newest first ────────────────────────
    q = q.order_by(TripRequest.created_at.desc())

    # ── Pagination ────────────────────────────────────
    offset = (filters.page - 1) * filters.limit
    trips  = q.offset(offset).limit(filters.limit).all()

    pages = math.ceil(total / filters.limit) if filters.limit else 1

    return PaginatedTripResponse(
        total=total,
        page=filters.page,
        limit=filters.limit,
        pages=pages,
        results=[_to_response(t, db) for t in trips],
    )


# ─── MY TRIPS (traveler's own trips) ─────────────────────────────────────────

def list_my_trips(
    traveler_id: UUID,
    status: str | None,
    db: Session,
) -> list[TripRequestResponse]:
    """Return all trips for a specific traveler, optionally filtered by status."""
    q = db.query(TripRequest).filter(TripRequest.user_id == traveler_id)
    if status:
        q = q.filter(TripRequest.status == status)
    trips = q.order_by(TripRequest.created_at.desc()).all()
    return [_to_response(t, db) for t in trips]