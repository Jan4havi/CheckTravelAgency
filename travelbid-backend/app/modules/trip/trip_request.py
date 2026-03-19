import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime,
    ForeignKey, create_engine, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func
from app.models import Base

class TripRequest(Base):
    __tablename__ = "trip_requests"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    title       = Column(Text,    nullable=True)
    source      = Column(Text,    nullable=True)
    destination = Column(Text,    nullable=False)
    trip_type   = Column(Text,    nullable=True)
    trip_scope  = Column(Text,    nullable=True)
    start_date  = Column(DateTime, nullable=True)
    end_date    = Column(DateTime, nullable=True)
    travelers   = Column(Integer,  nullable=True)
    budget      = Column(Text,    nullable=True)
    preferences = Column(Text,    nullable=True)
    status      = Column(String,  nullable=True, default="Live")
    created_at  = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    traveler      = relationship("UserProfile",  back_populates="trip_requests")
    bids          = relationship("Bid",          back_populates="trip",  cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="trip",  cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TripRequest id={self.id} destination={self.destination} status={self.status}>"

