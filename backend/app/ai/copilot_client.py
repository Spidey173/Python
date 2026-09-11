import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """You are Byte, a warm, patient, and inspiring 1-on-1 Python coding mentor for learners.
Your primary mission: Make coding feel natural, clear, and confidence-building. Teach, don't lecture.

CRITICAL MENTORING RULES:
1. NO OVERWHELMING WALLS OF TEXT (Keep replies under 120-150 words):
   - Never write academic textbooks, long essays, or intimidating overviews.
   - NEVER use markdown tables.
   - Keep answers to 2-3 short, friendly, well-spaced paragraphs or 2-3 crisp bullet points.

2. "SIMPLE FIRST, THEN MORE SIMPLE" (Progressive Clarity):
   - When asked "what is this problem?" or "how do I solve this?":
     Step 1: Explain the core real-world idea in 1 simple, relatable sentence (e.g. "A palindrome is just a word or phrase that reads the same backward as forward, like 'racecar' or 'madam'").
     Step 2: Give the 2 simple steps in plain English (e.g., "1. Clean out spaces and symbols. 2. Check if the reversed string matches.").
     Step 3: Ask 1 gentle, encouraging question to help them write the first step in their editor.

3. NEVER SPOIL THE SOLUTION CODE:
   - Do NOT write out the complete working program or dump boilerplate like `import sys`, `def main()`, `if __name__ == '__main__':`.
   - Never write the exact lines that solve the active challenge.
   - If showing code, show at most 1 short line of conceptual syntax or pseudocode.
   - The goal is for the student to experience the "Aha!" moment of solving it themselves.

4. BUILD CONFIDENCE & ENCOURAGE ACTION:
   - Always validate their curiosity and make them feel capable ("You've got this!", "Let's take it one step at a time.").
   - End with a friendly, bite-sized next action they can try right now in `solution.py`.
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

    # 1. Greetings & Warm Welcomes
    if msg_lower in ["hi", "hello", "hey", "hey there", "hola", "hi mentor", "hello mentor", "sup", "yo", "can u help solve this problem"]:
        return f"👋 **Hey there! Great to code with you!**\n\nI'm **Byte**, your personal mentor for **{prob_name}**.\n\nDon't worry about complicated syntax or tricky test cases—we'll take it one simple step at a time. What part would you like to explore first?"

    elif "who are you" in msg_lower or "what can you do" in msg_lower:
        return "🤖 I'm **Byte**, your 1-on-1 Python Coding Mentor! Ask me anything about how the problem works, how to get started, or debugging your code."

    elif "thank" in msg_lower or "thanks" in msg_lower or "awesome" in msg_lower or "great" in msg_lower:
        return "🙌 You've got this! Keep going—try writing out your thoughts in `solution.py` and click **Run**!"

    # 2. "What is this problem?" / "Explain" / "How to solve"
    elif any(k in msg_lower for k in ["how to solve", "explain", "how do i", "how does", "what strategy", "approach", "what is this", "what does this mean"]):
        return (
            f"👋 **Here is the simple idea for {prob_name}:**\n\n"
            f"Don't worry about complexity or long code—think of the problem in 2 easy steps:\n"
            f"1. **Clean / prepare the data**: Read your input and set it up so it's simple to inspect.\n"
            f"2. **Check the condition**: Check if the items meet the challenge requirement, and print the answer!\n\n"
            f"How would you like to start? Try writing your first line in `solution.py` (like reading input with `s = input()`) and let's go from there!"
        )

    # 3. Hints & Clues
    elif any(k in msg_lower for k in ["hint", "clue", "stuck", "help"]):
        return (
            f"💡 **Let's take it one small step at a time for {prob_name}:**\n\n"
            f"• **Step 1**: Start by reading the input cleanly with `s = input()`.\n"
            f"• **Step 2**: Focus only on the core condition without worrying about nested loops.\n\n"
            f"You don't need complex code for this—just a few clean lines. What line do you want to write first in your editor?"
        )

    # 4. Big-O Complexity
    elif any(k in msg_lower for k in ["complexity", "big o", "time", "space", "performance"]):
        return (
            f"⚡ **Efficiency Goals for {prob_name}:**\n\n"
            f"• **Time**: Aim for a single pass through the data (linear O(n)).\n"
            f"• **Memory**: Keep extra storage minimal.\n\n"
            f"Focus first on getting the logic working cleanly, then we can optimize!"
        )

    # 5. Debugging & Errors
    elif any(k in msg_lower for k in ["wrong", "error", "bug", "fail", "not working"]):
        if clean_code and "print" not in clean_code:
            return "👀 **Quick observation:** Make sure you use `print(...)` to output your final answer! Python Quest evaluates your solution by reading standard terminal output."
        return (
            f"👍 **You're making solid progress on {prob_name}!**\n\n"
            f"Click the green **Run (Ctrl+Enter)** button below to test your code against the sample inputs in the Terminal dock. If a test case fails, compare what your code printed against the expected output, and we'll fix it together!"
        )

    # 6. General Conversational / Encouraging Response
    else:
        return (
            f"🤖 **Mentor Byte here!**\n\n"
            f"For **{prob_name}**, remember to keep it simple: focus on the core logic step-by-step.\n\n"
            f"Try writing out your thoughts in `solution.py` and click **Run** anytime. What question do you have about the next step?"
        )
