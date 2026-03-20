from sqlalchemy.orm import Session
from app.modules.conversation.conversation_model import Conversation



def create_conversation(db: Session, data):
    obj = Conversation(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_conversations(db: Session, skip=0, limit=10):
    query = db.query(Conversation)

    total = query.count()
    data = query.offset(skip).limit(limit).all()

    return {"total": total, "data": data}