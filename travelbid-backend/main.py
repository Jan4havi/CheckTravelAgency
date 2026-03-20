"""
app/main.py
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import auth_router as auth_router
from app.core.config import settings
from app.core.database import Base, engine
from app.modules.trip.trip_router import trip_router
from app.modules.bid.bid_router import bid_router
from app.modules.user.user_router import user_router
from app.modules.support.support_router import support_router
from app.modules.message.message_router import message_router
from app.modules.conversation.conversation_router import conversation_router
from app.modules.agency.agency_router import agency_router


# Create all tables on startup (use Alembic in production instead)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1")
app.include_router(trip_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(support_router, prefix="/api/v1")
app.include_router(support_router, prefix="/api/v1")
app.include_router(message_router, prefix="/api/v1")
app.include_router(conversation_router, prefix="/api/v1")
app.include_router(bid_router, prefix="/api/v1")
app.include_router(agency_router, prefix="/api/v1")


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "app": settings.APP_NAME}


# ── Run locally ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)