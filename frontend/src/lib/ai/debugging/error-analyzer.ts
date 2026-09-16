// Error Analyzer Pipeline
// Connects EvidenceExtractor -> ConversationAnalyzer -> DiagnosticEngine.
// Deconstructs raw strings into structured facts before reasoning.
// Produces a complete ErrorAnalysisResult with an immutable DiagnosticReport.

import { ErrorAnalysisResult, ErrorType } from '../types';
import { extractEvidence } from './evidence-extractor';
import { analyzeConversation } from './conversation-analyzer';
import { diagnoseFailure } from './diagnostic-engine';

export function analyzeError(
  rawError?: string,
  userMessage: string = '',
  code: string = '',
  chatHistory: Array<{ role: string; content: string }> = []
): ErrorAnalysisResult {
  // 1. Extract structured factual evidence
  const evidence = extractEvidence(userMessage, rawError, code);

  // 2. Analyze conversation history and student state
  const convFacts = analyzeConversation(userMessage, code, chatHistory);

  // 3. Run rule-based causal diagnostic engine
  const report = diagnoseFailure(evidence, convFacts);

  // 4. Map FailureKind to ErrorType
  let errorType: ErrorType = 'none';
  switch (report.failureKind) {
    case 'COMPILE_ERROR':
      errorType = 'syntax_error';
      break;
    case 'RUNTIME_EXCEPTION':
      errorType = 'runtime_error';
      break;
    case 'TIMEOUT':
      errorType = 'infinite_loop';
      break;
    case 'RETURN_VALUE':
      errorType = 'missing_output';
      break;
    case 'WRONG_VALUE':
    case 'ASSERTION':
      errorType = 'wrong_answer';
      break;
    default:
      errorType = 'none';
      break;
  }

  const topHypothesis = report.hypotheses[0];
  const probableCause = topHypothesis
    ? `${topHypothesis.cause} (${Math.round(topHypothesis.score * 100)}% likelihood)`
    : 'General algorithmic logic check';

  return {
    errorType,
    rawError,
    lineHint: evidence.traceback?.line,
    probableCause,
    recommendedAction: report.teachingSummary,
    report,
  };
}
