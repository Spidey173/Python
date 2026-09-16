// Modular Answer Contract Resolver
// SINGLE SOURCE OF TRUTH: All behavioral decisions, capabilities, and permissions
// are decided here once and frozen via Object.freeze().
// Decomposed into clean sub-resolvers to avoid God Object sprawl.

import {
  AnswerContract,
  AnswerPermissions,
  ConfidenceLevel,
  DiagnosticReport,
  ExplanationDepth,
  HelpTier,
  LearningGoal,
  LearningSubIntent,
  Misconception,
  Presentation,
  QuestionType,
  ResponseKind,
  StudentIntent,
  TeachingMode,
  TeachingRequest,
  TeachingRole,
  TeachingStyle,
} from '../types';
import { getTeachingRequestSpec } from './teaching-request-specs';
import {
  classifyLearningGoal,
  deriveAdaptiveDepth,
  detectConfidence,
  detectMisconception,
  selectTeachingMode,
} from '../pedagogy/pedagogy';

export interface ContractResolverInput {
  message: string;
  intent: StudentIntent;
  subIntent?: LearningSubIntent;
  code?: string;
  hasActiveBug?: boolean;
  hasErrorTrace?: boolean;
  isGreeting?: boolean;
  askingForFullCode?: boolean;
  askingForSkeleton?: boolean;
  explicitVerbosity?: ExplanationDepth;
  hintLevel?: HelpTier;
  isSolved?: boolean;
  challengeTitle?: string;
  diagnosticReport?: DiagnosticReport | null;
}

