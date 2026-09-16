// Deterministic Response Validator
// Checks solution leakage, code block constraints, response bounds, and confidence

import { ResponsePlan, TeachingPlan, ValidationResult } from '../types';

export function validateResponse(
  rawText: string,
  plan: ResponsePlan | TeachingPlan,
  userMessage: string,
  hintTier: number = 1
): ValidationResult {
  let cleaned = rawText.trim();
  let confidence = 0.95;

  let leakedSolutionPrematurely = false;
  let unallowedCodeBlock = false;
  let emptyOrExcessive = false;
  let suggestClarification = false;
  let clarificationQuestion: string | undefined;

  const revealSolutionAllowed = 'revealSolution' in plan ? plan.revealSolution : plan.allowFullSolution;
  const includeCodeAllowed = 'includeCode' in plan ? plan.includeCode : plan.allowCode;
  const effectiveTier = 'helpLevel' in plan ? plan.helpLevel : hintTier;

  // 1. Check empty or excessively long response
  if (!cleaned || cleaned.length < 5) {
    emptyOrExcessive = true;
    confidence = 0.2;
    return {
      isValid: false,
      cleanedResponse:
        "I'm here to help. What part of the problem or implementation would you like to explore?",
      confidence,
      flags: { leakedSolutionPrematurely, unallowedCodeBlock, emptyOrExcessive, suggestClarification: true },
      clarificationQuestion: "Could you tell me what specific part you'd like to work through?",
    };
  }

  if (cleaned.length > 3500) {
    emptyOrExcessive = true;
    const cutIdx = cleaned.lastIndexOf('\n\n', 2500);
    if (cutIdx > 1000) {
      cleaned = cleaned.slice(0, cutIdx) + '\n\n*(Summary condensed for clarity)*';
    }
    confidence -= 0.1;
  }

  // 2. Check for premature full code solution (Tier 1-3)
  const pythonCodeBlockRegex = /```(?:python)?\s*([\s\S]*?)```/gi;
  const matches = [...cleaned.matchAll(pythonCodeBlockRegex)];

  if (!revealSolutionAllowed && effectiveTier <= 3) {
    for (const m of matches) {
      const blockCode = m[1];
      const lines = blockCode.split('\n').filter((l) => l.trim().length > 0);

      // If model emitted a complete function or multi-line executable solution
      if (
        lines.length >= 3 &&
        (blockCode.includes('def ') || blockCode.includes('return ') || blockCode.includes('print('))
      ) {
        leakedSolutionPrematurely = true;
        confidence -= 0.2;
        // Replace leaked block with conceptual blueprint
        cleaned = cleaned.replace(
          m[0],
          `> 💡 *[Full code withheld for Progressive Learning Tier ${effectiveTier}]*\n> Focus on the invariant first: try writing out the loop and pointer checks step-by-step!`
        );
      }
    }
  }

  // 3. Check for leftover code blocks when code is strictly forbidden (Tier 1 Nudge)
  if (!includeCodeAllowed && effectiveTier === 1 && !leakedSolutionPrematurely && matches.length > 0) {
    unallowedCodeBlock = true;
    confidence -= 0.15;
    // Convert code block into inline emphasis to preserve intuition without spoiler
    cleaned = cleaned.replace(pythonCodeBlockRegex, '`$1`');
  }

  // 4. Ambiguity / Clarification check
  if (
    userMessage.length < 8 &&
    !['hi', 'hey', 'hello', 'yo', 'hint', 'help', 'debug'].includes(userMessage.toLowerCase().trim())
  ) {
    suggestClarification = true;
    clarificationQuestion = "Could you specify which part of the code or test case you're investigating?";
  }

  return {
    isValid: true,
    cleanedResponse: cleaned,
    confidence: Math.max(0.2, Math.min(1.0, confidence)),
    flags: {
      leakedSolutionPrematurely,
      unallowedCodeBlock,
      emptyOrExcessive,
      suggestClarification,
    },
    clarificationQuestion,
  };
}
