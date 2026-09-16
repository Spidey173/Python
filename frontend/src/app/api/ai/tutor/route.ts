import { NextRequest, NextResponse } from 'next/server';
import { chatWithSeniorEngineer } from '@/lib/ai';

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
  hint_tier?: number;
  last_bug?: string | null;
  is_solved?: boolean;
  verbosity?: string;
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

  for (const m of history.slice(-8)) {
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
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1200,
      presence_penalty: 0,
      frequency_penalty: 0,
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

  for (const m of history.slice(-8)) {
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
        maxOutputTokens: 1200,
        temperature: 0.7,
        topP: 0.9,
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
  const messages = history.slice(-8).map((m) => ({
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
      max_tokens: 1200,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      top_p: 0.9,
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
      verbosity = 'short',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Dynamic Workload-Based LLM Invoker
    const llmInvoker = async (
      systemPrompt: string,
      userMsg: string,
      history: Array<{ role: string; content: string }>,
      intent?: string
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

      const providers = [tryGroq, tryGemini, tryClaude, tryOpenAI];

      for (const provider of providers) {
        const reply = await provider();
        if (reply && reply.trim()) return reply;
      }

      return '';
    };

    // Chat directly with Senior Engineer (Direct LLM call with tiny formatter)
    const output = await chatWithSeniorEngineer({
      message,
      code,
      challengeTitle: challenge_title,
      chatHistory: chat_history as any,
      llmInvoker: async (systemPrompt, userMsg, history) => {
        return llmInvoker(systemPrompt, userMsg, history);
      },
    });

    return NextResponse.json({
      reply: output.reply,
      socratic_hint: output.reply,
      next_step: undefined,
      confidence: 1.0,
      intent: 'general',
      teaching_request: 'chat',
      question_type: 'general',
      verbosity,
      max_words: undefined,
      tier: hint_tier || 1,
      role: 'Senior Engineer',
      astSummary: undefined,
      clarification_question: undefined,
    });
  } catch (error: any) {
    console.error('Tutor API error:', error);
    return NextResponse.json(
      {
        reply:
          "I ran into a temporary issue connecting to the AI service. What part of the problem or code can I help you with?",
        socratic_hint: 'Verify your logic and test case inputs.',
        confidence: 0.5,
      },
      { status: 200 }
    );
  }
}