// -----------------------------------------------------------------------------
// 1. ResponseKind Sub-Resolver
// -----------------------------------------------------------------------------
export function resolveResponseKind(input: ContractResolverInput): ResponseKind {
  const {
    message,
    intent,
    subIntent,
    hasActiveBug = false,
    hasErrorTrace = false,
    askingForFullCode = false,
    askingForSkeleton = false,
    diagnosticReport,
  } = input;

  const lower = message.trim().toLowerCase();

  const isExplicitCodeRequest =
    askingForFullCode ||
    subIntent === 'walkthrough' ||
    /\b(give (me )?(the )?(code|solution)|provide (me )?(the )?(code|solution)|show (me )?(the )?(code|solution)|give code|provide code|show code|write (the )?code|full code|just code|code please|show solution|need code|what is the code)\b/i.test(
      lower
    );

  if (isExplicitCodeRequest) {
    return 'FullSolution';
  }

  // If a failure is actively diagnosed, it's a Debug request
  if (diagnosticReport && diagnosticReport.failureKind !== 'UNKNOWN') {
    return 'Debug';
  }

  if (
    intent === 'career' ||
    /\b(mock interview|faang|maang|interviewer question|test my knowledge)\b/i.test(lower)
  ) {
    return 'Interview';
  }

  if (
    intent === 'reviewing' ||
    /\b(review( my)? code|check my code|rate my code|feedback on( my)? code|critique)\b/i.test(lower)
  ) {
    return 'Review';
  }

  if (
    hasErrorTrace ||
    hasActiveBug ||
    intent === 'debugging' ||
    /\b(why is my code wrong|what('s| is) wrong with my code|where is my mistake|traceback|syntaxerror|typeerror|indexerror|keyerror|returning none|returns none|bug|fails?)\b/i.test(
      lower
    )
  ) {
    return 'Debug';
  }

  if (
    askingForSkeleton ||
    subIntent === 'pattern' ||
    subIntent === 'pseudocode' ||
    /\b(skeleton|scaffold|boilerplate|pseudocode)\b/i.test(lower)
  ) {
    return 'Walkthrough';
  }

  if (
    subIntent === 'hint' ||
    /\b(i('m| am) stuck|stuck|give me a hint|need a hint|another hint|clue|nudge|where do i start|help me start|i('m| am) lost|lost|i don't know|i do not know|help)\b/i.test(
      lower
    )
  ) {
    return 'Hint';
  }

  return 'Concept';
}

// -----------------------------------------------------------------------------
// 2. Permission Sub-Resolver
// -----------------------------------------------------------------------------
export function resolvePermissions(kind: ResponseKind): AnswerPermissions {
  const isCodeAllowed = kind === 'FullSolution' || kind === 'Walkthrough';
  const askFollowUp = kind === 'Hint' || kind === 'Interview';

  return Object.freeze({
    includeCode: isCodeAllowed,
    revealSolution: isCodeAllowed,
    askFollowUp,
  });
}

// -----------------------------------------------------------------------------
// 3. Teaching & Voice Sub-Resolver
// -----------------------------------------------------------------------------
interface TeachingResolution {
  teaching: TeachingStyle;
  learningGoal: LearningGoal;
  role: TeachingRole;
  questionType: QuestionType;
  teachingRequest: TeachingRequest;
}

export function resolveTeachingResolution(
  input: ContractResolverInput,
  kind: ResponseKind,
  permissions: AnswerPermissions
): TeachingResolution {
  const { message, intent, subIntent, hasActiveBug = false, hasErrorTrace = false, isGreeting = false } = input;
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  const learningGoal: LearningGoal = classifyLearningGoal(
    trimmed,
    intent,
    subIntent,
    permissions.revealSolution,
    hasActiveBug || hasErrorTrace
  );

  const mode: TeachingMode = selectTeachingMode(learningGoal, trimmed, intent);
  const confidence: ConfidenceLevel = detectConfidence(trimmed);

  const teaching: TeachingStyle = Object.freeze({
    mode,
    confidence,
  });

  let teachingRequest: TeachingRequest;
  let role: TeachingRole = 'tutor';
  let questionType: QuestionType = 'GENERAL';

  switch (kind) {
    case 'FullSolution':
    case 'Walkthrough':
      teachingRequest = TeachingRequest.ShowSolution;
      role = 'tutor';
      questionType = 'SHOW_CODE';
      break;
    case 'Debug':
      teachingRequest = TeachingRequest.Debug;
      role = 'debugger';
      questionType = 'WHY_ERROR';
      break;
    case 'Hint':
      teachingRequest = TeachingRequest.GiveHint;
      role = 'tutor';
      questionType = 'STUCK';
      break;
    case 'Review':
      teachingRequest = TeachingRequest.Review;
      role = 'reviewer';
      questionType = 'REVIEW';
      break;
    case 'Interview':
      teachingRequest = TeachingRequest.Interview;
      role = 'interviewer';
      questionType = 'GENERAL';
      break;
    case 'Concept':
    default:
      if (subIntent === 'complexity' || /\b(big o|time complexity|space complexity)\b/i.test(lower)) {
        teachingRequest = TeachingRequest.Complexity;
        role = 'explainer';
        questionType = 'COMPLEXITY';
      } else if (isGreeting) {
        teachingRequest = TeachingRequest.ExplainProblem;
        role = 'tutor';
        questionType = 'GREETING';
      } else if (/\b(what is this problem asking|explain the problem)\b/i.test(lower)) {
        teachingRequest = TeachingRequest.ExplainProblem;
        role = 'explainer';
        questionType = 'EXPLAIN_PROBLEM';
      } else {
        teachingRequest = TeachingRequest.ExplainConcept;
        role = 'explainer';
        questionType = 'GENERAL';
      }
      break;
  }

  return {
    teaching,
    learningGoal,
    role,
    questionType,
    teachingRequest,
  };
}

// -----------------------------------------------------------------------------
// 4. Presentation Sub-Resolver
// -----------------------------------------------------------------------------
export function resolvePresentation(
  kind: ResponseKind,
  teachingRequest: TeachingRequest,
  depth: ExplanationDepth,
  misconception: Misconception | null,
  report?: DiagnosticReport | null
): Presentation {
  const spec = getTeachingRequestSpec(teachingRequest, depth, misconception, report);

  return Object.freeze({
    template: teachingRequest,
    depth,
    maxWords: spec.maxWords,
    includeDiagram: kind === 'Hint' || kind === 'Debug' || kind === 'Concept',
    outputTemplate: spec.outputTemplate,
  });
}

// -----------------------------------------------------------------------------
// 5. Main Contract Assembler (Single Source of Truth)
// -----------------------------------------------------------------------------
export function resolveAnswerContract(input: ContractResolverInput): AnswerContract {
  const { message, code = '', hasActiveBug = false, hasErrorTrace = false, explicitVerbosity, diagnosticReport } = input;
  const trimmed = message.trim();

  // 1. Kind
  const responseKind = resolveResponseKind(input);

  // 2. Permissions
  const permissions = resolvePermissions(responseKind);

  // 3. Teaching & Voice
  const { teaching, learningGoal, role, questionType, teachingRequest } = resolveTeachingResolution(
    input,
    responseKind,
    permissions
  );

  // 4. Presentation
  const depth: ExplanationDepth = explicitVerbosity || deriveAdaptiveDepth(trimmed);
  const misconception =
    hasErrorTrace || hasActiveBug || Boolean(code && code.trim().length > 0)
      ? detectMisconception(trimmed, code)
      : null;

  const presentation = resolvePresentation(
    responseKind,
    teachingRequest,
    depth,
    misconception,
    diagnosticReport
  );

  // 5. Assemble & Freeze
  return Object.freeze({
    responseKind,
    permissions,
    presentation,
    teaching,
    learningGoal,
    role,
    questionType,
    // Ergonomic direct mirrors
    includeCode: permissions.includeCode,
    revealSolution: permissions.revealSolution,
    askFollowUp: permissions.askFollowUp,
    includeDiagram: presentation.includeDiagram,
    depth: presentation.depth,
    maxWords: presentation.maxWords,
    outputTemplate: presentation.outputTemplate,
    teachingRequest,
    teachingMode: teaching.mode,
    confidence: teaching.confidence,
  });
}
