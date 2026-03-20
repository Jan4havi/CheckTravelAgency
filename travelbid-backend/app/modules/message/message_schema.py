from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class MessageCreate(BaseModel):
    conversation_id: UUID
    sender_id: UUID
    sender_name: Optional[str]
    sender_type: Optional[str]
    content: str


class MessageResponse(MessageCreate):
    id: UUID
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True