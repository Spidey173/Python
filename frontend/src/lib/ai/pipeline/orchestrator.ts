// Main Cognitive Pipeline Orchestrator (Production ChatGPT / Claude Grade)
// Orchestrates: Normalize -> Weighted Intent -> Capability Router -> State -> Conditional Memory & AST -> Error Analyzer
//               -> Code Diff -> Knowledge -> Teaching Planner -> Style Engine -> Response Planner -> Modular Prompt
//               -> Workload Provider Router -> Validator -> Natural Language Polisher -> Stream / Output

import {
  ConversationState,
  HelpTier,
  StudentIntent,
  TeachingRole,
  FactualASTSummary,
  ResponsePlan,
  ResponseStyle,
  ErrorAnalysisResult,
  CompressedMemory,
  QuestionType,
  TeachingRequest,
  ExplanationDepth,
} from '../types';
import { detectIntent } from '../intent/detector';
import { tryResolveLocalCapability } from '../router/capability-router';
import { summarizeCode } from '../ast/summarizer';
import { computeCodeDiff, CodeDiffResult } from '../ast/code-diff';
import { analyzeError } from '../debugging/error-analyzer';
import { getOrCreateConversationState, recordIntent } from '../state/conversation-state';
import { compressMemory } from '../memory/memory-compressor';
import { retrieveChallengeKnowledge } from '../retrieval/knowledge-retriever';
import { createTeachingPlan } from '../planner/teaching-planner';
import { determineResponseStyle } from '../style/response-style';
import { createResponsePlan } from '../planner/response-planner';
import { buildSystemPrompt } from '../prompt/builder';
import { validateResponse } from '../validator/response-validator';
import { polishNaturalLanguage } from '../polisher/natural-language-rewriter';
import { detectTopic, renderTopicResponse } from '../fallback/template-engine';
import { getCacheKey, getCachedResponse, setCachedResponse } from '../cache/prompt-cache';

export interface CognitivePipelineInput {
  message: string;
  code?: string;
  challengeId?: number;
  challengeTitle?: string;
  chatHistory?: Array<{ role: string; content: string }>;
  rawError?: string;
  verbosity?: ExplanationDepth;
  stateOverrides?: {
    attemptCount?: number;
    hintLevel?: HelpTier;
    lastBug?: string | null;
    isSolved?: boolean;
    verbosity?: ExplanationDepth;
    conceptsGrasped?: string[];
    currentBottlenecks?: string[];
  };
  llmInvoker?: (
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: string; content: string }>,
    intent?: StudentIntent
  ) => Promise<string>;
}

export interface CognitivePipelineOutput {
  reply: string;
  confidence: number;
  intent: StudentIntent;
  subIntent?: string;
  teachingRequest: TeachingRequest;
  questionType: QuestionType;
  verbosity: ExplanationDepth;
  tier: HelpTier;
  role: TeachingRole;
  socratic_hint: string;
  nextStep?: string;
  astSummary: FactualASTSummary;
  codeDiff?: CodeDiffResult | null;
  errorAnalysis?: ErrorAnalysisResult;
  responsePlan: ResponsePlan;
  responseStyle: ResponseStyle;
  memory: CompressedMemory;
  clarificationQuestion?: string;
  resolvedLocally?: boolean;
}

const EMPTY_AST: FactualASTSummary = {
  functions: [],
  loopCount: 0,
  hasNestedLoops: false,
  hasRecursion: false,
  usesHashMap: false,
  usesStackOrQueue: false,
  hasPrint: false,
  hasReturn: false,
  linesOfCode: 0,
  potentialTraps: [],
  variables: [],
};

const EMPTY_ERROR_ANALYSIS: ErrorAnalysisResult = {
  errorType: 'none',
  probableCause: '',
  recommendedAction: '',
};

