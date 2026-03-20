from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ConversationCreate(BaseModel):
    trip_id: Optional[UUID]
    traveler_id: Optional[UUID]
    agency_id: Optional[UUID]


class ConversationResponse(ConversationCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True