from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from uuid import UUID

from app.modules.trip.trip_request import TripRequest
from app.modules.trip.trip_schema import TripRequestCreate, TripRequestUpdate

class TripService:

    @staticmethod
    def create(db: Session, data: TripRequestCreate):
        trip = TripRequest(**data.dict())
        db.add(trip)
        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def get(db: Session, trip_id: UUID):
        trip = db.query(TripRequest).filter(TripRequest.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        return trip

    @staticmethod
    def update(db: Session, trip_id: UUID, data: TripRequestUpdate):
        trip = TripService.get(db, trip_id)

        for key, value in data.dict(exclude_unset=True).items():
            setattr(trip, key, value)

        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def delete(db: Session, trip_id: UUID):
        trip = TripService.get(db, trip_id)
        db.delete(trip)
        db.commit()
        return {"message": "Deleted successfully"}

    @staticmethod
    def list(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        destination: Optional[str] = None,
        status: Optional[str] = None
    ):
        query = db.query(TripRequest)

        if search:
            query = query.filter(
                TripRequest.title.ilike(f"%{search}%") |
                TripRequest.destination.ilike(f"%{search}%")
            )

        if destination:
            query = query.filter(TripRequest.destination.ilike(f"%{destination}%"))

        if status:
            query = query.filter(TripRequest.status == status)

        query = query.order_by(TripRequest.created_at.desc())

        total = query.count()
        data = query.offset(skip).limit(limit).all()

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "data": data
        }