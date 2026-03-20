from sqlalchemy.orm import Session
from app.modules.message.message_model import Message


def create_message(db: Session, data):
    obj = Message(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_messages(db: Session, conversation_id, skip=0, limit=20):
    query = db.query(Message).filter(Message.conversation_id == conversation_id)

    total = query.count()
    data = query.offset(skip).limit(limit).all()

    return {"total": total, "data": data}