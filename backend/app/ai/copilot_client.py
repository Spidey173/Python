import json
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.ai.ast_explainer import ASTCodeAnalyzer

ast_analyzer = ASTCodeAnalyzer()

SYSTEM_EXPLAIN_PROMPT = """You are the Python Quest Senior Code Explainer AI.
Given the student's Python code and challenge context, return ONLY valid JSON.
Do not wrap the JSON in markdown.
Do not include explanations outside the JSON.

JSON schema:
- line_by_line: list of objects with line (int), code (str), explanation (str)
- beginner_summary: friendly 2-sentence explanation of what the code does
- time_complexity: Big O notation with brief reasoning
- space_complexity: Big O notation with brief reasoning
- common_mistakes: list of 2-3 common traps or beginner pitfalls
- better_approach: 2-3 sentences on idiomatic Python best practices
- optimized_code: cleaned up, idiomatic Python version
- dry_run_trace: list of 3-5 steps showing variable changes
"""

SYSTEM_TUTOR_PROMPT = """You are an experienced software engineer and friendly coding mentor.
Your job is to help users truly understand programming concepts and solve algorithmic challenges.

CORE PRINCIPLES:
1. Prioritize clarity over completeness.
   Explain one idea extremely well rather than five ideas superficially.
2. Answer the user's question first.
   Always answer the user's actual question directly before adding extra learning material.
3. Match the depth to the question.
   Keep explanations proportional to the user's request:
   - Short question -> Short answer.
   - Detailed question -> Detailed explanation.
4. Teach for understanding.
   Help the user build the correct mental model before diving into implementation details.
5. Use simple language.
   Use plain English before technical jargon. If technical terms are necessary, explain them briefly.
6. Encourage thoughtful learning.
   If the user's approach is mostly correct, acknowledge what works before explaining what needs improvement. Be encouraging, but never use fake praise.
7. Be honest.
   If you're uncertain, say so clearly. Never invent APIs, library behavior, or language features.

ADAPT YOUR STRUCTURE BASED ON INTENT:
- Avoid repeating section headings when they add no value. Only include sections that are relevant to the user's question.
- GREETINGS & CASUAL CHAT (e.g., "hi", "hello", "hey", "how are you"):
  Reply with a warm, friendly 1-2 sentence greeting offering help with the current challenge. NEVER dump code, steps, or explanations for a simple greeting.
- HINT REQUESTS:
  Give an encouraging nudge, a guiding question, or a small thought experiment. Let the student think—do NOT spoil the full solution immediately.
- DEBUG & ERROR REQUESTS:
  Identify what the code intended vs. what it actually did. Highlight what is already working, point out the logic flaw with a small, concrete counter-example, and then show the clean fix.
- CONCEPT & GENERAL QUESTIONS:
  Explain the concept with intuition first. When an analogy would genuinely improve understanding (e.g. HashMap = Phone Contacts app, Binary Search = Dictionary lookup, Two Pointers = Walking towards each other), use one! Don't force analogies for simple syntax.
- CODE & FULL EXPLANATION REQUESTS:
  Directly answer the question, then provide structured learning using ONLY the relevant sections from below:
  ## 💡 Simple Explanation
  Brief plain-English explanation of what the problem asks and why this solution works.
  
  ## 🌟 Real-Life Analogy (include only if it genuinely clarifies the concept)
  
  ## 👣 Step-by-Step
  3-4 small, numbered steps breaking down the logic.
  
  ## 💻 Python Solution
  ONE complete, working code block using the exact Starter Code Template. Add inline comments on 1-2 crucial lines.
  
  ## ⏱ Complexity
  - Time Complexity: O(...) with a 1-sentence plain English reason.
  - Space Complexity: O(...) with a 1-sentence plain English reason.
  
  ## ⚠️ Common Mistakes
  1-2 beginner traps or sneaky edge cases to watch out for.
  
  ## ✅ Summary
  A short, memorable 1-sentence takeaway.

IMPORTANT RULES:
- If you are uncertain, say so clearly. Do not invent APIs, functions, library behavior, or language features. When assumptions are necessary, state them explicitly.
- The Starter Code Template is the single source of truth. Always conform to it.
- Never ask the user which format the judge expects; provide standard working code matching the starter template.
- Prefer the cleanest, most interview-accepted approach first (e.g., two pointers, hash map, simple loops over unnecessary recursion)."""


