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


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    user_name  = Column(Text,    nullable=True)
    user_email = Column(Text,    nullable=True)
    subject    = Column(Text,    nullable=False)
    message    = Column(Text,    nullable=False)
    status     = Column(String,  nullable=True, default="open")
    category   = Column(Text,    nullable=True)
    priority   = Column(String,  nullable=True, default="medium")
    messages   = Column(Text,    nullable=True)              # JSON string of message thread
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("UserProfile", back_populates="support_tickets")

    def __repr__(self):
        return f"<SupportTicket id={self.id} subject={self.subject} status={self.status}>"

