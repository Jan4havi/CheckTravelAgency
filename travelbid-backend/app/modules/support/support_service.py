from sqlalchemy.orm import Session
from app.modules.support.support_model import SupportTicket


def create_ticket(db: Session, data):
    obj = SupportTicket(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_tickets(db: Session, skip=0, limit=10):
    query = db.query(SupportTicket)

    total = query.count()
    data = query.offset(skip).limit(limit).all()

    return {"total": total, "data": data}