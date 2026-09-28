from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.database import get_db
from app.models import Challenge, User, UserProgress, Submission
from app.schemas import (
    CodeRunRequest, CodeRunResponse, TestCaseResult,
    CodeSubmitRequest, CodeSubmitResponse
)
from app.security import get_current_user
from app.sandbox.runner import execute_code_in_sandbox
from app.sandbox.evaluator import evaluate_challenge_test_cases

router = APIRouter(prefix="/execution", tags=["Execution & Sandbox"])


@router.post("/run", response_model=CodeRunResponse)
async def run_code(
    req: CodeRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
            (UserProgress.challenge_id == ch.id) | (UserProgress.challenge_id == ch.level_number)
        )
    )
    progress = prog_res.scalars().first()
    already_passed = progress.passed if progress else False
    attempts = (progress.attempts + 1) if progress else 1

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

    if passed_all:
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        if not progress:
            progress = UserProgress(
                user_id=current_user.id,
                challenge_id=ch.id,
                passed=True,
                attempts=attempts,
                best_time_ms=total_time,
                code_submitted=req.code,
                completed_at=now_utc
            )
            db.add(progress)
        else:
            progress.passed = True
            progress.attempts = attempts
            progress.best_time_ms = min(progress.best_time_ms or total_time, total_time) if progress.best_time_ms else total_time
            progress.code_submitted = req.code
            progress.completed_at = now_utc

        # Update user streak and activity date
        if current_user.last_active_date:
            last_date = current_user.last_active_date.date()
            today_date = now_utc.date()
            diff = (today_date - last_date).days
            if diff == 1:
                current_user.streak = (current_user.streak or 0) + 1
            elif diff > 1:
                current_user.streak = 1
            elif diff == 0:
                current_user.streak = max(current_user.streak or 0, 1)
        else:
            current_user.streak = 1
        current_user.last_active_date = now_utc

        await db.commit()

        # Find next challenge ID
        next_ch_res = await db.execute(select(Challenge).where(Challenge.level_number == ch.level_number + 1))
        next_ch = next_ch_res.scalars().first()

        return CodeSubmitResponse(
            success=True,
            passed_all=True,
            execution_time_ms=total_time,
            test_results=[TestCaseResult(**tr) for tr in test_results],
            next_challenge_id=next_ch.id if next_ch else None,
            message="Challenge Passed! All test cases evaluated successfully."
        )

    else:
        if not progress:
            progress = UserProgress(
                user_id=current_user.id,
                challenge_id=ch.id,
                passed=False,
                attempts=attempts,
                best_time_ms=total_time,
                code_submitted=req.code
            )
            db.add(progress)
        else:
            progress.attempts = attempts
            if not already_passed:
                progress.code_submitted = req.code

        await db.commit()

        return CodeSubmitResponse(
            success=False,
            passed_all=False,
            execution_time_ms=total_time,
            test_results=[TestCaseResult(**tr) for tr in test_results],
            next_challenge_id=None,
            message="Some test cases failed. Keep refining your logic!"
        )
