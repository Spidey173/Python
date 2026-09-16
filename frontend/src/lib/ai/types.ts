// State-First AI Cognitive System - Type Definitions
// Refined Production Architecture Specification

export type StudentIntent =
  | 'greeting'
  | 'learning'
  | 'debugging'
  | 'reviewing'
  | 'career'
  | 'conversation';

export type LearningSubIntent =
  | 'hint'
  | 'concept'
  | 'complexity'
  | 'pseudocode'
  | 'pattern'
  | 'walkthrough';

export type QuestionType =
  | 'EXPLAIN_PROBLEM'
  | 'EXPLAIN_CODE'
  | 'STUCK'
  | 'WHY_ERROR'
  | 'SHOW_CODE'
  | 'GREETING'
  | 'COMPLEXITY'
  | 'REVIEW'
  | 'GENERAL';

export enum TeachingRequest {
  ExplainProblem = 'ExplainProblem',
  ExplainConcept = 'ExplainConcept',
  ExplainCode = 'ExplainCode',
  GiveHint = 'GiveHint',
  Debug = 'Debug',
  ShowSolution = 'ShowSolution',
  Complexity = 'Complexity',
  Compare = 'Compare',
  Review = 'Review',
  Interview = 'Interview',
  General = 'General',
}

export type ExplanationDepth =
  | 'tiny'    // ~30 words
  | 'short'   // ~80 words (default)
  | 'normal'  // ~150 words
  | 'deep';   // unlimited

export type LearningGoal =
  | 'Understand'
  | 'Hint'
  | 'Debug'
  | 'ShowCode'
  | 'Review'
  | 'Compare'
  | 'Interview';

export type TeachingMode =
  | 'Teacher'
  | 'Coach'
  | 'Debugger'
  | 'Interviewer'
  | 'PairProgrammer';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type MasteryState = 'learned' | 'learning' | 'not_started';

export interface Misconception {
  id: string;
  name: string;
  correction: string;
}

export interface PatternStep {
  pattern: string;
  nextPattern?: string;
  prerequisite?: string;
  transferClue: string;
}

export interface NextBestStep {
  topic: string;
  suggestion: string;
}

export interface TeachingRequestSpec {
  request: TeachingRequest;
  maxWords: number;
  maxExamples: number;
  allowCode: boolean;
  allowFollowUpQuestion: boolean;
  explanationDepth: ExplanationDepth;
  outputTemplate: string;
}

export type ErrorType =
  | 'syntax_error'
  | 'runtime_error'
  | 'wrong_answer'
  | 'infinite_loop'
  | 'missing_output'
  | 'none';

export type TeachingRole =
  | 'tutor'
  | 'debugger'
  | 'explainer'
  | 'reviewer'
  | 'interviewer';

export type HelpTier = 1 | 2 | 3 | 4 | 5;

export interface ConversationState {
  challengeId: number;
  challengeTitle: string;
  attemptCount: number;
  hintLevel: HelpTier;
  lastBug?: string | null;
  isSolved: boolean;
  learningMode?: 'socratic' | 'direct' | 'interview';
  verbosity?: ExplanationDepth;
  recentIntents?: StudentIntent[];
  lastHintProvided?: string;
  conceptsGrasped?: string[];
  currentBottlenecks?: string[];
  previousCode?: string;
  codeDiffSummary?: string;
}

export interface FactualASTSummary {
  functions: string[];
  loopCount: number;
  hasNestedLoops: boolean;
  hasRecursion: boolean;
  usesHashMap: boolean;
  usesStackOrQueue: boolean;
  hasPrint: boolean;
  hasReturn: boolean;
  linesOfCode: number;
  potentialTraps: string[];
  variables: string[];
}

export type FailureKind =
  | 'RETURN_VALUE'        // (no output), None returned
  | 'WRONG_VALUE'         // expected X, got Y (boolean, list, etc.)
  | 'TIMEOUT'             // infinite loop / time limit exceeded
  | 'RUNTIME_EXCEPTION'   // IndexError, KeyError, TypeError, AttributeError, etc.
  | 'COMPILE_ERROR'       // SyntaxError, IndentationError
  | 'MEMORY_LIMIT'        // Out of memory
  | 'ASSERTION'           // AssertionError
  | 'UNKNOWN';

export interface StructuredEvidence {
  input?: string;
  expected?: string;
  actual?: string;
  hasTestEvidence: boolean;
  traceback?: {
    errorName: string;
    message: string;
    line?: number;
  };
  codeFacts: {
    hasCode: boolean;
    lineCount: number;
    hasReturn: boolean;
    hasPrint: boolean;
  };
  platform: 'leetcode_style' | 'terminal_script';
  rawText: string;
}

