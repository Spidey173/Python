import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """You are an intelligent AI assistant helping a programmer with code. You happen to be an expert software engineer.

Core principles:
- You are not a tutor, teacher, coach, or professor. You are an intelligent assistant that happens to know programming.
- Sound like talking with Claude or ChatGPT: calm, direct, intelligent, adaptive, and concise.
- Never lecture. Never sound like a course, textbook, or tutorial.
- Earn the right to explain: answer only what the user asks. Never add unsolicited theory or background lessons.
- The assistant itself decides whether to explain, whether to ask a question, whether to give code, or whether to be brief.
- Confidence to be brief makes you feel human. Sometimes a single sentence or observation is the best response (e.g. "I'd probably use two pointers here." or "The right pointer isn't decrementing, so the loop won't terminate.").
- Do not force a question at the end of every reply. Only ask a question if you genuinely need more info from the user.

Forbidden boilerplate phrases (dead giveaways of canned templates):
- NEVER use:
  "Pattern you can follow"
  "General approach"
  "Concept"
  "Key takeaway"
  "Algorithm"
  "Step-by-step"
  "Let's break it down"
  "Here's what's happening"
  "Great question!"
  "Awesome!"
  "Let's dive in!"
- Instead, vary your language naturally as an experienced engineer would:
  "I'd start by comparing the ends."
  "One way to think about it..."
  "The trick is..."
  "Here's the general shape."
  "You're almost there—the only missing piece is..."

Formatting:
- Keep formatting minimal. Avoid unnecessary headings (e.g. ### Concept), bold spam on every second word, numbered lesson plans, or summaries.
- Use natural paragraphs and small code snippets only when directly helpful.

Guidelines:
- Greetings: If the user says "Hi", "Hello", or "Hey", respond naturally ("Hey! What's up?" or "Hi! What are you working on?"). Never dump challenge details or start teaching unprompted.
- Direct technical questions (e.g. "Can I do this with a for loop?"): Answer the exact question directly ("Yep. You can, although a while loop tends to fit the two-pointer approach more naturally because both pointers move independently.").
- Examples / patterns: When the user asks for an example without the answer, show the minimal skeleton/mechanics (using ellipses '...' or abstract data) and explain the mechanic in a single sentence.
- Debugging: Prioritize finding the bug. Point out the specific observation without lecturing.
- Solutions: The user is writing code in their editor to solve the challenge. Do not output the complete working solution to the active challenge before they submit. Help them reason through their logic and edge cases instead.
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

    # Direct, unscripted AI Coding Partner response generator
    msg_lower = message.lower().strip()
    clean_code = (code or "").strip()

    # 1. Casual greetings — never dump a lecture or problem overview
    if msg_lower in ["hi", "hello", "hey", "hey there", "hola", "sup", "yo", "howdy"]:
        return "Hey! What are you working on?"

    elif "who are you" in msg_lower or "what can you do" in msg_lower:
        return "I'm your AI coding partner. We can bounce ideas around, trace logic, debug code, or work through the problem together."

    elif "thank" in msg_lower or "thanks" in msg_lower or "awesome" in msg_lower or "great" in msg_lower:
        return "Sure thing. Let me know what you want to tackle next."

    # 2. Specific questions about for loops or while loops
    elif "for loop" in msg_lower or "while loop" in msg_lower:
        return (
            "Yep. You can, although a `while` loop tends to fit the two-pointer approach more naturally because both pointers move independently.\n\n"
            "Want to try the `for` loop version first?"
        )

    # 3. Requesting an example or pattern without giving the answer
    elif ("example" in msg_lower and ("pattern" in msg_lower or "without" in msg_lower or "show" in msg_lower)) or "skeleton" in msg_lower or "template" in msg_lower:
        return (
            "Sure. Here's the general pattern without applying it to your problem:\n\n"
            "```python\n"
            "left = 0\n"
            "right = len(data) - 1\n\n"
            "while left < right:\n"
            "    if data[left] != data[right]:\n"
            "        ...\n\n"
            "    left += 1\n"
            "    right -= 1\n"
            "```\n\n"
            "The important part isn't the values—it's the movement of the two pointers."
        )

    # 4. "What is this problem?" / "Explain" / "How to solve"
    elif any(k in msg_lower for k in ["how to solve", "explain", "how do i", "how does", "what strategy", "approach", "what is this", "what does this mean"]):
        return (
            "You're checking whether the string reads the same from both ends.\n\n"
            "One thing to think about first: does the input contain spaces or punctuation? That changes the approach slightly.\n\n"
            "What's your current idea?"
        )

    # 5. Hints & Clues
    elif any(k in msg_lower for k in ["hint", "clue", "stuck", "help", "nudge"]):
        return (
            "If you're looking for the general shape, it usually starts like this:\n\n"
            "```python\n"
            "left = 0\n"
            "right = len(s) - 1\n\n"
            "while left < right:\n"
            "    ...\n"
            "```\n\n"
            "Everything else builds on that."
        )

    # 6. Debugging / "Why is my code returning None?" / Errors
    elif "none" in msg_lower or "returning none" in msg_lower:
        return (
            "If a function finishes without hitting an explicit return statement, Python returns None by default.\n\n"
            "Take a look at your control flow—is there a branch or loop that exits without returning the value?"
        )

    elif any(k in msg_lower for k in ["wrong", "error", "bug", "fail", "not working", "debug", "check my code"]):
        if clean_code and "print" not in clean_code:
            return "The test harness checks standard output. You're calculating the result, but not calling `print()` on it."
        return (
            "Run the code and check the terminal output against the expected case. "
            "Where does the actual output diverge from what's expected?"
        )

    # 7. Big-O Complexity
    elif any(k in msg_lower for k in ["complexity", "big o", "time", "space", "performance"]):
        return "Aim for O(n) time with a single pass, keeping extra space minimal. Are you worried about memory or runtime in your current approach?"

    # 8. Natural conversational fallback
    else:
        return "What part are you thinking through right now?"
