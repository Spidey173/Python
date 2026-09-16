// Response Style Engine
// Computes deterministic style attributes (depth, tone, technical level, example inclusion, follow-up)

import { ConversationState, ResponseStyle, StudentIntent } from '../types';

export function determineResponseStyle(
  state: ConversationState,
  intent: StudentIntent,
  userMessage: string
): ResponseStyle {
  const lower = userMessage.toLowerCase();

  // 1. Tone Determination
  let tone: ResponseStyle['tone'] = 'neutral';
  if (state.isSolved) {
    tone = 'celebratory';
  } else if (
    state.attemptCount >= 3 ||
    /\b(still (failing|broken)|not working|stuck|why does it|frustrated|again)\b/i.test(lower)
  ) {
    tone = 'supportive';
  }

  // 2. Depth Determination
  let depth: ResponseStyle['depth'] = 'normal';
  if (/\b(brief|short|quick|tldr|one line)\b/i.test(lower)) {
    depth = 'brief';
  } else if (/\b(detailed|explain fully|deep dive|comprehensive|walkthrough)\b/i.test(lower)) {
    depth = 'detailed';
  }

  // 3. Technical Level
  let technicalLevel: ResponseStyle['technicalLevel'] = 'intermediate';
  if (/\b(beginner|simple terms|eli5|plain english|new to python)\b/i.test(lower)) {
    technicalLevel = 'beginner';
  } else if (/\b(senior|optimal|in-place|cpython|bytecode|advanced)\b/i.test(lower)) {
    technicalLevel = 'advanced';
  }

  // 4. Example and Diagram Flags
  const includeExample =
    depth !== 'brief' &&
    (/\b(example|sample|pattern|skeleton|how to use)\b/i.test(lower) || intent === 'learning');

  const includeDiagram =
    depth === 'detailed' && /\b(diagram|visualize|step by step)\b/i.test(lower);

  // 5. Ask Followup Question
  const askFollowup =
    intent === 'greeting' ||
    (intent === 'learning' && state.hintLevel <= 2) ||
    tone === 'supportive';

  return {
    depth,
    tone,
    technicalLevel,
    includeExample,
    includeDiagram,
    askFollowup,
  };
}

export function formatStyleDirective(style: ResponseStyle): string {
  const items: string[] = [];
  items.push(`Tone: ${style.tone}`);
  items.push(`Depth: ${style.depth}`);
  items.push(`Level: ${style.technicalLevel}`);
  if (style.includeExample) items.push('Include 1 clear micro-example');
  if (style.askFollowup) items.push('Conclude with 1 Socratic check-in question');
  else items.push('Do NOT force a question at the end');

  return items.join(' | ');
}
