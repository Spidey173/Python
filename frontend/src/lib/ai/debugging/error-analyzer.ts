// Dedicated Error Analyzer
// Categorizes errors into specific types (Syntax, Runtime, Wrong Answer, Infinite Loop, Missing Output)

import { ErrorAnalysisResult, ErrorType } from '../types';

export function analyzeError(
  rawError?: string,
  userMessage: string = '',
  code: string = ''
): ErrorAnalysisResult {
  const combined = `${rawError || ''} ${userMessage} ${code}`.toLowerCase();

  // Extract line number if present
  let lineHint: number | undefined;
  const lineMatch = combined.match(/line\s+(\d+)/i);
  if (lineMatch) {
    lineHint = parseInt(lineMatch[1], 10);
  }

  // 1. Syntax & Indentation Errors
  if (/syntaxerror|indentationerror|unexpected indent|unindent|invalid syntax/i.test(combined)) {
    return {
      errorType: 'syntax_error',
      rawError,
      lineHint,
      probableCause: 'Unclosed parentheses/brackets, mismatched indentation, or missing colon after an if/for/while statement.',
      recommendedAction: `Inspect line ${lineHint || 'flagged'}: verify colon (:) at end of statement and check 4-space indentation alignment.`,
    };
  }

  // 2. Runtime Errors
  if (/indexerror/i.test(combined)) {
    return {
      errorType: 'runtime_error',
      rawError,
      lineHint,
      probableCause: 'Attempting to access an index out of bounds (e.g. index >= len(arr) or negative index before 0).',
      recommendedAction: 'Verify loop range upper boundary (`len(arr) - 1`) and ensure pointer conditions check bounds before accessing `arr[i]`.',
    };
  }

  if (/keyerror/i.test(combined)) {
    return {
      errorType: 'runtime_error',
      rawError,
      lineHint,
      probableCause: 'Querying a dictionary key that does not exist.',
      recommendedAction: 'Use `dict.get(key, default)` or verify with `if key in dict:` before indexing.',
    };
  }

  if (/typeerror|attributeerror/i.test(combined)) {
    return {
      errorType: 'runtime_error',
      rawError,
      lineHint,
      probableCause: 'Calling a method on incompatible type (e.g. calling string method on integer, or indexing a NoneType).',
      recommendedAction: 'Confirm the type of the variable right before this operation using print(type(var)) or adding a None-check.',
    };
  }

  // 3. Timeout / Infinite Loop
  if (/timeout|timed out|infinite loop|stuck/i.test(combined)) {
    return {
      errorType: 'infinite_loop',
      rawError,
      lineHint,
      probableCause: 'Loop termination condition never evaluates to False (pointers never advance or step variable unchanged).',
      recommendedAction: 'Check while-loop variables: ensure left/right pointers or decrement counters change on EVERY execution path.',
    };
  }

  // 4. Missing Output / Returning None
  if (/missing output|returning none|no output|stdout empty/i.test(combined) || (code && !code.includes('print') && !code.includes('return'))) {
    return {
      errorType: 'missing_output',
      rawError,
      lineHint,
      probableCause: 'The test harness evaluates terminal stdout, but the script did not call `print(...)`.',
      recommendedAction: 'Add `print(result)` to output your calculated value to terminal stdout.',
    };
  }

  // 5. Wrong Answer / Assertion mismatch
  if (/test case.*fail|expected.*got|assertionerror|wrong output/i.test(combined)) {
    return {
      errorType: 'wrong_answer',
      rawError,
      lineHint,
      probableCause: 'Algorithm produces an output differing from the expected test case (likely an edge case like duplicate values, single element, or whitespace).',
      recommendedAction: 'Trace the test input by hand or add intermediate print debugging to observe state before final output.',
    };
  }

  return {
    errorType: 'none',
    rawError,
    probableCause: 'General question or behavior check.',
    recommendedAction: 'Review the problem constraints and verify algorithmic assumptions.',
  };
}
