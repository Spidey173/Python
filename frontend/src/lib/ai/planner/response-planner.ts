import {
  ConfidenceLevel,
  ErrorAnalysisResult,
  ExplanationDepth,
  FactualASTSummary,
  HelpTier,
  LearningGoal,
  LearningSubIntent,
  Misconception,
  NextBestStep,
  PatternStep,
  QuestionType,
  ResponsePlan,
  ResponseStyle,
  StudentIntent,
  TeachingMode,
  TeachingRequest,
  TeachingRole,
} from '../types';
import { classifyTeachingRequest, classifyQuestionType } from '../intent/question-classifier';
import { getTeachingRequestSpec } from './teaching-request-specs';
import {
  classifyLearningGoal,
  deriveAdaptiveDepth,
  detectConfidence,
  detectMisconception,
  getTeachingModeDirective,
  resolveNextBestStep,
  resolvePatternStep,
  selectTeachingMode,
} from '../pedagogy/pedagogy';

export function createResponsePlan(
  intent: StudentIntent,
  subIntent: LearningSubIntent | undefined,
  tier: HelpTier,
  style: ResponseStyle,
  errorAnalysis: ErrorAnalysisResult,
  ast: FactualASTSummary,
  askingForFullCode: boolean = false,
  userMessage: string = '',
  hasActiveBug: boolean = false,
  isGreeting: boolean = false,
  explicitVerbosity?: ExplanationDepth,
  challengeTitle: string = '',
  code: string = '',
  isSolved: boolean = false
): ResponsePlan {
  // 1. Pedagogical Classifications
  const learningGoal: LearningGoal = classifyLearningGoal(
    userMessage,
    intent,
    subIntent,
    askingForFullCode,
    errorAnalysis.errorType !== 'none' || hasActiveBug
  );

  const teachingMode: TeachingMode = selectTeachingMode(learningGoal, userMessage, intent);

  // Derive adaptive depth from message phrasing if not explicitly pinned
  const adaptiveDepth: ExplanationDepth = explicitVerbosity || deriveAdaptiveDepth(userMessage);

  // Detect confidence level: low | medium | high
  const confidenceLevel: ConfidenceLevel = detectConfidence(userMessage);

  // Detect top-5 misconception only if debugging, active bug, or user has code
  const misconception: Misconception | null =
    errorAnalysis.errorType !== 'none' || hasActiveBug || Boolean(code && code.trim().length > 0)
      ? detectMisconception(userMessage, code)
      : null;

  // 2. Map to deterministic TeachingRequest & QuestionType
  const teachingRequest: TeachingRequest = classifyTeachingRequest({
    message: userMessage,
    intent,
    subIntent,
    askingForFullCode,
    askingForSkeleton: subIntent === 'pattern' || tier === 4,
    hasErrorTrace: errorAnalysis.errorType !== 'none',
    isGreeting,
    hasActiveBug,
  });

  const questionType: QuestionType = classifyQuestionType({
    message: userMessage,
    intent,
    subIntent,
    askingForFullCode,
    askingForSkeleton: subIntent === 'pattern' || tier === 4,
    hasErrorTrace: errorAnalysis.errorType !== 'none',
    isGreeting,
    hasActiveBug,
  });

  // Pattern step & Next Best Step only needed for algorithm hints/reviews/solved states
  const needsPattern =
    teachingRequest === TeachingRequest.GiveHint ||
    teachingRequest === TeachingRequest.Review ||
    subIntent === 'pattern';

  const patternStep: PatternStep = needsPattern
    ? resolvePatternStep(challengeTitle || userMessage)
    : { pattern: 'General', transferClue: '' };

  const nextBestStep: NextBestStep =
    isSolved || teachingRequest === TeachingRequest.Review
      ? resolveNextBestStep(challengeTitle || patternStep.pattern, isSolved, confidenceLevel)
      : { topic: 'Next Step', suggestion: '' };

  // Resolve deterministic slot template and word budget
  const spec = getTeachingRequestSpec(teachingRequest, adaptiveDepth, misconception);

  // Determine teaching role cleanly
  let role: TeachingRole = 'tutor';
  if (teachingRequest === TeachingRequest.Debug) {
    role = 'debugger';
  } else if (
    teachingRequest === TeachingRequest.ExplainProblem ||
    teachingRequest === TeachingRequest.ExplainCode ||
    teachingRequest === TeachingRequest.ExplainConcept ||
    teachingRequest === TeachingRequest.Complexity ||
    teachingRequest === TeachingRequest.Compare
  ) {
    role = 'explainer';
  } else if (teachingRequest === TeachingRequest.Review) {
    role = 'reviewer';
  } else if (teachingRequest === TeachingRequest.Interview) {
    role = 'interviewer';
  }

  return {
    teachingRequest,
    requestSpec: spec,
    explanationDepth: adaptiveDepth,
    questionType,
    learningGoal,
    teachingMode,
    confidenceLevel,
    misconception,
    patternStep,
    nextBestStep,
    goal: `Fill slots for ${teachingRequest}`,
    teachingGoal: `Fill exact template slots under ${spec.maxWords} words. No extra sections.`,
    role,
    responseLength:
      adaptiveDepth === 'tiny' || adaptiveDepth === 'short'
        ? 'short'
        : adaptiveDepth === 'normal'
        ? 'medium'
        : 'long',
    revealSolution: spec.allowCode,
    includeCode: spec.allowCode,
    askQuestionAtEnd: spec.allowFollowUpQuestion,
    structure: spec.outputTemplate.split('\n'),
    confidence: confidenceLevel === 'low' ? 0.85 : confidenceLevel === 'high' ? 0.99 : 0.95,
  };
}

export function formatPlanDirective(plan: ResponsePlan): string {
  const spec = plan.requestSpec;
  const lines: string[] = [];

  lines.push(`TEACHING REQUEST: ${spec.request} (Verbosity: ${spec.explanationDepth.toUpperCase()})`);
  lines.push(`DIRECTIVE: ${getTeachingModeDirective(plan.teachingMode, plan.confidenceLevel)}`);

  if (
    plan.patternStep &&
    plan.patternStep.transferClue &&
    (plan.teachingRequest === TeachingRequest.GiveHint || plan.teachingRequest === TeachingRequest.Review)
  ) {
    lines.push(`PATTERN INSIGHT: ${plan.patternStep.pattern} — ${plan.patternStep.transferClue}`);
  }

  lines.push(`WORD LIMIT: Under ${spec.maxWords} words.`);
  lines.push(`FILL-IN TEMPLATE:\n${spec.outputTemplate}`);
  lines.push('RULES: Fill ONLY the template above. Never refuse. Answer what was asked.');

  return lines.join('\n');
}