export interface ConversationFacts {
  previousSolutionProvided: boolean;
  userAskedForCorrection: boolean;
  sameFailureRepeated: boolean;
  editorCodeMissing: boolean;
  studentRejectedHint: boolean;
  turnsCount: number;
}

export interface Observation {
  kind: 'expected' | 'actual' | 'input' | 'traceback' | 'editor';
  label: string;
  value: string;
}

export interface DiagnosticHypothesis {
  rank: number;
  cause: string;
  score: number; // 0.0 - 1.0
  evidenceFor: string[];
  evidenceAgainst: string[];
  whyExplanation: string;
}

export interface DiagnosticReport {
  failureKind: FailureKind;
  observations: Observation[];
  inferences: string[];
  counterfactual: string; // "What would I expect instead?"
  hypotheses: DiagnosticHypothesis[];
  contradiction?: {
    detected: boolean;
    explanation: string;
    actionableAdvice: string;
  };
  requestedEvidence: string[];
  teachingSummary: string;
}

export interface ErrorAnalysisResult {
  errorType: ErrorType;
  rawError?: string;
  lineHint?: number;
  probableCause: string;
  recommendedAction: string;
  report?: DiagnosticReport;
}

export interface ResponseStyle {
  depth: 'brief' | 'normal' | 'detailed';
  tone: 'neutral' | 'supportive' | 'celebratory';
  technicalLevel: 'beginner' | 'intermediate' | 'advanced';
  includeExample: boolean;
  includeDiagram: boolean;
  askFollowup: boolean;
}

export interface CompressedMemory {
  challengeTitle: string;
  attemptCount: number;
  understoodConcepts: string[];
  strugglingWith: string[];
  previousBug?: string;
  lastHint?: string;
  formattedText: string;
}

export type ResponseKind =
  | 'Concept'
  | 'Hint'
  | 'Debug'
  | 'Walkthrough'
  | 'FullSolution'
  | 'Review'
  | 'Interview';

export interface AnswerPermissions {
  readonly includeCode: boolean;
  readonly revealSolution: boolean;
  readonly askFollowUp: boolean;
}

export interface Presentation {
  readonly template: TeachingRequest;
  readonly depth: ExplanationDepth;
  readonly maxWords: number;
  readonly includeDiagram: boolean;
  readonly outputTemplate: string;
}

export interface TeachingStyle {
  readonly mode: TeachingMode;
  readonly confidence: ConfidenceLevel;
}

export interface AnswerContract {
  readonly responseKind: ResponseKind;
  readonly permissions: AnswerPermissions;
  readonly presentation: Presentation;
  readonly teaching: TeachingStyle;
  readonly learningGoal: LearningGoal;
  readonly role: TeachingRole;
  readonly questionType: QuestionType;
  // Conveniences mirrored directly for ergonomic access
  readonly includeCode: boolean;
  readonly revealSolution: boolean;
  readonly includeDiagram: boolean;
  readonly askFollowUp: boolean;
  readonly depth: ExplanationDepth;
  readonly maxWords: number;
  readonly outputTemplate: string;
  readonly teachingRequest: TeachingRequest;
  readonly teachingMode: TeachingMode;
  readonly confidence: ConfidenceLevel;
}

export interface ResponsePlan {
  teachingRequest: TeachingRequest;
  requestSpec: TeachingRequestSpec;
  explanationDepth: ExplanationDepth;
  questionType: QuestionType;
  learningGoal: LearningGoal;
  teachingMode: TeachingMode;
  confidenceLevel: ConfidenceLevel;
  contract: AnswerContract;
  misconception?: Misconception | null;
  patternStep?: PatternStep | null;
  nextBestStep?: NextBestStep | null;
  goal: string;
  teachingGoal: string;
  role: TeachingRole;
  responseLength: 'short' | 'medium' | 'long';
  revealSolution: boolean;
  includeCode: boolean;
  askQuestionAtEnd: boolean;
  structure: string[];
  confidence: number;
}

export interface PromptSection {
  title: string;
  content: string;
}

export interface RetrievedKnowledge {
  conceptName: string;
  targetHint: string;
  commonTrap: string;
  edgeCases: string[];
  optimalApproachTitle: string;
  optimalCodeSnippet?: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export interface TeachingPlan {
  intent: StudentIntent;
  subIntent?: LearningSubIntent;
  helpLevel: HelpTier;
  allowCode: boolean;
  allowFullSolution: boolean;
  role: TeachingRole;
  focusDirective: string;
}

export interface ValidationResult {
  isValid: boolean;
  cleanedResponse: string;
  confidence: number;
  flags: {
    leakedSolutionPrematurely: boolean;
    unallowedCodeBlock: boolean;
    emptyOrExcessive: boolean;
    suggestClarification: boolean;
  };
  clarificationQuestion?: string;
}
