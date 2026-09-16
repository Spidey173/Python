// Section-based Modular Prompt Builder (~500-600 tokens)
// Assembles independently testable PromptSection blocks joined by headers

import { CORE_IDENTITY, ROLE_TEMPLATES } from './templates';
import {
  CompressedMemory,
  ConversationState,
  ErrorAnalysisResult,
  FactualASTSummary,
  PromptSection,
  ResponsePlan,
  ResponseStyle,
  RetrievedKnowledge,
} from '../types';
import { formatASTForPrompt } from '../ast/summarizer';
import { formatStyleDirective } from '../style/response-style';
import { formatPlanDirective } from '../planner/response-planner';

export interface ModularPromptInput {
  state: ConversationState;
  ast: FactualASTSummary;
  memory: CompressedMemory;
  plan: ResponsePlan;
  style: ResponseStyle;
  knowledge: RetrievedKnowledge;
  errorAnalysis: ErrorAnalysisResult;
  codeDiff?: { hasChanges: boolean; summary: string } | null;
  userMessage: string;
}

export function buildPromptSections(input: ModularPromptInput): PromptSection[] {
  const { state, ast, memory, plan, style, knowledge, errorAnalysis, codeDiff } = input;

  const sections: PromptSection[] = [];

  // 1. Identity
  sections.push({
    title: 'SYSTEM IDENTITY',
    content: CORE_IDENTITY,
  });

  // 2. Role & Dynamic Style
  const roleText = ROLE_TEMPLATES[plan.role] || ROLE_TEMPLATES.tutor;
  sections.push({
    title: 'ROLE',
    content: roleText,
  });

  // 3. Challenge Context (ONLY when working on challenge-specific logic)
  const isChallengeRelated =
    plan.teachingRequest === 'GiveHint' ||
    plan.teachingRequest === 'ShowSolution' ||
    plan.teachingRequest === 'Debug' ||
    plan.teachingRequest === 'ExplainProblem';

  if (isChallengeRelated && knowledge.conceptName) {
    sections.push({
      title: 'CHALLENGE CONTEXT',
      content: `Challenge: ${state.challengeTitle}\nTopic: ${knowledge.conceptName} | Time: ${knowledge.timeComplexity}, Space: ${knowledge.spaceComplexity}`,
    });
  }

  // 4. Code Observations & AST (ONLY if student has code and is debugging or reviewing)
  const isCodeRelated =
    ast.linesOfCode > 0 &&
    (plan.teachingRequest === 'Debug' ||
      plan.teachingRequest === 'Review' ||
      errorAnalysis.errorType !== 'none');

  if (isCodeRelated) {
    const astFormatted = formatASTForPrompt(ast);
    let codeContext = astFormatted;
    if (errorAnalysis.errorType !== 'none') {
      codeContext += `\nDiagnostic Flag: ${errorAnalysis.errorType} (${errorAnalysis.probableCause})`;
    }
    if (codeDiff?.hasChanges) {
      codeContext += `\nRecent code change: ${codeDiff.summary}`;
    }
    sections.push({
      title: 'CODE OBSERVATIONS',
      content: codeContext,
    });
  }

  // 5. Diagnostic Evidence & Ranked Hypotheses (when debugging a failure)
  if (errorAnalysis.report && errorAnalysis.report.failureKind !== 'UNKNOWN') {
    const rep = errorAnalysis.report;
    const diagLines: string[] = [];
    diagLines.push(`Failure Kind: ${rep.failureKind}`);

    if (rep.observations.length > 0) {
      diagLines.push('Factual Observations:');
      for (const obs of rep.observations) {
        diagLines.push(`• ${obs.label}: ${obs.value}`);
      }
    }

    if (rep.counterfactual) {
      diagLines.push(`Counterfactual ("What would I expect instead?"): ${rep.counterfactual}`);
    }

    if (rep.hypotheses.length > 0) {
      diagLines.push('Ranked Hypotheses:');
      for (const hyp of rep.hypotheses) {
        diagLines.push(`• [${Math.round(hyp.score * 100)}% Likelihood] ${hyp.cause}`);
        diagLines.push(`  Why: ${hyp.whyExplanation}`);
        if (hyp.evidenceAgainst.length > 0) {
          diagLines.push(`  Evidence Against: ${hyp.evidenceAgainst.join('; ')}`);
        }
      }
    }

    if (rep.contradiction?.detected) {
      diagLines.push(`Contradiction Flag: ${rep.contradiction.explanation}`);
      diagLines.push(`Action Instruction: ${rep.contradiction.actionableAdvice}`);
    }

    if (rep.requestedEvidence.length > 0) {
      diagLines.push(`Missing Evidence: ${rep.requestedEvidence.join(', ')} — ask student to paste current editor implementation.`);
    }

    diagLines.push('CRITICAL RULE: Base your debugging explanation only on the observations and hypotheses below. Do not invent additional causes unless the evidence is insufficient. Never suggest print() statements (the platform evaluates function return values), and do not invent regex or string-cleaning guesses when output is missing.');

    sections.push({
      title: 'DIAGNOSTIC EVIDENCE',
      content: diagLines.join('\n'),
    });
  }

  // 6. Response Plan & Blueprint
  sections.push({
    title: 'RESPONSE PLAN',
    content: formatPlanDirective(plan),
  });

  return sections;
}

export function buildSystemPrompt(input: ModularPromptInput): string {
  const sections = buildPromptSections(input);
  return sections.map((s) => `[${s.title}]\n${s.content}`).join('\n\n');
}
