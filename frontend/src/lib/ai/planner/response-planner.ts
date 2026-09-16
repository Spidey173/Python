// Structured Response Planner (PyForge Teaching Philosophy)
// "Teach first. Explain second. Lecture only when asked."
// "One question → one answer. One concept → one explanation. One mistake → one fix."

import {
  ErrorAnalysisResult,
  FactualASTSummary,
  HelpTier,
  LearningSubIntent,
  QuestionType,
  ResponsePlan,
  ResponseStyle,
  StudentIntent,
} from '../types';
import { classifyQuestionType } from '../intent/question-classifier';

export function createResponsePlan(
  intent: StudentIntent,
  subIntent: LearningSubIntent | undefined,
  tier: HelpTier,
  style: ResponseStyle,
  errorAnalysis: ErrorAnalysisResult,
  ast: FactualASTSummary,
  askingForFullCode: boolean = false,
  userMessage: string = '',
  hasActiveBug: boolean = false,
  isGreeting: boolean = false
): ResponsePlan {
  const questionType: QuestionType = classifyQuestionType({
    message: userMessage,
    intent,
    subIntent,
    askingForFullCode,
    askingForSkeleton: subIntent === 'pattern' || tier === 4,
    hasErrorTrace: errorAnalysis.errorType !== 'none',
    isGreeting,
    hasActiveBug,
  });

  // 1. SHOW_CODE
  if (questionType === 'SHOW_CODE') {
    return {
      questionType,
      goal: 'Python code block followed by "**How it works**" with 4-5 bullet points. No essay.',
      teachingGoal: 'Direct working code with 5 simple bullet points.',
      role: 'tutor',
      responseLength: 'medium',
      revealSolution: true,
      includeCode: true,
      askQuestionAtEnd: false,
      structure: [
        '```python\n[Clean, minimal code]\n```',
        '**How it works**',
        '* [bullet 1]',
        '* [bullet 2]',
        '* [bullet 3]',
        '* [bullet 4]',
        '* [bullet 5]',
        'Stop.',
      ],
      confidence: 0.99,
    };
  }

  // 2. EXPLAIN_CODE
  if (questionType === 'EXPLAIN_CODE') {
    return {
      questionType,
      goal: 'Explain the code line by line. 1-2 simple sentences each.',
      teachingGoal: 'Line 1 -> what it does -> Line 2 -> what it does. No syntax lecture.',
      role: 'explainer',
      responseLength: 'medium',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        'Line by line walkthrough',
        'Each line or block gets 1-2 simple sentences',
        'Do not explain basic Python syntax unless asked',
        'Stop.',
      ],
      confidence: 0.98,
    };
  }

  // 3. EXPLAIN_PROBLEM
  if (questionType === 'EXPLAIN_PROBLEM') {
    return {
      questionType,
      goal: 'Reply in exact 4-part slot format: In simple words, Input, Output, Example. 30 seconds to read.',
      teachingGoal: 'Stop right after example. Do NOT explain Big-O, edge cases, or algorithms.',
      role: 'explainer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        '**In simple words**\n(1-2 sentences)',
        '**Input**\n(one line)',
        '**Output**\n(one line)',
        '**Example**\n(one tiny example: input -> output)',
        'Stop. Nothing else.',
      ],
      confidence: 0.99,
    };
  }

  // 4. WHY_ERROR
  if (questionType === 'WHY_ERROR') {
    return {
      questionType,
      goal: 'Explain only the single biggest mistake in under 80 words.',
      teachingGoal: 'Problem -> Reason -> How to fix. Do NOT review the whole program.',
      role: 'debugger',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        'Problem: [1 sentence naming the biggest mistake]',
        'Reason: [1 sentence explaining why it happened]',
        'How to fix: [1 sentence telling them what to check]',
        'Stop. Under 80 words total.',
      ],
      confidence: 0.96,
    };
  }

  // 5. STUCK
  if (questionType === 'STUCK') {
    return {
      questionType,
      goal: '40 words. One idea, one hint, one question. Like a senior dev sitting next to them.',
      teachingGoal: 'Encourage and guide with 1 idea + 1 hint + 1 question.',
      role: 'tutor',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        "You're not far off.",
        'One idea: [1 sentence on the core pattern/strategy]',
        'One hint: [1-2 sentences on what to try next]',
        'One question: [1 small question to spark their thinking]',
        'Stop. Total 40-50 words.',
      ],
      confidence: 0.97,
    };
  }

  // 6. COMPLEXITY
  if (questionType === 'COMPLEXITY') {
    return {
      questionType,
      goal: 'Time and space complexity in 2 sentences.',
      teachingGoal: 'Plain English. No huge tables.',
      role: 'explainer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: false,
      structure: [
        'Time: O(...) (1 sentence why)',
        'Space: O(...) (1 sentence why)',
        'Stop.',
      ],
      confidence: 0.96,
    };
  }

  // 7. GREETING
  if (questionType === 'GREETING') {
    return {
      questionType,
      goal: 'Short, warm greeting from a senior teammate across the desk.',
      teachingGoal: '1 sentence acknowledgment + 1 question. Under 25 words.',
      role: 'tutor',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        'Hey! Working on this with you.',
        'What part do you want to tackle first?',
      ],
      confidence: 0.99,
    };
  }

  // 8. REVIEW
  if (questionType === 'REVIEW') {
    return {
      questionType,
      goal: '1 thing done well, 1 clean improvement. Under 80 words.',
      teachingGoal: 'Friendly and direct. No checklist essay.',
      role: 'reviewer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        'One thing done well (1 sentence)',
        'One clean improvement (1-2 sentences)',
        'Stop.',
      ],
      confidence: 0.93,
    };
  }

  // 9. GENERAL Fallback
  return {
    questionType,
    goal: 'Direct answer in 2-3 simple sentences. Under 80 words.',
    teachingGoal: 'One question -> one answer. No essay.',
    role: 'tutor',
    responseLength: 'short',
    revealSolution: false,
    includeCode: false,
    askQuestionAtEnd: false,
    structure: [
      'Direct answer in 2-3 simple sentences',
      'Stop.',
    ],
    confidence: 0.88,
  };
}

export function formatPlanDirective(plan: ResponsePlan): string {
  const lines: string[] = [];
  lines.push(`QUESTION ARCHETYPE: ${plan.questionType}`);
  lines.push(`LENGTH BUDGET: ${plan.responseLength.toUpperCase()} (Keep strictly under 120 words unless showing code)`);
  lines.push(`FILL-IN TEMPLATE SLOTS:\n${plan.structure.map((s) => `  - ${s}`).join('\n')}`);
  lines.push('CRITICAL: Fill only the template slots above. Do NOT add headings like "Direct Diagnosis", "Why this happens", or "Verification Tip". Answer naturally.');

  return lines.join('\n');
}

