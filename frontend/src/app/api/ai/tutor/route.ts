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

const SYSTEM_PROMPT = `You are Mentor, an AI programming partner.

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

Always optimize for a natural conversation. The user should forget they're talking to a prompt-engineered bot. They should feel like they're talking to a highly capable AI assistant.`;

// Call Anthropic Claude API
async function callClaude(apiKey: string, prompt: string, code: string, challengeInfo: string, history: ChatMessage[]) {
  const messages = history.map((m) => ({
    role: m.role === 'assistant' || m.role === 'mentor' ? 'assistant' : 'user',
    content: m.content,
  }));

  const userContent = [
    challengeInfo ? `Active Challenge Context: ${challengeInfo}` : '',
    code ? `Student's Current Code:\n\`\`\`python\n${code}\n\`\`\`` : '',
    prompt,
  ].filter(Boolean).join('\n\n');

  messages.push({ role: 'user', content: userContent });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
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

  // Add system instruction as first exchange
  contents.push({
    role: 'user',
    parts: [{ text: `System Instruction: ${SYSTEM_PROMPT}\n\nActive Challenge: ${challengeInfo}\nStudent's Code:\n\`\`\`python\n${code}\n\`\`\`` }],
  });
  contents.push({
    role: 'model',
    parts: [{ text: "Understood! I'm Byte, your encouraging Python DSA tutor ready to assist." }],
  });

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

  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ contents }),
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
  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (challengeInfo) {
    messages.push({ role: 'system', content: `Active Challenge: ${challengeInfo}` });
  }
  if (code) {
    messages.push({ role: 'system', content: `Student's Current Code:\n\`\`\`python\n${code}\n\`\`\`` });
  }

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
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI-compatible API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// Autonomous 1-on-1 AI Partner Engine (Natural, calm, experienced-engineer peer style)
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
  const concept = knowledge?.conceptName || 'Algorithmic Logic';
  const explanation = knowledge?.conceptExplanation || sol?.explanation || 'Break down the problem into input, processing, and output.';
  const interviewTrap = knowledge?.interviewTrap || 'Watch out for boundary values and empty inputs.';

  // 1. Casual greetings
  if (/^(hi|hello|hey|hey there|hola|sup|good (morning|afternoon|evening)|yo)$/i.test(q)) {
    return `Hey. I'm working through "${problemTitle}" with you. Where do you want to start?`;
  }

  // 2. "What is this problem?" / "Explain" / "How to solve"
  if (
    q.includes('what is this problem') ||
    q.includes('explain') ||
    q.includes('help solve') ||
    q.includes('how to solve') ||
    q.includes('how do i') ||
    q.includes('solve this') ||
    q.includes('approach') ||
    q.includes('strategy') ||
    q.includes('what does this mean')
  ) {
    return (
      `Here is the core idea for "${problemTitle}":\n\n` +
      `${explanation}\n\n` +
      `At a high level:\n` +
      `1. Parse and normalize the input so it's clean to work with.\n` +
      `2. Apply the ${concept.toLowerCase()} logic to decide the output.\n\n` +
      `What are your thoughts on starting the first step in solution.py?`
    );
  }

  // 3. Hints & Clues request
  if (q.includes('hint') || q.includes('clue') || q.includes('stuck') || q.includes('nudge')) {
    const hint1 = knowledge?.hints?.[0]?.nudge || 'Start by understanding the input and what output is expected.';
    const hint2 = knowledge?.hints?.[1]?.nudge || 'Think about keeping only what you need and comparing values.';

    return (
      `${hint1}\n\n` +
      `Once you have that, ${hint2.toLowerCase()}\n\n` +
      `What line are you thinking of writing next?`
    );
  }

  // 4. Code Review / "Why is it wrong?" / "Debug my code" / "Check my code"
  if (
    q.includes('wrong') ||
    q.includes('bug') ||
    q.includes('error') ||
    q.includes('fail') ||
    q.includes('debug') ||
    q.includes('check my code') ||
    q.includes('review')
  ) {
    if (!code || code.trim() === '') {
      return `Your editor is empty right now. Put your initial attempt in solution.py or paste what you have, and we can trace it.`;
    }

    const hasPrint = code.includes('print');
    if (!hasPrint) {
      return `The test harness checks standard output. Your code isn't calling print() on the result, so the tests see empty output.`;
    }

    return `Run the code and check the terminal output against the expected case. Where does the actual output diverge from what's expected?`;
  }

  // 5. Time and Space Complexity (Big-O)
  if (q.includes('complexity') || q.includes('big o') || q.includes('runtime') || q.includes('space') || q.includes('time')) {
    return (
      `For "${problemTitle}", the target is typically O(n) time with minimal extra space.\n\n` +
      `Are you concerned about a nested loop or memory usage in your current approach?`
    );
  }

  // 6. Natural conversational response
  return (
    `Looking at "${problemTitle}". What part of the logic or implementation are you thinking about right now?`
  );
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
