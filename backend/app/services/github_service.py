import os
import re
import io
import zipfile
import httpx
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from backend.app.config import settings

GITHUB_URL_REGEX = re.compile(r"github\.com[/:](?P<owner>[\w\-]+)/(?P<repo>[\w\-\.]+)(?:\.git)?")

class GitHubService:
    @staticmethod
    def parse_repo_url(url: str) -> Optional[Tuple[str, str]]:
        """Extracts (owner, repo) from GitHub URL or owner/repo format."""
        url = url.strip().rstrip("/")
        match = GITHUB_URL_REGEX.search(url)
        if match:
            repo_name = match.group("repo")
            if repo_name.endswith(".git"):
                repo_name = repo_name[:-4]
            return match.group("owner"), repo_name
        
        # Check if direct owner/repo format
        parts = url.split("/")
        if len(parts) == 2 and not url.startswith("http"):
            return parts[0], parts[1]
        
        return None

    @staticmethod
    def get_headers(token: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Projector-AI-App"
        }
        active_token = token or settings.GITHUB_TOKEN
        if active_token:
            headers["Authorization"] = f"Bearer {active_token}"
        return headers

    @staticmethod
    async def get_repo_details(owner: str, repo: str, token: Optional[str] = None) -> Dict[str, Any]:
        """Fetches metadata for a GitHub repo."""
        headers = GitHubService.get_headers(token)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
            if resp.status_code == 404:
                raise ValueError(f"Repository {owner}/{repo} not found or is private.")
            if resp.status_code == 401 or resp.status_code == 403:
                rate_limit_reset = resp.headers.get("x-ratelimit-reset")
                raise ValueError(f"GitHub API Error: {resp.json().get('message', 'Authentication or Rate Limit error.')}")
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    async def download_repo_archive(owner: str, repo: str, target_dir: Path, branch: Optional[str] = None, token: Optional[str] = None) -> str:
        """
        Downloads repo zip archive from GitHub and unzips it into target_dir.
        Returns the resolved root path containing the project files.
        """
        target_dir.mkdir(parents=True, exist_ok=True)
        headers = GitHubService.get_headers(token)
        headers["Accept"] = "application/vnd.github.v3+raw"

        ref = branch if branch else ""
        url = f"https://api.github.com/repos/{owner}/{repo}/zipball/{ref}"

        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                raise ValueError(f"Failed to download repository zipball: HTTP {resp.status_code} - {resp.text[:200]}")
            
            # Extract zip in memory
            with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
                # Zip root directory is typically `owner-repo-commitHash/`
                namelist = z.namelist()
                if not namelist:
                    raise ValueError("Downloaded archive is empty.")
                
                root_prefix = namelist[0].split("/")[0] + "/"
                
                for member in z.infolist():
                    if member.is_dir():
                        continue
                    # Strip top-level directory prefix
                    filename = member.filename
                    if filename.startswith(root_prefix):
                        filename = filename[len(root_prefix):]
                    if not filename:
                        continue
                    
                    dest_path = target_dir / filename
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(member) as source_file, open(dest_path, "wb") as target_file:
                        target_file.write(source_file.read())

        return str(target_dir)

    @staticmethod
    async def exchange_oauth_code(code: str, client_id: Optional[str] = None, client_secret: Optional[str] = None, redirect_uri: Optional[str] = None) -> str:
        cid = client_id or settings.GITHUB_CLIENT_ID
        csec = client_secret or settings.GITHUB_CLIENT_SECRET
        ruri = redirect_uri or settings.GITHUB_REDIRECT_URI
        if not cid or not csec:
            raise ValueError("GitHub OAuth App credentials (GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET) are not configured. You can configure them in Settings or use Personal Access Token SSO.")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                json={
                    "client_id": cid,
                    "client_secret": csec,
                    "code": code,
                    "redirect_uri": ruri
                }
            )
            data = resp.json()
            if "error" in data:
                raise ValueError(f"GitHub OAuth Error: {data.get('error_description') or data.get('error')}")
            access_token = data.get("access_token")
            if not access_token:
                raise ValueError("Failed to retrieve access token from GitHub.")
            return access_token

    @staticmethod
    async def create_device_code(client_id: Optional[str] = None) -> Dict[str, Any]:
        """Initiates GitHub OAuth Device Authorization Flow."""
        cid = client_id or settings.GITHUB_CLIENT_ID
        if not cid:
            raise ValueError("GITHUB_CLIENT_ID is required for GitHub SSO Device flow. Set it in Settings or provide a token.")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://github.com/login/device/code",
                headers={"Accept": "application/json"},
                data={
                    "client_id": cid,
                    "scope": "repo,read:user"
                }
            )
            data = resp.json()
            if "error" in data:
                raise ValueError(f"GitHub Device Code Error: {data.get('error_description') or data.get('error')}")
            return data

    @staticmethod
    async def poll_device_code(device_code: str, client_id: Optional[str] = None) -> Dict[str, Any]:
        """Polls for completion of Device Authorization."""
        cid = client_id or settings.GITHUB_CLIENT_ID
        if not cid:
            raise ValueError("GITHUB_CLIENT_ID is required for Device flow polling.")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": cid,
                    "device_code": device_code,
                    "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
                }
            )
            data = resp.json()
            return data

    @staticmethod
    async def get_user_profile(token: str) -> Dict[str, Any]:
        """Fetches profile for authenticated GitHub user."""
        headers = GitHubService.get_headers(token)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://api.github.com/user", headers=headers)
            if resp.status_code != 200:
                raise ValueError(f"GitHub Auth Error: {resp.json().get('message', 'Invalid token')}")
            data = resp.json()
            return {
                "login": data.get("login"),
                "name": data.get("name") or data.get("login"),
                "avatar_url": data.get("avatar_url"),
                "html_url": data.get("html_url"),
                "bio": data.get("bio", ""),
                "company": data.get("company", ""),
                "public_repos": data.get("public_repos", 0),
                "total_private_repos": data.get("total_private_repos", 0)
            }

    @staticmethod
    async def list_user_repos(token: str) -> List[Dict[str, Any]]:
        """Lists repositories for an authenticated user with broad affiliation and latest updates."""
        headers = GitHubService.get_headers(token)
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(
                "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
                headers=headers
            )
            if resp.status_code != 200:
                raise ValueError("Failed to fetch user repositories from GitHub.")
            repos = resp.json()
            return [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "full_name": r["full_name"],
                    "description": r.get("description"),
                    "private": r["private"],
                    "url": r["html_url"],
                    "language": r.get("language") or "Other",
                    "stars": r.get("stargazers_count", 0),
                    "default_branch": r.get("default_branch", "main"),
                    "updated_at": r.get("updated_at")
                }
                for r in repos
            ]

