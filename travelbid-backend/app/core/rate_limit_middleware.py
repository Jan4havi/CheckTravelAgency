import time
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException
from starlette.responses import JSONResponse

# Simple in-memory store (use Redis in production)
RATE_LIMIT = 100  # requests
WINDOW = 60       # seconds

client_requests = {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        client_ip = request.client.host
        now = time.time()

        if client_ip not in client_requests:
            client_requests[client_ip] = []

        # Filter valid timestamps
        client_requests[client_ip] = [
            t for t in client_requests[client_ip] if now - t < WINDOW
        ]

        if len(client_requests[client_ip]) >= RATE_LIMIT:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"}
)

        client_requests[client_ip].append(now)

        return await call_next(request)