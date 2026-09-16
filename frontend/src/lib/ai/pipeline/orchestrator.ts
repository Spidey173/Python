// Main Cognitive Pipeline Orchestrator
// Architectural Control Flow:
// Intent Detection -> AnswerContract Resolver (Single Source of Truth, Object.freeze)
//                  -> Declarative Planner (Object.freeze)
//                  -> Prompt Builder (Pure data) -> LLM -> Format Validator (Formatting only)

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
import { determineResponseStyle } from '../style/response-style';
import { resolveAnswerContract } from '../planner/contract-resolver';
import { createResponsePlan } from '../planner/response-planner';
import { detectMisconception } from '../pedagogy/pedagogy';
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

  // 1. Input Normalizer
  const normalizedMessage = message.trim();

  // 2. Weighted Intent Detection (<1ms)
  const detected = detectIntent(normalizedMessage, code);

  // 3. Conditional Stage: Fast Local Capability Router (<1ms, 0 LLM tokens)
  // Only for general language questions when the student is not asking for full challenge code
  const isAskingCode =
    detected.flags.askingForFullCode ||
    detected.subIntent === 'walkthrough' ||
    /\b(give (me )?(the )?(code|solution)|provide (me )?(the )?(code|solution)|show (me )?(the )?(code|solution)|give code|provide code|show code|full code|just code|code please)\b/i.test(
      normalizedMessage
    );

  if (
    !isAskingCode &&
    (detected.intent === 'learning' ||
      detected.intent === 'conversation' ||
      /^(what|how|difference)/i.test(normalizedMessage))
  ) {
    const localCap = tryResolveLocalCapability(normalizedMessage);
    if (localCap) {
      const dummyState = getOrCreateConversationState(challengeId, challengeTitle, stateOverrides);
      const memory = compressMemory(dummyState, EMPTY_AST, chatHistory);
      const style = determineResponseStyle(dummyState, detected.intent, normalizedMessage);

      const contract = resolveAnswerContract({
        message: normalizedMessage,
        intent: detected.intent,
        subIntent: detected.subIntent,
        code,
        explicitVerbosity: inputVerbosity || stateOverrides?.verbosity,
        challengeTitle,
      });

      const plan = createResponsePlan(contract, {
        challengeTitle,
        userMessage: normalizedMessage,
      });

      console.log('🤖 [AI Pipeline Version: 2026-09-16]', {
        message: normalizedMessage,
        responseKind: contract.responseKind,
        allowCode: contract.permissions.includeCode,
        resolvedLocally: true,
      });

      return {
        reply: polishNaturalLanguage(localCap.response),
        confidence: 0.99,
        intent: detected.intent,
        subIntent: detected.subIntent,
        teachingRequest: contract.teachingRequest,
        questionType: contract.questionType,
        verbosity: contract.depth,
        tier: dummyState.hintLevel,
        role: contract.role,
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

  // 7. Error Analyzer
  const needsErrorAnalysis =
    detected.intent === 'debugging' ||
    detected.flags.hasErrorTrace ||
    Boolean(rawError || state.lastBug);

  const errorAnalysis = needsErrorAnalysis
    ? analyzeError(rawError || state.lastBug || undefined, normalizedMessage, code)
    : EMPTY_ERROR_ANALYSIS;

  // 8. Single Source of Truth: AnswerContract Resolver
  const contract = resolveAnswerContract({
    message: normalizedMessage,
    intent: detected.intent,
    subIntent: detected.subIntent,
    code,
    hasActiveBug: Boolean(rawError || state.lastBug),
    hasErrorTrace: errorAnalysis.errorType !== 'none',
    isGreeting: detected.flags.isGreeting,
    askingForFullCode: detected.flags.askingForFullCode,
    askingForSkeleton: detected.flags.askingForSkeleton,
    explicitVerbosity: inputVerbosity || stateOverrides?.verbosity,
    hintLevel: state.hintLevel,
    isSolved: state.isSolved,
    challengeTitle,
  });

  // 9. Knowledge Retrieval Layer
  const helpLevel = (contract.permissions.revealSolution ? 5 : state.hintLevel) as HelpTier;
  const knowledge = retrieveChallengeKnowledge(
    challengeId,
    helpLevel,
    contract.permissions.revealSolution
  );

  // 10. Response Style Engine (Depth, tone, technical level)
  const responseStyle = determineResponseStyle(state, detected.intent, normalizedMessage);

  // 11. Declarative Response Planner (Template and slot selection only)
  const misconception =
    errorAnalysis.errorType !== 'none' || Boolean(rawError || state.lastBug) || Boolean(code && code.trim().length > 0)
      ? detectMisconception(normalizedMessage, code)
      : null;

  const responsePlan = createResponsePlan(contract, {
    challengeTitle,
    userMessage: normalizedMessage,
    isSolved: state.isSolved,
    misconception,
  });

  console.log('🤖 [AI Pipeline Version: 2026-09-16]', {
    message: normalizedMessage,
    responseKind: contract.responseKind,
    teachingMode: contract.teachingMode,
    confidence: contract.confidence,
    allowCode: contract.permissions.includeCode,
    revealSolution: contract.permissions.revealSolution,
    maxWords: contract.presentation.maxWords,
    resolvedLocally: false,
  });

  // 12. Strict Zero-Pollution Cache Policy Guard
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
    helpLevel
  );

  if (isEligibleForCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return {
        reply: polishNaturalLanguage(cached),
        confidence: 0.98,
        intent: detected.intent,
        subIntent: detected.subIntent,
        teachingRequest: contract.teachingRequest,
        questionType: contract.questionType,
        verbosity: contract.depth,
        tier: helpLevel,
        role: contract.role,
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

  // 13. Modular Section-based Prompt Builder
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
      hintLevel: helpLevel,
      code,
      lastBug: state.lastBug,
    });
  }

  // 15. Format-Only Response Validator (Fixes formatting, never alters meaning)
  const validated = validateResponse(rawReply, responsePlan, normalizedMessage);

  // 16. Natural Language Polisher
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
    teachingRequest: contract.teachingRequest,
    questionType: contract.questionType,
    verbosity: contract.depth,
    tier: helpLevel,
    role: contract.role,
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
