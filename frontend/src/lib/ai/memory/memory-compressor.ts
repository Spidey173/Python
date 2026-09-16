// Memory Compressor
// Distills conversation history and state into a high-density 60-90 token memory block

import { CompressedMemory, ConversationState, FactualASTSummary } from '../types';

export function compressMemory(
  state: ConversationState,
  ast: FactualASTSummary,
  history: Array<{ role: string; content: string }> = []
): CompressedMemory {
  const understood = new Set<string>(state.conceptsGrasped || []);
  const struggling = new Set<string>(state.currentBottlenecks || []);

  // Infer understood concepts from AST
  if (ast.functions.length > 0) understood.add('Function structure & signature');
  if (ast.usesHashMap) understood.add('HashMap / Dictionary mapping');
  if (ast.usesStackOrQueue) understood.add('Stack / LIFO ordering');
  if (ast.loopCount > 0) understood.add('Iteration / Pointers');

  // Infer struggles from recent bugs, traps, or chat history
  if (state.lastBug) struggling.add(state.lastBug.slice(0, 70));
  for (const trap of ast.potentialTraps.slice(0, 2)) {
    struggling.add(trap.slice(0, 70));
  }

  // Scan recent history (last 3 turns) for quick clues if available
  for (const h of history.slice(-3)) {
    if (h.role === 'user' && /(indexerror|wrong answer|test case fail)/i.test(h.content)) {
      struggling.add(h.content.slice(0, 60));
    }
  }

  const understoodList = Array.from(understood).slice(0, 4);
  const strugglingList = Array.from(struggling).slice(0, 3);

  // Format into lean ~60-90 token markdown
  const lines: string[] = [];
  lines.push(`Attempt: #${state.attemptCount} (Hint Tier ${state.hintLevel}/5)`);
  if (understoodList.length > 0) {
    lines.push(`Grasped: ${understoodList.map((c) => `✓ ${c}`).join(' | ')}`);
  }
  if (strugglingList.length > 0) {
    lines.push(`Active Hurdle: ${strugglingList.map((s) => `• ${s}`).join('; ')}`);
  }
  if (state.lastHintProvided) {
    lines.push(`Prior Clue: "${state.lastHintProvided.slice(0, 70)}"`);
  }
  if (state.isSolved) {
    lines.push('Status: Challenge verified & completed');
  }

  return {
    challengeTitle: state.challengeTitle,
    attemptCount: state.attemptCount,
    understoodConcepts: understoodList,
    strugglingWith: strugglingList,
    previousBug: state.lastBug || undefined,
    lastHint: state.lastHintProvided,
    formattedText: lines.join('\n'),
  };
}
