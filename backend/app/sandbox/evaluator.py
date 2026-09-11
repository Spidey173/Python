from typing import List, Dict, Any, Tuple
from app.sandbox.runner import execute_code_in_sandbox


def normalize_output(text: str) -> str:
    """Normalizes string output by trimming outer whitespace and standardizing newlines."""
    if not text:
        return ""
    lines = [line.rstrip() for line in text.strip().splitlines()]
    return "\n".join(lines)


def strip_quotes(s: str) -> str:
    """Removes single or double wrapping quotes if present."""
    s = s.strip()
    if (s.startswith("'") and s.endswith("'")) or (s.startswith('"') and s.endswith('"')):
        return s[1:-1].strip()
    return s


def is_beginner_friendly_match(actual: str, expected: str) -> bool:
    """
    Intelligent, beginner-friendly output comparator:
    1. Exact normalized match.
    2. Boolean equivalence ('true' == 'True' == True, 'false' == 'False' == False).
    3. Surrounding quotes tolerance ('"True"' or "'hello'" matches 'hello').
    4. Numeric and float equivalence ('4.0' == '4', '+5' == '5').
    5. List / Array spacing tolerance ('[1,2,3]' == '[1, 2, 3]' == '1 2 3').
    6. Case-insensitive match for single-word / status token responses.
    """
    act_norm = normalize_output(actual)
    exp_norm = normalize_output(expected)

    # 1. Exact match after basic trimming
    if act_norm == exp_norm:
        return True

    # 1b. Strip prompt prefixes like "Enter a string: ", "Enter number: ", etc. if present
    import re
    act_cleaned = re.sub(r'^(enter\s+[^:\n]+:\s*)+', '', act_norm, flags=re.IGNORECASE).strip()
    if act_cleaned == exp_norm:
        return True

    # 2. Quote-stripped comparison
    act_unquoted = strip_quotes(act_cleaned)
    exp_unquoted = strip_quotes(exp_norm)
    if act_unquoted == exp_unquoted:
        return True

    # 3. Boolean equivalence (e.g. True / False vs true / false vs "true" / "True")
    act_lower = act_unquoted.lower()
    exp_lower = exp_unquoted.lower()

    if exp_lower in ("true", "false"):
        return act_lower == exp_lower

    # 4. Numeric tolerance (int / float / negative / positive)
    try:
        if float(act_unquoted) == float(exp_unquoted):
            return True
    except (ValueError, TypeError):
        pass

    # 5. List / Tuple / Space-separated array tolerance (e.g. '[1, 2, 3]' vs '1 2 3' or '[1,2,3]')
    def clean_tokens(text: str) -> list:
        # Strip brackets, parentheses, and commas
        cleaned = text.replace("[", " ").replace("]", " ").replace("(", " ").replace(")", " ").replace(",", " ")
        return [strip_quotes(token).lower() for token in cleaned.split() if token.strip()]

    act_tokens = clean_tokens(act_norm)
    exp_tokens = clean_tokens(exp_norm)
    if act_tokens and act_tokens == exp_tokens:
        return True

    # 6. Single-line case-insensitive fallback (for words like "palindrome", "valid", "anagram", "-1")
    if "\n" not in exp_norm and "\n" not in act_norm:
        if act_lower == exp_lower:
            return True

    return False


async def evaluate_challenge_test_cases(
    code: str,
    test_cases: List[Dict[str, Any]],
    timeout_seconds: float = 3.0
) -> Tuple[bool, List[Dict[str, Any]], float]:
    """
    Runs user code against all test cases for a challenge.
    Returns: (passed_all, test_results, total_execution_time_ms)
    """
    results = []
    total_time_ms = 0.0
    all_passed = True

    for idx, tc in enumerate(test_cases, 1):
        input_data = str(tc.get("input", ""))
        expected_raw = str(tc.get("expected", ""))
        description = tc.get("description", f"Test Case #{idx}")
        hidden = bool(tc.get("hidden", False))

        exec_res = await execute_code_in_sandbox(
            code=code,
            stdin_input=input_data,
            timeout_seconds=timeout_seconds
        )

        actual_raw = exec_res.get("stdout", "")
        error = exec_res.get("stderr") or exec_res.get("security_error")
        time_ms = exec_res.get("execution_time_ms", 0.0)
        total_time_ms += time_ms

        passed = (
            exec_res["success"]
            and not error
            and is_beginner_friendly_match(actual_raw, expected_raw)
        )

        if not passed:
            all_passed = False

        results.append({
            "test_case_index": idx,
            "description": description,
            "passed": passed,
            "input": input_data,
            "expected_output": expected_raw,
            "actual_output": actual_raw,
            "error": error if not passed else None,
            "execution_time_ms": time_ms,
            "hidden": hidden
        })

    return all_passed, results, round(total_time_ms, 2)


def calculate_rewards_and_stars(
    passed_all: bool,
    base_xp: int,
    base_coins: int,
    hints_used: int,
    attempts: int,
    execution_time_ms: float,
    current_streak: int
) -> Dict[str, Any]:
    """Calculates stars (1-3), combo bonus, speed bonus, XP and Coins earned."""
    if not passed_all:
        return {
            "stars": 0,
            "xp_earned": 0,
            "coins_earned": 0,
            "combo_bonus": 0,
            "speed_bonus": 0,
            "perfect_score": False
        }

    # Base stars: 3 max
    stars = 3
    if hints_used >= 2:
        stars -= 1
    if attempts >= 3:
        stars -= 1
    stars = max(1, stars)

    # Speed Bonus: if execution under 250ms
    speed_bonus = 25 if execution_time_ms < 250 else 0

    # Combo Bonus: based on streak
    combo_bonus = min(50, current_streak * 10)

    # Perfect score: 3 stars + 1st attempt + no hints
    perfect_score = (stars == 3 and attempts == 1 and hints_used == 0)
    perfect_multiplier = 1.25 if perfect_score else 1.0

    total_xp = int((base_xp + speed_bonus + combo_bonus) * perfect_multiplier)
    total_coins = int((base_coins + (15 if perfect_score else 0)))

    return {
        "stars": stars,
        "xp_earned": total_xp,
        "coins_earned": total_coins,
        "combo_bonus": combo_bonus,
        "speed_bonus": speed_bonus,
        "perfect_score": perfect_score
    }
