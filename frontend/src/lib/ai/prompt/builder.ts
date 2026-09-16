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
  const styleDirective = formatStyleDirective(style);
  sections.push({
    title: 'ROLE & STYLE',
    content: `${roleText}\n${styleDirective}`,
  });

  // 3. Challenge Context
  sections.push({
    title: 'CHALLENGE CONTEXT',
    content: `Challenge: ${state.challengeTitle}
Topic: ${knowledge.conceptName} | Time: ${knowledge.timeComplexity}, Space: ${knowledge.spaceComplexity}
Target Clue: ${knowledge.targetHint}
Interview Trap: ${knowledge.commonTrap}`,
  });

  // 4. Compressed Memory
  sections.push({
    title: 'STUDENT MEMORY',
    content: memory.formattedText,
  });

  // 5. AST & Code Observations
  const astFormatted = formatASTForPrompt(ast);
  let codeContext = astFormatted;
  if (errorAnalysis.errorType !== 'none') {
    codeContext += `\nDiagnostic Flag: ${errorAnalysis.errorType} (${errorAnalysis.probableCause})`;
  }
  sections.push({
    title: 'CODE OBSERVATIONS',
    content: codeContext,
  });

  // 6. Code Iteration Diff (if student modified code between attempts)
  if (codeDiff?.hasChanges) {
    sections.push({
      title: 'CODE ITERATION DIFF',
      content: `Recent code adjustment from previous attempt: ${codeDiff.summary}`,
    });
  }

  // 6. Response Plan & Blueprint
  sections.push({
    title: 'RESPONSE PLAN & STRUCTURE',
    content: formatPlanDirective(plan),
  });

  return sections;
}

export function buildSystemPrompt(input: ModularPromptInput): string {
  const sections = buildPromptSections(input);
  return sections.map((s) => `[${s.title}]\n${s.content}`).join('\n\n');
}
