// Teaching Request & Question Type Classifier (<1ms deterministic rule engine)
// Classifies student queries into TeachingRequest:
// ExplainProblem | ExplainConcept | ExplainCode | GiveHint | Debug | ShowSolution | Complexity | Compare | Review | Interview | General

import { QuestionType, TeachingRequest, StudentIntent, LearningSubIntent } from '../types';

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

export function classifyTeachingRequest(input: QuestionClassifierInput): TeachingRequest {
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

  // 1. ShowSolution ("Show me code", "give me code", "provide me the code")
  if (
    askingForFullCode ||
    /\b(give (me )?(the )?code|provide (me )?(the )?code|show (me )?(the )?code|full code|give code|provide code|show code|give solution|provide solution|full solution|just code|write the code)\b/i.test(lower)
  ) {
    return TeachingRequest.ShowSolution;
  }

  // 2. ExplainCode ("Explain the code", "line by line")
  if (
    /\b(explain (the|this|my) code|line by line|walk through (the|this) code|break down (the|this) code|how does (this|my) code work)\b/i.test(lower)
  ) {
    return TeachingRequest.ExplainCode;
  }

  // 3. ExplainProblem ("What is this problem asking?")
  if (
    /\b(what is (this|the) problem asking|what does (this|the) problem mean|explain (the|this) problem|understand (the|this) problem|what are we trying to do|what is it asking|problem description)\b/i.test(lower)
  ) {
    return TeachingRequest.ExplainProblem;
  }

  // 4. Debug ("Why is my code wrong?", errors, active bugs)
  if (
    hasErrorTrace ||
    hasActiveBug ||
    intent === 'debugging' ||
    /\b(why is my code wrong|what('s| is) wrong with my code|where is my mistake|why is this wrong|why does it fail|error|bug|traceback|syntaxerror|typeerror|indexerror|keyerror|returning none|returns none)\b/i.test(lower)
  ) {
    return TeachingRequest.Debug;
  }

  // 5. GiveHint ("I'm stuck", "give me a hint", "where do i start")
  if (
    /\b(i('m| am) stuck|stuck|give me a hint|need a hint|another hint|clue|nudge|where do i start|help me start|didn't get it|how to approach|what to do)\b/i.test(lower) ||
    (intent === 'learning' && (subIntent === 'hint' || subIntent === 'pattern'))
  ) {
    return TeachingRequest.GiveHint;
  }

  // 6. Compare ("difference between", "compare", "which is better")
  if (
    /\b(compare|difference between|which is better|versus|\bvs\b|alternative approach|other approach)\b/i.test(lower)
  ) {
    return TeachingRequest.Compare;
  }

  // 7. Complexity ("time complexity", "space complexity", "Big O")
  if (
    subIntent === 'complexity' ||
    /\b(time complexity|space complexity|big o|o\(n\)|runtime|memory complexity)\b/i.test(lower)
  ) {
    return TeachingRequest.Complexity;
  }

  // 8. ExplainConcept ("what is two pointers", "explain hash map", "intuition")
  if (
    subIntent === 'concept' ||
    /\b(what is|how does|explain concept|intuition behind|meaning of|analogy)\b/i.test(lower)
  ) {
    return TeachingRequest.ExplainConcept;
  }

  // 9. Review ("review my code", "check my code")
  if (
    intent === 'reviewing' ||
    /\b(review( my)? code|check my code|rate my code|feedback on( my)? code|critique)\b/i.test(lower)
  ) {
    return TeachingRequest.Review;
  }

  // 10. Interview ("mock interview", "interviewer question")
  if (
    intent === 'career' ||
    /\b(interview|mock interview|faang|maang|interviewer question)\b/i.test(lower)
  ) {
    return TeachingRequest.Interview;
  }

  // 11. General
  return TeachingRequest.General;
}

export function classifyQuestionType(input: QuestionClassifierInput): QuestionType {
  const req = classifyTeachingRequest(input);
  switch (req) {
    case TeachingRequest.ExplainProblem:
      return 'EXPLAIN_PROBLEM';
    case TeachingRequest.ExplainCode:
      return 'EXPLAIN_CODE';
    case TeachingRequest.GiveHint:
      return 'STUCK';
    case TeachingRequest.Debug:
      return 'WHY_ERROR';
    case TeachingRequest.ShowSolution:
      return 'SHOW_CODE';
    case TeachingRequest.Complexity:
      return 'COMPLEXITY';
    case TeachingRequest.Review:
      return 'REVIEW';
    case TeachingRequest.Interview:
      return 'GENERAL';
    case TeachingRequest.General:
    default:
      if (input.isGreeting) return 'GREETING';
      return 'GENERAL';
  }
}
