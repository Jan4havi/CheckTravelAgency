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


class AgencyProfile(Base):
    __tablename__ = "agency_profiles"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)           # FK → auth.users.id
    agency_name    = Column(Text,    nullable=True)
    phone          = Column(Text,    nullable=True)
    email          = Column(Text,    nullable=True)
    gst_number     = Column(Text,    nullable=True)
    pan_number     = Column(Text,    nullable=True)
    address        = Column(Text,    nullable=True)
    website        = Column(Text,    nullable=True)
    user_type      = Column(String,  nullable=True, default="agency")
    # Bank details
    bank_name      = Column(Text,    nullable=True)
    account_number = Column(Text,    nullable=True)
    ifsc_code      = Column(Text,    nullable=True)
    account_holder = Column(Text,    nullable=True)
    bank_phone     = Column(Text,    nullable=True)
    created_at     = Column(DateTime, nullable=False, default=datetime.utcnow)

    hashed_password = Column(Text, nullable=False) 
    membership_plan = Column(String, default="Free")
    is_active       = Column(Boolean, default=True)

    # Relationships
    bids           = relationship("Bid",          back_populates="agency",  cascade="all, delete-orphan")
    conversations  = relationship("Conversation", foreign_keys="Conversation.agency_id", back_populates="agency")

    def __repr__(self):
        return f"<AgencyProfile id={self.id} name={self.agency_name}>"
