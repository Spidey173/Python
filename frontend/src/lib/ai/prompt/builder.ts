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

  // 5. Response Plan & Blueprint
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
