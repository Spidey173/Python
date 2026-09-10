import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_TUTOR_PROMPT = """You are Byte, an expert, warm, and encouraging AI Python Coding Tutor and DSA Mentor.
You engage naturally like a friendly conversational chatbot (ChatGPT/Claude style).
Key persona rules:
1. Respond conversationally to any user prompt—whether it's a greeting ('hi', 'hello'), a request for an explanation ('explain how two pointers work'), code analysis ('why is my code slow?'), or an open discussion.
2. Be highly encouraging, supportive, and motivating. Build student confidence!
3. Provide clear, detailed, step-by-step explanations when asked for concept breakdowns or guidance. Use bullet points and code snippets where appropriate.
4. When discussing coding problems, guide candidates socratically toward optimal time/space complexity while highlighting key Python 3 idioms and interview edge cases.
5. Never refuse chit-chat or general coding questions. Always answer naturally and offer relevant follow-up tips!
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

    # 1. Greetings & Chit-Chat
    if msg_lower in ["hi", "hello", "hey", "hey there", "hola", "hi mentor", "hello mentor", "sup", "yo", "can u help solve this problem"]:
        return f"👋 **Hey!** I'm ready to help you conquer **{prob_name}**! What part of the problem would you like to explore first? We can discuss the optimal data structure, write an algorithm outline, or debug your current code!"

    elif "who are you" in msg_lower or "what can you do" in msg_lower:
        return "🤖 I'm **Byte**, your AI Python Coach! Ask me anything about algorithm strategy, line-by-line code logic, time complexity, or edge cases."

    elif "thank" in msg_lower or "thanks" in msg_lower or "awesome" in msg_lower or "great" in msg_lower:
        return "🙌 Happy to help! Keep sharpening your problem-solving intuition. Try writing out your logic in `solution.py` and hit **Run**!"

    # 2. Detailed explanation / how to solve / concept questions
    elif any(k in msg_lower for k in ["how to solve", "explain", "how do i", "how does", "what strategy", "approach"]):
        return (
            f"📘 **Strategy for {prob_name}**:\n\n"
            f"1. **Analyze Input & Edge Cases**: Watch out for empty strings/lists, case sensitivity, or boundary values.\n"
            f"2. **Choose Optimal Data Structure**: Think if a two-pointer approach, hash map, or sliding window eliminates $O(n^2)$ nested loops.\n"
            f"3. **Format Output**: Ensure your solution prints the exact expected result format.\n\n"
            f"What data structure or loop strategy are you planning to use?"
        )

    # 3. Hints & Clues
    elif any(k in msg_lower for k in ["hint", "clue", "stuck", "help"]):
        return (
            f"💡 **Key Clue for {prob_name}**:\n"
            f"- For string or array scanning, can you maintain pointer(s) or track seen elements in a hash set/dict?\n"
            f"- Check if built-in Python methods like `.isalnum()`, `.lower()`, or `.split()` simplify your data prep.\n"
            f"- Click the **Tiny Hint** or **Bigger Clue** button above for progressive step-by-step nudges!"
        )

    # 4. Big-O Complexity
    elif any(k in msg_lower for k in ["complexity", "big o", "time", "space", "performance"]):
        return (
            f"⚡ **Big-O Goals for {prob_name}**:\n"
            f"- **Target Time Complexity**: $O(n)$ linear scan (or $O(n \\log n)$ if sorting is needed).\n"
            f"- **Target Space Complexity**: $O(1)$ auxiliary memory or $O(n)$ for hash storage.\n"
            f"Avoid nested `for` loops where possible to keep execution fast under 3,000ms!"
        )

    # 5. Debugging & Errors
    elif any(k in msg_lower for k in ["wrong", "error", "bug", "fail", "not working"]):
        if clean_code and "print" not in clean_code:
            return "⚠️ **Output Required**: Remember that Python Quest evaluates your solution using standard output. Make sure you use `print(...)` to output your calculated answer!"
        return (
            f"🔍 **Debugging {prob_name}**:\n"
            f"1. Click the green **Run (Ctrl+Enter)** button to run your solution against test cases.\n"
            f"2. Inspect the **Terminal** tab to see your actual output vs the expected test case output.\n"
            f"3. Check for off-by-one errors or empty input handling!"
        )

    # 6. Any other general prompt
    else:
        return (
            f"🤖 **Mentor**: You asked: *\"{message}\"*\n\n"
            f"To excel in Python technical interviews for **{prob_name}**:\n"
            f"- Keep your code clean, modular, and readable.\n"
            f"- Double check your conditional statements and variable updates.\n"
            f"- Click **Run** anytime to test your solution live!"
        )
