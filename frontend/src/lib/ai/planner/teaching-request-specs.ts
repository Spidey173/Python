// Deterministic Teaching Request Specifications & Slot Templates
// Architecture Rule: The LLM should only fill slots. Your application should decide the format.

import { TeachingRequest, ExplanationDepth, TeachingRequestSpec } from '../types';

export function getTeachingRequestSpec(
  request: TeachingRequest,
  depth: ExplanationDepth = 'short'
): TeachingRequestSpec {
  switch (request) {
    case TeachingRequest.ExplainProblem:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 35 : depth === 'short' ? 65 : depth === 'normal' ? 110 : 200,
        maxExamples: 1,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `In simple words:
[1-2 sentences]

Input:
[one line]

Output:
[one line]

Example:
[one tiny example]`,
      };

    case TeachingRequest.GiveHint:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 35 : depth === 'short' ? 60 : depth === 'normal' ? 90 : 150,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: true,
        outputTemplate: `You're close.

Hint:
[1-2 sentences pointing to the core pattern]

Think about:
[1 small question to spark their thinking]`,
      };

    case TeachingRequest.Debug:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 45 : depth === 'short' ? 80 : depth === 'normal' ? 120 : 180,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `The main issue is:
[1 sentence naming the single biggest mistake]

Why:
[1 sentence explaining why this happens]

Fix:
[1 sentence directing them what to check]`,
      };

    case TeachingRequest.ShowSolution:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 60 : depth === 'short' ? 120 : depth === 'normal' ? 180 : 300,
        maxExamples: 1,
        allowCode: true,
        allowFollowUpQuestion: false,
        outputTemplate: `\`\`\`python
[Clean, minimal Python code]
\`\`\`

How it works:
* [Step 1]
* [Step 2]
* [Step 3]
* [Step 4]`,
      };

    case TeachingRequest.ExplainCode:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 50 : depth === 'short' ? 100 : depth === 'normal' ? 150 : 250,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Line by line:
Line [X]: [What it does in 1 sentence]
Line [Y]: [What it does in 1 sentence]`,
      };

    case TeachingRequest.ExplainConcept:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 40 : depth === 'short' ? 80 : depth === 'normal' ? 130 : 220,
        maxExamples: 1,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `In simple words:
[1-2 sentences]

Everyday analogy:
[1 sentence analogy]

Rule to remember:
[1 sentence takeaway]`,
      };

    case TeachingRequest.Complexity:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 30 : depth === 'short' ? 50 : depth === 'normal' ? 80 : 120,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Time complexity:
[Big-O and 1 sentence why]

Space complexity:
[Big-O and 1 sentence why]`,
      };

    case TeachingRequest.Compare:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 45 : depth === 'short' ? 85 : depth === 'normal' ? 130 : 200,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Approach 1:
[1 sentence]

Approach 2:
[1 sentence]

When to use:
[1 sentence tradeoff]`,
      };

    case TeachingRequest.Review:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 40 : depth === 'short' ? 75 : depth === 'normal' ? 110 : 160,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `What worked well:
[1 sentence]

One clean improvement:
[1-2 sentences]`,
      };

    case TeachingRequest.Interview:
      return {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 40 : depth === 'short' ? 70 : depth === 'normal' ? 110 : 150,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: true,
        outputTemplate: `Interviewer check:
[1 sentence technical question]

What they are testing:
[1 sentence]`,
      };

    case TeachingRequest.General:
    default:
      return {
        request: TeachingRequest.General,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 30 : depth === 'short' ? 60 : depth === 'normal' ? 100 : 150,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Direct answer:
[2-3 simple sentences]`,
      };
  }
}
