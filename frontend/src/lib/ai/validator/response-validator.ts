// Format-Only Response Validator
// A validator must NEVER change meaning, replace code, hide solutions, or inject warnings.
// Its ONLY job is fixing presentation formatting:
// - Close unclosed markdown code fences
// - Remove duplicate consecutive headings
// - Normalize excessive blank lines and whitespace
// - Guard against empty responses

import { ResponsePlan, ValidationResult } from '../types';

export function validateResponse(
  rawText: string,
  plan: ResponsePlan,
  userMessage: string = ''
): ValidationResult {
  let cleaned = (rawText || '').trim();
  let confidence = 0.95;

  // 1. Guard against empty response
  if (!cleaned || cleaned.length < 5) {
    return {
      isValid: false,
      cleanedResponse: "I'm here to help. What part of the problem would you like to work through?",
      confidence: 0.2,
      flags: {
        leakedSolutionPrematurely: false,
        unallowedCodeBlock: false,
        emptyOrExcessive: true,
        suggestClarification: true,
      },
      clarificationQuestion: 'What would you like help with?',
    };
  }

  // 2. Remove duplicate consecutive headings (e.g., "**How it works**" or "### Title" repeated twice)
  cleaned = cleaned.replace(/((\*\*|###)[^\n]+(\*\*|\n))\s*\1/gi, '$1');

  // 3. Ensure unclosed code fences are properly closed
  const fenceMatches = cleaned.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    cleaned += '\n```';
  }

  // 4. Normalize excessive newlines (max 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 5. Trim excessively long responses at natural paragraph breaks
  let emptyOrExcessive = false;
  if (cleaned.length > 3500) {
    emptyOrExcessive = true;
    const cutIdx = cleaned.lastIndexOf('\n\n', 2500);
    if (cutIdx > 1000) {
      cleaned = cleaned.slice(0, cutIdx).trim();
      // Re-verify code fences after cut
      const postCutFences = cleaned.match(/```/g);
      if (postCutFences && postCutFences.length % 2 !== 0) {
        cleaned += '\n```';
      }
    }
    confidence -= 0.1;
  }

  // 6. Ambiguity check for very short queries
  let suggestClarification = false;
  let clarificationQuestion: string | undefined;
  if (
    userMessage.length < 8 &&
    !['hi', 'hey', 'hello', 'yo', 'hint', 'help', 'debug', 'code', 'why'].includes(
      userMessage.toLowerCase().trim()
    )
  ) {
    suggestClarification = true;
    clarificationQuestion = 'What part would you like to focus on?';
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
