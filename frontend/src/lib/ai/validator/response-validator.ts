// Response Validator
// Guards against empty/excessive responses. Never blocks code the student asked for.
// Rule: "When the student explicitly asks for something, give it."

import { ResponsePlan, TeachingPlan, ValidationResult } from '../types';

export function validateResponse(
  rawText: string,
  plan: ResponsePlan | TeachingPlan,
  userMessage: string,
  hintTier: number = 1
): ValidationResult {
  let cleaned = rawText.trim();
  let confidence = 0.95;

  let emptyOrExcessive = false;
  let suggestClarification = false;
  let clarificationQuestion: string | undefined;

  // 1. Check empty response
  if (!cleaned || cleaned.length < 5) {
    emptyOrExcessive = true;
    confidence = 0.2;
    return {
      isValid: false,
      cleanedResponse:
        "I'm here to help. What part of the problem would you like to work through?",
      confidence,
      flags: {
        leakedSolutionPrematurely: false,
        unallowedCodeBlock: false,
        emptyOrExcessive,
        suggestClarification: true,
      },
      clarificationQuestion: "What would you like help with?",
    };
  }

  // 2. Trim excessively long responses (keep it focused)
  if (cleaned.length > 3500) {
    emptyOrExcessive = true;
    const cutIdx = cleaned.lastIndexOf('\n\n', 2500);
    if (cutIdx > 1000) {
      cleaned = cleaned.slice(0, cutIdx);
    }
    confidence -= 0.1;
  }

  // 3. Ambiguity check for very short messages that aren't common keywords
  if (
    userMessage.length < 8 &&
    !['hi', 'hey', 'hello', 'yo', 'hint', 'help', 'debug', 'code', 'why'].includes(userMessage.toLowerCase().trim())
  ) {
    suggestClarification = true;
    clarificationQuestion = "What part would you like to focus on?";
  }

  return {
    isValid: true,
    cleanedResponse: cleaned,
    confidence: Math.max(0.2, Math.min(1.0, confidence)),
    flags: {
      leakedSolutionPrematurely: false,
      unallowedCodeBlock: false,
      emptyOrExcessive,
      suggestClarification,
    },
    clarificationQuestion,
  };
}

