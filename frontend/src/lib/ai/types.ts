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

export interface ErrorAnalysisResult {
  errorType: ErrorType;
  rawError?: string;
  lineHint?: number;
  probableCause: string;
  recommendedAction: string;
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

export interface ResponsePlan {
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
