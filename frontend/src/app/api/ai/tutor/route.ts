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

const SYSTEM_PROMPT = `You are Byte, an expert, warm, and highly encouraging AI Python Coding Tutor and DSA Mentor for PyForge.
Your goal is to help students, freshers, and interview candidates master Python coding and data structures & algorithms.
Persona Guidelines:
1. Be as conversational, helpful, and articulate as Claude or ChatGPT.
2. When asked to help solve a problem, guide them step-by-step with clear logic, optimal time/space complexity (Big-O), and concise Python code examples.
3. If they ask about their code, analyze their logic directly, point out bugs or missing print/return statements gently, and explain why.
4. Keep a positive, motivating, and encouraging tone!
5. Format code blocks using proper markdown (\`\`\`python ... \`\`\`).
6. Never give rigid one-liner canned responses. Tailor your answer directly to what the user asked.`;

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

// Autonomous Deep Socratic AI Tutor Engine (High Quality fallback when no external LLM key is configured)
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
  const explanation = knowledge?.conceptExplanation || sol?.explanation || 'Break down the problem into inputs, processing, and output.';
  const interviewTrap = knowledge?.interviewTrap || 'Watch out for boundary values and empty inputs.';
  const optimalSolution = approaches?.[0];
  const alternativeSolution = approaches?.[1];

  // 1. Greetings & Warm Welcomes
  if (/^(hi|hello|hey|hey there|hola|sup|good (morning|afternoon|evening)|yo)/i.test(q)) {
    return `👋 **Hey there! Great to code with you today!**\n\nI'm **Byte**, your dedicated Python & DSA mentor. We're currently working on **"${problemTitle}"** (${concept}).\n\nHow can I help you right now?\n- 💡 Need a **step-by-step hint** on how to get started?\n- 🔍 Want me to **review or debug** the code currently in your editor?\n- ⚡ Curious about the **optimal time & space complexity**?\n\nJust let me know what you'd like to explore!`;
  }

  // 2. "Can you help solve this problem?" / "How to solve" / "Explain approach"
  if (
    q.includes('help solve') ||
    q.includes('how to solve') ||
    q.includes('how do i solve') ||
    q.includes('solve this') ||
    q.includes('approach') ||
    q.includes('strategy')
  ) {
    return `🎯 **Let's break down "${problemTitle}" together!**\n\nHere is how top software engineers approach this in an interview:\n\n### 1. The Core Idea\n${explanation}\n\n### 2. High-Level Strategy\n- **Step 1 (Parse Input)**: Read and clean the input according to the problem requirements.\n- **Step 2 (Algorithm)**: Focus on the **${concept}** pattern to avoid unnecessary loops.\n- **Step 3 (Output)**: Make sure to print the exact expected format using \`print(...)\`.\n\n### 3. Interview Trap to Avoid\n> ⚠️ **Watch Out**: ${interviewTrap}\n\n**Next step**: Take a look at your \`solution.py\` editor. What data structure or first step do you think we should write first?`;
  }

  // 3. Hints & Clues request
  if (q.includes('hint') || q.includes('clue') || q.includes('stuck') || q.includes('nudge')) {
    const hint1 = knowledge?.hints?.[0]?.nudge || 'Start by understanding the input constraints and expected output.';
    const hint2 = knowledge?.hints?.[1]?.nudge || 'Think about using a two-pointer or hash map pattern.';
    const snippet = knowledge?.hints?.[1]?.codeSnippet || optimalSolution?.code || sol?.optimalCode || '';

    return `💡 **Here's your strategic hint for "${problemTitle}"**:\n\n1. **Conceptual Clue**:\n   ${hint1}\n\n2. **Implementation Pointer**:\n   ${hint2}\n\n${snippet ? `\`\`\`python\n# Starting pattern\n${snippet}\n\`\`\`` : ''}\n\nGive this a try in the code editor! If you want a deeper look at the next line, just ask!`;
  }

  // 4. "Anything else?" / "More tips" / "What else"
  if (q.includes('anything else') || q.includes('what else') || q.includes('more tips') || q.includes('more')) {
    return `✨ **Bonus Pro Tips for "${problemTitle}"**:\n\n1. **Edge Case Checklist**:\n   - What happens if the input is completely empty or single-character?\n   - Does case sensitivity matter (e.g. \`s.lower()\`)?\n   - Are spaces and punctuation handled cleanly (e.g. \`c.isalnum()\`)?\n\n2. **Complexity Goal**:\n   - Target Time: **${optimalSolution?.timeComplexity || sol?.timeComplexity || 'O(n)'}**\n   - Target Space: **${optimalSolution?.spaceComplexity || sol?.spaceComplexity || 'O(1)'}**\n\n3. **Alternative Approach**:\n   ${alternativeSolution ? `You can also solve this using **${alternativeSolution.title}** (${alternativeSolution.timeComplexity}), which gives great perspective during an interview discussion!` : 'Keeping your solution clean and readable is highly valued by interviewers.'}\n\nWould you like me to inspect the code you have written so far? Click **Run** or paste any question!`;
  }

  // 5. Code Review / "Why is it wrong?" / "Debug my code" / "Check my code"
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
      return `📝 Your editor looks empty right now! Start by writing a draft in \`solution.py\` or take inspiration from the problem spec on the left, then ask me to review it anytime.`;
    }

    const hasPrint = code.includes('print');
    const hasInput = code.includes('input');

    const issues: string[] = [];
    if (!hasPrint) {
      issues.push('• **Missing \`print(...)\`**: The test runner evaluates what your code outputs to the terminal. Make sure to print the final result!');
    }
    if (!hasInput && challengeId <= 40) {
      issues.push('• **Input Reading**: Ensure you read inputs using \`s = input()\` or \`sys.stdin.read().splitlines()\`.');
    }

    if (issues.length > 0) {
      return `🔍 **Quick Code Review on your current implementation**:\n\n${issues.join('\n')}\n\nHere is an idiomatic skeleton to match:\n\`\`\`python\n${knowledge?.patternExample || optimalSolution?.code || sol?.optimalCode || '# Write your solution here'}\n\`\`\`\n\nUpdate your code and hit the green **Run (Ctrl+Enter)** button to test it against live test cases!`;
    }

    return `👍 **Your code has good structure!**\n\nMake sure your variables handle all boundary cases (like empty strings or single elements). Hit the green **Run (Ctrl+Enter)** button to run your solution against the visible test cases in the Terminal! If any case fails, tell me the error message and we'll fix it together!`;
  }

  // 6. Time and Space Complexity (Big-O)
  if (q.includes('complexity') || q.includes('big o') || q.includes('runtime') || q.includes('space') || q.includes('time')) {
    return `⚡ **Complexity Analysis for "${problemTitle}"**:\n\n- **Optimal Time Complexity**: \`${optimalSolution?.timeComplexity || sol?.timeComplexity || 'O(n)'}\`\n  *Why*: We scan or process each element a constant number of times.\n\n- **Auxiliary Space Complexity**: \`${optimalSolution?.spaceComplexity || sol?.spaceComplexity || 'O(1)'}\`\n  *Why*: Minimal extra memory beyond basic pointers/variables.\n\n💡 *Interview Tip*: Always state your Big-O upfront to the interviewer before jumping straight into code!`;
  }

  // 7. General Conversational / Socratic Response
  return `🤖 **Mentor Byte here!**\n\nRegarding: *"${message}"*\n\nFor **"${problemTitle}"**, remember:\n1. **Concept**: ${concept} — ${explanation}\n2. **Trap**: ${interviewTrap}\n3. Keep your code clean and Pythonic!\n\n${optimalSolution ? `**Optimal Pattern Reference**:\n\`\`\`python\n${optimalSolution.code}\n\`\`\`` : ''}\n\nWhat would you like to try next? You can edit your code in \`solution.py\` and hit **Run** anytime!`;
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