def clean_llm_response(text: str) -> str:
    """Minimal response sanitizer to fix unclosed code blocks and extra whitespace."""
    if not text:
        return ""
    cleaned = text.strip()
    fence_count = cleaned.count("```")
    if fence_count % 2 != 0:
        cleaned += "\n```"
    return cleaned


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
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```json"):
                    content = content[7:]
                elif content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                return json.loads(content.strip())
    except Exception:
        pass

    return ast_analyzer.analyze(code, user_question)


async def chat_with_ai_tutor(
    message: str,
    code: Optional[str] = None,
    challenge_info: Optional[Dict[str, Any]] = None,
    starter_code: Optional[str] = None,
    last_error: Optional[str] = None,
    chat_history: Optional[list] = None
) -> str:
    """
    Direct context pass-through LLM tutor call.
    """
    msg_lower = message.lower().strip()
    clean_code = (code or "").strip()
    clean_starter = (starter_code or "").strip()

    # Determine if user is asking to debug or fix existing code
    is_debug_request = any(k in msg_lower for k in [
        "debug", "why failing", "my error", "fix my code", "check my code",
        "wrong output", "syntax error", "traceback", "failing test", "why failed",
        "not working", "test case failed", "why is this wrong", "can you correct",
        "error", "failed", "bug in my code", "fix this"
    ])

    # Build clear context envelope right above user question
    context_sections = []
    if challenge_info:
        title = challenge_info.get("title", "")
        objective = challenge_info.get("objective", "")
        if title:
            context_sections.append(f"### Challenge\n{title}")
        if objective:
            context_sections.append(f"### Problem Description\n{objective}")

    context_sections.append(
        "### Platform Rules & Solution Style\n"
        "- Platform Judge Type: Standard input/output scripts using input() and print().\n"
        "- Authoritative Template: Starter Code Template.\n"
        "- Preferred Solution Style: Easiest interview-accepted solution first (prefer two pointers / hash maps / simple loops over recursion).\n"
        "- Avoid: Complex recursive or advanced variants unless required or requested.\n"
        "- Do NOT ask the user which format to use. Provide code using the starter template directly."
    )

    if clean_starter:
        context_sections.append(
            f"### Starter Code Template (SINGLE SOURCE OF TRUTH)\n```python\n{clean_starter}\n```"
        )

    # Only send editor code and error details when user explicitly asks for debugging/fixing
    if is_debug_request:
        if clean_code:
            context_sections.append(f"### Current User Code (For Debugging)\n```python\n{clean_code}\n```")
        if last_error:
            context_sections.append(f"### Latest Test Result / Error\n```\n{last_error}\n```")

    context_sections.append(f"### User Question\n{message}")
    full_user_prompt = "\n\n".join(context_sections)

    # 1. Groq / OpenAI API call if configured
    if settings.GROQ_API_KEY:
        try:
            messages = [{"role": "system", "content": SYSTEM_TUTOR_PROMPT}]
            if chat_history:
                for h in chat_history[-6:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": full_user_prompt})

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.GROQ_MODEL or "llama-3.3-70b-versatile",
                        "messages": messages,
                        "temperature": 0.5,
                        "max_tokens": 1200,
                    }
                )
                if resp.status_code == 200:
                    return clean_llm_response(resp.json()["choices"][0]["message"]["content"])
        except Exception as e:
            print("Groq API call error:", e)

    # 2. Gemini API call if configured
    if settings.GEMINI_API_KEY:
        try:
            contents = []
            if chat_history:
                for h in chat_history[-6:]:
                    contents.append({
                        "role": "model" if h.get("role") in ["assistant", "mentor"] else "user",
                        "parts": [{"text": h.get("content", "")}],
                    })
            contents.append({"role": "user", "parts": [{"text": full_user_prompt}]})

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent",
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": settings.GEMINI_API_KEY,
                    },
                    json={
                        "system_instruction": {
                            "parts": [{"text": SYSTEM_TUTOR_PROMPT}]
                        },
                        "contents": contents
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return clean_llm_response(data["candidates"][0]["content"]["parts"][0]["text"])
        except Exception as e:
            print("Gemini API call error:", e)

    # 3. Honest API offline response
    return "I'm currently unable to reach the AI server. Please verify that your API key is configured or backend server is running."

