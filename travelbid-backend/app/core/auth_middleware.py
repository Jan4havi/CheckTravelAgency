from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import JSONResponse
from jose import jwt, JWTError
from app.modules.user.user_model import UserProfile
from app.modules.agency.agency_model import AgencyProfile
from app.core.database import SessionLocal
import os
from app.core.config import settings


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        if request.method == "OPTIONS":
            return await call_next(request)

        public_paths = [
            "/docs",
            "/openapi.json",
            "/auth/login",
            "auth/agency/login",
            "auth/signup/traveler",
            "auth/signup/agency",
        ]

        if any(request.url.path.endswith(p) for p in public_paths):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Missing token"})

        try:
            scheme, token = auth_header.split()
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )

            user_id = payload.get("sub")
            user_type = payload.get("user_type")

            if not user_id or not user_type:
                return JSONResponse(
                    status_code=401, content={"detail": "Invalid token"}
                )

        except (JWTError, ValueError):
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        db = SessionLocal()

        try:
            if user_type == "traveler":
                user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
            elif user_type == "agency":
                user = (
                    db.query(AgencyProfile).filter(AgencyProfile.id == user_id).first()
                )
            else:
                return JSONResponse(
                    status_code=401, content={"detail": "Invalid user type"}
                )

            if not user:
                return JSONResponse(
                    status_code=401, content={"detail": "User not found"}
                )

            # ✅ Attach context
            request.state.user = user
            request.state.user_id = user_id
            request.state.user_type = user_type

            return await call_next(request)

        finally:
            db.close()
