from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.project import Project, Flashcard
from backend.app.schemas.project import (
    FlashcardResponse,
    FlashcardUpdate,
    InterviewEvalRequest,
    InterviewEvalResponse
)
from backend.app.services.interview_service import InterviewService

router = APIRouter(prefix="/api/interview", tags=["Interview Prep"])

@router.get("/{project_id}/flashcards", response_model=List[FlashcardResponse])
def get_project_flashcards(project_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Flashcard)
        .filter(Flashcard.project_id == project_id)
        .order_by(Flashcard.mastery.asc(), Flashcard.created_at.desc())
        .all()
    )

@router.put("/flashcards/{flashcard_id}", response_model=FlashcardResponse)
def update_flashcard_mastery(
    flashcard_id: str,
    update: FlashcardUpdate,
    db: Session = Depends(get_db)
):
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not fc:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    fc.mastery = update.mastery
    db.commit()
    db.refresh(fc)
    return fc

@router.post("/{project_id}/generate-cards", response_model=List[FlashcardResponse])
async def generate_more_flashcards(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    cards_data = await InterviewService.generate_flashcards(
        project.name, project.tech_stack or [], project.file_tree or []
    )
    created = []
    for c in cards_data:
        fc = Flashcard(
            project_id=project.id,
            category=c.get("category", "architecture"),
            question=c.get("question", ""),
            answer=c.get("answer", ""),
            code_context=c.get("code_context", "")
        )
        db.add(fc)
        created.append(fc)

    db.commit()
    for c in created:
        db.refresh(c)
    return created

@router.post("/evaluate", response_model=InterviewEvalResponse)
async def evaluate_interview_answer(
    req: InterviewEvalRequest,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    project_name = project.name if project else "Software Project"

    eval_result = await InterviewService.evaluate_answer(
        project_name=project_name,
        question=req.question,
        user_answer=req.answer,
        category=req.category or "system_design"
    )
    return InterviewEvalResponse(**eval_result)
