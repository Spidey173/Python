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
    `Hey! I'm working through "${ctx.knowledge.conceptName}" with you. Where would you like to start?`,

  renderHint: (ctx) =>
    `${ctx.knowledge.targetHint}\n\nWhat rule should decide when to move the left pointer versus the right pointer?`,

  renderDebug: (ctx) =>
    (ctx.lastBug
      ? `The main issue looks like: \`${ctx.lastBug}\`.\n\n`
      : 'Check your loop pointers.\n\n') +
    'Make sure `left` moves forward (`left += 1`) and `right` moves backward (`right -= 1`). Otherwise the loop will run forever or miss elements.',

  renderComplexity: (ctx) =>
    `• Time: ${ctx.knowledge.timeComplexity} (we go through the input once)\n• Memory: ${ctx.knowledge.spaceComplexity} (in-place)`,

  renderSkeleton: (ctx) =>
    `\`\`\`python\nleft = 0\nright = len(data) - 1\n\nwhile left < right:\n    # TODO: compare data[left] and data[right]\n    if condition:\n        left += 1\n    else:\n        right -= 1\n\`\`\`\n\nFill in the condition to decide which pointer moves.`,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• We use two pointers moving from outside to inside.\n` +
    `• Each step compares the two ends.\n` +
    `• Time: ${ctx.knowledge.timeComplexity}\n` +
    `• Space: ${ctx.knowledge.spaceComplexity}`,
};

const hashMapTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! Looking at "${ctx.knowledge.conceptName}". What part of the logic are you thinking about?`,

  renderHint: (ctx) =>
    `${ctx.knowledge.targetHint}\n\nCan we store values we've already seen in a dictionary so lookups take $O(1)$ time?`,

  renderDebug: (ctx) =>
    (ctx.lastBug
      ? `Looking at this error: \`${ctx.lastBug}\`.\n\n`
      : 'Check your dictionary lookup.\n\n') +
    'Remember to check `if key in seen:` before accessing it, or use `seen.get(key, 0)` so Python doesn\'t throw a KeyError.',

  renderComplexity: (ctx) =>
    `• Time: ${ctx.knowledge.timeComplexity} (single pass using dictionary lookups)\n• Memory: ${ctx.knowledge.spaceComplexity} (stores elements in dictionary)`,

  renderSkeleton: (ctx) =>
    `\`\`\`python\nseen = {}\nfor item in items:\n    target = match_for(item)\n    if target in seen:\n        # TODO: found match\n        break\n    seen[item] = True\n\`\`\`\n\nWhat value should you store in \`seen\`?`,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• We walk through the list once.\n` +
    `• A dictionary stores previous numbers for instant lookup.\n` +
    `• Time: ${ctx.knowledge.timeComplexity}\n` +
    `• Space: ${ctx.knowledge.spaceComplexity}`,
};

const stackTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! For "${ctx.knowledge.conceptName}", a stack helps us match items in Last-In, First-Out order. Where should we start?`,

  renderHint: (ctx) =>
    `${ctx.knowledge.targetHint}\n\nWhat should we do when we see a closing character and the stack is empty?`,

  renderDebug: (ctx) =>
    'Always check `if stack:` before calling `stack.pop()`. If the stack is empty, popping from it throws an IndexError.',

  renderComplexity: (ctx) =>
    `• Time: ${ctx.knowledge.timeComplexity}\n• Memory: ${ctx.knowledge.spaceComplexity}`,

  renderSkeleton: (ctx) =>
    `\`\`\`python\nstack = []\nfor item in data:\n    if is_open(item):\n        stack.append(item)\n    elif stack and matches(stack[-1], item):\n        stack.pop()\n    else:\n        return False\nreturn len(stack) == 0\n\`\`\``,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• Push opening items onto the stack.\n` +
    `• Pop when a match is found.\n` +
    `• Return True only if the stack is completely empty at the end.`,
};

const generalTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! I'm here with you on "${ctx.knowledge.conceptName}". What are you thinking for the first step?`,

  renderHint: (ctx) =>
    `${ctx.knowledge.targetHint}\n\nHow can we break this into a single pass?`,

  renderDebug: (ctx) =>
    ctx.lastBug
      ? `The main issue is: \`${ctx.lastBug}\`. Check your input bounds or terminal print output.`
      : !ctx.ast.hasPrint
      ? 'Your code computes a value, but never calls `print(...)`. Add `print(result)` at the end!'
      : 'Check your loop termination condition to ensure pointers move forward on every step.',

  renderComplexity: (ctx) =>
    `• Time: ${ctx.knowledge.timeComplexity}\n• Space: ${ctx.knowledge.spaceComplexity}`,

  renderSkeleton: (ctx) =>
    `1. Read input.\n2. Process elements in one pass.\n3. Print the final result.`,

  renderSolution: (ctx) =>
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• Time: ${ctx.knowledge.timeComplexity}\n• Space: ${ctx.knowledge.spaceComplexity}`,
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
    if (subIntent === 'pattern' || subIntent === 'pseudocode' || ctx.hintLevel >= 4) return template.renderSkeleton(ctx);
    if (subIntent === 'walkthrough') return template.renderSolution(ctx);
    return template.renderHint(ctx);
  }

  return template.renderHint(ctx);
}
