
# ===================== routes/trip_routes.py =====================
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.core.database import get_db
from app.modules.trip.trip_service import TripService
from app.modules.trip.trip_schema import (
    TripRequestCreate,
    TripRequestUpdate,
    TripRequestResponse,
    PaginatedTripResponse
)

trip_router = APIRouter(prefix="/trips", tags=["Trips"])

@trip_router.post("/", response_model=TripRequestResponse)
def create_trip(data: TripRequestCreate, db: Session = Depends(get_db)):
    return TripService.create(db, data)

@trip_router.get("/{trip_id}", response_model=TripRequestResponse)
def get_trip(trip_id: UUID, db: Session = Depends(get_db)):
    return TripService.get(db, trip_id)

@trip_router.put("/{trip_id}", response_model=TripRequestResponse)
def update_trip(trip_id: UUID, data: TripRequestUpdate, db: Session = Depends(get_db)):
    return TripService.update(db, trip_id, data)

@trip_router.delete("/{trip_id}")
def delete_trip(trip_id: UUID, db: Session = Depends(get_db)):
    return TripService.delete(db, trip_id)

@trip_router.get("/", response_model=PaginatedTripResponse)
def list_trips(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return TripService.list(db, skip, limit, search, destination, status)
