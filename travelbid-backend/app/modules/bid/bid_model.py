import uuid
from app.base import Base
from app.modules.trip.trip_request_model import TripRequest
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime,
    ForeignKey, create_engine, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func



class Bid(Base):
    __tablename__ = "bids"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id       = Column(UUID(as_uuid=True), ForeignKey("trip_requests.id"), nullable=True)
    agency_id     = Column(UUID(as_uuid=True), ForeignKey("agency_profiles.id"), nullable=True)
    agency_name   = Column(Text,    nullable=True)
    bid_amount    = Column(Text,    nullable=True)
    message       = Column(Text,    nullable=True)
    viewed        = Column(Boolean, nullable=True, default=False)
    chat_requested= Column(Boolean, nullable=True, default=False)
    is_unlocked   = Column(Boolean, nullable=True, default=False)
    created_at    = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    trip   = relationship("TripRequest",   back_populates="bids")
    agency = relationship("AgencyProfile", back_populates="bids")

    def __repr__(self):
        return f"<Bid id={self.id} amount={self.bid_amount} unlocked={self.is_unlocked}>"
