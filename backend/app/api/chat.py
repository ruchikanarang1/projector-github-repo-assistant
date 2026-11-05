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
You are a Staff Software Engineer and Technical Interviewer conducting a technical deep-dive into the candidate's repository.
Your role:
- When the user asks about the repo or wants you to interview them, ask challenging yet constructive questions about their design choices, tradeoffs, scalability bottlenecks, and implementation details.
- Provide clear, direct answers with specific references to their code files and lines.
- Always explain "The Why" behind architecture patterns (e.g. why async I/O was used, how data consistency is preserved).
- Prepare the user to sound articulate, confident, and senior in real interviews.
"""

CODE_EXPLORER_SYSTEM_PROMPT = """
You are an expert Codebase Assistant and Pair Programmer.
Your goal is to answer the developer's questions about this specific repository accurately.
- Use the provided Codebase Context (file contents and line numbers).
- Cite exact file paths and line numbers whenever possible.
- Explain algorithms, state flow, and component relationships clearly.
"""

QUICK_RECALL_SYSTEM_PROMPT = """
You are a rapid-fire interview coach. The candidate is in a waiting room or walking to an interview right now!
Keep answers ultra-concise, punchy, and memorable (bullet points, under 150 words).
Focus on: High-level pitch, key tech stack, hardest technical challenge, and direct answer.
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

    reply_text = await LLMService.generate_response(full_prompt, system_instruction=sys_prompt)

    # Save Assistant Message
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=reply_text,
        citations=citations
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
