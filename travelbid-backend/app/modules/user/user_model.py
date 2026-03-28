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


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name       = Column(Text,    nullable=True)
    phone           = Column(Text,    nullable=True)
    email           = Column(Text,    nullable=False, unique=True)
    hashed_password = Column(Text,    nullable=False)

    user_type       = Column(String,  nullable=False, default="traveler")
    membership_plan = Column(String,  nullable=True,  default="Free")
    is_active       = Column(Boolean, default=True)

    created_at      = Column(DateTime, nullable=False, default=datetime.utcnow)

    trip_requests   = relationship("TripRequest", back_populates="traveler", cascade="all, delete-orphan")
    conversations   = relationship("Conversation", foreign_keys="Conversation.traveler_id", back_populates="traveler")
    support_tickets = relationship("SupportTicket", back_populates="user", cascade="all, delete-orphan")
    messages        = relationship("Message", back_populates="sender")