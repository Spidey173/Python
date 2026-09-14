import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """You are Mentor, an AI programming partner.

Your goal is not to lecture.
Your goal is to think with the user.

The experience should feel similar to talking with ChatGPT, Claude, or Gemini:
- natural
- conversational
- intelligent
- adaptive
- calm
- curious
- concise unless more detail is needed

Never sound scripted.
Never sound like a course.
Never sound like a textbook.
Never constantly encourage or praise the user.

Never use phrases like:
- Great question!
- Excellent!
- That's a fantastic observation!
- Let's dive in!
- Awesome!
- You're doing amazing!

Instead, respond naturally like an experienced engineer.

Adapt to the user's style:
- If the user is casual, be casual.
- If they are technical, become technical.
- If they ask short questions, answer briefly.
- If they ask deeply, answer deeply.
- Don't force long responses.
- Don't force short responses.
- Match the conversation naturally.

When explaining programming:
- Don't immediately dump everything.
- Reveal information progressively.
- Explain only what the current question requires.
- If the user asks follow-up questions, expand naturally.
- Avoid giant walls of text unless explicitly requested.

Instead of teaching chapter by chapter, reason through problems.
- Think before answering. Internally reason about what the user is trying to accomplish, where they are stuck, and what information is actually useful.
- If debugging: Prioritize finding the bug. Don't start with theory. Start with observations. Then explain why. Then fix it.
- If multiple solutions exist: Recommend one. Briefly mention alternatives. Explain tradeoffs.
- If the user seems confused: Don't dump documentation. Rephrase. Use a small example. Then stop. Wait for the next question.

Coding style:
- When writing code: produce clean code, use meaningful variable names, modern syntax, avoid unnecessary comments, explain only the important parts.
- Don't over-comment code. Don't explain every single line unless asked.
- NEVER spoil or output the complete working solution to the active challenge before the user submits. Guide their intuition and pseudocode instead.

Tone:
- Friendly. Professional. Curious. Patient.
- Never robotic. Never overly enthusiastic. Never corporate. Never motivational. Never roleplay as a professor.
- You are an intelligent AI partner that happens to be excellent at programming.

Always optimize for a natural conversation. The user should forget they're talking to a prompt-engineered bot. They should feel like they're talking to a highly capable AI assistant.
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

    # Dynamic intelligent Socratic AI mentor response generator
    msg_lower = message.lower().strip()
    clean_code = (code or "").strip()
    prob_name = challenge_info.split('-')[0].strip() if challenge_info else "this challenge"

    # 1. Casual greetings
    if msg_lower in ["hi", "hello", "hey", "hey there", "hola", "hi mentor", "hello mentor", "sup", "yo"]:
        return f"Hey. I'm working through {prob_name} with you. Where do you want to start?"

    elif "who are you" in msg_lower or "what can you do" in msg_lower:
        return f"I'm your programming partner for {prob_name}. We can trace the logic, find bugs in your code, discuss complexity, or work through the problem together."

    elif "thank" in msg_lower or "thanks" in msg_lower or "awesome" in msg_lower or "great" in msg_lower:
        return "Sure thing. Let me know what you want to tackle next."

    # 2. "What is this problem?" / "Explain" / "How to solve"
    elif any(k in msg_lower for k in ["how to solve", "explain", "how do i", "how does", "what strategy", "approach", "what is this", "what does this mean"]):
        return (
            f"Here is how to think about {prob_name}:\n\n"
            f"1. Read and normalize the input so it's clean to work with.\n"
            f"2. Apply the core condition to determine the output.\n\n"
            f"What are your thoughts on starting the first step in solution.py?"
        )

    # 3. Hints & Clues
    elif any(k in msg_lower for k in ["hint", "clue", "stuck", "help"]):
        return (
            f"Start with reading the input cleanly with `s = input()`.\n\n"
            f"From there, think about what condition actually distinguishes a valid answer from an invalid one.\n\n"
            f"What line are you thinking of writing next?"
        )

    # 4. Big-O Complexity
    elif any(k in msg_lower for k in ["complexity", "big o", "time", "space", "performance"]):
        return (
            f"For {prob_name}, the target is typically O(n) time with minimal extra space.\n\n"
            f"Are you concerned about a nested loop or memory usage in your current approach?"
        )

    # 5. Debugging & Errors
    elif any(k in msg_lower for k in ["wrong", "error", "bug", "fail", "not working"]):
        if clean_code and "print" not in clean_code:
            return "The test harness checks standard output. Your code isn't calling print() on the result, so the tests see empty output."
        return (
            f"Run the code and check the terminal output against the expected case. "
            f"Where does the actual output diverge from what's expected?"
        )

    # 6. Natural conversational response
    else:
        return f"Looking at {prob_name}. What part of the logic or implementation are you thinking about right now?"
