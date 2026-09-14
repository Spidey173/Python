import { NextRequest, NextResponse } from 'next/server';
import { ALL_50_MENTOR_KNOWLEDGE } from '@/lib/mentor-data';
import { ALL_50_SOLUTIONS } from '@/lib/solutions-data';
import { ALL_50_RANKED_SOLUTIONS, RankedSolution } from '@/lib/ranked-solutions-data';

interface ChatMessage {
  role: 'user' | 'assistant' | 'mentor';
  content: string;
}

interface TutorRequestBody {
  message: string;
  code?: string;
  challenge_id?: number;
  chat_history?: ChatMessage[];
}

const SYSTEM_PROMPT = `You are an AI Coding Partner pair-programming with the user.

Core philosophy:
Every response should sound like it was typed by an experienced software engineer in real time—not retrieved from a programming course.
95% of the time, feel like a capable, direct peer engineer (similar to ChatGPT or Claude). Only 5% of the time coach, and only when the user is stuck or directly asks for guidance.
Earn the right to teach—never assume every message is a lesson.

Response flow:
Answer directly -> Small explanation (if needed) -> Optional natural question or next step.
No long intros. No "idiomatic structural patterns". No textbook lectures.

Formatting rules:
- Shorter responses by default. Keep it concise.
- Few or no headings. Avoid over-formatting.
- No bold spam or concept boxes.
- Write natural conversational paragraphs.
- Use small code snippets only when directly helpful to illustrate an idea.

Conversational rules:
- If the user says "Hi" or greets you, respond naturally like a colleague ("Hey! What's up?" or "Hi! What are you working on?"). Never start explaining or teaching the challenge unprompted.
- If the user asks a direct question ("Can I do this with a for loop?"), answer that exact question first ("Yep. You can, although...").
- If the user asks for an example pattern without the answer, show the minimal skeleton/mechanics (using ellipses '...' or abstract data) and explain the mechanic in one sentence.
- If debugging: point out what you observe, why it happens, and suggest the fix. Don't start with theory.
- NEVER spoil or output the complete working solution to the challenge before the user solves it.
- Never use cheerleading or canned enthusiasm ("Great question!", "Awesome!", "Let's dive in!").
- Never roleplay as a professor or course instructor.`;

