// Dynamic Topic Fallback Engine (PyForge Minimalist Teaching Philosophy)
// Core Principle: Smallest explanation that answers the question. Conversation over documentation.

import { RetrievedKnowledge, FactualASTSummary, HelpTier, StudentIntent } from '../types';

export interface TemplateContext {
  topicName: string;
  knowledge: RetrievedKnowledge;
  ast: FactualASTSummary;
  attemptCount: number;
  hintLevel: HelpTier;
  code?: string;
  lastBug?: string | null;
}

interface TopicTemplate {
  renderGreeting(ctx: TemplateContext): string;
  renderHint(ctx: TemplateContext): string;
  renderDebug(ctx: TemplateContext): string;
  renderComplexity(ctx: TemplateContext): string;
  renderSkeleton(ctx: TemplateContext): string;
  renderSolution(ctx: TemplateContext): string;
}

const twoPointersTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! Working on "${ctx.knowledge.conceptName}" with you. What part do you want to tackle first?`,

  renderHint: (ctx) =>
    "You're not far off.\n\n" +
    `This problem is usually solved using two pointers.\n\n` +
    `Try putting one pointer at the start and one at the end, and compare characters as you move inward.\n\n` +
    "What should you do when you find a space or comma?",

  renderDebug: (ctx) =>
    `Problem: ${ctx.lastBug ? `\`${ctx.lastBug}\`` : 'Pointer movement issue'}\n\n` +
    `Reason: Make sure \`left\` moves forward (\`left += 1\`) and \`right\` moves backward (\`right -= 1\`).\n\n` +
    `How to fix: Check your pointer updates inside the loop so it doesn't get stuck.`,

  renderComplexity: (ctx) =>
    `Time: ${ctx.knowledge.timeComplexity} (single pass)\nSpace: ${ctx.knowledge.spaceComplexity} (in-place)`,

  renderSkeleton: (ctx) =>
    `\`\`\`python\nleft = 0\nright = len(data) - 1\n\nwhile left < right:\n    # TODO: compare data[left] and data[right]\n    if condition:\n        left += 1\n    else:\n        right -= 1\n\`\`\`\n\nFill in the condition to decide which pointer moves.`,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `**How it works**\n` +
    `* Start one pointer at the beginning and one at the end\n` +
    `* Move pointers toward the center\n` +
    `* Compare both ends at each step\n` +
    `* Return False immediately on mismatch\n` +
    `* Time: ${ctx.knowledge.timeComplexity}, Space: ${ctx.knowledge.spaceComplexity}`,
};

const hashMapTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! Working on "${ctx.knowledge.conceptName}" with you. What part do you want to tackle first?`,

  renderHint: (ctx) =>
    "You're not far off.\n\n" +
    `This problem is usually solved using a hash map or dictionary.\n\n` +
    `${ctx.knowledge.targetHint}\n\n` +
    "Can we store what we've already seen so lookups take O(1) time?",

  renderDebug: (ctx) =>
    `Problem: ${ctx.lastBug ? `\`${ctx.lastBug}\`` : 'Dictionary lookup error'}\n\n` +
    `Reason: Accessing a key before it exists in the dictionary throws a KeyError.\n\n` +
    `How to fix: Check \`if key in seen:\` before lookup or use \`seen.get(key, 0)\`.`,

  renderComplexity: (ctx) =>
    `Time: ${ctx.knowledge.timeComplexity} (single pass)\nSpace: ${ctx.knowledge.spaceComplexity} (dictionary storage)`,

  renderSkeleton: (ctx) =>
    `\`\`\`python\nseen = {}\nfor item in items:\n    target = match_for(item)\n    if target in seen:\n        # TODO: found match\n        break\n    seen[item] = True\n\`\`\`\n\nWhat value should you store in \`seen\`?`,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `**How it works**\n` +
    `* Walk through the list once\n` +
    `* Store previous items in a dictionary\n` +
    `* Check for matches in O(1) time\n` +
    `* Return the result as soon as a pair matches\n` +
    `* Time: ${ctx.knowledge.timeComplexity}, Space: ${ctx.knowledge.spaceComplexity}`,
};

const stackTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! Working on "${ctx.knowledge.conceptName}" with you. What part do you want to tackle first?`,

  renderHint: (ctx) =>
    "You're not far off.\n\n" +
    `A stack helps us match elements in Last-In, First-Out order.\n\n` +
    `${ctx.knowledge.targetHint}\n\n` +
    "What should you do when you see a closing symbol and the stack is empty?",

  renderDebug: (ctx) =>
    `Problem: ${ctx.lastBug ? `\`${ctx.lastBug}\`` : 'Stack underflow or empty stack error'}\n\n` +
    `Reason: Calling \`stack.pop()\` when empty raises an IndexError.\n\n` +
    `How to fix: Always verify \`if stack:\` before calling \`pop()\`.`,

  renderComplexity: (ctx) =>
    `Time: ${ctx.knowledge.timeComplexity}\nSpace: ${ctx.knowledge.spaceComplexity}`,

  renderSkeleton: (ctx) =>
    `\`\`\`python\nstack = []\nfor item in data:\n    if is_open(item):\n        stack.append(item)\n    elif stack and matches(stack[-1], item):\n        stack.pop()\n    else:\n        return False\nreturn len(stack) == 0\n\`\`\``,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `**How it works**\n` +
    `* Push open elements onto the stack\n` +
    `* Pop when a matching closing element arrives\n` +
    `* If items don't match, return False immediately\n` +
    `* Return True only if the stack is completely empty\n` +
    `* Time: ${ctx.knowledge.timeComplexity}, Space: ${ctx.knowledge.spaceComplexity}`,
};

const generalTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! Working on "${ctx.knowledge.conceptName}" with you. What part do you want to tackle first?`,

  renderHint: (ctx) =>
    "You're not far off.\n\n" +
    `${ctx.knowledge.targetHint}\n\n` +
    "How can we solve this in a single pass?",

  renderDebug: (ctx) =>
    `Problem: ${ctx.lastBug ? `\`${ctx.lastBug}\`` : 'Output mismatch'}\n\n` +
    `Reason: The tests check stdout or return values.\n\n` +
    `How to fix: Check your print statement or return value at the end of the function.`,

  renderComplexity: (ctx) =>
    `Time: ${ctx.knowledge.timeComplexity}\nSpace: ${ctx.knowledge.spaceComplexity}`,

  renderSkeleton: (ctx) =>
    `1. Read input.\n2. Process elements in one pass.\n3. Return or print the final result.`,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `**How it works**\n` +
    `* Process the input in a single pass\n` +
    `* Maintain state with minimal memory\n` +
    `* Produce the final result cleanly\n` +
    `* Time: ${ctx.knowledge.timeComplexity}, Space: ${ctx.knowledge.spaceComplexity}`,
};

export const TOPIC_TEMPLATES: Record<string, TopicTemplate> = {
  two_pointers: twoPointersTemplate,
  hash_map: hashMapTemplate,
  stack: stackTemplate,
  general: generalTemplate,
};

export function detectTopic(knowledge: RetrievedKnowledge, code?: string): string {
  const combined = `${knowledge.conceptName} ${knowledge.optimalApproachTitle} ${code || ''}`.toLowerCase();

  if (combined.includes('pointer') || combined.includes('palindrome') || combined.includes('binary search')) {
    return 'two_pointers';
  }
  if (combined.includes('dict') || combined.includes('hash') || combined.includes('frequency') || combined.includes('map')) {
    return 'hash_map';
  }
  if (combined.includes('stack') || combined.includes('parenthes') || combined.includes('queue')) {
    return 'stack';
  }

  return 'general';
}

export function renderTopicResponse(
  topicKey: string,
  intent: StudentIntent,
  subIntent: string | undefined,
  ctx: TemplateContext
): string {
  const template = TOPIC_TEMPLATES[topicKey] || TOPIC_TEMPLATES.general;

  if (intent === 'greeting') return template.renderGreeting(ctx);
  if (intent === 'debugging') return template.renderDebug(ctx);

  if (intent === 'learning') {
    if (subIntent === 'complexity') return template.renderComplexity(ctx);
    if (subIntent === 'walkthrough' || ctx.hintLevel === 5) return template.renderSolution(ctx);
    if (subIntent === 'pattern' || subIntent === 'pseudocode' || ctx.hintLevel === 4) return template.renderSkeleton(ctx);
    return template.renderHint(ctx);
  }

  return template.renderHint(ctx);
}
