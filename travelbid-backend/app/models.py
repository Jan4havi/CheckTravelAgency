"""
CheckTravelPrice — SQLAlchemy Models
Matches the Supabase PostgreSQL schema exactly.
"""

import uuid
from app.modules.trip.trip_request import TripRequest
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime,
    ForeignKey, create_engine, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func

Base = declarative_base()


# ─────────────────────────────────────────
# USER PROFILES  (traveler accounts)
# ─────────────────────────────────────────
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


# ─────────────────────────────────────────
# AGENCY PROFILES
# ─────────────────────────────────────────
class AgencyProfile(Base):
    __tablename__ = "agency_profiles"

    id             = Column(UUID(as_uuid=True), primary_key=True)           # FK → auth.users.id
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

    # Relationships
    bids           = relationship("Bid",          back_populates="agency",  cascade="all, delete-orphan")
    conversations  = relationship("Conversation", foreign_keys="Conversation.agency_id", back_populates="agency")

    def __repr__(self):
        return f"<AgencyProfile id={self.id} name={self.agency_name}>"


# ─────────────────────────────────────────
# TRIP REQUESTS
# ─────────────────────────────────────────

# ─────────────────────────────────────────
# BIDS
# ─────────────────────────────────────────
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


# ─────────────────────────────────────────
# CONVERSATIONS
# ─────────────────────────────────────────
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


# ─────────────────────────────────────────
# MESSAGES
# ─────────────────────────────────────────
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


# ─────────────────────────────────────────
# SUPPORT TICKETS
# ─────────────────────────────────────────
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


# ─────────────────────────────────────────
# DATABASE CONNECTION HELPER
# ─────────────────────────────────────────
def get_engine(database_url: str):
    """
    database_url format:
      postgresql://USER:PASSWORD@HOST:PORT/DBNAME

    For Supabase:
      postgresql://postgres:YOUR_PASSWORD@db.maasgggtWVcibrmuxsgx.supabase.co:5432/postgres
    """
    return create_engine(
        database_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,        # reconnect on stale connections
        echo=False,                # set True to log SQL
    )


def get_session(database_url: str):
    engine = get_engine(database_url)
    Session = sessionmaker(bind=engine)
    return Session()


# ─────────────────────────────────────────
# EXAMPLE USAGE
# ─────────────────────────────────────────
if __name__ == "__main__":
    import os
    DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/checktravelprice")
    engine = get_engine(DB_URL)

    # Create all tables (only if they don't exist — safe to run)
    Base.metadata.create_all(engine)
    print("✅ Tables verified/created.")

    Session = sessionmaker(bind=engine)
    session = Session()

    # Quick sanity check
    count = session.query(TripRequest).count()
    print(f"📦 TripRequests in DB: {count}")
    session.close()