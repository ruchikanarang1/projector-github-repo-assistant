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
    async def list_user_repos(token: str) -> List[Dict[str, Any]]:
        """Lists repositories for an authenticated user."""
        headers = GitHubService.get_headers(token)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://api.github.com/user/repos?sort=updated&per_page=50", headers=headers)
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
                    "language": r.get("language"),
                    "stars": r.get("stargazers_count", 0),
                    "default_branch": r.get("default_branch", "main"),
                    "updated_at": r.get("updated_at")
                }
                for r in repos
            ]

