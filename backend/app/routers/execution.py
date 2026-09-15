from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import math

from app.database import get_db
from app.models import Challenge, User, UserProgress, Submission, Achievement, UserAchievement
from app.schemas import (
    CodeRunRequest, CodeRunResponse, TestCaseResult,
    CodeSubmitRequest, CodeSubmitResponse, AchievementResponse
)
from app.security import get_current_user
from app.sandbox.runner import execute_code_in_sandbox
from app.sandbox.evaluator import evaluate_challenge_test_cases, calculate_rewards_and_stars

router = APIRouter(prefix="/execution", tags=["Execution & Sandbox"])


@router.post("/run", response_model=CodeRunResponse)
async def run_code(req: CodeRunRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Challenge).where((Challenge.id == req.challenge_id) | (Challenge.level_number == req.challenge_id))
    )
    ch = res.scalars().first()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # If custom input is provided, run single test
    if req.custom_input is not None and req.custom_input != "":
        exec_res = await execute_code_in_sandbox(req.code, stdin_input=req.custom_input)
        test_res = TestCaseResult(
            test_case_index=1,
            description="Custom Input Run",
            passed=exec_res["success"],
            input=req.custom_input,
            expected_output="Custom run",
            actual_output=exec_res["stdout"],
            error=exec_res["stderr"] or exec_res.get("security_error"),
            execution_time_ms=exec_res["execution_time_ms"],
            hidden=False
        )
        return CodeRunResponse(
            success=exec_res["success"],
            stdout=exec_res["stdout"],
            stderr=exec_res["stderr"],
            test_results=[test_res],
            passed_all=exec_res["success"],
            execution_time_ms=exec_res["execution_time_ms"],
            security_error=exec_res.get("security_error")
        )

    # Otherwise, run against all visible test cases
    visible_tests = [t for t in ch.test_cases if not t.get("hidden", False)]
    if not visible_tests:
        visible_tests = ch.test_cases[:1]

    passed_all, test_results, total_time = await evaluate_challenge_test_cases(req.code, visible_tests)

    # Aggregate stdout / stderr from the first test run for terminal preview
    first_res = test_results[0] if test_results else {}
    return CodeRunResponse(
        success=passed_all,
        stdout=first_res.get("actual_output", ""),
        stderr=first_res.get("error") or "",
        test_results=[TestCaseResult(**tr) for tr in test_results],
        passed_all=passed_all,
        execution_time_ms=total_time,
        security_error=first_res.get("error") if "Security Violation" in str(first_res.get("error")) else None
    )