export async function runCognitivePipeline(
  input: CognitivePipelineInput
): Promise<CognitivePipelineOutput> {
  const {
    message,
    code = '',
    challengeId = 1,
    challengeTitle = `Challenge #${challengeId}`,
    chatHistory = [],
    rawError,
    verbosity: inputVerbosity,
    stateOverrides,
    llmInvoker,
  } = input;

  const verbosity: ExplanationDepth =
    stateOverrides?.verbosity || inputVerbosity || 'short';

  // 1. Input Normalizer
  const normalizedMessage = message.trim();

  // 2. Weighted Scoring Intent Detection (<1ms)
  const detected = detectIntent(normalizedMessage, code);

  // HARD OVERRIDE FOR SHOW_CODE / SOLUTION REQUESTS
  // When a student explicitly asks for code, nothing later in the pipeline may override it.
  const isShowCodeRequest =
    detected.flags.askingForFullCode ||
    detected.subIntent === 'walkthrough' ||
    /\b(give (me )?(the )?(code|solution)|provide (me )?(the )?(code|solution)|show (me )?(the )?(code|solution)|give code|provide code|show code|write (the )?code|full code|just code|code please)\b/i.test(
      normalizedMessage
    );

  if (isShowCodeRequest) {
    detected.intent = 'learning';
    detected.subIntent = 'walkthrough';
    detected.flags.askingForFullCode = true;
  }

  // 3. Conditional Stage: Capability Router (Only check if message is asking a factual question)
  // NEVER resolve locally if user is asking for challenge code!
  if (
    !isShowCodeRequest &&
    (detected.intent === 'learning' ||
      detected.intent === 'conversation' ||
      /^(what|how|difference)/i.test(normalizedMessage))
  ) {
    const localCap = tryResolveLocalCapability(normalizedMessage);
    if (localCap) {
      const dummyState = getOrCreateConversationState(challengeId, challengeTitle, stateOverrides);
      const memory = compressMemory(dummyState, EMPTY_AST, chatHistory);
      const style = determineResponseStyle(dummyState, detected.intent, normalizedMessage);
      const plan = createResponsePlan(
        detected.intent,
        detected.subIntent,
        dummyState.hintLevel,
        style,
        EMPTY_ERROR_ANALYSIS,
        EMPTY_AST,
        false,
        normalizedMessage,
        false,
        false,
        inputVerbosity || stateOverrides?.verbosity,
        challengeTitle,
        code,
        dummyState.isSolved
      );

      console.log('🤖 [AI Pipeline Version: 2026-09-16]', {
        message: normalizedMessage,
        requestType: plan.teachingRequest,
        allowCode: plan.includeCode,
        resolvedLocally: true,
      });

      return {
        reply: polishNaturalLanguage(localCap.response),
        confidence: 0.99,
        intent: detected.intent,
        subIntent: detected.subIntent,
        teachingRequest: plan.teachingRequest,
        questionType: plan.questionType,
        verbosity: plan.explanationDepth,
        tier: dummyState.hintLevel,
        role: 'explainer',
        socratic_hint: 'Standard Python documentation & algorithmic foundation.',
        nextStep: plan.nextBestStep?.suggestion,
        astSummary: EMPTY_AST,
        responsePlan: plan,
        responseStyle: style,
        memory,
        resolvedLocally: true,
      };
    }
  }

  // 4. Conversation State Manager
  const state = getOrCreateConversationState(challengeId, challengeTitle, stateOverrides);
  recordIntent(challengeId, detected.intent);

  // 5. Conditional Stage: AST Code Analysis & Code Diff
  // A pure greeting or general chat does not spend cycles analyzing syntax
  const needsCodeAnalysis =
    Boolean(code && code.trim().length > 0) &&
    (detected.intent === 'debugging' ||
      detected.intent === 'reviewing' ||
      detected.subIntent === 'pattern' ||
      detected.subIntent === 'walkthrough');

  const ast = needsCodeAnalysis ? summarizeCode(code) : EMPTY_AST;
  const codeDiff = needsCodeAnalysis ? computeCodeDiff(code, state.previousCode) : null;
  if (code && code.trim().length > 0) {
    state.previousCode = code;
  }

  // 6. Memory Compression (60-90 tokens)
  const memory = compressMemory(state, ast, chatHistory);

  // 7. Conditional Stage: Error Analyzer
  // Only evaluate error details if debugging or if an explicit error is present
  const needsErrorAnalysis =
    detected.intent === 'debugging' ||
    detected.flags.hasErrorTrace ||
    Boolean(rawError || state.lastBug);

  const errorAnalysis = needsErrorAnalysis
    ? analyzeError(rawError || state.lastBug || undefined, normalizedMessage, code)
    : EMPTY_ERROR_ANALYSIS;

  // 8. Teaching Planner (Pedagogical tier progression 1..5)
  const teachingPlan = createTeachingPlan(detected, state);

  // Hard override on teaching plan if asking for code
  if (isShowCodeRequest) {
    teachingPlan.helpLevel = 5;
    teachingPlan.allowCode = true;
    teachingPlan.allowFullSolution = true;
    teachingPlan.role = 'tutor';
    teachingPlan.focusDirective =
      'The student explicitly requested code. Give the clean Python code, followed by "**How it works**" with 4-6 short bullet points. No essay.';
  }

  // 9. Knowledge Retrieval Layer
  const knowledge = retrieveChallengeKnowledge(
    challengeId,
    teachingPlan.helpLevel,
    teachingPlan.allowFullSolution
  );

  // 10. Response Style Engine (Depth, tone, technical level)
  const responseStyle = determineResponseStyle(state, detected.intent, normalizedMessage);

  // 11. Response Planner (Reasoning blueprint object)
  const responsePlan = createResponsePlan(
    detected.intent,
    detected.subIntent,
    teachingPlan.helpLevel,
    responseStyle,
    errorAnalysis,
    ast,
    detected.flags.askingForFullCode,
    normalizedMessage,
    Boolean(rawError || state.lastBug),
    detected.flags.isGreeting,
    inputVerbosity || stateOverrides?.verbosity,
    challengeTitle,
    code,
    state.isSolved
  );

  // Hard override on response plan if asking for code
  if (isShowCodeRequest) {
    responsePlan.teachingRequest = TeachingRequest.ShowSolution;
    responsePlan.role = 'tutor';
    responsePlan.revealSolution = true;
    responsePlan.includeCode = true;
    responsePlan.teachingMode = 'Teacher';
  }

  console.log('🤖 [AI Pipeline Version: 2026-09-16]', {
    message: normalizedMessage,
    requestType: responsePlan.teachingRequest,
    teachingMode: responsePlan.teachingMode,
    allowCode: responsePlan.includeCode,
    allowFullSolution: responsePlan.revealSolution,
    resolvedLocally: false,
  });

  // 12. Strict Zero-Pollution Cache Policy Guard
  // Never cache if student has custom code, active bugs, repeated attempts, or frustration tone!
  const isEligibleForCache =
    detected.intent === 'learning' &&
    (!code || code.trim().length === 0) &&
    state.attemptCount === 1 &&
    !state.lastBug &&
    responseStyle.tone === 'neutral' &&
    ['concept', 'complexity'].includes(detected.subIntent || '');

  const cacheKey = getCacheKey(
    challengeId,
    detected.intent,
    detected.subIntent || '',
    teachingPlan.helpLevel
  );

  if (isEligibleForCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return {
        reply: polishNaturalLanguage(cached),
        confidence: 0.98,
        intent: detected.intent,
        subIntent: detected.subIntent,
        teachingRequest: responsePlan.teachingRequest,
        questionType: responsePlan.questionType,
        verbosity: responsePlan.explanationDepth,
        tier: teachingPlan.helpLevel,
        role: responsePlan.role,
        socratic_hint: knowledge.targetHint,
        nextStep: responsePlan.nextBestStep?.suggestion,
        astSummary: ast,
        codeDiff,
        errorAnalysis,
        responsePlan,
        responseStyle,
        memory,
      };
    }
  }

  // 13. Modular Section-based Prompt Builder (~300-450 tokens)
  const systemPrompt = buildSystemPrompt({
    state,
    ast,
    memory,
    plan: responsePlan,
    style: responseStyle,
    knowledge,
    errorAnalysis,
    codeDiff,
    userMessage: normalizedMessage,
  });

  // 14. Workload-Based LLM Provider Routing with Dynamic Topic Fallback
  let rawReply = '';

  if (llmInvoker) {
    try {
      rawReply = await llmInvoker(systemPrompt, normalizedMessage, chatHistory, detected.intent);
    } catch (err) {
      console.warn('LLM provider invocation failed, activating template fallback engine:', err);
    }
  }

  // Fallback to dynamic topic template if LLM is offline or produced empty output
  if (!rawReply || !rawReply.trim()) {
    const topicKey = detectTopic(knowledge, code);
    rawReply = renderTopicResponse(topicKey, detected.intent, detected.subIntent, {
      topicName: topicKey,
      knowledge,
      ast,
      attemptCount: state.attemptCount,
      hintLevel: teachingPlan.helpLevel,
      code,
      lastBug: state.lastBug,
    });
  }

  // 15. Response Validator (Deterministic premature leak guard & confidence scoring)
  const validated = validateResponse(
    rawReply,
    responsePlan,
    normalizedMessage,
    teachingPlan.helpLevel
  );

  // 16. Natural Language Polisher (Removes robotic phrases, boilerplate, and smooths transitions)
  const polishedReply = polishNaturalLanguage(validated.cleanedResponse);

  // Cache strictly generic responses
  if (isEligibleForCache && validated.isValid && validated.confidence >= 0.85) {
    setCachedResponse(cacheKey, polishedReply);
  }

  return {
    reply: polishedReply,
    confidence: validated.confidence,
    intent: detected.intent,
    subIntent: detected.subIntent,
    teachingRequest: responsePlan.teachingRequest,
    questionType: responsePlan.questionType,
    verbosity: responsePlan.explanationDepth,
    tier: teachingPlan.helpLevel,
    role: responsePlan.role,
    socratic_hint: knowledge.targetHint,
    nextStep: responsePlan.nextBestStep?.suggestion,
    astSummary: ast,
    codeDiff,
    errorAnalysis,
    responsePlan,
    responseStyle,
    memory,
    clarificationQuestion: validated.clarificationQuestion,
  };
}
