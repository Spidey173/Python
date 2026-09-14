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

const SYSTEM_PROMPT = `You are an intelligent AI assistant helping a programmer with code.

You talk like an experienced software engineer in real time: calm, direct, concise, and thoughtful.

Guidelines:
- Match the user's depth. If a one-sentence answer is best, give a one-sentence answer (e.g. "I'd probably use two pointers here." or "Yep, that works.").
- Don't lecture, don't teach chapter-by-chapter, and don't force a question at the end of every reply. Let silence exist.
- Use natural engineer language ("I'd probably...", "One way is...", "The trick here is...").
- Strictly avoid canned template phrases like "Key takeaway", "Step-by-step", "Let's break it down", or "Great question!".
- The user is working on solving this challenge in their editor. Do not give the complete working solution to the challenge unprompted—guide their intuition, edge cases, and debugging instead.
- If the user simply says "Hi", greet them normally ("Hey! What are you working on?").`;

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

// Autonomous 1-on-1 AI Engine (Direct, unscripted peer style)
function generateClaudeGradeFallback(
  message: string,
  code: string,
  _challengeId: number,
  knowledge?: (typeof ALL_50_MENTOR_KNOWLEDGE)[number],
  approaches?: RankedSolution[]
): string {
  const q = message.trim().toLowerCase();

  // 1. Casual greetings
  if (/^(hi|hello|hey|hey there|hola|sup|good (morning|afternoon|evening)|yo|howdy)$/i.test(q)) {
    return "Hey. What are you working on?";
  }

  // 2. Specific questions about for loops or while loops
  if (q.includes('for loop') || q.includes('while loop')) {
    return "Yep. You can use either, though a `while` loop is usually cleaner here since the two pointers move independently.";
  }

  // 3. Alternative approaches
  if (q.includes('another way') || q.includes('other approach') || q.includes('alternative')) {
    if (approaches && approaches.length > 1) {
      const names = approaches.map((a) => a.title).join(' or ');
      return `A few ways to think about it: ${names}. Which one fits your intuition best?`;
    }
    return "One option is two pointers. Another is cleaning the string first and comparing it to its reverse.";
  }

  // 4. Requesting an example or pattern without giving the answer
  if (
    (q.includes('example') && (q.includes('pattern') || q.includes('without') || q.includes('show'))) ||
    q.includes('skeleton') ||
    q.includes('template') ||
    q.includes('show me a pattern')
  ) {
    return (
      "Here's the general shape:\n\n" +
      "```python\n" +
      "left = 0\n" +
      "right = len(data) - 1\n\n" +
      "while left < right:\n" +
      "    if data[left] != data[right]:\n" +
      "        ...\n\n" +
      "    left += 1\n" +
      "    right -= 1\n" +
      "```\n\n" +
      "The movement of the pointers is the main idea."
    );
  }

  // 5. "What is this problem?" / "Explain" / "How to solve"
  if (
    q.includes('what is this problem') ||
    q.includes('explain') ||
    q.includes('how to solve') ||
    q.includes('what does this mean')
  ) {
    if (knowledge?.conceptName) {
      return `This challenge centers around ${knowledge.conceptName}. Try breaking down the core transformation step by step.`;
    }
    return "You're checking whether the string reads identically forwards and backwards after stripping out non-alphanumerics. One thing to think about first: does the input contain spaces or punctuation?";
  }

  // 6. Hints & Clues request / Stuck
  if (q.includes('stuck') || q.includes('hint') || q.includes('clue') || q.includes('nudge')) {
    if (knowledge?.hints?.[0]?.nudge) {
      return knowledge.hints[0].nudge;
    }
    return "I'd start by comparing characters from both ends and moving toward the center.";
  }

  // 7. Debugging / "Why is my code returning None?" / "Wrong" / "Bug" / "Error"
  if (q.includes('none') || q.includes('returning none')) {
    return "Check your return statement—if execution reaches the end without hitting a return, Python returns None.";
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
      return "The tests check stdout. Your code calculates a value, but doesn't call `print()`.";
    }

    return "Where does your output diverge from the test case?";
  }

  // 8. Time and Space Complexity
  if (q.includes('complexity') || q.includes('big o') || q.includes('runtime') || q.includes('space') || q.includes('time')) {
    return "Aim for O(n) time with a single pass, keeping extra space minimal.";
  }

  // 9. Natural conversational fallback
  return "I'd probably use two pointers starting from both ends here.";
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
