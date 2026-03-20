from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.agency import agency_service

agency_router = APIRouter(prefix="/agencies", tags=["Agencies"])


@agency_router.get("/")
def list(
    skip: int = 0,
    limit: int = 10,
    keyword: str = Query(None),
    db: Session = Depends(get_db),
):
    return agency_service.list_agencies(db, skip, limit, keyword)