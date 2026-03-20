from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.support import support_service
from app.modules.support.support_schema import SupportCreate

support_router = APIRouter(prefix="/support", tags=["Support"])


@support_router.post("/")
def create(data: SupportCreate, db: Session = Depends(get_db)):
    return support_service.create_ticket(db, data)


@support_router.get("/")
def list(db: Session = Depends(get_db)):
    return support_service.list_tickets(db)