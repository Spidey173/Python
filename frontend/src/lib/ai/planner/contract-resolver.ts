// Answer Contract Resolver
// SINGLE SOURCE OF TRUTH: All behavioral decisions, capabilities, and permissions
// are decided here ONCE and frozen via Object.freeze().
// Nothing downstream may alter or re-interpret these decisions.

import {
  AnswerContract,
  AnswerPermissions,
  ConfidenceLevel,
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
}

export function resolveAnswerContract(input: ContractResolverInput): AnswerContract {
  const {
    message,
    intent,
    subIntent,
    code = '',
    hasActiveBug = false,
    hasErrorTrace = false,
    isGreeting = false,
    askingForFullCode = false,
    askingForSkeleton = false,
    explicitVerbosity,
  } = input;

  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Determine ResponseKind (Clean discriminated union)
  let responseKind: ResponseKind;

  const isExplicitCodeRequest =
    askingForFullCode ||
    subIntent === 'walkthrough' ||
    /\b(give (me )?(the )?(code|solution)|provide (me )?(the )?(code|solution)|show (me )?(the )?(code|solution)|give code|provide code|show code|write (the )?code|full code|just code|code please|show solution|need code|what is the code)\b/i.test(
      lower
    );

  if (isExplicitCodeRequest) {
    responseKind = 'FullSolution';
  } else if (
    intent === 'career' ||
    /\b(mock interview|faang|maang|interviewer question|test my knowledge)\b/i.test(lower)
  ) {
    responseKind = 'Interview';
  } else if (
    intent === 'reviewing' ||
    /\b(review( my)? code|check my code|rate my code|feedback on( my)? code|critique)\b/i.test(lower)
  ) {
    responseKind = 'Review';
  } else if (
    hasErrorTrace ||
    hasActiveBug ||
    intent === 'debugging' ||
    /\b(why is my code wrong|what('s| is) wrong with my code|where is my mistake|traceback|syntaxerror|typeerror|indexerror|keyerror|returning none|returns none|bug|fails?)\b/i.test(
      lower
    )
  ) {
    responseKind = 'Debug';
  } else if (
    askingForSkeleton ||
    subIntent === 'pattern' ||
    subIntent === 'pseudocode' ||
    /\b(skeleton|scaffold|boilerplate|pseudocode)\b/i.test(lower)
  ) {
    responseKind = 'Walkthrough';
  } else if (
    subIntent === 'hint' ||
    /\b(i('m| am) stuck|stuck|give me a hint|need a hint|another hint|clue|nudge|where do i start|help me start|i('m| am) lost|lost|i don't know|i do not know|help)\b/i.test(
      lower
    )
  ) {
    responseKind = 'Hint';
  } else {
    responseKind = 'Concept';
  }

  // 2. Determine Permissions (Strictly separated from pedagogy)
  const permissions: AnswerPermissions = Object.freeze({
    includeCode: responseKind === 'FullSolution' || responseKind === 'Walkthrough',
    revealSolution: responseKind === 'FullSolution' || responseKind === 'Walkthrough',
  });

  // 3. Determine Pedagogy & Voice
  const learningGoal: LearningGoal = classifyLearningGoal(
    trimmed,
    intent,
    subIntent,
    permissions.revealSolution,
    hasActiveBug || hasErrorTrace
  );

  const teachingMode: TeachingMode = selectTeachingMode(learningGoal, trimmed, intent);

  // Confidence is categorized cleanly: 'low' | 'medium' | 'high'
  const confidence: ConfidenceLevel = detectConfidence(trimmed);

  // Depth derives adaptively unless explicitly provided
  const depth: ExplanationDepth = explicitVerbosity || deriveAdaptiveDepth(trimmed);

  // 4. Map to TeachingRequest & TeachingRole
  let teachingRequest: TeachingRequest;
  let role: TeachingRole = 'tutor';
  let questionType: QuestionType = 'GENERAL';

  switch (responseKind) {
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

  // Detect misconception only if relevant
  const misconception: Misconception | null =
    hasErrorTrace || hasActiveBug || Boolean(code && code.trim().length > 0)
      ? detectMisconception(trimmed, code)
      : null;

  // 5. Determine Presentation
  const spec = getTeachingRequestSpec(teachingRequest, depth, misconception);

  const presentation: Presentation = Object.freeze({
    template: teachingRequest,
    depth,
    maxWords: spec.maxWords,
    includeDiagram: responseKind === 'Hint' || responseKind === 'Debug' || responseKind === 'Concept',
    askFollowUp: spec.allowFollowUpQuestion && (responseKind === 'Hint' || responseKind === 'Interview'),
    outputTemplate: spec.outputTemplate,
  });

  // 6. Return Fully Frozen Contract
  return Object.freeze({
    responseKind,
    permissions,
    presentation,
    teachingMode,
    learningGoal,
    confidence,
    role,
    questionType,
    // Direct access conveniences mirrored from permissions & presentation
    includeCode: permissions.includeCode,
    revealSolution: permissions.revealSolution,
    includeDiagram: presentation.includeDiagram,
    askFollowUp: presentation.askFollowUp,
    depth: presentation.depth,
    maxWords: presentation.maxWords,
    outputTemplate: presentation.outputTemplate,
    teachingRequest,
  });
}
