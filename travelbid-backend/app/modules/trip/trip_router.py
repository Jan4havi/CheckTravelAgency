"""
app/modules/trip/trip_router.py
FastAPI router for TripRequest CRUD.

Public  (no auth):  GET  /trips            — agencies browse live trips
                    GET  /trips/{id}        — anyone views a trip

Traveler only:      POST   /trips           — create trip
                    PATCH  /trips/{id}      — edit trip
                    DELETE /trips/{id}      — delete trip
                    PATCH  /trips/{id}/close — mark as closed
                    GET    /trips/my        — traveler's own trips

Query params for GET /trips:
  keyword, status, trip_type, trip_scope, destination,
  travelers_min, travelers_max,
  start_date_from, start_date_to,
  page (default 1), limit (default 20, max 100)
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_traveler, get_current_user, CurrentUser
from app.core.database import get_db
from app.modules.user.user_model import UserProfile
from app.modules.trip.trip_schema import (
    PaginatedTripResponse,
    TripFilters,
    TripRequestCreate,
    TripRequestResponse,
    TripRequestUpdate,
)
from app.modules.trip import trip_service
from datetime import datetime

trip_router = APIRouter(prefix="/trips", tags=["Trips"])


# ─── PUBLIC — Browse & Search ─────────────────────────────────────────────────

@trip_router.get("", response_model=PaginatedTripResponse, summary="Browse & search trips")
def list_trips(
    # ── keyword ──────────────────────────────────────
    keyword: Optional[str] = Query(None, description="Search title, destination, preferences"),

    # ── enum filters ─────────────────────────────────
    status:      Optional[str] = Query("Live", description="Live | Closed | Expired"),
    trip_type:   Optional[str] = Query(None,   description="Leisure | Adventure | Romantic | Family …"),
    trip_scope:  Optional[str] = Query(None,   description="national | international"),
    destination: Optional[str] = Query(None,   description="Partial match, e.g. 'Goa'"),

    # ── numeric range ─────────────────────────────────
    travelers_min: Optional[int] = Query(None, ge=1),
    travelers_max: Optional[int] = Query(None, ge=1),

    # ── date range ────────────────────────────────────
    start_date_from: Optional[datetime] = Query(None),
    start_date_to:   Optional[datetime] = Query(None),

    # ── pagination ────────────────────────────────────
    page:  int = Query(1,  ge=1),
    limit: int = Query(20, ge=1, le=100),

    db: Session = Depends(get_db),
):
    filters = TripFilters(
        keyword=keyword,
        status=status,
        trip_type=trip_type,
        trip_scope=trip_scope,
        destination=destination,
        travelers_min=travelers_min,
        travelers_max=travelers_max,
        start_date_from=start_date_from,
        start_date_to=start_date_to,
        page=page,
        limit=limit,
    )
    return trip_service.list_trips(filters, db)


@trip_router.get("/my", response_model=list[TripRequestResponse], summary="My trips (traveler)")
def my_trips(
    status: Optional[str] = Query(None, description="Filter by status: Live | Closed"),
    current_user: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    """Returns all trips posted by the authenticated traveler."""
    return trip_service.list_my_trips(current_user.id, status, db)


@trip_router.get("/{trip_id}", response_model=TripRequestResponse, summary="Get trip by ID")
def get_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
):
    return trip_service.get_trip(trip_id, db)


# ─── TRAVELER — Create ────────────────────────────────────────────────────────

@trip_router.post("", response_model=TripRequestResponse, status_code=201, summary="Post a new trip")
def create_trip(
    payload: TripRequestCreate,
    current_user: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    """
    Only travelers can post trips.
    Enforces 1 active trip at a time.
    """
    return trip_service.create_trip(payload, current_user.id, db)


# ─── TRAVELER — Update ────────────────────────────────────────────────────────

@trip_router.patch("/{trip_id}", response_model=TripRequestResponse, summary="Edit trip (destination locked)")
def update_trip(
    trip_id: UUID,
    payload: TripRequestUpdate,
    current_user: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    """
    Partial update — only provided fields are changed.
    Destination cannot be changed (excluded from TripRequestUpdate).
    """
    return trip_service.update_trip(trip_id, payload, current_user.id, db)


# ─── TRAVELER — Close ─────────────────────────────────────────────────────────

@trip_router.patch("/{trip_id}/close", response_model=TripRequestResponse, summary="Close trip")
def close_trip(
    trip_id: UUID,
    current_user: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    """Mark a trip as Closed — traveler has chosen an agency."""
    return trip_service.close_trip(trip_id, current_user.id, db)


# ─── TRAVELER — Delete ────────────────────────────────────────────────────────

@trip_router.delete("/{trip_id}", summary="Delete trip")
def delete_trip(
    trip_id: UUID,
    current_user: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    return trip_service.delete_trip(trip_id, current_user.id, db)