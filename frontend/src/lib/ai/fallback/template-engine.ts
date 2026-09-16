// Dynamic DSA Topic Template Fallback Engine
// Replaces hardcoded if-chains with modular topic templates

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
    `Hey! For **${ctx.knowledge.conceptName}**, we can use two pointers moving toward each other. Where would you like to begin?`,

  renderHint: (ctx) =>
    `### Conceptual Nudge (Tier ${ctx.hintLevel})\n` +
    `${ctx.knowledge.targetHint}\n\n` +
    `> **Key Invariant**: Keep track of what \`left\` and \`right\` represent. Ensure your condition prevents pointers from crossing past each other.`,

  renderDebug: (ctx) =>
    `### Diagnostic: Two Pointers Loop\n` +
    (ctx.lastBug ? `Recent Error: \`${ctx.lastBug}\`\n\n` : '') +
    `1. **Pointer Movement**: Are you incrementing \`left += 1\` or decrementing \`right -= 1\` on *every* path?\n` +
    `2. **Bounds**: Use \`while left < right:\` to avoid index out of range.\n` +
    `3. **Terminal Output**: Does your script print the final boolean or value?`,

  renderComplexity: (ctx) =>
    `### Complexity Analysis\n` +
    `• **Time**: \`${ctx.knowledge.timeComplexity}\` (each element is inspected at most once as pointers converge).\n` +
    `• **Space**: \`${ctx.knowledge.spaceComplexity}\` in-place auxiliary space.`,

  renderSkeleton: (ctx) =>
    `### Two Pointers Pattern Skeleton\n` +
    `\`\`\`python\n` +
    `# 1. Initialize pointers at both boundaries\n` +
    `left = 0\n` +
    `right = len(data) - 1\n\n` +
    `while left < right:\n` +
    `    # TODO: Compare data[left] and data[right]\n` +
    `    if condition:\n` +
    `        left += 1\n` +
    `    else:\n` +
    `        right -= 1\n\n` +
    `# TODO: Output result\n` +
    `\`\`\``,

  renderSolution: (ctx) =>
    `### Optimal Solution\n` +
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• **Approach**: ${ctx.knowledge.optimalApproachTitle}\n` +
    `• **Complexity**: Time ${ctx.knowledge.timeComplexity}, Space ${ctx.knowledge.spaceComplexity}`,
};

const hashMapTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! We're working on **${ctx.knowledge.conceptName}**. A dictionary or hash map allows fast $O(1)$ lookups. How is your logic structured so far?`,

  renderHint: (ctx) =>
    `### Intuition Nudge (Tier ${ctx.hintLevel})\n` +
    `${ctx.knowledge.targetHint}\n\n` +
    `> **Tip**: Instead of nested loops, store previously seen values in a dictionary to find matches in a single pass.`,

  renderDebug: (ctx) =>
    `### Diagnostic: Hash Map Lookup\n` +
    (ctx.lastBug ? `Recent Error: \`${ctx.lastBug}\`\n\n` : '') +
    `1. **Key Existence**: Use \`seen.get(key, 0)\` or \`if key in seen:\` to avoid KeyError.\n` +
    `2. **Order preservation**: When seeking the first unique item, iterate over the original sequence, not the dictionary keys.\n` +
    `3. **Return Value**: Check what you return when no matching pair exists.`,

  renderComplexity: (ctx) =>
    `### Complexity Analysis\n` +
    `• **Time**: \`${ctx.knowledge.timeComplexity}\` (single pass with $O(1)$ dictionary average lookups).\n` +
    `• **Space**: \`${ctx.knowledge.spaceComplexity}\` (stores elements in memory).`,

  renderSkeleton: (ctx) =>
    `### Hash Map Pattern Skeleton\n` +
    `\`\`\`python\n` +
    `seen = {}\n` +
    `for item in items:\n` +
    `    target = complement_of(item)\n` +
    `    if target in seen:\n` +
    `        # Found match!\n` +
    `        break\n` +
    `    seen[item] = current_index\n` +
    `\`\`\``,

  renderSolution: (ctx) =>
    `### Optimal Solution\n` +
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• **Approach**: ${ctx.knowledge.optimalApproachTitle}\n` +
    `• **Complexity**: Time ${ctx.knowledge.timeComplexity}, Space ${ctx.knowledge.spaceComplexity}`,
};

const stackTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Welcome! **${ctx.knowledge.conceptName}** relies on Last-In, First-Out (LIFO) order. What are you thinking for the stack condition?`,

  renderHint: (ctx) =>
    `### Stack Invariant (Tier ${ctx.hintLevel})\n` +
    `${ctx.knowledge.targetHint}\n\n` +
    `> **Tip**: Push items onto the stack as you encounter them; pop to match or reduce when a closing condition is met.`,

  renderDebug: (ctx) =>
    `### Diagnostic: Stack Boundaries\n` +
    `1. **Empty Stack**: Always verify \`if stack:\` before calling \`stack.pop()\` to prevent IndexError.\n` +
    `2. **Leftover Elements**: After processing, is the stack completely empty?`,

  renderComplexity: (ctx) =>
    `### Complexity Analysis\n` +
    `• **Time**: \`${ctx.knowledge.timeComplexity}\` (each element pushed and popped at most once).\n` +
    `• **Space**: \`${ctx.knowledge.spaceComplexity}\` in the worst case.`,

  renderSkeleton: (ctx) =>
    `### Stack Pattern Skeleton\n` +
    `\`\`\`python\n` +
    `stack = []\n` +
    `for char in s:\n` +
    `    if is_opening(char):\n` +
    `        stack.append(char)\n` +
    `    elif stack and matches(stack[-1], char):\n` +
    `        stack.pop()\n` +
    `    else:\n` +
    `        return False\n` +
    `return len(stack) == 0\n` +
    `\`\`\``,

  renderSolution: (ctx) =>
    `### Optimal Solution\n` +
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• **Complexity**: Time ${ctx.knowledge.timeComplexity}, Space ${ctx.knowledge.spaceComplexity}`,
};

const generalTemplate: TopicTemplate = {
  renderGreeting: (ctx) =>
    `Hey! I'm here to help you solve **${ctx.knowledge.conceptName}**. What part of the implementation are you considering?`,

  renderHint: (ctx) =>
    `### Hint (Tier ${ctx.hintLevel})\n` +
    `${ctx.knowledge.targetHint}\n\n` +
    `> **Interview Trap to Avoid**: ${ctx.knowledge.commonTrap}`,

  renderDebug: (ctx) =>
    `### Code Diagnostic\n` +
    (ctx.lastBug ? `Recent Error: \`${ctx.lastBug}\`\n\n` : '') +
    `• **Loops**: ${ctx.ast.loopCount} loops detected.\n` +
    `• **Output**: ${ctx.ast.hasPrint ? 'Prints to stdout.' : 'No print() found — make sure to print your result!'}\n` +
    `• **Traps**: ${ctx.ast.potentialTraps.join(' ') || 'Check edge cases (empty or single element).'}\n\n` +
    `Where does your output diverge from expected?`,

  renderComplexity: (ctx) =>
    `### Target Complexity\n` +
    `• **Time Complexity**: \`${ctx.knowledge.timeComplexity}\`\n` +
    `• **Space Complexity**: \`${ctx.knowledge.spaceComplexity}\``,

  renderSkeleton: (ctx) =>
    `### High-Level Outline\n` +
    `1. Parse input and handle edge cases.\n` +
    `2. Traverse data with a single pass or pointers.\n` +
    `3. Print the resulting boolean or value.`,

  renderSolution: (ctx) =>
    `### Optimal Solution\n` +
    (ctx.knowledge.optimalCodeSnippet
      ? `\`\`\`python\n${ctx.knowledge.optimalCodeSnippet}\n\`\`\`\n\n`
      : '') +
    `• **Approach**: ${ctx.knowledge.optimalApproachTitle}\n` +
    `• **Complexity**: Time ${ctx.knowledge.timeComplexity}, Space ${ctx.knowledge.spaceComplexity}`,
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
