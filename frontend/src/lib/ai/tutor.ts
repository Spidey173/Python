// Senior Engineer Chatbot Interface
// Thin wrapper around the LLM: Context -> System Prompt -> LLM -> Tiny Formatter.
// No planning, no contracts, no intermediate state machines.

import { SYSTEM_PROMPT } from './system-prompt';
import { formatResponse } from './formatter';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SeniorEngineerInput {
  message: string;
  code?: string;
  challengeTitle?: string;
  chatHistory?: Array<{ role: string; content: string }>;
  llmInvoker: (systemPrompt: string, userMessage: string, history: ChatMessage[]) => Promise<string>;
}

export interface SeniorEngineerOutput {
  reply: string;
}

export async function chatWithSeniorEngineer(
  input: SeniorEngineerInput
): Promise<SeniorEngineerOutput> {
  const { message, code = '', challengeTitle = '', chatHistory = [], llmInvoker } = input;

  // 1. Build contextual user message if code or challenge context is present
  const contextParts: string[] = [];

  if (challengeTitle && challengeTitle.trim().length > 0) {
    contextParts.push(`Challenge context: ${challengeTitle.trim()}`);
  }

  if (code && code.trim().length > 0) {
    contextParts.push(`Current code:\n\`\`\`python\n${code.trim()}\n\`\`\``);
  }

  contextParts.push(message.trim());
  const combinedUserMessage = contextParts.join('\n\n');

  // 2. Normalize recent chat history
  const normalizedHistory: ChatMessage[] = chatHistory.slice(-8).map((m) => ({
    role: m.role === 'assistant' || m.role === 'mentor' ? 'assistant' : 'user',
    content: m.content,
  }));

  // 3. Send directly to LLM
  let rawReply = '';
  try {
    rawReply = await llmInvoker(SYSTEM_PROMPT, combinedUserMessage, normalizedHistory);
  } catch (error) {
    console.error('LLM invocation failed in chatWithSeniorEngineer:', error);
  }

  // 4. Natural conversational fallback if LLM is unreachable
  if (!rawReply || !rawReply.trim()) {
    rawReply = getNaturalFallback(message, code);
  }

  // 5. Apply tiny formatting cleanup
  const reply = formatResponse(rawReply);

  return { reply };
}

function getNaturalFallback(message: string, code: string): string {
  const lower = message.toLowerCase().trim();

  // Direct code requests
  if (/\b(give (me )?(the )?(code|solution)|show (me )?(the )?(code|solution)|provide code|write code|full code|just code)\b/i.test(lower)) {
    return `Here is a clean implementation:\n\n\`\`\`python\ndef is_palindrome(s: str) -> bool:\n    left, right = 0, len(s) - 1\n    while left < right:\n        while left < right and not s[left].isalnum():\n            left += 1\n        while left < right and not s[right].isalnum():\n            right -= 1\n        if s[left].lower() != s[right].lower():\n            return False\n        left += 1\n        right -= 1\n    return True\n\`\`\`\n\nThis uses two pointers moving inward from both ends, skipping non-alphanumeric characters and comparing letters.`;
  }

  // Hints
  if (/\b(hint|clue|nudge)\b/i.test(lower)) {
    return "Think of reading the string from both ends simultaneously: how would you move pointers toward the center while skipping spaces and punctuation?";
  }

  // Failures with missing code
  if (/\b(fail|failed|broken|bug|error|wrong|not working)\b/i.test(lower) && (!code || code.trim().length === 0)) {
    return "Could you paste the code currently in your editor and the test output? Once I can see what is running, I'll point out the exact line causing the issue.";
  }

  // Explanations
  if (/\b(explain|how does|what is)\b/i.test(lower)) {
    return "The goal is to determine if the string reads identically forward and backward after stripping out punctuation and spaces. Using two pointers at opposite ends lets us verify this in a single O(n) pass with O(1) extra space.";
  }

  // Conversational default
  return "Hey! What part of this problem or code are you working on right now?";
}
