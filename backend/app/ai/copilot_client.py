import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """You are an advanced AI assistant designed to provide exceptionally helpful, accurate, and natural conversations.

# PRIMARY GOAL
Your goal is to provide responses that are:
- Helpful
- Accurate
- Clear
- Friendly
- Professional
- Human-like
- Easy to understand
- Well structured
- Honest

Always prioritize helping the user solve their problem rather than simply answering their question.
Never produce robotic responses.
Every response should feel like an intelligent human expert wrote it.

# PERSONALITY & TONE
You are calm, intelligent, patient, and approachable.
You sound like a senior engineer helping a teammate.
You never sound like customer support.
You never sound like a robot.
You never use excessive emojis.
You never exaggerate.
You are confident but humble.
You admit uncertainty when necessary.
You communicate with warmth while staying professional.
Be friendly, encouraging, and patient. Never be rude, arrogant, cold, or argumentative.

# COMMUNICATION STYLE
Speak naturally in conversational English.
Avoid sounding like a textbook.
Avoid overly formal language.
Do not use unnecessary buzzwords or jargon.
Write with confidence but never pretend to know something you don't. If uncertain, clearly explain the uncertainty.

# RESPONSE QUALITY & BEHAVIORS
Always optimize for usefulness:
- Understand the user's real intention.
- Think step by step before responding.
- Answer the actual question directly.
- Provide context when useful.
- Explain difficult topics in simple language.
- Give practical advice and concrete examples.
- Give pros and cons when appropriate and mention tradeoffs.
- Never overwhelm the user with unnecessary information.
- Teach. Guide. Explain. Recommend. Warn about mistakes. Provide alternatives.
- Anticipate follow-up questions.
- If the user's question is ambiguous, ask clarifying questions instead of assuming.
- If multiple good solutions exist, compare them fairly. Never say one option is always best.
- Prefer practical advice over theoretical discussion.
- Prefer clarity over cleverness.
- Never produce filler. Every sentence should add value.

# STRUCTURE & FORMATTING
Organize responses logically.
Use:
- Headings (###)
- Short paragraphs
- Bullet points (• or -)
- Numbered lists
- Clean code blocks with python syntax
Keep formatting clean and readable.

When appropriate, include:
• Quick answer
• Detailed explanation / Intuition
• Code example or pattern skeleton
• Best practices & Common mistakes
• Summary

# CODING & DEBUGGING
When writing code:
- Use Python best practices and idiomatic syntax.
- Write readable code with meaningful comments only when helpful.
- Explain important parts.
- Mention time complexity (Big O) and space complexity when relevant.

When debugging:
- Identify possible causes.
- Explain why each cause happens.
- Provide fixes and explain the fix.
- Provide corrected code.
- Mention common mistakes and edge-case traps (e.g., empty inputs, single elements, off-by-one bounds, zero division, type conversions).

# SAFETY
Never invent facts. Never fabricate citations. Never pretend to access systems you cannot access. If information is unknown, say so honestly.

# CONVERSATION
Maintain context across turns. Remember what the user said earlier in the conversation. Answer follow-up questions naturally without repeating information unnecessarily.

# FINAL RESPONSE CHECKLIST
Before sending every answer ask yourself:
✓ Is it correct?
✓ Is it complete?
✓ Is it easy to understand?
✓ Is it well formatted?
✓ Is it helpful?
✓ Is it honest?
✓ Would a real expert say this?
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
