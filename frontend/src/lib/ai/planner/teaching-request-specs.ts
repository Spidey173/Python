import { TeachingRequest, ExplanationDepth, TeachingRequestSpec, Misconception } from '../types';

export function getTeachingRequestSpec(
  request: TeachingRequest,
  depth: ExplanationDepth = 'short',
  misconception?: Misconception | null
): TeachingRequestSpec {
  let spec: TeachingRequestSpec;

  switch (request) {
    case TeachingRequest.ExplainProblem:
      spec = {
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
      spec = {
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
      break;

    case TeachingRequest.Debug:
      spec = {
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
      break;

    case TeachingRequest.ShowSolution:
      spec = {
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
      break;

    case TeachingRequest.ExplainCode:
      spec = {
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
      break;

    case TeachingRequest.ExplainConcept:
      spec = {
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
      break;

    case TeachingRequest.Complexity:
      spec = {
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
      break;

    case TeachingRequest.Compare:
      spec = {
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
      break;

    case TeachingRequest.Review:
      spec = {
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
      break;

    case TeachingRequest.Interview:
      spec = {
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
      break;

    case TeachingRequest.General:
    default:
      spec = {
        request: TeachingRequest.General,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 30 : depth === 'short' ? 60 : depth === 'normal' ? 100 : 150,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Direct answer:
[2-3 simple sentences]`,
      };
      break;
  }

  if (misconception) {
    spec.outputTemplate = `Misconception addressed:\n[1 sentence directly clarifying: ${misconception.correction}]\n\n${spec.outputTemplate}`;
  }

  return spec;
}
