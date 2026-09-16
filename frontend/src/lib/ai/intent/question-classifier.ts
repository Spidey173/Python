// Question Type Classifier (<1ms deterministic rule engine)
// Classifies student queries into strict operational archetypes:
// EXPLAIN_PROBLEM | EXPLAIN_CODE | STUCK | WHY_ERROR | SHOW_CODE | GREETING | COMPLEXITY | REVIEW | GENERAL

import { QuestionType, StudentIntent, LearningSubIntent } from '../types';

export interface QuestionClassifierInput {
  message: string;
  intent: StudentIntent;
  subIntent?: LearningSubIntent;
  askingForFullCode: boolean;
  askingForSkeleton: boolean;
  hasErrorTrace: boolean;
  isGreeting: boolean;
  hasActiveBug: boolean;
}

export function classifyQuestionType(input: QuestionClassifierInput): QuestionType {
  const {
    message,
    intent,
    subIntent,
    askingForFullCode,
    hasErrorTrace,
    isGreeting,
    hasActiveBug,
  } = input;

  const lower = message.toLowerCase().trim();

  // 1. SHOW_CODE
  if (
    askingForFullCode ||
    /\b(give (me )?(the )?code|show (me )?code|show (the )?code|full code|give code|give solution|full solution|just code|write the code)\b/i.test(lower)
  ) {
    return 'SHOW_CODE';
  }

  // 2. EXPLAIN_CODE
  if (
    /\b(explain (the|this|my) code|line by line|walk through (the|this) code|break down (the|this) code|how does (this|my) code work)\b/i.test(lower)
  ) {
    return 'EXPLAIN_CODE';
  }

  // 3. EXPLAIN_PROBLEM
  if (
    /\b(what is (this|the) problem asking|what does (this|the) problem mean|explain (the|this) problem|understand (the|this) problem|what are we trying to do|what is it asking|problem description)\b/i.test(lower) ||
    (intent === 'learning' && subIntent === 'concept' && !/\b(i don('t| not) understand|confused|stuck)\b/i.test(lower))
  ) {
    return 'EXPLAIN_PROBLEM';
  }

  // 4. WHY_ERROR
  if (
    hasErrorTrace ||
    hasActiveBug ||
    intent === 'debugging' ||
    /\b(why is my code wrong|what('s| is) wrong with my code|where is my mistake|why is this wrong|why does it fail|error|bug|traceback|syntaxerror|typeerror|indexerror|keyerror|returning none|returns none)\b/i.test(lower)
  ) {
    return 'WHY_ERROR';
  }

  // 5. STUCK
  if (
    /\b(i('m| am) stuck|stuck|give me a hint|need a hint|another hint|clue|nudge|where do i start|help me start|i don('t| not) understand|confused|didn't get it|how to approach|what to do)\b/i.test(lower) ||
    (intent === 'learning' && (subIntent === 'hint' || subIntent === 'pattern'))
  ) {
    return 'STUCK';
  }

  // 6. COMPLEXITY
  if (
    subIntent === 'complexity' ||
    /\b(time complexity|space complexity|big o|o\(n\)|runtime|memory complexity)\b/i.test(lower)
  ) {
    return 'COMPLEXITY';
  }

  // 7. GREETING
  if (isGreeting || intent === 'greeting' || /^(hi|hello|hey|sup|yo|howdy)[\s!.]*$/i.test(lower)) {
    return 'GREETING';
  }

  // 8. REVIEW
  if (
    intent === 'reviewing' ||
    /\b(review( my)? code|check my code|rate my code|feedback on( my)? code|critique)\b/i.test(lower)
  ) {
    return 'REVIEW';
  }

  return 'GENERAL';
}
