from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.conversation import conversation_service
from app.modules.conversation.conversation_schema import ConversationCreate

conversation_router = APIRouter(prefix="/conversations", tags=["Conversations"])


@conversation_router.post("/")
def create(data: ConversationCreate, db: Session = Depends(get_db)):
    return conversation_service.create_conversation(db, data)


@conversation_router.get("/")
def list(db: Session = Depends(get_db)):
    return conversation_service.list_conversations(db)