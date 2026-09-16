// Natural Language Post-Processing & Polisher
// Catches robotic boilerplate, documentation-style syntax explanations,
// and converts them into natural senior-developer speech

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

const ROBOTIC_TRANSITIONS = [
  { match: /\bIt is important to note that\b/gi, replacement: 'Note that' },
  { match: /\bIn order to\b/gi, replacement: 'To' },
  { match: /\bAs previously mentioned\b/gi, replacement: 'As noted earlier' },
  { match: /\bFeel free to ask if you have any questions!?\b/gi, replacement: '' },
  { match: /\bDon't hesitate to ask!?\b/gi, replacement: '' },
  { match: /\bI'd be happy to (help|explain) (further|more)!?\b/gi, replacement: '' },
  { match: /\bThis is (a common|an important) concept\b/gi, replacement: 'This' },
  { match: /\bIt('s| is) worth noting that\b/gi, replacement: '' },
  { match: /\bAs you can see,?\s*/gi, replacement: '' },
  { match: /\bAs we (can|will) see,?\s*/gi, replacement: '' },
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

// Catch syntax-focused explanations and documentation-style phrasing
const SYNTAX_EXPLANATIONS = [
  { match: /\bthis (increments|decrements) (the )?(variable|counter|index|pointer)\b/gi, replacement: 'move to the next one' },
  { match: /\bthis (assigns|sets) the (value|variable)\b/gi, replacement: 'this stores the result' },
  { match: /\bthe for loop iterates over\b/gi, replacement: 'we go through each item in' },
  { match: /\bthe while loop (continues|runs) (until|while)\b/gi, replacement: 'we keep going until' },
  { match: /\bthis (initializes|declares) (the |a )(variable|list|array|dictionary|hash map|set)\b/gi, replacement: 'we start with' },
  { match: /\bthis returns the (result|value|answer)\b/gi, replacement: 'we send back the answer' },
  { match: /\bthe (function|method) (takes|accepts|receives)\b/gi, replacement: 'we pass in' },
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

  // 3. Smooth robotic transitions
  for (const { match, replacement } of ROBOTIC_TRANSITIONS) {
    cleaned = cleaned.replace(match, replacement);
  }

  // 4. Soften syntax-focused explanations into intent-focused language
  for (const { match, replacement } of SYNTAX_EXPLANATIONS) {
    cleaned = cleaned.replace(match, replacement);
  }

  // 5. Normalize excessive vertical spacing (max 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 6. Ensure code blocks are properly formatted
  cleaned = cleaned.replace(/```\s*\n\s*python/gi, '```python\n');

  // 7. Clean trailing robotic sign-offs
  cleaned = cleaned.replace(/\n\s*(happy coding|best regards|happy learning|good luck|let me know)[^\n]*$/i, '');

  return cleaned.trim();
}

