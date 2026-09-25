# LegalLens Backend - FastAPI Application
# This application provides AI-powered legal document analysis.
# IMPORTANT: This is informational assistance only, never legal advice.

import logging
import os
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.routers import analysis, compare, documents, export

# Rate limiting with slowapi
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
    HAS_SLOWAPI = True
except Exception:
    HAS_SLOWAPI = False
    limiter = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─── Security Headers Middleware ─────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Security headers patch
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LegalLens backend starting up with Security Hardening active...")
    logger.info("Note: This service provides informational assistance only, not legal advice.")
    yield
    logger.info("LegalLens backend shutting down.")


app = FastAPI(
    title="LegalLens API",
    description=(
        "GenAI-powered legal document assistant. "
        "IMPORTANT: This API provides general information and assistance only. "
        "It does NOT provide legal advice and does NOT replace a licensed attorney."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

if HAS_SLOWAPI and limiter:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS — Scoped strictly to frontend origins
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if settings.frontend_url and settings.frontend_url not in allowed_origins:
    allowed_origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Global Exception Handler (Prevent Stack Trace Leakage) ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the full exception internally for debugging
    logger.error(f"Unhandled server error on {request.url.path}: {exc}", exc_info=True)
    # Return sanitized client-facing response without internal system details or paths
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred during document analysis. Please try again or verify your document format."
        },
    )


app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(compare.router, prefix="/api/compare", tags=["compare"])
app.include_router(export.router, prefix="/api/export", tags=["export"])


@app.get("/")
async def root():
    return {
        "service": "LegalLens API",
        "status": "operational",
        "disclaimer": (
            "This service provides general information only, not legal advice. "
            "Always consult a licensed attorney for decisions with real legal consequences."
        ),
    }


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
