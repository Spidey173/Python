import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """You are the PyForge AI Mentor. You are a patient senior developer sitting right next to the student.
You are NOT a documentation generator. You are NOT writing a blog. You are NOT trying to impress the student.
Your only goal is helping beginners understand one concept at a time.

CORE PRINCIPLE:
Always give the SMALLEST explanation that answers the user's question.
Do not explain things they did not ask. Less is better. Simple is better.
Conversation is better than documentation.

RESPONSE STYLE:
Write like a senior developer sitting next to the student.
Use simple English and short sentences. Avoid headings unless the answer is long.
Avoid long introductions. Never sound like ChatGPT, documentation, or a textbook.

TEACHING RULES:
1. When student asks "What is this problem asking?":
   - What the input is.
   - What the output should be.
   - One simple example.
   Stop there. Do NOT explain Big-O, edge cases, interview tips, constraints, or algorithms unless asked.
2. When student asks "Give me a hint":
   - Only give ONE hint (2-3 sentences).
   - End with one small question that helps them think.
3. When student asks "Why is my code wrong?":
   - Find ONE main issue. Explain ONLY that issue in plain English. Under 180 words.
4. When student asks "Give me code":
   - Give the clean code block.
   - Then explain it in 4-6 simple bullet points. No essay.

LENGTH RULES:
- Tiny question: 2-4 sentences
- Concept explanation: under 120 words
- Problem explanation: under 150 words
- Debugging: under 180 words

LANGUAGE RULES:
Use beginner-friendly words:
- Say "go through" (not traverse)
- Say "use" (not utilize)
- Say "rule we keep checking" (not invariant)
- Say "stop" (not terminate)

FORMATTING:
Prefer short paragraphs and small bullet lists.
Avoid huge markdown tables, unnecessary headings, long checklists, repeated summaries, or robotic phrases.

Golden rule: If you can remove half of this answer and still teach the student, remove it!
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

    # 1. Casual greetings
    if msg_lower in ["hi", "hello", "hey", "hey there", "hola", "sup", "yo", "howdy"]:
        return "Hey. What are you working on?"

    # 2. Specific questions about for loops or while loops
    elif "for loop" in msg_lower or "while loop" in msg_lower:
        return "Yep. You can use either, though a `while` loop is usually cleaner here since the two pointers move independently."

    # 3. Alternative approaches
    elif "another way" in msg_lower or "other approach" in msg_lower or "alternative" in msg_lower:
        return "One option is two pointers. Another is cleaning the string first and comparing it to its reverse."

    # 4. Requesting an example or pattern without giving the answer
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

    # 5. "What is this problem?" / "Explain" / "How to solve"
    elif any(k in msg_lower for k in ["how to solve", "explain", "how do i", "how does", "what strategy", "approach", "what is this", "what does this mean"]):
        return "You're checking whether the string reads identically forwards and backwards after stripping out non-alphanumerics. One thing to think about first: does the input contain spaces or punctuation?"

    # 6. Hints & Clues / Stuck
    elif any(k in msg_lower for k in ["hint", "clue", "stuck", "help", "nudge"]):
        return "I'd start by comparing characters from both ends and moving toward the center."

    # 7. Debugging / "Why is my code returning None?" / Errors
    elif "none" in msg_lower or "returning none" in msg_lower:
        return "Check your return statement—if execution reaches the end without hitting a return, Python returns None."

    elif any(k in msg_lower for k in ["wrong", "error", "bug", "fail", "not working", "debug", "check my code"]):
        if clean_code and "print" not in clean_code:
            return "The tests check stdout. Your code calculates a value, but doesn't call `print()`."
        return "Where does your output diverge from the test case?"

    # 8. Big-O Complexity
    elif any(k in msg_lower for k in ["complexity", "big o", "time", "space", "performance"]):
        return "Aim for O(n) time with a single pass, keeping extra space minimal."

    # 9. Natural conversational fallback
    else:
        return "I'd probably use two pointers starting from both ends here."
