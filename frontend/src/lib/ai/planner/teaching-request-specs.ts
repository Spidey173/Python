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
        maxWords: depth === 'tiny' ? 40 : depth === 'short' ? 80 : depth === 'normal' ? 130 : 220,
        maxExamples: 1,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `[Show a tiny concrete example first:]

\`\`\`
Input: [real example value]
       ↓
[1-2 steps showing what happens]
       ↓
Output: [real example result]
\`\`\`

In simple words: [1 sentence saying what the problem asks]`,
      };
      break;

    case TeachingRequest.GiveHint:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 40 : depth === 'short' ? 70 : depth === 'normal' ? 100 : 160,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: true,
        outputTemplate: `No worries. Let's solve it together.

Think of it like this:

\`\`\`
[Draw a tiny ASCII picture or trace showing the core pattern with pointers or state]
\`\`\`

[1-2 sentences explaining what to check and how pointers or state move]

That's the main idea behind this problem.`,
      };
      break;

    case TeachingRequest.Debug:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 50 : depth === 'short' ? 100 : depth === 'normal' ? 150 : 200,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Let's trace your code:

\`\`\`
[Walk through 2-3 steps of execution with actual values]
[Show the exact step where the state breaks]
[Arrow or ❌ marking where it goes wrong]
\`\`\`

[1 sentence saying what to fix and WHY]`,
      };
      break;

    case TeachingRequest.ShowSolution:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 70 : depth === 'short' ? 130 : depth === 'normal' ? 200 : 320,
        maxExamples: 1,
        allowCode: true,
        allowFollowUpQuestion: false,
        outputTemplate: `\`\`\`python
[Clean, minimal Python code]
\`\`\`

**How it works**

* [Bullet 1: setup / initial pointers / state]
* [Bullet 2: what we check at each step]
* [Bullet 3: condition that triggers return or update]
* [Bullet 4: final answer returned]`,
      };
      break;

    case TeachingRequest.ExplainCode:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 60 : depth === 'short' ? 110 : depth === 'normal' ? 170 : 270,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `[Explain WHY each line exists, not WHAT it does:]

Line [X]: [Why this line is here — what problem it solves]
Line [Y]: [Why this step is needed — what would break without it]

[Do NOT explain syntax like "this increments x" or "this is a for loop"]`,
      };
      break;

    case TeachingRequest.ExplainConcept:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 50 : depth === 'short' ? 100 : depth === 'normal' ? 150 : 240,
        maxExamples: 1,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `[Start with a concrete example — NOT a definition:]

\`\`\`
[Tiny visual showing the concept in action with real values]
\`\`\`

[Now name the concept in 1 sentence]

Rule to remember: [1 sentence takeaway]`,
      };
      break;

    case TeachingRequest.Complexity:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 35 : depth === 'short' ? 60 : depth === 'normal' ? 90 : 130,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Time: [Big-O] — [1 sentence WHY, e.g. "because we visit each element once"]

Space: [Big-O] — [1 sentence WHY, e.g. "because we store at most N items in the hash map"]`,
      };
      break;

    case TeachingRequest.Compare:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 50 : depth === 'short' ? 100 : depth === 'normal' ? 150 : 220,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `\`\`\`
Approach A: [name]
[1-line visual showing how it works]

Approach B: [name]
[1-line visual showing how it works]
\`\`\`

Use A when: [1 sentence]
Use B when: [1 sentence]`,
      };
      break;

    case TeachingRequest.Review:
      spec = {
        request,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 45 : depth === 'short' ? 80 : depth === 'normal' ? 120 : 170,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `Nice work on: [1 sentence — what they did well and WHY it's good]

One improvement: [1-2 sentences — what to change and WHY it helps]`,
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
        outputTemplate: `[1 focused technical question about their approach]

What this tests: [1 sentence]`,
      };
      break;

    case TeachingRequest.General:
    default:
      spec = {
        request: TeachingRequest.General,
        explanationDepth: depth,
        maxWords: depth === 'tiny' ? 35 : depth === 'short' ? 65 : depth === 'normal' ? 110 : 160,
        maxExamples: 0,
        allowCode: false,
        allowFollowUpQuestion: false,
        outputTemplate: `[2-3 simple sentences answering directly]`,
      };
      break;
  }

  if (misconception) {
    spec.outputTemplate = `Quick note first: ${misconception.correction}\n\n${spec.outputTemplate}`;
  }

  return spec;
}

