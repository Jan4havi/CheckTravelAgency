from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.user import user_service
from app.modules.user.user_schema import UserCreate, UserUpdate, UserResponse

user_router = APIRouter(prefix="/users", tags=["Users"])


@user_router.post("/", response_model=UserResponse)
def create(data: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, data)


@user_router.get("/{id}", response_model=UserResponse)
def get(id: str, db: Session = Depends(get_db)):
    return user_service.get_user(db, id)


@user_router.put("/{id}", response_model=UserResponse)
def update(id: str, data: UserUpdate, db: Session = Depends(get_db)):
    return user_service.update_user(db, id, data)


@user_router.delete("/{id}")
def delete(id: str, db: Session = Depends(get_db)):
    return user_service.delete_user(db, id)


@user_router.get("/")
def list(
    skip: int = 0,
    limit: int = 10,
    keyword: str = Query(None),
    db: Session = Depends(get_db),
):
    return user_service.list_users(db, skip, limit, keyword)