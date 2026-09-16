// Progressive Teaching Planner
// Enforces 5-tier pedagogical escalation and role allocation

import { TeachingPlan, TeachingRole, HelpTier, StudentIntent, LearningSubIntent } from '../types';
import { DetectedIntentResult } from '../intent/detector';
import { ConversationState } from '../types';

export function createTeachingPlan(
  detected: DetectedIntentResult,
  state: ConversationState
): TeachingPlan {
  const { intent, subIntent, flags } = detected;

  // 1. Solution / Full code request
  if (flags.askingForFullCode || (intent === 'learning' && subIntent === 'walkthrough' && state.hintLevel === 5)) {
    return {
      intent: 'learning',
      subIntent: 'walkthrough',
      helpLevel: 5,
      allowCode: true,
      allowFullSolution: true,
      role: 'tutor',
      focusDirective:
        'The student explicitly requested code. Give the clean Python code, followed by "**How it works**" with 4-6 short bullet points. No essay.',
    };
  }

  // 2. Debugging flow
  if (intent === 'debugging') {
    return {
      intent: 'debugging',
      helpLevel: Math.max(state.hintLevel, 2) as HelpTier,
      allowCode: false,
      allowFullSolution: false,
      role: 'debugger',
      focusDirective:
        'Find the ONE biggest mistake. Explain only that mistake in under 150 words. Do not review the whole program or list multiple issues.',
    };
  }

  // 3. Code Review flow
  if (intent === 'reviewing') {
    return {
      intent: 'reviewing',
      helpLevel: state.hintLevel,
      allowCode: false,
      allowFullSolution: false,
      role: 'reviewer',
      focusDirective:
        'Critique readability, efficiency, and edge-case robustness. Highlight strengths and suggest one specific optimization.',
    };
  }

  // 4. Greeting flow
  if (intent === 'greeting') {
    return {
      intent: 'greeting',
      helpLevel: 1,
      allowCode: false,
      allowFullSolution: false,
      role: 'tutor',
      focusDirective:
        'Warm, senior-engineer greeting. Acknowledge the current challenge and ask what part of the logic they want to tackle.',
    };
  }

  // 5. Learning flow (tiered escalation)
  if (intent === 'learning') {
    if (subIntent === 'complexity') {
      return {
        intent: 'learning',
        subIntent: 'complexity',
        helpLevel: state.hintLevel,
        allowCode: false,
        allowFullSolution: false,
        role: 'explainer',
        focusDirective:
          'Explain the target Time and Space complexity cleanly using loop and structure facts. Do not write full solutions.',
      };
    }

    if (subIntent === 'concept') {
      return {
        intent: 'learning',
        subIntent: 'concept',
        helpLevel: state.hintLevel,
        allowCode: false,
        allowFullSolution: false,
        role: 'explainer',
        focusDirective:
          'Explain the core concept using an intuitive real-world analogy. Keep it engaging and concise.',
      };
    }

    if (subIntent === 'pattern' || subIntent === 'pseudocode' || flags.askingForSkeleton) {
      const tier: HelpTier = flags.askingForSkeleton || subIntent === 'pattern' ? 4 : 3;
      return {
        intent: 'learning',
        subIntent: subIntent || 'pattern',
        helpLevel: tier,
        allowCode: tier === 4,
        allowFullSolution: false,
        role: 'tutor',
        focusDirective:
          tier === 4
            ? 'Provide a code scaffold/skeleton with comments indicating where the student needs to fill in logic.'
            : 'Provide high-level step-by-step pseudocode without complete Python syntax.',
      };
    }

    // Default progressive hint escalation based on attempt count & hintLevel
    const effectiveTier = Math.min(
      4,
      Math.max(state.hintLevel, state.attemptCount > 3 ? 3 : state.attemptCount > 1 ? 2 : 1)
    ) as HelpTier;

    const directives: Record<HelpTier, string> = {
      1: 'Give ONE hint only (max 3 sentences). End with one small question. DO NOT show code.',
      2: 'Highlight the essential rule or data structure requirement. Give a 1-line tip.',
      3: 'Provide step-by-step simple pseudocode outlining the process.',
      4: 'Provide a code skeleton with # TODO comments where student fills logic.',
      5: 'Provide the code block, then 4-6 short bullet points under "**How it works**". No essay.',
    };

    return {
      intent: 'learning',
      subIntent: 'hint',
      helpLevel: effectiveTier,
      allowCode: effectiveTier >= 4,
      allowFullSolution: effectiveTier === 5,
      role: 'tutor',
      focusDirective: directives[effectiveTier],
    };
  }

  // 6. Career / Conversation fallback
  return {
    intent: intent === 'career' ? 'career' : 'conversation',
    helpLevel: state.hintLevel,
    allowCode: false,
    allowFullSolution: false,
    role: 'tutor',
    focusDirective:
      'Provide a helpful, direct response in the context of Python development and software engineering.',
  };
}
