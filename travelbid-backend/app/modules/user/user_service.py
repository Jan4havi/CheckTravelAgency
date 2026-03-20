from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.agency.agency_model import AgencyProfile
from app.modules.user.user_model import UserProfile

def list_users(db: Session, skip=0, limit=10, keyword=None):
    query = db.query(UserProfile)

    if keyword:
        query = query.filter(
            or_(
                UserProfile.full_name.ilike(f"%{keyword}%"),
                UserProfile.email.ilike(f"%{keyword}%")
            )
        )

    total = query.count()
    data = query.offset(skip).limit(limit).all()
    return {"total": total, "data": data}