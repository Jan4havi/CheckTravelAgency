from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.message import message_service
from app.modules.message.message_schema import MessageCreate

message_router = APIRouter(prefix="/messages", tags=["Messages"])


@message_router.post("/")
def create(data: MessageCreate, db: Session = Depends(get_db)):
    return message_service.create_message(db, data)


@message_router.get("/{conversation_id}")
def list(conversation_id: str, db: Session = Depends(get_db)):
    return message_service.list_messages(db, conversation_id)