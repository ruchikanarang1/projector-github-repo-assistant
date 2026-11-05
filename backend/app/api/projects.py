import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.project import Project, ProjectDocument, Flashcard
from backend.app.schemas.project import (
    ProjectCreateGitHub,
    ProjectCreateLocal,
    ProjectResponse,
    ProjectDetailResponse,
    FileContentResponse
)
from backend.app.services.github_service import GitHubService
from backend.app.services.local_repo_service import LocalRepoService
from backend.app.services.repo_analyzer import RepoAnalyzer, LANGUAGE_MAP
from backend.app.services.doc_generator import DocGenerator
from backend.app.services.interview_service import InterviewService

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.updated_at.desc()).all()

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/github", response_model=ProjectDetailResponse)
async def import_github_repo(data: ProjectCreateGitHub, db: Session = Depends(get_db)):
    parsed = GitHubService.parse_repo_url(data.repo_url)
    if not parsed:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL format. Example: https://github.com/owner/repo")
    
    owner, repo_name = parsed
    
    # Check details from GitHub
    try:
        repo_info = await GitHubService.get_repo_details(owner, repo_name, token=data.github_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    project_db = Project(
        name=repo_info.get("name", repo_name),
        description=repo_info.get("description", ""),
        source="github",
        repo_url=data.repo_url,
        default_branch=data.branch or repo_info.get("default_branch", "main"),
        summary=f"GitHub repository {owner}/{repo_name}. Stars: {repo_info.get('stargazers_count', 0)}"
    )
    db.add(project_db)
    db.flush()

    # Download archive into storage
    project_dir = settings.REPOS_DIR / project_db.id
    try:
        await GitHubService.download_repo_archive(
            owner=owner,
            repo=repo_name,
            target_dir=project_dir,
            branch=project_db.default_branch,
            token=data.github_token
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to clone/download repository: {e}")

    # Analyze repo
    analysis = RepoAnalyzer.scan_directory(project_dir)
    project_db.local_path = str(project_dir)
    project_db.file_count = analysis["file_count"]
    project_db.languages = analysis["languages"]
    project_db.tech_stack = analysis["tech_stack"]
    project_db.file_tree = analysis["file_tree"]
    project_db.readme_content = analysis["readme_content"]

    db.commit()
    db.refresh(project_db)

    # Initial flashcards
    try:
        flashcards_data = await InterviewService.generate_flashcards(
            project_db.name, project_db.tech_stack, project_db.file_tree
        )
        for fc in flashcards_data:
            db.add(Flashcard(
                project_id=project_db.id,
                category=fc.get("category", "architecture"),
                question=fc.get("question", ""),
                answer=fc.get("answer", ""),
                code_context=fc.get("code_context", "")
            ))
        db.commit()
    except Exception:
        pass

    return project_db

@router.post("/upload-zip", response_model=ProjectDetailResponse)
async def upload_project_zip(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".zip", ".tar", ".gz")):
        raise HTTPException(status_code=400, detail="Only .zip archives are supported.")

    project_name = name or Path(file.filename).stem

    project_db = Project(
        name=project_name,
        description=f"Imported from {file.filename}",
        source="zip",
        summary="Local project uploaded via ZIP archive."
    )
    db.add(project_db)
    db.flush()

    project_dir = settings.REPOS_DIR / project_db.id
    try:
        await LocalRepoService.extract_uploaded_zip(file, project_dir)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to extract zip file: {e}")

    analysis = RepoAnalyzer.scan_directory(project_dir)
    project_db.local_path = str(project_dir)
    project_db.file_count = analysis["file_count"]
    project_db.languages = analysis["languages"]
    project_db.tech_stack = analysis["tech_stack"]
    project_db.file_tree = analysis["file_tree"]
    project_db.readme_content = analysis["readme_content"]

    db.commit()
    db.refresh(project_db)

    # Generate initial flashcards
    try:
        flashcards_data = await InterviewService.generate_flashcards(
            project_db.name, project_db.tech_stack, project_db.file_tree
        )
        for fc in flashcards_data:
            db.add(Flashcard(
                project_id=project_db.id,
                category=fc.get("category", "architecture"),
                question=fc.get("question", ""),
                answer=fc.get("answer", ""),
                code_context=fc.get("code_context", "")
            ))
        db.commit()
    except Exception:
        pass

    return project_db

@router.post("/local", response_model=ProjectDetailResponse)
async def import_local_path(data: ProjectCreateLocal, db: Session = Depends(get_db)):
    source_path = Path(data.local_path).resolve()
    if not source_path.exists() or not source_path.is_dir():
        raise HTTPException(status_code=400, detail=f"Directory '{data.local_path}' does not exist on this machine.")

    project_name = data.name or source_path.name

    project_db = Project(
        name=project_name,
        description=f"Linked from {str(source_path)}",
        source="local",
        local_path=str(source_path),
        summary=f"Local filesystem repository at {str(source_path)}"
    )
    db.add(project_db)
    db.flush()

    target_dir = settings.REPOS_DIR / project_db.id
    try:
        LocalRepoService.link_or_copy_local_path(str(source_path), target_dir)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to copy local repository: {e}")

    analysis = RepoAnalyzer.scan_directory(target_dir)
    project_db.local_path = str(target_dir)
    project_db.file_count = analysis["file_count"]
    project_db.languages = analysis["languages"]
    project_db.tech_stack = analysis["tech_stack"]
    project_db.file_tree = analysis["file_tree"]
    project_db.readme_content = analysis["readme_content"]

    db.commit()
    db.refresh(project_db)

    # Generate flashcards
    try:
        flashcards_data = await InterviewService.generate_flashcards(
            project_db.name, project_db.tech_stack, project_db.file_tree
        )
        for fc in flashcards_data:
            db.add(Flashcard(
                project_id=project_db.id,
                category=fc.get("category", "architecture"),
                question=fc.get("question", ""),
                answer=fc.get("answer", ""),
                code_context=fc.get("code_context", "")
            ))
        db.commit()
    except Exception:
        pass

    return project_db

@router.post("/sample", response_model=ProjectDetailResponse)
async def create_sample_project(db: Session = Depends(get_db)):
    """Creates an instant interactive sample repository so users can test immediately with 1 click."""
    project_db = Project(
        name="FinTrack-Core",
        description="High-throughput FinTech Ledger & Payment Reconciliation Microservice with FastAPI, React & Postgres",
        source="sample",
        default_branch="main",
        summary="Sample production-ready FinTech ledger app with idempotency keys, JWT auth, and async event dispatching."
    )
    db.add(project_db)
    db.flush()

    project_dir = settings.REPOS_DIR / project_db.id
    project_dir.mkdir(parents=True, exist_ok=True)

    sample_files = {
        "README.md": "# FinTrack Core Engine\n\nHigh-throughput transactional ledger service designed for fintech platforms.\n\n## Tech Stack\n- FastAPI + Python 3.12\n- React + Vite + Tailwind PWA\n- PostgreSQL with SQLAlchemy 2.0 (asyncio)\n- Redis for distributed lock & idempotency keys\n\n## Architecture Highlights\n- Double-entry bookkeeping ledger guarantees zero discrepancy\n- Distributed lock ensures zero race condition on balance deductions\n- Strict Pydantic v2 schemas on all ingress/egress payload\n",
        "backend/main.py": 'from fastapi import FastAPI, Depends, HTTPException, Header\nfrom pydantic import BaseModel, Field\nfrom typing import Optional\n\napp = FastAPI(title="FinTrack Ledger API", version="2.4.0")\n\nclass TransactionRequest(BaseModel):\n    account_id: str\n    amount_cents: int = Field(gt=0)\n    currency: str = "USD"\n    reference_id: str\n\n@app.post("/v1/transactions/debit")\nasync def process_debit(req: TransactionRequest, idempotency_key: str = Header(...)):\n    """\n    Processes debit with distributed lock and strict double-entry ledger bookkeeping.\n    Guarantees idempotency via redis key cache.\n    """\n    if not idempotency_key:\n        raise HTTPException(status_code=400, detail="Missing Idempotency-Key")\n    return {"status": "SUCCESS", "tx_id": "tx_981249124", "amount": req.amount_cents}\n',
        "backend/services/ledger.py": 'from sqlalchemy.orm import Session\n\nclass LedgerService:\n    @staticmethod\n    def record_entry(session: Session, debit_acc: str, credit_acc: str, amount: int):\n        print(f"Transferring {amount} from {debit_acc} to {credit_acc}")\n        return True\n',
        "frontend/src/App.jsx": 'import React, { useState } from "react";\n\nexport default function App() {\n  const [balance, setBalance] = useState(14850.75);\n  return (\n    <div className="p-8 font-sans">\n      <h1 className="text-2xl font-bold">FinTrack Dashboard</h1>\n      <p className="text-gray-600">Real-time ledger reconciliation</p>\n      <div className="mt-4 p-4 border rounded bg-slate-50">\n        <span className="text-sm">Available Balance:</span>\n        <div className="text-3xl font-mono">${balance.toLocaleString()}</div>\n      </div>\n    </div>\n  );\n}\n',
        "docker-compose.yml": 'version: "3.8"\nservices:\n  backend:\n    build: ./backend\n    ports:\n      - "8000:8000"\n    environment:\n      - DATABASE_URL=postgresql://postgres:secret@db:5432/fintrack\n  db:\n    image: postgres:16-alpine\n    environment:\n      - POSTGRES_PASSWORD=secret\n      - POSTGRES_DB=fintrack\n'
    }

    for rel_path, content in sample_files.items():
        file_path = project_dir / rel_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")

    analysis = RepoAnalyzer.scan_directory(project_dir)
    project_db.local_path = str(project_dir)
    project_db.file_count = analysis["file_count"]
    project_db.languages = analysis["languages"]
    project_db.tech_stack = ["FastAPI", "React", "PostgreSQL", "Tailwind CSS", "Docker"]
    project_db.file_tree = analysis["file_tree"]
    project_db.readme_content = analysis["readme_content"]

    db.commit()
    db.refresh(project_db)

    # Add flashcards
    flashcards_data = await InterviewService.generate_flashcards(
        project_db.name, project_db.tech_stack, project_db.file_tree
    )
    for fc in flashcards_data:
        db.add(Flashcard(
            project_id=project_db.id,
            category=fc.get("category", "architecture"),
            question=fc.get("question", ""),
            answer=fc.get("answer", ""),
            code_context=fc.get("code_context", "")
        ))
    db.commit()

    return project_db

@router.get("/{project_id}/file", response_model=FileContentResponse)
def get_project_file(
    project_id: str,
    path: str = Query(..., description="Relative file path within project"),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.local_path:
        raise HTTPException(status_code=404, detail="Project not found")

    target_path = (Path(project.local_path) / path).resolve()
    base_path = Path(project.local_path).resolve()

    # Prevent path traversal
    if not str(target_path).startswith(str(base_path)):
        raise HTTPException(status_code=400, detail="Invalid path traversal attempt.")

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail=f"File '{path}' not found.")

    ext = target_path.suffix.lower()
    lang = LANGUAGE_MAP.get(ext, "Plain Text")

    try:
        content = target_path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read file: {e}")

    return FileContentResponse(
        path=path,
        name=target_path.name,
        extension=ext,
        content=content,
        size=target_path.stat().st_size,
        language=lang
    )

@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.local_path:
        storage_path = Path(project.local_path)
        if storage_path.exists() and str(settings.REPOS_DIR) in str(storage_path):
            try:
                shutil.rmtree(storage_path, ignore_errors=True)
            except Exception:
                pass

    db.delete(project)
    db.commit()
    return {"status": "success", "message": f"Project {project_id} deleted"}

@router.get("/github/user-repos")
async def get_github_user_repos(token: str = Query(..., description="GitHub Personal Access Token")):
    try:
        repos = await GitHubService.list_user_repos(token)
        return repos
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
