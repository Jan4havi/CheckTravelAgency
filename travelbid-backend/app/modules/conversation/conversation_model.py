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


class Conversation(Base):
    __tablename__ = "conversations"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id       = Column(UUID(as_uuid=True), ForeignKey("trip_requests.id"), nullable=True)
    traveler_id   = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    agency_id     = Column(UUID(as_uuid=True), ForeignKey("agency_profiles.id"), nullable=True)
    traveler_name = Column(Text,    nullable=True)
    agency_name   = Column(Text,    nullable=True)
    lead_id       = Column(Text,    nullable=True)
    last_message  = Column(Text,    nullable=True)
    updated_at    = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at    = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    trip     = relationship("TripRequest",   back_populates="conversations")
    traveler = relationship("UserProfile",   foreign_keys=[traveler_id], back_populates="conversations")
    agency   = relationship("AgencyProfile", foreign_keys=[agency_id],   back_populates="conversations")
    messages = relationship("Message",       back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation id={self.id} trip={self.trip_id}>"

