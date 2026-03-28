"""
app/modules/bid/bid_router.py
FastAPI router for Bid CRUD.

Public:
  GET  /bids/stats/{trip_id}       — avg/min/max for a trip (agencies see this)

Agency only:
  POST   /bids                     — place a bid
  PATCH  /bids/{bid_id}            — edit own bid
  DELETE /bids/{bid_id}            — withdraw own bid
  GET    /bids/my                  — all bids placed by this agency (paginated)
  GET    /bids/my/trip/{trip_id}   — agency's own bid on a specific trip

Traveler only:
  GET    /bids/trip/{trip_id}      — all bids on traveler's own trip (full details)
  PATCH  /bids/{bid_id}/viewed     — mark a bid as viewed
  PATCH  /bids/{bid_id}/unlock     — unlock bid after payment

Admin / internal:
  GET    /bids                     — list all bids with full filters + pagination
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_agency,
    get_current_traveler,
    get_current_user,
    CurrentUser,
)
from app.core.database import get_db
from app.modules.agency.agency_model import AgencyProfile
from app.modules.user.user_model import UserProfile
from app.modules.bid.bid_schema import (
    BidCreate,
    BidFilters,
    BidResponse,
    BidStats,
    BidUpdate,
    PaginatedBidResponse,
)
from app.modules.bid import bid_service
from app.core.rbac_dep import require_user_types

bid_router = APIRouter(
    prefix="/bids",
    tags=["Bids"],
)


# ─── PUBLIC — Stats ───────────────────────────────────────────────────────────


@bid_router.get(
    "/stats/{trip_id}",
    response_model=BidStats,
    summary="Get bid stats for a trip (avg/min/max — no individual amounts exposed)",
)
def get_bid_stats(trip_id: UUID, db: Session = Depends(get_db)):
    return bid_service.get_bid_stats(trip_id, db)


# ─── AGENCY — Place a bid ─────────────────────────────────────────────────────


@bid_router.post(
    "",
    response_model=BidResponse,
    status_code=201,
    summary="Place a bid on a trip",
    dependencies=[Depends(require_user_types(["agency"]))],
)
def create_bid(
    payload: BidCreate,
    current_agency: AgencyProfile = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    """
    Agency places one bid per trip.
    Raises 409 if the agency already bid on this trip.
    Raises 400 if the trip is not Live.
    """
    return bid_service.create_bid(payload, current_agency, db)


# ─── AGENCY — Edit own bid ────────────────────────────────────────────────────


@bid_router.patch(
    "/{bid_id}",
    response_model=BidResponse,
    summary="Edit your bid (amount + message)",
    dependencies=[Depends(require_user_types(["agency"]))],
)
def update_bid(
    bid_id: UUID,
    payload: BidUpdate,
    current_agency: AgencyProfile = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    return bid_service.update_bid(bid_id, payload, current_agency.id, db)


# ─── AGENCY — Withdraw bid ────────────────────────────────────────────────────


@bid_router.delete(
    "/{bid_id}",
    summary="Withdraw your bid",
    dependencies=[Depends(require_user_types(["agency"]))],
)
def delete_bid(
    bid_id: UUID,
    current_agency: AgencyProfile = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    return bid_service.delete_bid(bid_id, current_agency.id, db)


# ─── AGENCY — My bids (all trips I bid on) ────────────────────────────────────


@bid_router.get(
    "/my",
    response_model=PaginatedBidResponse,
    summary="All bids placed by this agency",
    dependencies=[Depends(require_user_types(["agency"]))],
)
def my_bids(
    keyword: Optional[str] = Query(None, description="Search message content"),
    trip_id: Optional[UUID] = Query(None),
    is_unlocked: Optional[bool] = Query(None),
    chat_requested: Optional[bool] = Query(None),
    viewed: Optional[bool] = Query(None),
    created_from: Optional[datetime] = Query(None),
    created_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_agency: AgencyProfile = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    """Returns all bids placed by the authenticated agency with optional filters."""
    filters = BidFilters(
        keyword=keyword,
        trip_id=trip_id,
        agency_id=current_agency.id,  # always scoped to this agency
        is_unlocked=is_unlocked,
        chat_requested=chat_requested,
        viewed=viewed,
        created_from=created_from,
        created_to=created_to,
        page=page,
        limit=limit,
    )
    return bid_service.list_bids(filters, db)


# ─── AGENCY — My bid on a specific trip ──────────────────────────────────────


@bid_router.get(
    "/my/trip/{trip_id}",
    response_model=BidResponse,
    summary="Get this agency's own bid on a specific trip",
    dependencies=[Depends(require_user_types(["agency"]))],
)
def my_bid_for_trip(
    trip_id: UUID,
    current_agency: AgencyProfile = Depends(get_current_agency),
    db: Session = Depends(get_db),
):
    return bid_service.get_my_bid_for_trip(trip_id, current_agency.id, db)


# ─── TRAVELER — All bids on their trip (full details) ────────────────────────


@bid_router.get(
    "/trip/{trip_id}",
    response_model=PaginatedBidResponse,
    summary="All bids on traveler's trip (traveler only — full amounts + messages)",
    dependencies=[Depends(require_user_types(["traveler"]))],
)
def bids_for_trip(
    trip_id: UUID,
    current_traveler: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    """
    Only the traveler who posted the trip can see all bids with full details.
    Other agencies cannot access this endpoint.
    """
    return bid_service.list_bids_for_trip(trip_id, current_traveler.id, db)


# ─── TRAVELER — Mark bid as viewed ───────────────────────────────────────────


@bid_router.patch(
    "/{bid_id}/viewed",
    response_model=BidResponse,
    summary="Mark a bid as viewed (traveler opens it)",
    dependencies=[Depends(require_user_types(["traveler"]))],
)
def mark_bid_viewed(
    bid_id: UUID,
    _: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    return bid_service.mark_viewed(bid_id, db)


# ─── TRAVELER — Unlock bid (post payment) ────────────────────────────────────


@bid_router.patch(
    "/{bid_id}/unlock",
    response_model=BidResponse,
    summary="Unlock a bid after payment — reveals agency contact details",
    dependencies=[Depends(require_user_types(["traveler"]))],
)
def unlock_bid(
    bid_id: UUID,
    current_traveler: UserProfile = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    """
    Called after Razorpay payment succeeds.
    Sets is_unlocked=True + chat_requested=True on the bid.
    """
    return bid_service.unlock_bid(bid_id, current_traveler.id, db)


# ─── ADMIN / INTERNAL — Full list with all filters ───────────────────────────


@bid_router.get(
    "",
    response_model=PaginatedBidResponse,
    summary="List all bids (admin/internal)",
    dependencies=[Depends(require_user_types(["admin"]))],
)
def list_all_bids(
    keyword: Optional[str] = Query(None, description="Search agency_name or message"),
    trip_id: Optional[UUID] = Query(None),
    agency_id: Optional[UUID] = Query(None),
    is_unlocked: Optional[bool] = Query(None),
    chat_requested: Optional[bool] = Query(None),
    viewed: Optional[bool] = Query(None),
    created_from: Optional[datetime] = Query(None),
    created_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    # protect this in production — add admin dependency
    _: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = BidFilters(
        keyword=keyword,
        trip_id=trip_id,
        agency_id=agency_id,
        is_unlocked=is_unlocked,
        chat_requested=chat_requested,
        viewed=viewed,
        created_from=created_from,
        created_to=created_to,
        page=page,
        limit=limit,
    )
    return bid_service.list_bids(filters, db)
