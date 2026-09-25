# LegalLens Backend - FastAPI Application
# This application provides AI-powered legal document analysis.
# IMPORTANT: This is informational assistance only, never legal advice.

import os
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from app.routers import documents, analysis, compare, export
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LegalLens backend starting up...")
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

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
