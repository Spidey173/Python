// Structured Response Planner (PyForge Teaching Philosophy)
// "The LLM should only fill slots. Your application should decide the format."
// "One question → one answer → one concept."

import {
  ErrorAnalysisResult,
  ExplanationDepth,
  FactualASTSummary,
  HelpTier,
  LearningSubIntent,
  QuestionType,
  ResponsePlan,
  ResponseStyle,
  StudentIntent,
  TeachingRequest,
  TeachingRole,
} from '../types';
import { classifyTeachingRequest, classifyQuestionType } from '../intent/question-classifier';
import { getTeachingRequestSpec } from './teaching-request-specs';

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
  verbosity: ExplanationDepth = 'short'
): ResponsePlan {
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

  // Resolve deterministic slot template and word budget based on verbosity
  const spec = getTeachingRequestSpec(teachingRequest, verbosity);

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
    explanationDepth: verbosity,
    questionType,
    goal: `Fill slots for ${teachingRequest}`,
    teachingGoal: `Fill exact template slots under ${spec.maxWords} words. No extra sections.`,
    role,
    responseLength:
      verbosity === 'tiny' || verbosity === 'short'
        ? 'short'
        : verbosity === 'normal'
        ? 'medium'
        : 'long',
    revealSolution: spec.allowCode,
    includeCode: spec.allowCode,
    askQuestionAtEnd: spec.allowFollowUpQuestion,
    structure: spec.outputTemplate.split('\n'),
    confidence: 0.98,
  };
}

export function formatPlanDirective(plan: ResponsePlan): string {
  const spec = plan.requestSpec;
  const lines: string[] = [];
  lines.push(`TEACHING REQUEST: ${spec.request} (Verbosity Level: ${spec.explanationDepth.toUpperCase()})`);
  lines.push(`WORD LIMIT: Strictly under ${spec.maxWords} words.`);
  lines.push(`MANDATORY FILL-IN TEMPLATE:\n${spec.outputTemplate}`);
  lines.push('SLOT RULES:');
  lines.push('- Fill ONLY the template slots above.');
  lines.push('- Never add Big O, edge cases, verification tips, Socratic questions, or extra explanations unless requested.');
  lines.push('- Do NOT output artificial headers like "Direct Diagnosis", "Why this happens", or "Verification Tip".');

  return lines.join('\n');
}


