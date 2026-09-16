// Purely Declarative Response Planner
// Converts the frozen AnswerContract into slot templates and metadata.
// DOES NOT MAKE BEHAVIORAL DECISIONS (All decisions belong to resolveAnswerContract).
// Freezes the resulting plan via Object.freeze().

import {
  AnswerContract,
  ConfidenceLevel,
  ExplanationDepth,
  Misconception,
  NextBestStep,
  PatternStep,
  QuestionType,
  ResponsePlan,
  TeachingMode,
  TeachingRequest,
  TeachingRole,
} from '../types';
import { getTeachingRequestSpec } from './teaching-request-specs';
import { resolveNextBestStep, resolvePatternStep } from '../pedagogy/pedagogy';

export interface DeclarativePlannerOptions {
  challengeTitle?: string;
  userMessage?: string;
  isSolved?: boolean;
  misconception?: Misconception | null;
}

export function createResponsePlan(
  contract: AnswerContract,
  options: DeclarativePlannerOptions = {}
): ResponsePlan {
  const {
    challengeTitle = '',
    userMessage = '',
    isSolved = false,
    misconception = null,
  } = options;

  // Resolve pattern step only for hints or reviews
  const needsPattern =
    contract.teachingRequest === TeachingRequest.GiveHint ||
    contract.teachingRequest === TeachingRequest.Review;

  const patternStep: PatternStep = needsPattern
    ? resolvePatternStep(challengeTitle || userMessage)
    : { pattern: 'General', transferClue: '' };

  const nextBestStep: NextBestStep =
    isSolved || contract.teachingRequest === TeachingRequest.Review
      ? resolveNextBestStep(challengeTitle || patternStep.pattern, isSolved, contract.confidence)
      : { topic: 'Next Step', suggestion: '' };

  const spec = getTeachingRequestSpec(contract.teachingRequest, contract.depth, misconception);

  const plan: ResponsePlan = Object.freeze({
    contract,
    teachingRequest: contract.teachingRequest,
    requestSpec: spec,
    explanationDepth: contract.depth,
    questionType: contract.questionType,
    learningGoal: contract.learningGoal,
    teachingMode: contract.teachingMode,
    confidenceLevel: contract.confidence,
    misconception,
    patternStep,
    nextBestStep,
    goal: `Fill slots for ${contract.teachingRequest}`,
    teachingGoal: `Fill template under ${contract.maxWords} words.`,
    role: contract.role,
    responseLength:
      contract.depth === 'tiny' || contract.depth === 'short'
        ? 'short'
        : contract.depth === 'normal'
        ? 'medium'
        : 'long',
    revealSolution: contract.permissions.revealSolution,
    includeCode: contract.permissions.includeCode,
    askQuestionAtEnd: contract.presentation.askFollowUp,
    structure: contract.outputTemplate.split('\n'),
    confidence: contract.confidence === 'low' ? 0.85 : contract.confidence === 'high' ? 0.99 : 0.95,
  });

  return plan;
}

export function formatPlanDirective(plan: ResponsePlan): string {
  const { contract } = plan;
  const lines: string[] = [];

  lines.push(`RESPONSE KIND: ${contract.responseKind}`);
  lines.push(`TEACHING MODE: ${contract.teachingMode} (Tone: ${contract.confidence} confidence)`);
  lines.push(
    `PERMISSIONS: includeCode=${contract.permissions.includeCode}, revealSolution=${contract.permissions.revealSolution}`
  );
  lines.push(`WORD LIMIT: Under ${contract.maxWords} words.`);

  if (
    plan.patternStep &&
    plan.patternStep.transferClue &&
    (contract.teachingRequest === TeachingRequest.GiveHint ||
      contract.teachingRequest === TeachingRequest.Review)
  ) {
    lines.push(`PATTERN INSIGHT: ${plan.patternStep.pattern} — ${plan.patternStep.transferClue}`);
  }

  lines.push(`TEMPLATE TO FILL:\n${contract.outputTemplate}`);

  return lines.join('\n');
}
