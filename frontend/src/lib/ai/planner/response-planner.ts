// Structured Response Planner
// Plans exact objective, constraints, and section blueprint before LLM invocation

import {
  ErrorAnalysisResult,
  FactualASTSummary,
  HelpTier,
  LearningSubIntent,
  ResponsePlan,
  ResponseStyle,
  StudentIntent,
  TeachingRole,
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
  // 1. Solution Request / Tier 5 Walkthrough
  if (askingForFullCode || (intent === 'learning' && subIntent === 'walkthrough' && tier === 5)) {
    return {
      goal: 'Walk through the complete optimal Python solution with trade-off analysis.',
      teachingGoal: 'Explain why the optimal approach outperforms brute force.',
      role: 'tutor',
      responseLength: 'medium',
      revealSolution: true,
      includeCode: true,
      askQuestionAtEnd: false,
      structure: [
        '1. Optimal Solution Code Block',
        '2. Line-by-Line Intuition & Core Invariant',
        '3. Time & Space Big-O Trade-off',
        '4. Key Takeaway for Interviews',
      ],
      confidence: 0.98,
    };
  }

  // 2. Debugging Flow
  if (intent === 'debugging' || errorAnalysis.errorType !== 'none') {
    return {
      goal: `Help student diagnose and fix ${errorAnalysis.errorType === 'none' ? 'the logic bug' : errorAnalysis.errorType.replace('_', ' ')}.`,
      teachingGoal: 'Explain the root cause so the student fixes the condition themselves.',
      role: 'debugger',
      responseLength: style.depth === 'brief' ? 'short' : 'medium',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: style.askFollowup,
      structure: [
        '1. Direct Diagnosis (Identify the root cause)',
        '2. Why this happens in Python runtime/indexing',
        '3. Specific line or loop condition to inspect',
        '4. Verification tip',
      ],
      confidence: 0.95,
    };
  }

  // 3. Greeting Flow
  if (intent === 'greeting') {
    return {
      goal: 'Welcome the student and establish friendly technical mentorship.',
      teachingGoal: 'Prompt the student to state what part of the challenge they want to tackle.',
      role: 'tutor',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: true,
      structure: [
        '1. Natural, warm greeting (no customer service tone)',
        '2. Acknowledge current problem',
        '3. Open check-in question',
      ],
      confidence: 0.99,
    };
  }

  // 4. Code Review Flow
  if (intent === 'reviewing') {
    return {
      goal: 'Provide senior engineering code review on style, efficiency, and edge cases.',
      teachingGoal: 'Reinforce clean Python idioms (PEP 8) and optimal time/space usage.',
      role: 'reviewer',
      responseLength: 'medium',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: style.askFollowup,
      structure: [
        '1. Commend what is clean and functional',
        '2. Idiomatic Python improvement (readability/cleanliness)',
        '3. Potential edge case or bounds vulnerability',
        '4. Efficiency observation',
      ],
      confidence: 0.94,
    };
  }

  // 5. Learning Flow (Tiered escalation)
  if (subIntent === 'complexity') {
    return {
      goal: 'Explain the Time and Space complexity trade-offs clearly.',
      teachingGoal: 'Connect loop nesting and dictionary operations to Big-O.',
      role: 'explainer',
      responseLength: 'short',
      revealSolution: false,
      includeCode: false,
      askQuestionAtEnd: style.askFollowup,
      structure: [
        '1. Quick Time & Space Complexity Summary',
        '2. Intuitive Explanation (how loop depth dictates runtime)',
        '3. Space Trade-off (auxiliary memory vs in-place)',
      ],
      confidence: 0.95,
    };
  }

  if (subIntent === 'pattern' || subIntent === 'pseudocode' || tier >= 3) {
    const isSkeleton = subIntent === 'pattern' || tier === 4;
    return {
      goal: isSkeleton
        ? 'Provide an architectural code scaffold with TODO placeholders.'
        : 'Provide step-by-step algorithmic pseudocode.',
      teachingGoal: 'Help student visualize loop logic without giving away finished code.',
      role: 'tutor',
      responseLength: 'medium',
      revealSolution: false,
      includeCode: isSkeleton,
      askQuestionAtEnd: style.askFollowup,
      structure: isSkeleton
        ? [
            '1. Pattern Architecture Overview',
            '2. Scaffold Skeleton with # TODO comments',
            '3. Core Invariant to maintain in loop',
          ]
        : [
            '1. High-Level Algorithm Strategy',
            '2. Step-by-Step Pseudocode (Plain English)',
            '3. Critical Boundary Condition',
          ],
      confidence: 0.93,
    };
  }

  // Default Conceptual Nudge (Tier 1-2)
  return {
    goal: 'Guide student thinking with a focused Socratic nudge.',
    teachingGoal: 'Help student uncover the core data structure or two-pointer concept.',
    role: 'tutor',
    responseLength: style.depth === 'brief' ? 'short' : 'medium',
    revealSolution: false,
    includeCode: false,
    askQuestionAtEnd: true,
    structure: [
      '1. Direct Conceptual Nudge',
      '2. Core Algorithmic Invariant',
      '3. Common Interview Trap to Avoid',
      '4. Reflection Question',
    ],
    confidence: 0.92,
  };
}

export function formatPlanDirective(plan: ResponsePlan): string {
  const lines: string[] = [];
  lines.push(`Goal: ${plan.goal}`);
  lines.push(`Length: ${plan.responseLength.toUpperCase()}`);
  lines.push(`Code Policy: ${plan.revealSolution ? 'Full optimal code allowed' : plan.includeCode ? 'Skeleton/Scaffold with TODOs only' : 'NO Python code blocks'}`);
  lines.push(`Required Structure:\n${plan.structure.map((s) => `  ${s}`).join('\n')}`);

  return lines.join('\n');
}
