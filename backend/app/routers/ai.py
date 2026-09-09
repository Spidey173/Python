from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Challenge
from app.schemas import ExplainRequest, ExplainResponse, AITutorChatRequest, AITutorChatResponse
from app.ai.copilot_client import get_ai_explanation, chat_with_ai_tutor

router = APIRouter(prefix="/ai", tags=["AI Copilot & Tutor"])


@router.post("/explain", response_model=ExplainResponse)
async def explain_code(req: ExplainRequest, db: AsyncSession = Depends(get_db)):
    ch_title = ""
    if req.challenge_id:
        res = await db.execute(
            select(Challenge).where((Challenge.id == req.challenge_id) | (Challenge.level_number == req.challenge_id))
        )
        ch = res.scalars().first()
        if ch:
            ch_title = f"Level {ch.level_number}: {ch.title}"

    analysis = await get_ai_explanation(
        code=req.code,
        challenge_title=ch_title,
        user_question=req.user_question
    )

    return ExplainResponse(
        line_by_line=analysis.get("line_by_line", []),
        beginner_summary=analysis.get("beginner_summary", "Python code breakdown"),
        time_complexity=analysis.get("time_complexity", "O(1)"),
        space_complexity=analysis.get("space_complexity", "O(1)"),
        common_mistakes=analysis.get("common_mistakes", []),
        better_approach=analysis.get("better_approach", "Write clear, readable Python with standard idioms."),
        optimized_code=analysis.get("optimized_code", req.code),
        dry_run_trace=analysis.get("dry_run_trace", [])
    )


@router.post("/tutor", response_model=AITutorChatResponse)
async def tutor_chat(req: AITutorChatRequest, db: AsyncSession = Depends(get_db)):
    ch_info = None
    if req.challenge_id:
        res = await db.execute(
            select(Challenge).where((Challenge.id == req.challenge_id) | (Challenge.level_number == req.challenge_id))
        )
        ch = res.scalars().first()
        if ch:
            ch_info = f"{ch.title} - Objective: {ch.objective}"

    reply = await chat_with_ai_tutor(
        message=req.message,
        code=req.code,
        challenge_info=ch_info,
        chat_history=req.chat_history
    )

    return AITutorChatResponse(
        reply=reply,
        socratic_hint="Think about what each variable holds right before the loop ends."
    )
