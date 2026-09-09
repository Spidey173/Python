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

    # Greetings & Conversational Chit-Chat
    if msg_lower in ["hi", "hello", "hey", "hey there", "hola", "hi mentor", "hello mentor", "sup", "yo"]:
        return "👋 **Hey there!** I'm your Python DSA & Technical Interview Mentor. How can I help you with this challenge today? You can ask me how to get started, ask about time/space complexity, or ask for a hint!"

    elif "who are you" in msg_lower or "what can you do" in msg_lower or "your name" in msg_lower:
        return "🤖 I'm **Byte**, your AI Python Coach! I can explain algorithm concepts, review your code complexity, give Socratic clues, and guide you through edge cases."

    elif "thank" in msg_lower or "thanks" in msg_lower or "awesome" in msg_lower or "great" in msg_lower:
        return "🙌 You're very welcome! Keep pushing your coding skills. Try writing out your logic in `solution.py` and hit **Run** when ready!"

    elif "clue" in msg_lower or "hint" in msg_lower or "help" in msg_lower or "stuck" in msg_lower:
        if challenge_info:
            return f"💡 **Interview Clue**: For **{challenge_info.split('-')[0].strip()}**, think about the core data structure (e.g. hash map vs two pointers). Break the problem into 3 clear steps: 1) Parse input, 2) Apply O(n) algorithmic transformation, 3) Return/Print the exact expected output."
        return "💡 **Interview Clue**: 1) Identify the optimal data structure (hash map, two pointers, stack, or sliding window), 2) Avoid nested loops ($O(n^2)$), 3) Verify edge cases (empty or single input). Test your logic using the green 'Run' button!"

    elif "complexity" in msg_lower or "big o" in msg_lower or "time" in msg_lower or "space" in msg_lower:
        return "⚡ **Big-O Analysis**: In technical interviews, top tech companies target **$O(n)$ or $O(n \\log n)$ time complexity** with **$O(1)$ or $O(n)$ auxiliary space**. Using a hash table or two-pointer sweep eliminates redundant nested passes."

    elif "wrong" in msg_lower or "error" in msg_lower or "bug" in msg_lower or "fail" in msg_lower:
        if clean_code and "print" not in clean_code:
            return "⚠️ **Output Missing**: Your solution needs to output the result! Ensure you print the final answer using `print(...)` so the test runner can evaluate it."
        return "🔍 **Debugging Guidance**: Compare your code output in the Terminal against the expected output in Test Cases. Trace step-by-step for small boundary inputs (like single characters or empty strings)."

    elif "edge case" in msg_lower or "trap" in msg_lower or "pitfall" in msg_lower:
        return "🛡️ **Interview Edge Cases to Watch**: 1) Empty inputs or single-element arrays, 2) All identical elements, 3) Case sensitivity and spaces, 4) Negative values or zero, 5) Boundary indexing. Make sure your logic guards against these!"

    elif "explain" in msg_lower or "how to" in msg_lower or "why" in msg_lower or "what is" in msg_lower:
        if challenge_info:
            return f"📘 **Concept Breakdown**: In **{challenge_info}**, the objective is to transform the input efficiently. Review the Problem Spec tab for the exact input-output contract, write out your solution in `solution.py`, and click 'Run' to verify!"
        return f"📘 **Concept Breakdown**: Regarding '{message}': Focus on keeping Python logic modular and readable. Use idiomatic Python constructs (`enumerate`, `dict.get`, slice notation) to make your code clean and production-ready."

    else:
        return f"💬 **Mentor**: You asked: *\"{message}\"*. To solve this challenge efficiently, break down your approach: check your loop conditions, ensure your output format matches the specs, and hit **Run (Ctrl+Enter)** to test it against live inputs!"
