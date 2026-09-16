// Lightweight Knowledge Retrieval Layer
// Retrieves targeted problem hints, traps, and complexity notes on-demand without dumping entire datasets

import { RetrievedKnowledge, HelpTier } from '../types';
import { ALL_50_MENTOR_KNOWLEDGE } from '@/lib/mentor-data';
import { ALL_50_SOLUTIONS } from '@/lib/solutions-data';
import { ALL_50_RANKED_SOLUTIONS } from '@/lib/ranked-solutions-data';

export function retrieveChallengeKnowledge(
  challengeId: number,
  hintTier: HelpTier = 1,
  includeSolutionCode: boolean = false
): RetrievedKnowledge {
  const canonicalId = challengeId > 150 ? challengeId - 150 : challengeId;
  const mentor = ALL_50_MENTOR_KNOWLEDGE[canonicalId];
  const sol = ALL_50_SOLUTIONS[canonicalId];
  const ranked = ALL_50_RANKED_SOLUTIONS[canonicalId] || [];

  const tierHint = mentor?.hints?.find((h) => h.tier === hintTier)?.nudge ||
    mentor?.hints?.[0]?.nudge ||
    'Break down the problem into smaller invariant steps.';

  const optimal = ranked[0];

  return {
    conceptName: mentor?.conceptName || sol?.title || `Challenge #${canonicalId}`,
    targetHint: tierHint,
    commonTrap: mentor?.interviewTrap || 'Be mindful of edge cases such as empty input or single elements.',
    edgeCases: [
      'Empty or 1-element input',
      'All duplicates or identical elements',
      'Extreme boundary conditions',
    ],
    optimalApproachTitle: optimal?.title || sol?.title || 'Optimal In-Place Algorithm',
    optimalCodeSnippet: includeSolutionCode ? (optimal?.code || sol?.optimalCode) : undefined,
    timeComplexity: optimal?.timeComplexity || sol?.timeComplexity || 'O(n)',
    spaceComplexity: optimal?.spaceComplexity || sol?.spaceComplexity || 'O(1)',
  };
}
