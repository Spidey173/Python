import pytest
import asyncio
from app.sandbox.runner import execute_code_in_sandbox, inspect_code_safety
from app.sandbox.evaluator import evaluate_challenge_test_cases, calculate_rewards_and_stars
from app.ai.ast_explainer import ASTCodeAnalyzer


def test_ast_security_blocks_malicious_imports():
    malicious_code_1 = "import os\nos.system('ls')"
    error_1 = inspect_code_safety(malicious_code_1)
    assert error_1 is not None
    assert "Security Violation" in error_1
    assert "os" in error_1

    malicious_code_2 = "from subprocess import Popen"
    error_2 = inspect_code_safety(malicious_code_2)
    assert error_2 is not None
    assert "subprocess" in error_2

    malicious_code_3 = "f = open('/etc/passwd', 'r')"
    error_3 = inspect_code_safety(malicious_code_3)
    assert error_3 is not None
    assert "open" in error_3

    malicious_code_4 = "eval('2 + 2')"
    error_4 = inspect_code_safety(malicious_code_4)
    assert error_4 is not None
    assert "eval" in error_4


def test_ast_security_allows_safe_code():
    safe_code = """
energy = 100
for i in range(5):
    energy += i
print(energy)
"""
    error = inspect_code_safety(safe_code)
    assert error is None


@pytest.mark.asyncio
async def test_sandbox_executes_valid_code():
    code = "name = input()\nprint(f'Hello, {name}!')"
    res = await execute_code_in_sandbox(code, stdin_input="Runner")
    assert res["success"] is True
    assert res["stdout"].strip() == "Hello, Runner!"
    assert res["exit_code"] == 0


@pytest.mark.asyncio
async def test_sandbox_catches_infinite_loop_timeout():
    code = "while True:\n    pass"
    res = await execute_code_in_sandbox(code, timeout_seconds=1.0)
    assert res["success"] is False
    assert "Timed Out" in res["stderr"]


@pytest.mark.asyncio
async def test_evaluator_grades_test_cases():
    code = "a = int(input())\nb = int(input())\nprint(a + b)"
    test_cases = [
        {"input": "5\n10", "expected": "15", "description": "5+10"},
        {"input": "20\n30", "expected": "50", "description": "20+30"}
    ]
    passed_all, results, total_time = await evaluate_challenge_test_cases(code, test_cases)
    assert passed_all is True
    assert len(results) == 2
    assert results[0]["passed"] is True
    assert results[1]["passed"] is True


@pytest.mark.asyncio
async def test_evaluator_beginner_friendly_matching():
    # 1. Boolean matching: string 'true' / '"True"' matches boolean expected 'True'
    code_bool_str = "print('true')"
    test_case_bool = [{"input": "", "expected": "True"}]
    passed, res, _ = await evaluate_challenge_test_cases(code_bool_str, test_case_bool)
    assert passed is True

    # 2. Quotes tolerance: user printed '"hello"' when expected is 'hello'
    code_quotes = "print('\"hello\"')"
    test_case_str = [{"input": "", "expected": "hello"}]
    passed, res, _ = await evaluate_challenge_test_cases(code_quotes, test_case_str)
    assert passed is True

    # 4. Input prompt tolerance: user wrote input("Enter a string: ") with prompt text
    code_prompt = 's = input("Enter a string: ")\nprint(s == s[::-1])'
    test_case_prompt = [{"input": "racecar", "expected": "True"}]
    passed, res, _ = await evaluate_challenge_test_cases(code_prompt, test_case_prompt)
    assert passed is True


def test_rewards_and_stars_calculation():
    rewards = calculate_rewards_and_stars(
        passed_all=True,
        base_xp=100,
        base_coins=25,
        hints_used=0,
        attempts=1,
        execution_time_ms=50.0,
        current_streak=3
    )
    assert rewards["stars"] == 3
    assert rewards["speed_bonus"] == 25
    assert rewards["combo_bonus"] == 30
    assert rewards["perfect_score"] is True
    assert rewards["xp_earned"] > 100


def test_local_ast_explainer():
    analyzer = ASTCodeAnalyzer()
    code = """
def sum_even(n):
    total = 0
    for i in range(n):
        if i % 2 == 0:
            total += i
    return total
"""
    analysis = analyzer.analyze(code)
    assert len(analysis["line_by_line"]) > 0
    assert "Linear Time" in analysis["time_complexity"]
    assert "total" in analysis["dry_run_trace"][0]["variables"]
