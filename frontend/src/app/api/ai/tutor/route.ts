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

const SYSTEM_PROMPT = `You are Byte, a warm, patient, and inspiring 1-on-1 Python coding mentor for learners.
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
   - Do NOT write out the complete working program or dump boilerplate like \`import sys\`, \`def main()\`, \`if __name__ == '__main__':\`.
   - Never write the exact lines that solve the active challenge.
   - If showing code, show at most 1 short line of conceptual syntax or pseudocode.
   - The goal is for the student to experience the "Aha!" moment of solving it themselves.

4. BUILD CONFIDENCE & ENCOURAGE ACTION:
   - Always validate their curiosity and make them feel capable ("You've got this!", "Let's take it one step at a time.").
   - End with a friendly, bite-sized next action they can try right now in \`solution.py\`.`;

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

// Autonomous 1-on-1 Socratic AI Tutor Engine (Encouraging, simple-first, confidence-building)
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

  // 1. Greetings & Warm Welcomes
  if (/^(hi|hello|hey|hey there|hola|sup|good (morning|afternoon|evening)|yo)/i.test(q)) {
    return `👋 **Hey there! Great to code with you!**\n\nI'm **Byte**, your personal mentor for **${problemTitle}**.\n\nDon't worry about complicated syntax or tricky test cases—we'll take it one simple step at a time. What part would you like to explore first?`;
  }

  // 2. "What is this problem?" / "How to solve" / "Explain approach" / "Help"
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
      `👋 **Here is the simple idea for "${problemTitle}":**\n\n` +
      `${explanation}\n\n` +
      `**To solve it, we just break it down into 2 easy steps:**\n` +
      `1. **Clean / prepare the data**: Set up your input so it's clean and easy to test.\n` +
      `2. **Check the condition**: Use the **${concept}** pattern to decide the result.\n\n` +
      `💡 *Keep in mind*: ${interviewTrap}\n\n` +
      `How would you like to start? Try writing your first line in \`solution.py\` (like reading the input with \`s = input()\`) and tell me what you'd like to do next!`
    );
  }

  // 3. Hints & Clues request
  if (q.includes('hint') || q.includes('clue') || q.includes('stuck') || q.includes('nudge')) {
    const hint1 = knowledge?.hints?.[0]?.nudge || 'Start by understanding the input and what output is expected.';
    const hint2 = knowledge?.hints?.[1]?.nudge || 'Think about keeping only what you need and comparing values.';

    return (
      `💡 **Let's take it one small step at a time:**\n\n` +
      `• **Step 1**: ${hint1}\n` +
      `• **Step 2**: ${hint2}\n\n` +
      `You don't need complex code for this—just a few clean lines. What line do you want to write first?`
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
      return `📝 Your editor looks empty right now! Try writing your first thought in \`solution.py\` and hit **Run**, or ask me where to begin!`;
    }

    const hasPrint = code.includes('print');
    if (!hasPrint) {
      return (
        `👀 **Quick observation:**\n\n` +
        `Your logic might be close, but Python Quest checks standard output. Make sure you use \`print(...)\` to output your final answer, then click **Run** to test it!`
      );
    }

    return (
      `👍 **You're making solid progress!**\n\n` +
      `Click the green **Run (Ctrl+Enter)** button below to test your code against the visible sample inputs. If a case fails, compare what your code printed against the expected output, and we'll refine it together!`
    );
  }

  // 5. Time and Space Complexity (Big-O)
  if (q.includes('complexity') || q.includes('big o') || q.includes('runtime') || q.includes('space') || q.includes('time')) {
    return (
      `⚡ **Efficiency Goals for "${problemTitle}":**\n\n` +
      `• **Time**: Target a linear O(n) pass—look through the data once without nested loops.\n` +
      `• **Memory**: Keep auxiliary storage minimal.\n\n` +
      `Don't worry about perfection right away! Focus first on getting the logic working cleanly, then we can optimize.`
    );
  }

  // 6. General Conversational / Encouraging Response
  return (
    `🤖 **Mentor Byte here!**\n\n` +
    `For **${problemTitle}**, keep it simple: focus on the core **${concept}** idea.\n\n` +
    `Write out your thoughts in \`solution.py\` and click **Run** anytime. What question do you have about the next step?`
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
        reply: "I'm right here with you! Let's focus on breaking down this problem step by step. What part of the logic would you like to tackle first?",
        socratic_hint: "Check edge cases and input format.",
      },
      { status: 200 }
    );
  }
}
