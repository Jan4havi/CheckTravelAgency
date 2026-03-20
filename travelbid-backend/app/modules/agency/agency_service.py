from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.agency.agency_model import AgencyProfile


def list_agencies(db: Session, skip=0, limit=10, keyword=None):
    query = db.query(AgencyProfile)

    if keyword:
        query = query.filter(
            or_(
                AgencyProfile.agency_name.ilike(f"%{keyword}%"),
                AgencyProfile.email.ilike(f"%{keyword}%")
            )
        )

    total = query.count()
    data = query.offset(skip).limit(limit).all()

    return {"total": total, "data": data}