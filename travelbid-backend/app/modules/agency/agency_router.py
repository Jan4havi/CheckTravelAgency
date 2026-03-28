from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.agency import agency_service
from app.auth.dependencies import get_current_agency
from app.modules.agency.agency_schema import AgencyResponse

agency_router = APIRouter(prefix="/agencies", tags=["Agencies"])


@agency_router.get("/")
def list(
    skip: int = 0,
    limit: int = 10,
    keyword: str = Query(None),
    db: Session = Depends(get_db),
):
    return agency_service.list_agencies(db, skip, limit, keyword)


@agency_router.get("/me", response_model=AgencyResponse)
def get_me(current_agency = Depends(get_current_agency)):
    return current_agency