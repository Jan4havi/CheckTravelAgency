"""
CheckTravelPrice — SQLAlchemy Models
Matches the Supabase PostgreSQL schema exactly.
"""

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




# ─────────────────────────────────────────
# USER PROFILES  (traveler accounts)
# ─────────────────────────────────────────


# ─────────────────────────────────────────
# AGENCY PROFILES
# ─────────────────────────────────────────


# ─────────────────────────────────────────
# TRIP REQUESTS
# ─────────────────────────────────────────

# ─────────────────────────────────────────
# BIDS
# ─────────────────────────────────────────


# ─────────────────────────────────────────
# CONVERSATIONS
# ─────────────────────────────────────────

# ─────────────────────────────────────────
# MESSAGES
# ─────────────────────────────────────────


# ─────────────────────────────────────────
# SUPPORT TICKETS
# ─────────────────────────────────────────

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