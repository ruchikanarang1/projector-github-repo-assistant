import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.project import Project, ChatSession, ChatMessage
from backend.app.schemas.project import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse
)
from backend.app.services.rag_service import RAGService
from backend.app.services.llm_service import LLMService

router = APIRouter(prefix="/api/chat", tags=["Chat"])

INTERVIEW_COACH_SYSTEM_PROMPT = """
You are a Principal Software Architect and Elite Technical Interviewer.
Your responses MUST be beautifully formatted for maximum editorial readability:
1. Start with a 1-sentence bold takeaway in a blockquote (> **Key Takeaway**: ...).
2. Use clear markdown headers (## The Architectural Choice, ## Tradeoffs & Edge Cases, ## Code Evidence).
3. Always separate paragraphs with blank lines. Never produce single giant walls of text.
4. When presenting lists, use bullet points with bold title prefixes (- **Title**: details...).
5. Cite exact file paths like `[backend/main.py:12]` whenever referring to code.
"""

CODE_EXPLORER_SYSTEM_PROMPT = """
You are an expert Principal Engineer explaining a codebase.
Structure your answers with high editorial clarity:
1. Executive Summary in 1-2 sentences.
2. Structured breakdown with clear H2/H3 headings.
3. Bullet points with generous spacing for readability.
4. Reference exact files and line numbers (e.g. `[src/main.py]`).
"""

QUICK_RECALL_SYSTEM_PROMPT = """
You are a rapid-fire interview coach for a candidate waiting in a lobby.
Keep answers ultra-concise, formatted as 3 distinct bullet points:
- **Core 60s Pitch**: ...
- **Key Tradeoff**: ...
- **Senior Answer to Expect**: ...
"""

@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(data: ChatSessionCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    session = ChatSession(
        project_id=data.project_id,
        title=data.title or f"{project.name} Chat",
        mode=data.mode or "interview_coach"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{project_id}", response_model=List[ChatSessionResponse])
def list_project_sessions(project_id: str, db: Session = Depends(get_db)):
    return (
        db.query(ChatSession)
        .filter(ChatSession.project_id == project_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    session_id: str,
    data: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    project = session.project
    mode = data.mode or session.mode

    # Record User Message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=data.content
    )
    db.add(user_msg)
    db.commit()

    # Search Codebase via RAG
    code_context = ""
    citations = []
    if project.local_path:
        repo_dir = Path(project.local_path)
        if repo_dir.exists():
            code_context, citations = RAGService.search_codebase(repo_dir, data.content, top_k=6)

    # Choose prompt template
    if mode == "interview_coach":
        sys_prompt = INTERVIEW_COACH_SYSTEM_PROMPT
    elif mode == "quick_recall":
        sys_prompt = QUICK_RECALL_SYSTEM_PROMPT
    else:
        sys_prompt = CODE_EXPLORER_SYSTEM_PROMPT

    full_prompt = f"""
Project Name: {project.name}
Tech Stack: {', '.join(project.tech_stack if project.tech_stack else [])}
Overview: {project.summary or project.description or 'N/A'}

RELEVANT CODE SNIPPETS FROM REPO:
{code_context if code_context else 'No specific code snippets matched.'}

USER QUESTION / INTERVIEW PROMPT:
{data.content}

Instructions:
Answer thoroughly. When referring to files, quote the file path (e.g. `[src/main.py]`). Be authoritative and provide concrete engineering explanations.
"""

    reply_text, model_name = await LLMService.generate_response_with_meta(
        full_prompt, system_instruction=sys_prompt, model=data.model
    )

    # Save Assistant Message
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=reply_text,
        citations=citations,
        model_used=model_name
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
