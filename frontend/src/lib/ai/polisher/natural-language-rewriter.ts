// Light Natural Language Polisher
// Strictly handles robotic conversational cleanup:
// - Strips chatbot filler prefixes ("Certainly! I'd be happy to help...")
// - Strips generic chatbot sign-offs ("Happy coding!")
// - Strips leftover refusal or withholding tags
// DOES NOT REWRITE EXPLANATIONS OR ALTER SEMANTICS.

const ROBOTIC_PREFIXES = [
  /^(certainly|sure thing|absolutely|of course)!?\s*(here (is|are)|i('d| would) be (happy|glad) to help( you)? with that\.?)?\s*:?\s*/i,
  /^(great|excellent|fantastic|good) (question|observation|point)!?\s*/i,
  /^as an ai (language model|assistant|mentor),?\s*/i,
  /^let('s| us) (break this down|dive in|look at this|explore) (step-by-step|together|further):?\s*/i,
  /^i hope this helps!?:?\s*/i,
  /^in conclusion,?\s*/i,
  /^(so,? )?to (summarize|sum up|wrap up),?\s*/i,
  /^(alright|okay|so),?\s*(let('s| me)|here('s| is)),?\s*/i,
];

const ROBOTIC_SECTIONS = [
  /###?\s*Direct Diagnosis:?\s*/gi,
  /\*\*Direct Diagnosis:\*\*\s*/gi,
  /###?\s*Why this happens:?\s*/gi,
  /\*\*Why this happens:\*\*\s*/gi,
  /###?\s*Verification Tip:?\s*/gi,
  /\*\*Verification Tip:\*\*\s*/gi,
  /###?\s*Micro-example:?\s*/gi,
  /\*\*Micro-example:\*\*\s*/gi,
  /###?\s*Socratic Check-in:?\s*/gi,
  /\*\*Socratic Check-in:\*\*\s*/gi,
  /###?\s*Socratic Question:?\s*/gi,
  /\*\*Socratic Question:\*\*\s*/gi,
  /###?\s*Key (Takeaway|Insight|Point):?\s*/gi,
  /\*\*Key (Takeaway|Insight|Point):\*\*\s*/gi,
  /###?\s*Summary:?\s*/gi,
  /\*\*Summary:\*\*\s*/gi,
];

export function polishNaturalLanguage(text: string): string {
  if (!text) return text;

  let cleaned = text.trim();

  // 1. Strip robotic prefixes
  for (const prefix of ROBOTIC_PREFIXES) {
    cleaned = cleaned.replace(prefix, '');
  }

  // 2. Strip artificial mentor section headers
  for (const section of ROBOTIC_SECTIONS) {
    cleaned = cleaned.replace(section, '');
  }

  // 3. Normalize excessive vertical spacing (max 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 4. Ensure code blocks are properly formatted
  cleaned = cleaned.replace(/```\s*\n\s*python/gi, '```python\n');

  // 5. Clean trailing robotic sign-offs
  cleaned = cleaned.replace(
    /\n\s*(happy coding|best regards|happy learning|good luck|let me know)[^\n]*$/i,
    ''
  );

  // 6. Strip any leftover refusal or code-withholding artifacts
  cleaned = cleaned.replace(/>?\s*💡?\s*\*?\[Code withheld[^\]]*\]\*?\s*/gi, '');
  cleaned = cleaned.replace(/>\s*Focus on the rule first:[^\n]*\n?/gi, '');

  return cleaned.trim();
}
