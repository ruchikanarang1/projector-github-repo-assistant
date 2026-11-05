import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.app.config import settings
from backend.app.services.llm_service import LLMService

router = APIRouter(prefix="/api/settings", tags=["Settings"])

def mask_key(k: Optional[str]) -> str:
    if not k:
        return "Not Set"
    if len(k) <= 8:
        return "********"
    return k[:4] + "..." + k[-4:]

@router.get("")
async def get_system_settings():
    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "gemini_key_masked": mask_key(settings.GEMINI_API_KEY),
        "gemini_model": settings.GEMINI_MODEL,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "openai_key_masked": mask_key(settings.OPENAI_API_KEY),
        "openai_model": settings.OPENAI_MODEL,
        "github_token_configured": bool(settings.GITHUB_TOKEN),
        "github_token_masked": mask_key(settings.GITHUB_TOKEN),
        "database_type": "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite",
        "default_provider": settings.DEFAULT_LLM_PROVIDER
    }

class UpdateSettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    github_token: Optional[str] = None
    default_provider: Optional[str] = None

@router.post("")
async def update_system_settings(req: UpdateSettingsRequest):
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key.strip()
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key.strip()
    if req.github_token is not None:
        settings.GITHUB_TOKEN = req.github_token.strip()
    if req.default_provider is not None:
        settings.DEFAULT_LLM_PROVIDER = req.default_provider.strip()

    return {
        "status": "success",
        "message": "Settings updated successfully",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "github_token_configured": bool(settings.GITHUB_TOKEN)
    }

@router.get("/models/gemini")
async def get_dynamic_gemini_models():
    """
    Dynamically queries Google AI Studio API for current live, usable Gemini models.
    Returns classified models (lowest cost, latest flagship, fast efficient).
    """
    models = await LLMService.fetch_available_gemini_models()
    active = getattr(settings, "ACTIVE_GEMINI_MODEL", "gemini-2.5-flash")
    return {
        "active_model": active,
        "models": models
    }

class SetActiveModelRequest(BaseModel):
    model_id: str

@router.post("/models/gemini/active")
async def set_active_gemini_model(req: SetActiveModelRequest):
    settings.ACTIVE_GEMINI_MODEL = req.model_id.strip()
    settings.GEMINI_MODEL = req.model_id.strip()
    return {
        "status": "success",
        "active_model": settings.ACTIVE_GEMINI_MODEL,
        "message": f"Active model successfully updated to {settings.ACTIVE_GEMINI_MODEL}"
    }

