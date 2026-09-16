// Natural Language Post-Processing & Polisher
// Cleans robotic boilerplate, repetitive phrases, and awkward transitions to create ChatGPT/Claude-grade smoothness

const ROBOTIC_PREFIXES = [
  /^(certainly|sure thing|absolutely|of course)!?\s*(here (is|are)|i('d| would) be (happy|glad) to help( you)? with that\.?)?:?\s*/i,
  /^(great|excellent|fantastic) (question|observation|point)!?\s*/i,
  /^as an ai (language model|assistant|mentor),?\s*/i,
  /^let('s| us) (break this down|dive in|look at this) (step-by-step|together):?\s*/i,
  /^i hope this helps!?:?\s*/i,
  /^in conclusion,?\s*/i,
];

const ROBOTIC_TRANSITIONS = [
  { match: /\bIt is important to note that\b/gi, replacement: 'Note that' },
  { match: /\bIn order to\b/gi, replacement: 'To' },
  { match: /\bAs previously mentioned\b/gi, replacement: 'As noted earlier' },
  { match: /\bFeel free to ask if you have any questions!\b/gi, replacement: 'Let me know what you think!' },
];

export function polishNaturalLanguage(text: string): string {
  if (!text) return text;

  let cleaned = text.trim();

  // 1. Strip robotic prefixes
  for (const prefix of ROBOTIC_PREFIXES) {
    cleaned = cleaned.replace(prefix, '');
  }

  // 2. Smooth robotic transitions
  for (const { match, replacement } of ROBOTIC_TRANSITIONS) {
    cleaned = cleaned.replace(match, replacement);
  }

  // 3. Normalize excessive vertical spacing (max 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 4. Ensure code blocks are properly formatted
  cleaned = cleaned.replace(/```\s*\n\s*python/gi, '```python\n');

  // 5. Clean trailing robotic sign-offs if repeated
  cleaned = cleaned.replace(/\n\s*(happy coding|best regards|happy learning)[\s!.]*$/i, '');

  return cleaned.trim();
}
