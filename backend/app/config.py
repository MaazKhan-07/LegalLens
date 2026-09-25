# LegalLens Backend Configuration
# Reads from environment variables / .env file

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Gemini API — REQUIRED. Set in .env as GEMINI_API_KEY=<your_key>
    gemini_api_key: str = "YOUR_GEMINI_API_KEY_HERE"

    # The Gemini model to use for analysis
    gemini_model: str = "gemini-2.0-flash-exp"

    # Frontend URL for CORS
    frontend_url: str = "http://localhost:5173"

    # Max file size in MB
    max_file_size_mb: int = 20

    # Whether to allow optional document persistence (opt-in, off by default)
    allow_document_persistence: bool = False

    # App environment
    environment: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
