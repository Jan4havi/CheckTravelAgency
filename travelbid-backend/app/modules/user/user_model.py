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

    id              = Column(UUID(as_uuid=True), primary_key=True)          # FK → auth.users.id
    full_name       = Column(Text,    nullable=True)
    phone           = Column(Text,    nullable=True)
    email           = Column(Text,    nullable=True)
    user_type       = Column(String,  nullable=False, default="traveler")
    membership_plan = Column(String,  nullable=True,  default="Free")
    created_at      = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    trip_requests   = relationship("TripRequest",    back_populates="traveler", cascade="all, delete-orphan")
    conversations   = relationship("Conversation",   foreign_keys="Conversation.traveler_id", back_populates="traveler")
    support_tickets = relationship("SupportTicket",  back_populates="user",    cascade="all, delete-orphan")
    messages        = relationship("Message",        back_populates="sender")

    def __repr__(self):
        return f"<UserProfile id={self.id} name={self.full_name}>"