// Call Anthropic Claude API
async function callClaude(apiKey: string, prompt: string, code: string, challengeInfo: string, history: ChatMessage[]) {
  const messages = history.map((m) => ({
    role: m.role === 'assistant' || m.role === 'mentor' ? 'assistant' : 'user',
    content: m.content,
  }));

  // Send pure user prompt — background context is kept in system instructions so greetings don't trigger problem dumps
  messages.push({ role: 'user', content: prompt });

  const systemWithContext = `${SYSTEM_PROMPT}

Background context (reference only if relevant to the user's specific question):
- Active Challenge: ${challengeInfo}
${code ? `- User's current editor code:\n\`\`\`python\n${code}\n\`\`\`` : ''}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      system: systemWithContext,
      messages,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// Call Google Gemini API
async function callGemini(apiKey: string, prompt: string, code: string, challengeInfo: string, history: ChatMessage[]) {
  const contents = [];

  for (const m of history) {
    contents.push({
      role: m.role === 'assistant' || m.role === 'mentor' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const systemInstruction = `${SYSTEM_PROMPT}

Background context (reference only if relevant to the user's specific question):
- Active Challenge: ${challengeInfo}
${code ? `- User's current editor code:\n\`\`\`python\n${code}\n\`\`\`` : ''}`;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Call OpenAI / Groq / OpenRouter API
async function callOpenAICompatible(baseUrl: string, apiKey: string, model: string, prompt: string, code: string, challengeInfo: string, history: ChatMessage[]) {
  const systemWithContext = `${SYSTEM_PROMPT}

Background context (reference only if relevant to the user's specific question):
- Active Challenge: ${challengeInfo}
${code ? `- User's current editor code:\n\`\`\`python\n${code}\n\`\`\`` : ''}`;

  const messages: any[] = [{ role: 'system', content: systemWithContext }];

  for (const m of history) {
    messages.push({
      role: m.role === 'assistant' || m.role === 'mentor' ? 'assistant' : 'user',
      content: m.content,
    });
  }

  messages.push({ role: 'user', content: prompt });

  const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI-compatible API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// Autonomous 1-on-1 AI Coding Partner Engine (Direct, unscripted peer style)
function generateClaudeGradeFallback(
  message: string,
  code: string,
  challengeId: number,
  knowledge?: (typeof ALL_50_MENTOR_KNOWLEDGE)[number],
  approaches?: RankedSolution[]
): string {
  const q = message.trim().toLowerCase();
  const sol = ALL_50_SOLUTIONS[challengeId];
  const problemTitle = sol?.title || knowledge?.conceptName || `Challenge #${challengeId}`;

  // 1. Casual greetings — never dump a lecture or problem overview
  if (/^(hi|hello|hey|hey there|hola|sup|good (morning|afternoon|evening)|yo|howdy)$/i.test(q)) {
    return "Hey! What are you working on?";
  }

  // 2. Specific questions about for loops or while loops
  if (q.includes('for loop') || q.includes('while loop')) {
    return (
      "Yep. You can, although a `while` loop tends to fit the two-pointer approach more naturally because both pointers move independently.\n\n" +
      "Want to try the `for` loop version first?"
    );
  }

  // 3. Requesting an example or pattern without giving the answer
  if (
    (q.includes('example') && (q.includes('pattern') || q.includes('without') || q.includes('show'))) ||
    q.includes('skeleton') ||
    q.includes('template') ||
    q.includes('show me a pattern')
  ) {
    return (
      "Sure. Here's the general pattern without applying it to your problem:\n\n" +
      "```python\n" +
      "left = 0\n" +
      "right = len(data) - 1\n\n" +
      "while left < right:\n" +
      "    if data[left] != data[right]:\n" +
      "        ...\n\n" +
      "    left += 1\n" +
      "    right -= 1\n" +
      "```\n\n" +
      "The important part isn't the values—it's the movement of the two pointers."
    );
  }

  // 4. "What is this problem?" / "Explain" / "How to think about this"
  if (
    q.includes('what is this problem') ||
    q.includes('explain') ||
    q.includes('how to solve') ||
    q.includes('how do i start') ||
    q.includes('approach') ||
    q.includes('what does this mean')
  ) {
    return (
      "You're checking whether the string reads the same from both ends.\n\n" +
      "One thing to think about first: does the input contain spaces or punctuation? That changes the approach slightly.\n\n" +
      "What's your current idea?"
    );
  }

  // 5. Hints & Clues request
  if (q.includes('hint') || q.includes('clue') || q.includes('stuck') || q.includes('nudge')) {
    return (
      "If you're looking for the general shape, it usually starts like this:\n\n" +
      "```python\n" +
      "left = 0\n" +
      "right = len(s) - 1\n\n" +
      "while left < right:\n" +
      "    ...\n" +
      "```\n\n" +
      "Everything else builds on that."
    );
  }

  // 6. Debugging / "Why is my code returning None?" / "Wrong" / "Bug" / "Error"
  if (q.includes('none') || q.includes('returning none')) {
    return (
      "If a function finishes without hitting an explicit return statement, Python returns None by default.\n\n" +
      "Take a look at your control flow—is there a branch or loop that exits without returning the value?"
    );
  }

  if (
    q.includes('wrong') ||
    q.includes('bug') ||
    q.includes('error') ||
    q.includes('fail') ||
    q.includes('debug') ||
    q.includes('check my code')
  ) {
    if (!code || code.trim() === '') {
      return "Your editor is empty right now. Paste what you have or write out your initial attempt, and we can trace it.";
    }

    if (!code.includes('print')) {
      return "The test harness checks standard output. You're calculating the result, but not calling `print()` on it.";
    }

    return "Run the code and check the terminal output against the expected case. Where does the actual output diverge from what's expected?";
  }

  // 7. Time and Space Complexity
  if (q.includes('complexity') || q.includes('big o') || q.includes('runtime') || q.includes('space') || q.includes('time')) {
    return "Aim for O(n) time with a single pass, keeping extra space minimal. Are you worried about memory or runtime in your current approach?";
  }

  // 8. Natural conversational fallback
  return "What part are you thinking through right now?";
}

export async function POST(req: NextRequest) {
  try {
    const body: TutorRequestBody = await req.json();
    const { message, code = '', challenge_id = 1, chat_history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const knowledge = ALL_50_MENTOR_KNOWLEDGE[challenge_id];
    const approaches = ALL_50_RANKED_SOLUTIONS[challenge_id] || [];
    const sol = ALL_50_SOLUTIONS[challenge_id];
    const challengeInfo = sol
      ? `Level ${challenge_id}: ${sol.title} - Time: ${sol.timeComplexity} - Concept: ${knowledge?.conceptName || ''}`
      : `Challenge #${challenge_id}`;

    // Priority 1: Groq Ultra-Fast 120B AI (if GROQ_API_KEY is set)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const reply = await callOpenAICompatible(
          'https://api.groq.com/openai/v1',
          groqKey,
          process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          message,
          code,
          challengeInfo,
          chat_history
        );
        if (reply) {
          return NextResponse.json({ reply, socratic_hint: knowledge?.hints?.[0]?.nudge || '' });
        }
      } catch (err) {
        console.warn('Groq API call failed, trying next provider:', err);
      }
    }

    // Priority 2: Google Gemini 3.6 Flash (if GEMINI_API_KEY or GOOGLE_API_KEY is set)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      try {
        const reply = await callGemini(
          geminiKey,
          message,
          code,
          challengeInfo,
          chat_history
        );
        if (reply) {
          return NextResponse.json({ reply, socratic_hint: knowledge?.hints?.[0]?.nudge || '' });
        }
      } catch (err) {
        console.warn('Gemini API call failed, trying next provider:', err);
      }
    }

    // Priority 3: Anthropic Claude API (if ANTHROPIC_API_KEY is set in Vercel)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const reply = await callClaude(
          process.env.ANTHROPIC_API_KEY,
          message,
          code,
          challengeInfo,
          chat_history
        );
        if (reply) {
          return NextResponse.json({ reply, socratic_hint: knowledge?.hints?.[0]?.nudge || '' });
        }
      } catch (err) {
        console.warn('Anthropic API call failed, trying next provider:', err);
      }
    }

    // Priority 4: OpenAI / OpenRouter / GitHub Copilot API (if OPENAI_API_KEY, OPENROUTER_API_KEY, or GITHUB_TOKEN is set)
    const openAIKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GITHUB_TOKEN || process.env.COPILOT_API_KEY;
    if (openAIKey) {
      let baseUrl = process.env.OPENAI_API_BASE || (process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');
      let model = process.env.OPENAI_MODEL || (process.env.OPENROUTER_API_KEY ? 'meta-llama/llama-3.3-70b-instruct:free' : 'gpt-4o-mini');

      if (process.env.GITHUB_TOKEN || process.env.COPILOT_API_KEY) {
        baseUrl = process.env.COPILOT_API_BASE || 'https://models.inference.ai.azure.com';
        model = process.env.COPILOT_MODEL || 'gpt-4o-mini';
      }

      try {
        const reply = await callOpenAICompatible(
          baseUrl,
          openAIKey,
          model,
          message,
          code,
          challengeInfo,
          chat_history
        );
        if (reply) {
          return NextResponse.json({ reply, socratic_hint: knowledge?.hints?.[0]?.nudge || '' });
        }
      } catch (err) {
        console.warn('OpenAI / GitHub Models API call failed, falling back:', err);
      }
    }

    // Priority 5: High-Quality Claude-Grade Socratic Fallback
    const fallbackReply = generateClaudeGradeFallback(
      message,
      code,
      challenge_id,
      knowledge,
      approaches
    );

    return NextResponse.json({
      reply: fallbackReply,
      socratic_hint: knowledge?.hints?.[0]?.nudge || 'Think about the core data structure!',
    });
  } catch (error: any) {
    console.error('Tutor route handler error:', error);
    return NextResponse.json(
      {
        reply: "I ran into an issue connecting to the model. What part of the code or problem were you looking at?",
        socratic_hint: "Check edge cases and input format.",
      },
      { status: 200 }
    );
  }
}
