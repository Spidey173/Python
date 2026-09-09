import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """You are an expert Python Technical Interview Coach and Senior DSA Mentor.
Your mission: Help MCA students, freshers, and job seekers master Python coding fundamentals and crack technical interviews for software engineering roles.
Rules:
1. Guide candidates socratically towards optimal time and space complexity without immediately dumping the full solution.
2. Focus on core Data Structures & Algorithms patterns: Two Pointers, Hash Maps, Sliding Window, Monotonic Stacks, Binary Search, Trees, Graphs, and DP.
3. Emphasize interview traps, edge cases (empty inputs, duplicates, boundaries), and production-grade Python 3 idioms.
4. Keep explanations concise, professional, structured, and interview-ready.
"""

SYSTEM_EXPLAIN_PROMPT = """You are the Python Quest Senior Code Explainer AI.
Given the student's Python code and challenge context, return a structured JSON with:
- line_by_line: list of objects with line (int), code (str), explanation (str)
- beginner_summary: friendly 2-sentence explanation of what the code does
- time_complexity: Big O notation with brief reasoning
- space_complexity: Big O notation with brief reasoning
- common_mistakes: list of 2-3 common traps or beginner pitfalls
- better_approach: 2-3 sentences on idiomatic Python best practices
- optimized_code: cleaned up, idiomatic Python version
- dry_run_trace: list of 3-5 steps showing variable changes
"""


async def get_ai_explanation(
    code: str,
    challenge_title: str = "",
    user_question: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetches explanation from Copilot/OpenAI if API key available,
    otherwise falls back to local AST analyzer.
    """
    if not settings.COPILOT_API_KEY:
        return ast_analyzer.analyze(code, user_question)

    try:
        prompt = f"Challenge: {challenge_title}\nUser Question: {user_question or 'Explain this code'}\nCode:\n```python\n{code}\n```"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{settings.COPILOT_API_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.COPILOT_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.COPILOT_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_EXPLAIN_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
            )
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
    except Exception:
        # Fallback to local AST analyzer on network or API failure
        pass

    return ast_analyzer.analyze(code, user_question)


async def chat_with_ai_tutor(
    message: str,
    code: Optional[str] = None,
    challenge_info: Optional[str] = None,
    chat_history: Optional[list] = None
) -> str:
    """
    Converses with Byte, the Cyber Snake AI tutor.
    """
    if settings.COPILOT_API_KEY:
        try:
            messages = [{"role": "system", "content": SYSTEM_TUTOR_PROMPT}]
            if challenge_info:
                messages.append({"role": "system", "content": f"Active Challenge context: {challenge_info}"})
            if code:
                messages.append({"role": "system", "content": f"Student's current code:\n```python\n{code}\n```"})

            if chat_history:
                for h in chat_history[-6:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

            messages.append({"role": "user", "content": message})

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{settings.COPILOT_API_BASE}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.COPILOT_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.COPILOT_MODEL,
                        "messages": messages,
                        "temperature": 0.5,
                        "max_tokens": 400
                    }
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
        except Exception:
            pass

    # Socratic mentor response generator
    msg_lower = message.lower()
    if "clue" in msg_lower or "hint" in msg_lower or "help" in msg_lower:
        if challenge_info:
            return f"Interview Guidance: For '{challenge_info}', focus on the optimal data structure and time complexity. Break the algorithm into input parsing, data transformation, and edge-case handling. Use 'Run' to test your code!"
        return "Interview Guidance: 1) Identify the optimal data structure (hash map, two pointers, stack, etc.), 2) Apply the transformation in O(n) or O(log n), 3) Verify boundary conditions and edge cases. Click 'Run' to see output!"
    elif "complexity" in msg_lower or "big o" in msg_lower or "time" in msg_lower or "space" in msg_lower:
        return "In technical interviews, aim for optimal time and space complexity: O(n) or O(log n) for searching/arrays, O(1) or O(n) auxiliary space. Consider whether a hash map, two pointers, or a monotonic structure can avoid O(n^2) nested loops."
    elif "wrong" in msg_lower or "error" in msg_lower or "bug" in msg_lower or "fail" in msg_lower:
        if code and "print" not in code:
            return "Notice that standard output validation requires printing the final result using `print(...)`. Check if your code has a print statement matching the required output format!"
        return "Look closely at the test case inputs and expected outputs in the Terminal / Test Cases tab. Click 'Run' to inspect your output against the expected output and trace boundary values!"
    elif "edge case" in msg_lower or "trap" in msg_lower or "pitfall" in msg_lower:
        return "Standard interview edge cases to test: 1) Empty or single-element inputs, 2) All identical elements, 3) Negative numbers or zeroes, 4) Off-by-one indices, 5) Case sensitivity or whitespace. Does your solution handle these cleanly?"
    else:
        return "In software engineering interviews, clean logic, optimal Big-O complexity, and handling edge cases are paramount. Test your solution using 'Run' (Ctrl+Enter) or ask for a concept clue if you need guidance!"
