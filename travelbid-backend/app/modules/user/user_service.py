from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.agency.agency_model import AgencyProfile
from app.modules.user.user_model import UserProfile
from app.core.security import hash_password


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


def create_user(db: Session, data):
    payload = data.dict() if hasattr(data, "dict") else dict(data)

    # Accept either plain `password` or pre-hashed `hashed_password`.
    if payload.get("password"):
        payload["hashed_password"] = hash_password(payload.pop("password"))
    payload.setdefault("hashed_password", "")

    obj = UserProfile(**payload)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_user(db: Session, id: str):
    return db.query(UserProfile).filter(UserProfile.id == id).first()


def update_user(db: Session, id: str, data):
    obj = db.query(UserProfile).filter(UserProfile.id == id).first()
    if not obj:
        return None

    payload = data.dict(exclude_unset=True) if hasattr(data, "dict") else dict(data)

    if "password" in payload:
        obj.hashed_password = hash_password(payload.pop("password"))

    for k, v in payload.items():
        if hasattr(obj, k):
            setattr(obj, k, v)

    db.commit()
    db.refresh(obj)
    return obj


def delete_user(db: Session, id: str):
    obj = db.query(UserProfile).filter(UserProfile.id == id).first()
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return {"deleted": True}