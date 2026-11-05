import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(50), nullable=False, default="github")  # github, local, zip, sample
    repo_url = Column(String(512), nullable=True)
    local_path = Column(String(1024), nullable=True)
    default_branch = Column(String(100), default="main")
    file_count = Column(Integer, default=0)
    languages = Column(JSON, default=dict)
    tech_stack = Column(JSON, default=list)
    summary = Column(Text, nullable=True)
    file_tree = Column(JSON, default=list)
    readme_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="project", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="project", cascade="all, delete-orphan")

class ProjectDocument(Base):
    __tablename__ = "project_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String(50), nullable=False)  # architecture, interview_cheatsheet, modules, mermaid_flows, tradeoffs, api_specs
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    project = relationship("Project", back_populates="documents")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="Interview Session")
    mode = Column(String(50), default="interview_coach")  # interview_coach, code_explorer, quick_recall
    created_at = Column(DateTime, default=get_utc_now)

    project = relationship("Project", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list)  # list of {file, line_start, line_end, snippet}
    model_used = Column(String(100), nullable=True)  # e.g. gemini-2.5-flash, gpt-4o, heuristic
    created_at = Column(DateTime, default=get_utc_now)

    session = relationship("ChatSession", back_populates="messages")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), default="architecture")  # architecture, tradeoff, system_design, debugging, star_story
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    code_context = Column(Text, nullable=True)
    mastery = Column(Integer, default=0)  # 0: Unseen, 1: Reviewing, 2: Mastered
    created_at = Column(DateTime, default=get_utc_now)

    project = relationship("Project", back_populates="flashcards")

