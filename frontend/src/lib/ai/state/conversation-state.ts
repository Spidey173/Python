// Conversation State Manager - Per-Challenge State & Memory
// Maintains attempt counter, hint levels (1..5), recent bugs, and solved status

import { ConversationState, HelpTier, StudentIntent } from '../types';

// In-memory active session store keyed by challengeId
const challengeStateMap = new Map<number, ConversationState>();

export function getOrCreateConversationState(
  challengeId: number,
  challengeTitle: string = `Challenge #${challengeId}`,
  overrides?: Partial<ConversationState>
): ConversationState {
  let existing = challengeStateMap.get(challengeId);

  if (!existing) {
    existing = {
      challengeId,
      challengeTitle,
      attemptCount: 1,
      hintLevel: 1,
      lastBug: null,
      isSolved: false,
      learningMode: 'socratic',
      recentIntents: [],
      ...overrides,
    };
    challengeStateMap.set(challengeId, existing);
  } else if (overrides) {
    Object.assign(existing, overrides);
  }

  return existing;
}

export function recordAttemptFailure(challengeId: number, bugDescription: string): ConversationState {
  const state = getOrCreateConversationState(challengeId);
  state.attemptCount += 1;
  state.lastBug = bugDescription;

  // Progressively elevate hint tier upon repeated failures (up to Tier 4)
  if (state.hintLevel < 4) {
    state.hintLevel = Math.min(4, state.hintLevel + 1) as HelpTier;
  }

  return state;
}

export function recordAttemptSuccess(challengeId: number): ConversationState {
  const state = getOrCreateConversationState(challengeId);
  state.isSolved = true;
  state.lastBug = null;
  return state;
}

export function recordIntent(challengeId: number, intent: StudentIntent): ConversationState {
  const state = getOrCreateConversationState(challengeId);
  if (!state.recentIntents) state.recentIntents = [];
  state.recentIntents.push(intent);
  if (state.recentIntents.length > 5) {
    state.recentIntents.shift();
  }
  return state;
}

export function setHintTier(challengeId: number, tier: HelpTier): ConversationState {
  const state = getOrCreateConversationState(challengeId);
  state.hintLevel = tier;
  return state;
}

export function clearChallengeState(challengeId: number): void {
  challengeStateMap.delete(challengeId);
}
