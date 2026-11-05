from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Project Schemas
class ProjectCreateGitHub(BaseModel):
    repo_url: str = Field(..., description="GitHub repository URL (e.g. https://github.com/fastapi/fastapi)")
    github_token: Optional[str] = Field(None, description="Optional GitHub Personal Access Token")
    branch: Optional[str] = Field(None, description="Branch to checkout (defaults to default branch)")

class ProjectCreateLocal(BaseModel):
    local_path: str = Field(..., description="Absolute path to local folder on machine")
    name: Optional[str] = Field(None, description="Custom name for the project")

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    source: str
    repo_url: Optional[str] = None
    local_path: Optional[str] = None
    default_branch: Optional[str] = "main"
    file_count: int = 0
    languages: Dict[str, Any] = Field(default_factory=dict)
    tech_stack: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    file_tree: List[Dict[str, Any]] = Field(default_factory=list)
    readme_content: Optional[str] = None

class FileContentResponse(BaseModel):
    path: str
    name: str
    extension: str
    content: str
    size: int
    language: str

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    project_id: str
    doc_type: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GenerateDocRequest(BaseModel):
    doc_type: str = Field("all", description="architecture, interview_cheatsheet, modules, mermaid_flows, tradeoffs, api_specs, or all")
    custom_instructions: Optional[str] = None

# Chat Schemas
class ChatSessionCreate(BaseModel):
    project_id: str
    title: Optional[str] = "Interview Prep Chat"
    mode: str = Field("interview_coach", description="interview_coach, code_explorer, quick_recall")

class ChatSessionResponse(BaseModel):
    id: str
    project_id: str
    title: str
    mode: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    content: str
    mode: Optional[str] = None  # interview_coach, code_explorer, quick_recall

class ChatCitation(BaseModel):
    file: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    snippet: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True

# Flashcard Schemas
class FlashcardResponse(BaseModel):
    id: str
    project_id: str
    category: str
    question: str
    answer: str
    code_context: Optional[str] = None
    mastery: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class FlashcardUpdate(BaseModel):
    mastery: int = Field(..., ge=0, le=2)

class InterviewEvalRequest(BaseModel):
    project_id: str
    question: str
    answer: str
    category: Optional[str] = "system_design"

class InterviewEvalResponse(BaseModel):
    score: int = Field(..., ge=1, le=10)
    verdict: str
    feedback: str
    strengths: List[str]
    improvements: List[str]
    model_answer: str

# System Settings Schemas
class SettingsConfig(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    default_provider: Optional[str] = "gemini"
    github_token: Optional[str] = None
