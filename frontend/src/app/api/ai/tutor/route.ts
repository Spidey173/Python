import { NextRequest, NextResponse } from 'next/server';
import { runCognitivePipeline, HelpTier, StudentIntent } from '@/lib/ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'mentor';
  content: string;
}

interface TutorRequestBody {
  message: string;
  code?: string;
  challenge_id?: number;
  challenge_title?: string;
  chat_history?: ChatMessage[];
  attempt_count?: number;
  hint_tier?: HelpTier;
  last_bug?: string | null;
  is_solved?: boolean;
}

// Provider 1: Call Groq / OpenAI / OpenRouter API
async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const messages: any[] = [{ role: 'system', content: systemPrompt }];

  for (const m of history.slice(-4)) {
    messages.push({
      role: m.role === 'assistant' || m.role === 'mentor' ? 'assistant' : 'user',
      content: m.content,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  const url = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl.replace(/\/$/, '')}/chat/completions`;

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
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI-compatible error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// Provider 2: Call Google Gemini API
async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const contents = [];

  for (const m of history.slice(-4)) {
    contents.push({
      role: m.role === 'assistant' || m.role === 'mentor' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.6,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Provider 3: Call Anthropic Claude API
async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const messages = history.slice(-4).map((m) => ({
    role: m.role === 'assistant' || m.role === 'mentor' ? 'assistant' : 'user',
    content: m.content,
  }));

  messages.push({ role: 'user', content: userMessage });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export async function POST(req: NextRequest) {
  try {
    const body: TutorRequestBody = await req.json();
    const {
      message,
      code = '',
      challenge_id = 1,
      challenge_title,
      chat_history = [],
      attempt_count = 1,
      hint_tier = 1,
      last_bug = null,
      is_solved = false,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Dynamic Workload-Based LLM Invoker
    const llmInvoker = async (
      systemPrompt: string,
      userMsg: string,
      history: Array<{ role: string; content: string }>,
      intent?: StudentIntent
    ): Promise<string> => {
      const groqKey = process.env.GROQ_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const claudeKey = process.env.ANTHROPIC_API_KEY;
      const openAIKey =
        process.env.OPENAI_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        process.env.GITHUB_TOKEN ||
        process.env.COPILOT_API_KEY;

      const tryGroq = async () => {
        if (!groqKey) return '';
        try {
          return await callOpenAICompatible(
            'https://api.groq.com/openai/v1',
            groqKey,
            process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
            systemPrompt,
            userMsg,
            history as ChatMessage[]
          );
        } catch {
          return '';
        }
      };

      const tryClaude = async () => {
        if (!claudeKey) return '';
        try {
          return await callClaude(claudeKey, systemPrompt, userMsg, history as ChatMessage[]);
        } catch {
          return '';
        }
      };

      const tryGemini = async () => {
        if (!geminiKey) return '';
        try {
          return await callGemini(geminiKey, systemPrompt, userMsg, history as ChatMessage[]);
        } catch {
          return '';
        }
      };

      const tryOpenAI = async () => {
        if (!openAIKey) return '';
        const baseUrl =
          process.env.OPENAI_API_BASE ||
          (process.env.OPENROUTER_API_KEY
            ? 'https://openrouter.ai/api/v1'
            : process.env.GITHUB_TOKEN
            ? 'https://models.inference.ai.azure.com'
            : 'https://api.openai.com/v1');
        const model =
          process.env.OPENAI_MODEL ||
          (process.env.OPENROUTER_API_KEY ? 'meta-llama/llama-3.3-70b-instruct:free' : 'gpt-4o-mini');
        try {
          return await callOpenAICompatible(baseUrl, openAIKey, model, systemPrompt, userMsg, history as ChatMessage[]);
        } catch {
          return '';
        }
      };

      // Workload routing: Code reviews & complex debugs route to Claude/Gemini first
      // Quick hints & general learn route to ultra-low-latency Groq first
      const providers =
        intent === 'reviewing' || intent === 'debugging'
          ? [tryClaude, tryGemini, tryGroq, tryOpenAI]
          : [tryGroq, tryGemini, tryClaude, tryOpenAI];

      for (const provider of providers) {
        const reply = await provider();
        if (reply && reply.trim()) return reply;
      }

      return '';
    };

    // Execute the State-First Cognitive Pipeline
    const output = await runCognitivePipeline({
      message,
      code,
      challengeId: challenge_id,
      challengeTitle: challenge_title,
      chatHistory: chat_history,
      stateOverrides: {
        attemptCount: attempt_count,
        hintLevel: hint_tier,
        lastBug: last_bug,
        isSolved: is_solved,
      },
      llmInvoker,
    });

    return NextResponse.json({
      reply: output.reply,
      socratic_hint: output.socratic_hint,
      confidence: output.confidence,
      intent: output.intent,
      question_type: output.questionType,
      tier: output.tier,
      role: output.role,
      astSummary: output.astSummary,
      clarification_question: output.clarificationQuestion,
    });
  } catch (error: any) {
    console.error('Tutor cognitive pipeline error:', error);
    return NextResponse.json(
      {
        reply:
          "I ran into an issue connecting to the reasoning pipeline. What part of the logic or edge case are you working on?",
        socratic_hint: 'Verify loop bounds and terminal stdout print(...).',
        confidence: 0.5,
      },
      { status: 200 }
    );
  }
}
