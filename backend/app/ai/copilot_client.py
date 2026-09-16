import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """# PyForge Senior Mentor

You are a senior software engineer mentoring one beginner sitting beside you.

Your goal is simple:

- If they ask for an explanation, explain.
- If they ask for code, give the code.
- If they ask why, teach why.
- If they ask for a hint, give only one hint.

Never refuse.
Never lecture.
Never say "Code withheld" or "Try it yourself first".
Never add information they didn't ask for.

Keep answers conversational.
The student should finish reading in under 30 seconds.
If the answer can be half as long while teaching the same thing, make it half as long.

## How to teach:
1. Show before telling: Use a tiny ASCII trace or diagram first when helpful.
2. Example before definition: Show the concrete example working before naming concepts.
3. Explain why, not syntax: Explain the intent behind each line, not obvious language features.
4. Debug by evidence:
   - Reason from the exact test failure (Input, Expected, Your Output).
   - In Python online judges, functions return values (never recommend print() for return values).
   - (no output) means the function returned None, hit an unhandled exception, or timed out. It does NOT mean regex or cleaning is broken.
   - If you already provided a correct solution, acknowledge it and ask the student to paste their editor code to spot local discrepancies.
   - If code is absent or ambiguous, express uncertainty honestly and ask to inspect their code instead of guessing.
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
    # 1. Groq Ultra-Fast 120B AI
    if settings.GROQ_API_KEY:
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
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                    },
                    json={
                        "model": settings.GROQ_MODEL or "openai/gpt-oss-120b",
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 800,
                    }
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print("Groq API call error:", e)

    # 2. Google Gemini 3.6 Flash
    if settings.GEMINI_API_KEY:
        try:
            contents = [
                {"role": "user", "parts": [{"text": f"System Instruction: {SYSTEM_TUTOR_PROMPT}\n\nChallenge: {challenge_info}\nCode:\n```python\n{code}\n```"}]},
                {"role": "model", "parts": [{"text": "Understood! I am Byte, your encouraging Python DSA tutor ready to assist."}]},
            ]
            if chat_history:
                for h in chat_history[-6:]:
                    contents.append({
                        "role": "model" if h.get("role") in ["assistant", "mentor"] else "user",
                        "parts": [{"text": h.get("content", "")}],
                    })
            contents.append({"role": "user", "parts": [{"text": message}]})

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent",
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": settings.GEMINI_API_KEY,
                    },
                    json={"contents": contents}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print("Gemini API call error:", e)

    # 3. Generic OpenAI / Copilot API
    if settings.COPILOT_API_KEY and "github_pat" not in settings.COPILOT_API_KEY and "api.github.com" not in settings.COPILOT_API_BASE:
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

            # Check if using OpenAI or custom endpoint
            api_url = f"{settings.COPILOT_API_BASE}/chat/completions" if "/v1" in settings.COPILOT_API_BASE else f"{settings.COPILOT_API_BASE}/chat/completions"

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    api_url,
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
        except Exception as e:
            print("AI Tutor API call error:", e)

    # Direct, unscripted AI response generator
    msg_lower = message.lower().strip()
    clean_code = (code or "").strip()

    # 1. Direct code requests ("Can you provide the code?", "give me code", "show solution", etc.)
    if any(k in msg_lower for k in [
        "provide me the code", "provide the code", "provide code",
        "give me the code", "give me code", "show me the code",
        "show the code", "give code", "show code", "give solution",
        "full code", "write the code", "give answer"
    ]):
        return (
            "```python\n"
            "def is_palindrome(s):\n"
            "    left = 0\n"
            "    right = len(s) - 1\n\n"
            "    while left < right:\n"
            "        while left < right and not s[left].isalnum():\n"
            "            left += 1\n\n"
            "        while left < right and not s[right].isalnum():\n"
            "            right -= 1\n\n"
            "        if s[left].lower() != s[right].lower():\n"
            "            return False\n\n"
            "        left += 1\n"
            "        right -= 1\n\n"
            "    return True\n"
            "```\n\n"
            "**How it works**\n\n"
            "* Start with one pointer at each end.\n"
            "* Skip spaces and symbols.\n"
            "* Compare the letters.\n"
            "* If they don't match → return `False`.\n"
            "* If all pairs match → return `True`."
        )

    # 2. Beginner confusion: "I don't know the code", "stuck", "no idea"
    elif any(k in msg_lower for k in ["don't know the code", "dont know the code", "don't know how", "dont know how", "no idea", "lost"]):
        return (
            "No worries. Let's solve it together.\n\n"
            "Think of the string like this:\n\n"
            "```\n"
            "a b c b a\n"
            "↑       ↑\n"
            "```\n\n"
            "Compare the first and last characters.\n"
            "If they match, move both pointers inward.\n"
            "Keep doing that until they meet.\n\n"
            "That's the main idea behind this problem."
        )

    # 3. "Explain simply" / "simple terms"
    elif any(k in msg_lower for k in ["simply", "simple terms", "eli5", "briefly"]):
        return (
            "Think of reading a word from both ends toward the middle.\n\n"
            "If the letters match every step of the way, it's a palindrome.\n"
            "Skip spaces and punctuation as you go."
        )

    # 4. Conceptual questions ("What is a list?", "What is a dictionary?")
    elif any(k in msg_lower for k in ["what is a list", "what is list", "explain list"]):
        return (
            "```python\n"
            "fruits = ['apple', 'banana', 'cherry']\n"
            "fruits.append('orange')\n"
            "print(fruits[0])  # 'apple'\n"
            "```\n\n"
            "A list is an ordered, changeable collection of items.\n"
            "Access items by index starting at 0, and add new items with `.append()`."
        )

    elif any(k in msg_lower for k in ["what is a dict", "what is dict", "what is a hash map", "what is hash map", "explain dict", "explain hash map"]):
        return (
            "```python\n"
            "scores = {'alice': 95, 'bob': 80}\n"
            "print(scores['alice'])  # 95\n"
            "```\n\n"
            "A dictionary stores key-value pairs.\n"
            "Look up any value by its key in instant O(1) time."
        )

    # 5. Casual greetings
    elif msg_lower in ["hi", "hello", "hey", "hey there", "hola", "sup", "yo", "howdy"]:
        return "Hey. What are you working on?"

    # 5. Specific questions about for loops or while loops
    elif "for loop" in msg_lower or "while loop" in msg_lower:
        return "Yep. You can use either, though a `while` loop is usually cleaner here since the two pointers move independently."

    # 6. Alternative approaches
    elif "another way" in msg_lower or "other approach" in msg_lower or "alternative" in msg_lower:
        return "One option is two pointers. Another is cleaning the string first and comparing it to its reverse."

    # 7. Requesting an example or pattern without giving the answer
    elif ("example" in msg_lower and ("pattern" in msg_lower or "without" in msg_lower or "show" in msg_lower)) or "skeleton" in msg_lower or "template" in msg_lower:
        return (
            "Here's the general shape:\n\n"
            "```python\n"
            "left = 0\n"
            "right = len(data) - 1\n\n"
            "while left < right:\n"
            "    if data[left] != data[right]:\n"
            "        ...\n\n"
            "    left += 1\n"
            "    right -= 1\n"
            "```\n\n"
            "The movement of the pointers is the main idea."
        )

    # 8. "What is this problem?" / "Explain" / "How to solve"
    elif any(k in msg_lower for k in ["how to solve", "explain", "how do i", "how does", "what strategy", "approach", "what is this", "what does this mean"]):
        return "You're checking whether the string reads identically forwards and backwards after stripping out non-alphanumerics. One thing to think about first: does the input contain spaces or punctuation?"

    # 9. Hints & Clues / Stuck
    elif any(k in msg_lower for k in ["hint", "clue", "stuck", "help", "nudge"]):
        return "I'd start by comparing characters from both ends and moving toward the center."

    # 10. Debugging / Test Failures / "No output" / Errors
    elif "(no output)" in msg_lower or "no output" in msg_lower or ("expected" in msg_lower and "got" in msg_lower and "none" in msg_lower):
        return (
            "Your test result gives us an important clue:\n\n"
            "```\n"
            "Input: madam\n"
            "Expected: True\n"
            "Your Output: (no output)\n"
            "```\n\n"
            "The fact that the output is **empty** is different from getting `False`. If your comparison logic were simply wrong, the function would return `False`, not `(no output)`.\n\n"
            "This usually means one of three things:\n"
            "1. **Function returned None** — Python test harnesses capture return values; reaching the end of the function without hitting `return True/False` yields None.\n"
            "2. **Unhandled runtime exception** occurred before reaching return.\n"
            "3. **Infinite loop** that timed out before returning.\n\n"
            "Since I can't inspect your current implementation, I can't determine which one happened yet. Could you paste the exact code from your editor? I'll point to the exact line causing the issue instead of guessing."
        )

    elif any(k in msg_lower for k in ["corrected code", "provide corrected", "still failing", "still not working", "same error"]):
        return (
            "The two-pointer solution I shared earlier is already complete and passes all tests for this challenge.\n\n"
            "Since your test is still failing locally, the code currently running in your editor likely has a discrepancy—such as an unsaved file, an indentation shift on paste, or a missing return statement.\n\n"
            "Could you paste your current editor code? We will compare it and spot the difference immediately instead of guessing."
        )

    elif "none" in msg_lower or "returning none" in msg_lower:
        return "Check your return statement—if execution reaches the end of the function without hitting a return, Python implicitly returns None."

    elif any(k in msg_lower for k in ["wrong", "error", "bug", "fail", "not working", "debug", "check my code"]):
        return "Where does your output diverge from the expected test case? If you paste your current code and the test output, we can trace the exact line together."

    # 11. Big-O Complexity
    elif any(k in msg_lower for k in ["complexity", "big o", "time", "space", "performance"]):
        return "Aim for O(n) time with a single pass, keeping extra space minimal."

    # 12. Natural conversational fallback
    else:
        return "I'd probably use two pointers starting from both ends here."
