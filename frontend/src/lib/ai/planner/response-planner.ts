// Structured Response Planner (PyForge Teaching Philosophy)
// "Teach first. Explain second. Lecture only when asked."

import {
  ErrorAnalysisResult,
  FactualASTSummary,
  HelpTier,
  LearningSubIntent,
  ResponsePlan,
  ResponseStyle,
  StudentIntent,
} from '../types';

export function createResponsePlan(
  intent: StudentIntent,
  subIntent: LearningSubIntent | undefined,
  tier: HelpTier,
  style: ResponseStyle,
  errorAnalysis: ErrorAnalysisResult,
  ast: FactualASTSummary,
  askingForFullCode: boolean = false,
  userMessage: string = ''
): ResponsePlan {
  const lowerMsg = (userMessage || '').toLowerCase().trim();

  // 1. Give me the code
  if (askingForFullCode || /\b(give (me )?(the )?code|show (me )?code|full solution)\b/i.test(lowerMsg) || (intent === 'learning' && subIntent === 'walkthrough' && tier === 5)) {
    return {
      goal: 'Give the working code, then 4-6 short bullet points under "**How it works**".',
      teachingGoal: 'Direct and simple. No essay. No extra sections.',
      role: 'tutor',
      responseLength: 'medium',
      revealSolution: true,
      includeCode: true,
      askQuestionAtEnd: false,
      structure: [
        'Clean Python code block',
        '**How it works** heading followed by 4-6 short bullet points',
        'Stop there (no essay)',
      ],
      confidence: 0.99,
    };
  }

  // 2. Explain the code
  if (/\b(explain (the|this|my) code|line by line|walk through (the|this) code)\b/i.test(lowerMsg)) {
    return {
      goal: 'Explain the code line by line. Each line or block gets 1-2 simple sentences.',
      teachingGoal: 'Line-by-line explanation. Do not explain basic Python syntax they already know.',
      role: 'explainer',
      responseLength: 'medium',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        'Go line by line',
        'Each explanation should be 1-2 simple sentences',
        'Stop. No essay.',
      ],
      confidence: 0.98,
    };
  }

  // 3. Why is my code wrong?
  if (intent === 'debugging' || errorAnalysis.errorType !== 'none' || /\b(why is my code wrong|what('s| is) wrong with my code|my mistake)\b/i.test(lowerMsg)) {
    return {
      goal: 'Find the biggest mistake and explain only that mistake. Maximum 150 words.',
      teachingGoal: 'Do NOT review the whole program. Do not list 5 possible things. Talk like a teammate.',
      role: 'debugger',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        'State the biggest mistake in 1-2 simple sentences',
        'Explain what rule was broken (under 150 words)',
        'Tell them what to check without giving the whole answer',
      ],
      confidence: 0.95,
    };
  }

  // 4. Greeting
  if (intent === 'greeting') {
    return {
      goal: 'Short, warm greeting from a senior teammate (2 sentences max).',
      teachingGoal: 'No customer support tone. One friendly sentence and an open question.',
      role: 'tutor',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        'Hey! Working on [Problem Name] with you.',
        'What part do you want to tackle first?',
      ],
      confidence: 0.99,
    };
  }

  // 5. What is this problem asking?
  if (/\b(what is (this|the) problem asking|what does (this|the) problem mean|explain (the|this) problem)\b/i.test(lowerMsg) || (intent === 'learning' && subIntent === 'concept' && !/\b(i don('t| not) understand|confused)\b/i.test(lowerMsg))) {
    return {
      goal: 'Reply in exact format: In simple words, Input, Output, Example. Stop.',
      teachingGoal: 'Stop right after the example. Do NOT explain Big-O, edge cases, or algorithms.',
      role: 'explainer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        '**In simple words:** (1-2 sentences)',
        '**Input:** (one line)',
        '**Output:** (one line)',
        '**Example:** (one tiny example showing input -> output)',
        'STOP there.',
      ],
      confidence: 0.99,
    };
  }

  // 6. I don't understand
  if (/\b(i don('t| not) understand|confused|didn't get it)\b/i.test(lowerMsg)) {
    return {
      goal: 'Explain the idea in 3-5 simple sentences using everyday language.',
      teachingGoal: 'Avoid technical words if possible. No essay.',
      role: 'explainer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        'Explain the core idea in 3-5 simple sentences',
        'Use everyday language, avoid technical jargon',
      ],
      confidence: 0.98,
    };
  }

  // 5. Complexity
  if (subIntent === 'complexity') {
    return {
      goal: 'State target time and memory in 2-3 sentences. No huge tables.',
      teachingGoal: 'Short and conversational.',
      role: 'explainer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        'Time complexity in plain English',
        'Memory complexity in plain English',
      ],
      confidence: 0.96,
    };
  }

  // 6. Give me a hint (ONE hint only, max 3 sentences + 1 question)
  if (intent === 'learning') {
    if (subIntent === 'pattern' || tier === 4) {
      return {
        goal: 'Provide a code skeleton with # TODO comments where student fills logic.',
        teachingGoal: 'Scaffold only.',
        role: 'tutor',
        responseLength: 'medium',
        revealSolution: false,
        includeCode: true,
        askQuestionAtEnd: true,
        structure: [
          'Code skeleton with # TODO comments',
          'One rule to remember while filling it in',
        ],
        confidence: 0.94,
      };
    }

    return {
      goal: 'Give ONE hint only. Maximum 3 sentences. End with one small question. Stop.',
      teachingGoal: 'Smallest explanation possible.',
      role: 'tutor',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        'ONE hint only (max 3 sentences)',
        'End with one small question to make them think',
        'Stop.',
      ],
      confidence: 0.95,
    };
  }

  // 7. Reviewing
  if (intent === 'reviewing') {
    return {
      goal: 'Mention 1 thing done well, and 1 clean improvement.',
      teachingGoal: 'Under 120 words. Friendly and direct.',
      role: 'reviewer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        'One thing done well',
        'One clean tip to improve it',
      ],
      confidence: 0.93,
    };
  }

  // Fallback
  return {
    goal: 'Answer directly in 2-4 simple sentences. No essay.',
    teachingGoal: 'Less is better. Simple is better.',
    role: 'tutor',
    responseLength: 'short',
    revealSolution: false,
    includeCode: false,
    askQuestionAtEnd: false,
    structure: ['Direct answer in 2-4 sentences'],
    confidence: 0.85,
  };
}

export function formatPlanDirective(plan: ResponsePlan): string {
  const lines: string[] = [];
  lines.push(`Goal: ${plan.goal}`);
  lines.push(`Length: ${plan.responseLength.toUpperCase()}`);
  lines.push(`Format Instructions:\n${plan.structure.map((s) => `  - ${s}`).join('\n')}`);
  lines.push('Do NOT output template section names like "Direct Diagnosis" or "Verification Tip". Speak naturally.');

  return lines.join('\n');
}
