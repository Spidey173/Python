// Structured Response Planner (PyForge Teaching Philosophy)
// Enforces: Minimal explanation, short sentences, no unnecessary sections, conversation over documentation

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
  askingForFullCode: boolean = false
): ResponsePlan {
  // 1. Solution Request / Full Code
  if (askingForFullCode || (intent === 'learning' && subIntent === 'walkthrough' && tier === 5)) {
    return {
      goal: 'Give clean Python code, followed by 4-6 simple bullet points explaining how it works.',
      teachingGoal: 'Direct and simple. No essay. No extra sections.',
      role: 'tutor',
      responseLength: 'medium',
      revealSolution: true,
      includeCode: true,
      askQuestionAtEnd: false,
      structure: [
        '1. Clean Python Code Block',
        '2. 4 to 6 simple bullet points explaining how it works',
        '3. Stop there (no extra theory)',
      ],
      confidence: 0.99,
    };
  }

  // 2. Debugging Flow (Under 180 words, ONE main issue only)
  if (intent === 'debugging' || errorAnalysis.errorType !== 'none') {
    return {
      goal: 'Point out the ONE main bug in their code and explain only that issue.',
      teachingGoal: 'Do not list five possible things. Speak like a senior dev sitting next to them.',
      role: 'debugger',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        '1. Name the ONE main issue directly (e.g. index bounds or loop update)',
        '2. Plain English explanation of why it happens (2-3 sentences)',
        '3. Tell them what specific line or rule to check',
      ],
      confidence: 0.95,
    };
  }

  // 3. Greeting Flow (2 sentences max)
  if (intent === 'greeting') {
    return {
      goal: 'Short, warm greeting as a senior teammate.',
      teachingGoal: 'Keep it to 2 sentences. No customer support tone.',
      role: 'tutor',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        '1. Hey! Working on [Problem Name] with you.',
        '2. What part do you want to tackle first?',
      ],
      confidence: 0.99,
    };
  }

  // 4. Problem Explanation ("What is this problem asking?")
  if (subIntent === 'concept' || intent === 'learning') {
    if (subIntent === 'concept') {
      return {
        goal: 'Explain what the problem is asking in under 120 words.',
        teachingGoal: '1. What the input is. 2. What output is expected. 3. ONE simple example. Stop there.',
        role: 'explainer',
        responseLength: 'short',
        revealSolution: false,
        includeCode: false,
        askQuestionAtEnd: false,
        structure: [
          '1. Input: What data is given',
          '2. Output: What should be returned or printed',
          '3. One clean example with expected result',
          '4. Stop there (do not mention Big O, edge cases, or algorithms)',
        ],
        confidence: 0.95,
      };
    }

    if (subIntent === 'complexity') {
      return {
        goal: 'State the target Big-O time and memory in 2-3 sentences.',
        teachingGoal: 'Short and conversational. No huge tables.',
        role: 'explainer',
        responseLength: 'short',
        revealSolution: false,
        includeCode: false,
        askQuestionAtEnd: false,
        structure: [
          '1. Target Time Complexity in plain English',
          '2. Target Space Complexity in plain English',
        ],
        confidence: 0.96,
      };
    }

    if (subIntent === 'pattern' || tier === 4) {
      return {
        goal: 'Provide a code skeleton with # TODO comments where student fills logic.',
        teachingGoal: 'Scaffold only. Do not complete the solution.',
        role: 'tutor',
        responseLength: 'medium',
        revealSolution: false,
        includeCode: true,
        askQuestionAtEnd: true,
        structure: [
          '1. Code Skeleton with # TODO comments',
          '2. One rule to remember while filling it in',
        ],
        confidence: 0.94,
      };
    }

    // Default Hint Flow (Under 80 words, ONE hint only + 1 question)
    return {
      goal: 'Give exactly ONE small hint and end with one question to help them think.',
      teachingGoal: 'Smallest explanation possible. Do not explain the entire algorithm.',
      role: 'tutor',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        '1. Exactly ONE intuitive hint (2-3 sentences max)',
        '2. One small reflective question at the end',
      ],
      confidence: 0.94,
    };
  }

  // 5. Code Review (Under 120 words)
  if (intent === 'reviewing') {
    return {
      goal: 'Mention 1 thing done well, and 1 clean practical improvement.',
      teachingGoal: 'Brief, conversational, no checklist essay.',
      role: 'reviewer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        '1. One strength in their approach',
        '2. One clean tip to improve it',
      ],
      confidence: 0.93,
    };
  }

  // General fallback
  return {
    goal: 'Answer the question directly in 2-4 sentences using simple English.',
    teachingGoal: 'Less is better. Simple is better.',
    role: 'tutor',
    responseLength: 'short',
    revealSolution: false,
    includeCode: false,
    askQuestionAtEnd: false,
    structure: ['1. Direct, simple answer in 2-4 sentences'],
    confidence: 0.85,
  };
}

export function formatPlanDirective(plan: ResponsePlan): string {
  const lines: string[] = [];
  lines.push(`Goal: ${plan.goal}`);
  lines.push(`Length Limit: ${plan.responseLength.toUpperCase()} (Keep it brief, simple sentences)`);
  lines.push(`Code Policy: ${plan.revealSolution ? 'Complete code allowed + 4-6 bullet points' : plan.includeCode ? 'Skeleton with # TODO only' : 'NO Python code blocks'}`);
  lines.push(`Blueprint:\n${plan.structure.map((s) => `  - ${s}`).join('\n')}`);

  return lines.join('\n');
}