@router.post("/submit", response_model=CodeSubmitResponse)
async def submit_code(
    req: CodeSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Challenge).where((Challenge.id == req.challenge_id) | (Challenge.level_number == req.challenge_id))
    )
    ch = res.scalars().first()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Fetch previous progress
    prog_res = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.challenge_id == ch.id
        )
    )
    progress = prog_res.scalars().first()
    already_passed = progress.passed if progress else False
    attempts = (progress.attempts + 1) if progress else 1

    # Unlimited attempts enabled: no lives restriction for studying & practice

    # Run against all test cases (both visible and hidden)
    passed_all, test_results, total_time = await evaluate_challenge_test_cases(req.code, ch.test_cases)

    # Record submission history
    passed_tests_count = sum(1 for tr in test_results if tr.get("passed"))
    sub = Submission(
        user_id=current_user.id,
        challenge_id=ch.id,
        code=req.code,
        status="PASSED" if passed_all else "FAILED",
        tests_passed=passed_tests_count,
        total_tests=len(ch.test_cases),
        execution_time_ms=total_time
    )
    db.add(sub)

    new_achievements = []

    if passed_all:
        rewards = calculate_rewards_and_stars(
            passed_all=True,
            base_xp=ch.xp_reward,
            base_coins=ch.coin_reward,
            hints_used=req.hints_used,
            attempts=attempts,
            execution_time_ms=total_time,
            current_streak=current_user.streak
        )

        stars = rewards["stars"]
        # If user had already passed previously, give partial repeat rewards
        xp_earned = rewards["xp_earned"] if not already_passed else int(rewards["xp_earned"] * 0.25)
        coins_earned = rewards["coins_earned"] if not already_passed else int(rewards["coins_earned"] * 0.25)

        old_level = current_user.level
        current_user.xp += xp_earned
        current_user.coins += coins_earned
        # Level formula: level = floor(sqrt(xp / 100)) + 1
        new_level = int(math.floor(math.sqrt(current_user.xp / 100.0))) + 1
        level_up = new_level > old_level
        current_user.level = new_level

        # Update progress entry
        if not progress:
            progress = UserProgress(
                user_id=current_user.id,
                challenge_id=ch.id,
                passed=True,
                stars=stars,
                attempts=attempts,
                best_time_ms=total_time,
                code_submitted=req.code
            )
            db.add(progress)
        else:
            progress.passed = True
            progress.stars = max(progress.stars, stars)
            progress.attempts = attempts
            progress.best_time_ms = min(progress.best_time_ms or total_time, total_time)
            progress.code_submitted = req.code

        # Check Achievements
        # 1. FIRST_BLOOD
        if not already_passed:
            ach_res = await db.execute(select(Achievement).where(Achievement.code == "FIRST_BLOOD"))
            ach = ach_res.scalars().first()
            if ach:
                ua = await db.execute(select(UserAchievement).where(UserAchievement.user_id == current_user.id, UserAchievement.achievement_id == ach.id))
                if not ua.scalars().first():
                    db.add(UserAchievement(user_id=current_user.id, achievement_id=ach.id))
                    new_achievements.append(AchievementResponse.model_validate(ach))

            # 2. SPEED_DEMON
            if total_time < 100.0:
                ach_sp = await db.execute(select(Achievement).where(Achievement.code == "SPEED_DEMON"))
                ach_sp_obj = ach_sp.scalars().first()
                if ach_sp_obj:
                    ua2 = await db.execute(select(UserAchievement).where(UserAchievement.user_id == current_user.id, UserAchievement.achievement_id == ach_sp_obj.id))
                    if not ua2.scalars().first():
                        db.add(UserAchievement(user_id=current_user.id, achievement_id=ach_sp_obj.id))
                        new_achievements.append(AchievementResponse.model_validate(ach_sp_obj))

            # 3. BOSS_SLAYER
            if ch.is_boss:
                ach_boss = await db.execute(select(Achievement).where(Achievement.code == "BOSS_SLAYER"))
                ach_b_obj = ach_boss.scalars().first()
                if ach_b_obj:
                    ua3 = await db.execute(select(UserAchievement).where(UserAchievement.user_id == current_user.id, UserAchievement.achievement_id == ach_b_obj.id))
                    if not ua3.scalars().first():
                        db.add(UserAchievement(user_id=current_user.id, achievement_id=ach_b_obj.id))
                        new_achievements.append(AchievementResponse.model_validate(ach_b_obj))

            # 4. PYTHON_OVERLORD_SLAYER
            if ch.level_number == 50:
                ach_final = await db.execute(select(Achievement).where(Achievement.code == "PYTHON_OVERLORD_SLAYER"))
                ach_f_obj = ach_final.scalars().first()
                if ach_f_obj:
                    ua4 = await db.execute(select(UserAchievement).where(UserAchievement.user_id == current_user.id, UserAchievement.achievement_id == ach_f_obj.id))
                    if not ua4.scalars().first():
                        db.add(UserAchievement(user_id=current_user.id, achievement_id=ach_f_obj.id))
                        new_achievements.append(AchievementResponse.model_validate(ach_f_obj))

        await db.commit()

        # Find next challenge ID
        next_ch_res = await db.execute(select(Challenge).where(Challenge.level_number == ch.level_number + 1))
        next_ch = next_ch_res.scalars().first()

        return CodeSubmitResponse(
            success=True,
            passed_all=True,
            stars_earned=stars,
            xp_earned=xp_earned,
            coins_earned=coins_earned,
            combo_bonus=rewards["combo_bonus"],
            speed_bonus=rewards["speed_bonus"],
            lives_remaining=current_user.lives,
            level_up=level_up,
            new_level=current_user.level,
            test_results=[TestCaseResult(**tr) for tr in test_results],
            next_challenge_id=next_ch.id if next_ch else None,
            new_achievements=new_achievements,
            message="Level Cleared! Mainframe Security Overridden.",
            boss_defeated=bool(ch.is_boss)
        )

    else:
        # Failed execution - keep lives unlimited so students can keep practicing
        current_user.lives = max(current_user.lives, 5)
        if not progress:
            progress = UserProgress(
                user_id=current_user.id,
                challenge_id=ch.id,
                passed=False,
                stars=0,
                attempts=attempts,
                best_time_ms=total_time,
                code_submitted=req.code
            )
            db.add(progress)
        else:
            progress.attempts = attempts
            # Preserve user's working solution if they had already passed
            if not already_passed:
                progress.code_submitted = req.code

        await db.commit()

        return CodeSubmitResponse(
            success=False,
            passed_all=False,
            stars_earned=0,
            xp_earned=0,
            coins_earned=0,
            combo_bonus=0,
            speed_bonus=0,
            lives_remaining=max(current_user.lives, 5),
            level_up=False,
            new_level=current_user.level,
            test_results=[TestCaseResult(**tr) for tr in test_results],
            next_challenge_id=None,
            new_achievements=[],
            message="Some test cases failed. Keep refining your logic!",
            boss_defeated=False
        )
