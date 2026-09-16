// Evidence Extractor
// RESPONSIBILITY: Parse raw user message, raw error, and editor code into StructuredEvidence.
// NO REASONING. NO PROBABILITIES. NO HISTORY INTERPRETATION.
// Purely deterministic factual extraction.

import { StructuredEvidence } from '../types';

export function extractEvidence(
  message: string = '',
  rawError: string = '',
  code: string = ''
): StructuredEvidence {
  const combined = `${message} ${rawError}`.trim();
  const rawText = combined;

  // 1. Extract test inputs and outputs
  let input: string | undefined;
  let expected: string | undefined;
  let actual: string | undefined;

  const inputMatch = combined.match(/input:\s*(?:[`"']([^`"'\n]+)[`"']|([^\n]+))/i);
  const expectedMatch = combined.match(/expected:\s*(?:[`"']([^`"'\n]+)[`"']|([^\n]+))/i);
  const actualMatch = combined.match(
    /(?:my output|your output|got|actual):\s*(?:[`"']([^`"'\n]+)[`"']|([^\n]+))/i
  );

  if (inputMatch) input = (inputMatch[1] ?? inputMatch[2] ?? '').trim();
  if (expectedMatch) expected = (expectedMatch[1] ?? expectedMatch[2] ?? '').trim();
  if (actualMatch) actual = (actualMatch[1] ?? actualMatch[2] ?? '').trim();

  // Also check for inline failure string like "expected True, got (no output)"
  if (!expected && !actual) {
    const inlineMatch = combined.match(/expected\s+([^,]+),\s*got\s+(.*?)(\)|$|\n)/i);
    if (inlineMatch) {
      expected = inlineMatch[1].trim();
      actual = inlineMatch[2].trim();
    }
  }

  // Also check if (no output) is mentioned standalone
  if (!actual && /\(no output\)/i.test(combined)) {
    actual = '(no output)';
  }

  const hasTestEvidence = expected !== undefined || actual !== undefined;

  // 2. Extract traceback details if an exception occurred
  let traceback: StructuredEvidence['traceback'] | undefined;
  const errorNameMatch = combined.match(
    /\b(IndexError|AttributeError|KeyError|TypeError|NameError|SyntaxError|IndentationError|ValueError|ZeroDivisionError|RecursionError|MemoryError)\b/i
  );

  if (errorNameMatch) {
    const errorName = errorNameMatch[1];
    let line: number | undefined;
    const lineMatch = combined.match(/line\s+(\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
    }

    // Extract message snippet following error name
    let msgSnippet = '';
    const msgMatch = combined.match(new RegExp(`${errorName}:?\\s*([^\\n]+)`, 'i'));
    if (msgMatch) {
      msgSnippet = msgMatch[1].trim();
    }

    traceback = {
      errorName,
      message: msgSnippet || `${errorName} detected`,
      line,
    };
  }

  // 3. Extract factual code properties
  const cleanCode = code.trim();
  const codeFacts = {
    hasCode: cleanCode.length > 0,
    lineCount: cleanCode ? cleanCode.split('\n').length : 0,
    hasReturn: /\breturn\b/.test(cleanCode),
    hasPrint: /\bprint\s*\(/.test(cleanCode),
  };

  // 4. Platform context (LeetCode / Online Judge returns values; terminal scripts print)
  const isLeetCodeStyle =
    /\bclass Solution\b/.test(cleanCode) ||
    /\bdef\s+[a-zA-Z_]\w*\s*\(self/i.test(cleanCode) ||
    hasTestEvidence;

  const platform = isLeetCodeStyle ? 'leetcode_style' : 'terminal_script';

  return {
    input,
    expected,
    actual,
    hasTestEvidence,
    traceback,
    codeFacts,
    platform,
    rawText,
  };
}
