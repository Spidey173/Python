from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Challenge, UserProgress, User
from app.schemas import ChapterGroup, ChallengeSummary, ChallengeDetail, TestCaseSchema
from app.security import get_current_user_optional

router = APIRouter(prefix="/challenges", tags=["Challenges"])


@router.get("/chapters", response_model=List[ChapterGroup])
async def list_chapters(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    # Fetch all challenges sorted by level_number
    res = await db.execute(select(Challenge).order_by(Challenge.level_number.asc()))
    challenges = res.scalars().all()

    # Fetch user progress if user logged in
    user_progress_map = {}
    if current_user:
        prog_res = await db.execute(
            select(UserProgress).where(UserProgress.user_id == current_user.id)
        )
        for p in prog_res.scalars().all():
            user_progress_map[p.challenge_id] = p

    # Group by chapter
    chapters_dict = {}
    prev_passed = True  # Level 1 unlocked by default

    for ch in challenges:
        cid = ch.chapter_id
        if cid not in chapters_dict:
            chapters_dict[cid] = {
                "chapter_id": cid,
                "chapter_title": ch.chapter_title,
                "levels": [],
                "total_xp": 0,
                "completed_count": 0
            }

        prog = user_progress_map.get(ch.id) or user_progress_map.get(ch.level_number)
        passed = bool(prog.passed) if prog else False
        stars = prog.stars if prog else 0

        # Level 1 always unlocked. Subsequent levels unlocked if previous level passed or user is admin
        is_unlocked = (ch.level_number == 1) or prev_passed or (current_user and current_user.role == "admin")

        summary = ChallengeSummary(
            id=ch.id,
            chapter_id=ch.chapter_id,
            chapter_title=ch.chapter_title,
            level_number=ch.level_number,
            title=ch.title,
            xp_reward=ch.xp_reward,
            coin_reward=ch.coin_reward,
            is_boss=ch.is_boss,
            boss_name=ch.boss_name,
            difficulty=ch.difficulty,
            passed=passed,
            stars=stars,
            locked=not is_unlocked
        )

        chapters_dict[cid]["levels"].append(summary)
        chapters_dict[cid]["total_xp"] += ch.xp_reward
        if passed:
            chapters_dict[cid]["completed_count"] += 1

        prev_passed = passed

    response = []
    for cid in sorted(chapters_dict.keys()):
        cdata = chapters_dict[cid]
        total_lvl = len(cdata["levels"])
        comp_pct = round((cdata["completed_count"] / total_lvl * 100), 1) if total_lvl > 0 else 0.0
        response.append(
            ChapterGroup(
                chapter_id=cdata["chapter_id"],
                chapter_title=cdata["chapter_title"],
                levels=cdata["levels"],
                completion_percentage=comp_pct,
                total_xp=cdata["total_xp"]
            )
        )

    return response


@router.get("/{level_id}", response_model=ChallengeDetail)
async def get_challenge_detail(
    level_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    # Can query by level_number or id
    res = await db.execute(
        select(Challenge).where((Challenge.id == level_id) | (Challenge.level_number == level_id))
    )
    ch = res.scalars().first()
    if not ch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge with ID/Level {level_id} not found."
        )

    passed = False
    stars = 0
    saved_code = None

    if current_user:
        prog_res = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id,
                (UserProgress.challenge_id == ch.id) | (UserProgress.challenge_id == ch.level_number)
            )
        )
        prog = prog_res.scalars().first()
        if prog:
            passed = prog.passed
            stars = prog.stars
            saved_code = prog.code_submitted

    # Filter visible test cases for student
    visible_tests = [
        TestCaseSchema(
            input=t.get("input", ""),
            expected=t.get("expected", ""),
            hidden=False,
            description=t.get("description", "Public test case")
        )
        for t in ch.test_cases if not t.get("hidden", False)
    ]

    return ChallengeDetail(
        id=ch.id,
        chapter_id=ch.chapter_id,
        chapter_title=ch.chapter_title,
        level_number=ch.level_number,
        title=ch.title,
        story=ch.story,
        objective=ch.objective,
        starter_code=ch.starter_code,
        expected_output=ch.expected_output,
        hints=ch.hints,
        visible_test_cases=visible_tests,
        total_test_cases=len(ch.test_cases),
        explanation=ch.explanation if passed else None,
        xp_reward=ch.xp_reward,
        coin_reward=ch.coin_reward,
        is_boss=ch.is_boss,
        boss_name=ch.boss_name,
        boss_hp=ch.boss_hp,
        difficulty=ch.difficulty,
        passed=passed,
        stars=stars,
        saved_code=saved_code
    )
