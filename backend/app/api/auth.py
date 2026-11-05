from fastapi import APIRouter, HTTPException, Header, Query, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.app.config import settings
from backend.app.services.github_service import GitHubService

router = APIRouter(prefix="/api/auth/github", tags=["GitHub SSO Auth"])

class OAuthCallbackRequest(BaseModel):
    code: str

class TokenLoginRequest(BaseModel):
    token: str

class DevicePollRequest(BaseModel):
    device_code: str

@router.get("/config")
def get_oauth_config():
    """Returns GitHub OAuth SSO configuration status."""
    has_oauth = bool(settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET)
    return {
        "oauth_configured": has_oauth,
        "client_id": settings.GITHUB_CLIENT_ID if has_oauth else None,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "repo,read:user"
    }

@router.post("/callback")
async def github_oauth_callback(req: OAuthCallbackRequest):
    """Exchanges GitHub OAuth authorization code for an access token."""
    try:
        access_token = await GitHubService.exchange_oauth_code(req.code)
        profile = await GitHubService.get_user_profile(access_token)
        # Store in settings for convenience
        settings.GITHUB_TOKEN = access_token
        return {
            "status": "success",
            "access_token": access_token,
            "user": profile
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/device-code")
async def start_device_flow():
    """Initiates GitHub Device Authorization Flow (Zero-Setup SSO)."""
    try:
        data = await GitHubService.create_device_code()
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/device-poll")
async def poll_device_flow(req: DevicePollRequest):
    """Polls GitHub Device Flow for user authorization completion."""
    try:
        data = await GitHubService.poll_device_code(req.device_code)
        if "access_token" in data:
            token = data["access_token"]
            profile = await GitHubService.get_user_profile(token)
            settings.GITHUB_TOKEN = token
            return {
                "status": "complete",
                "access_token": token,
                "user": profile
            }
        return {
            "status": "pending",
            "error": data.get("error", "authorization_pending")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/token-login")
async def token_sso_login(req: TokenLoginRequest):
    """Validates Personal Access Token as SSO credential and returns user profile."""
    try:
        token = req.token.strip()
        profile = await GitHubService.get_user_profile(token)
        settings.GITHUB_TOKEN = token
        return {
            "status": "success",
            "access_token": token,
            "user": profile
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@router.get("/user")
async def get_current_user(authorization: Optional[str] = Header(None), token: Optional[str] = Query(None)):
    """Fetches user profile for active GitHub session."""
    active_token = None
    if authorization and authorization.startswith("Bearer "):
        active_token = authorization.replace("Bearer ", "").strip()
    elif token:
        active_token = token.strip()
    elif settings.GITHUB_TOKEN:
        active_token = settings.GITHUB_TOKEN

    if not active_token:
        raise HTTPException(status_code=401, detail="No active GitHub authentication session.")

    try:
        return await GitHubService.get_user_profile(active_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/repos")
async def get_user_repositories(authorization: Optional[str] = Header(None), token: Optional[str] = Query(None)):
    """Fetches all repositories for the authenticated user to populate workspaces."""
    active_token = None
    if authorization and authorization.startswith("Bearer "):
        active_token = authorization.replace("Bearer ", "").strip()
    elif token:
        active_token = token.strip()
    elif settings.GITHUB_TOKEN:
        active_token = settings.GITHUB_TOKEN

    if not active_token:
        raise HTTPException(status_code=401, detail="No active GitHub authentication session.")

    try:
        return await GitHubService.list_user_repos(active_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
