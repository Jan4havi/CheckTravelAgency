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

class Message(Base):
    __tablename__ = "messages"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True)
    sender_id       = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    sender_name     = Column(Text,    nullable=True)
    sender_type     = Column(Text,    nullable=True)        # "traveler" | "agency"
    content         = Column(Text,    nullable=False)
    is_read         = Column(Boolean, nullable=True, default=False)
    created_at      = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender       = relationship("UserProfile",  back_populates="messages")

    def __repr__(self):
        return f"<Message id={self.id} sender={self.sender_name} read={self.is_read}>"
