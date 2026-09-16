// Failure Diagnostic Engine (Production Senior Mentor Reasoning)
// RESPONSIBILITY: Pure rule-based causal inference over StructuredEvidence and ConversationFacts.
// Rules:
// 1. Classifies FailureKind using an extensible taxonomy.
// 2. Generates Observations, Inferences, and Counterfactuals ("What would I expect instead?").
// 3. Produces Ranked Hypotheses with numeric scores, Evidence For, and Evidence Against.
// 4. Detects Contradictions (e.g. student reports failure after working solution was already provided).
// 5. Explicitly specifies Missing / Requested Evidence (e.g. student's current editor code).

import {
  ConversationFacts,
  DiagnosticHypothesis,
  DiagnosticReport,
  FailureKind,
  Observation,
  StructuredEvidence,
} from '../types';

export function diagnoseFailure(
  evidence: StructuredEvidence,
  convFacts: ConversationFacts
): DiagnosticReport {
  // 1. Extensible FailureKind Classification
  let failureKind: FailureKind = 'UNKNOWN';

  const lowerText = evidence.rawText.toLowerCase();

  if (evidence.traceback?.errorName) {
    const err = evidence.traceback.errorName.toLowerCase();
    if (err.includes('syntax') || err.includes('indentation')) {
      failureKind = 'COMPILE_ERROR';
    } else if (err.includes('memory')) {
      failureKind = 'MEMORY_LIMIT';
    } else {
      failureKind = 'RUNTIME_EXCEPTION';
    }
  } else if (
    /\b(timeout|timed out|infinite loop|time limit exceeded)\b/i.test(lowerText)
  ) {
    failureKind = 'TIMEOUT';
  } else if (
    evidence.actual === '(no output)' ||
    evidence.actual === '' ||
    evidence.actual === 'None' ||
    /\b(no output|missing output|stdout empty|returned none|returning none)\b/i.test(
      lowerText
    )
  ) {
    failureKind = 'RETURN_VALUE';
  } else if (
    evidence.hasTestEvidence &&
    evidence.expected !== undefined &&
    evidence.actual !== undefined &&
    evidence.expected !== evidence.actual
  ) {
    failureKind = 'WRONG_VALUE';
  } else if (/\bassertionerror\b/i.test(lowerText)) {
    failureKind = 'ASSERTION';
  } else if (
    /\b(syntaxerror|indentationerror|unexpected indent)\b/i.test(lowerText)
  ) {
    failureKind = 'COMPILE_ERROR';
  } else if (
    /\b(indexerror|keyerror|typeerror|attributeerror)\b/i.test(lowerText)
  ) {
    failureKind = 'RUNTIME_EXCEPTION';
  }

  // 2. Observations (Facts directly verified from evidence)
  const observations: Observation[] = [];

  if (evidence.input !== undefined) {
    observations.push({
      kind: 'input',
      label: 'Test Input',
      value: evidence.input,
    });
  }
  if (evidence.expected !== undefined) {
    observations.push({
      kind: 'expected',
      label: 'Expected Output',
      value: evidence.expected,
    });
  }
  if (evidence.actual !== undefined) {
    observations.push({
      kind: 'actual',
      label: 'Actual Output',
      value: evidence.actual,
    });
  }
  if (evidence.traceback) {
    observations.push({
      kind: 'traceback',
      label: 'Traceback Flag',
      value: `${evidence.traceback.errorName}${
        evidence.traceback.line ? ` on line ${evidence.traceback.line}` : ''
      }: ${evidence.traceback.message}`,
    });
  }
  observations.push({
    kind: 'editor',
    label: 'Editor Implementation',
    value: evidence.codeFacts.hasCode
      ? `${evidence.codeFacts.lineCount} lines present`
      : 'No implementation provided in editor',
  });

  // 3. Inferences & Counterfactuals ("What would I expect instead?")
  const inferences: string[] = [];
  let counterfactual = '';

  switch (failureKind) {
    case 'RETURN_VALUE':
      inferences.push(
        'The function terminated execution without producing an explicit return value (Python implicitly evaluated to None).'
      );
      counterfactual =
        'If the comparison logic were simply incorrect, Python would still return `False` (or an evaluated result). Here the output is completely empty `(no output)`. This proves the return statement itself was never reached or returned None.';
      break;

    case 'WRONG_VALUE':
      inferences.push(
        `The algorithm executed to completion and returned \`${evidence.actual}\`, which diverged from \`${evidence.expected}\`.`
      );
      counterfactual =
        `If an exception or timeout had occurred, the test would report an error. Here the code completed, meaning the conditional branch or boundary logic made an incorrect decision on input \`${evidence.input || 'given'}\`.`;
      break;

    case 'RUNTIME_EXCEPTION':
      inferences.push(
        `Execution halted prematurely due to an unhandled ${
          evidence.traceback?.errorName || 'exception'
        }.`
      );
      counterfactual =
        'If all boundary checks were in place, pointer operations would terminate cleanly. The exception indicates an index or key access occurred without prior bounds verification.';
      break;

    case 'TIMEOUT':
      inferences.push(
        'Execution exceeded time limits, indicating pointer progression or loop exit condition remained stuck.'
      );
      counterfactual =
        'In a standard two-pointer or traversal loop, pointers advance inward each step. A timeout indicates an execution branch where pointers never advance.';
      break;

    case 'COMPILE_ERROR':
      inferences.push(
        'Python interpreter failed to parse the code before execution began.'
      );
      counterfactual =
        'Syntax and indentation errors prevent the file from running at all; no logic or test cases were evaluated.';
      break;

    default:
      inferences.push('General logic or failure report.');
      counterfactual =
        'Verify algorithmic invariants against the specified problem constraints.';
      break;
  }

  // 4. Ranked Hypotheses with Numeric Score, Evidence For, and Evidence Against
  const hypotheses: DiagnosticHypothesis[] = [];

  switch (failureKind) {
    case 'RETURN_VALUE':
      hypotheses.push({
        rank: 1,
        cause: 'Function returned None (missing or bypassed return True/False)',
        score: 0.82,
        evidenceFor: [
          'Output is empty / (no output)',
          'In Python, reaching the end of a function without hitting return yields None',
        ],
        evidenceAgainst: [],
        whyExplanation:
          'In Python online judges, test harnesses inspect the returned value. If execution falls off the end of a function or exits without an explicit return value, Python returns None, displaying as (no output).',
      });
      hypotheses.push({
        rank: 2,
        cause: 'Unhandled runtime exception before reaching return',
        score: 0.12,
        evidenceFor: ['Exceptions halt execution immediately before returning'],
        evidenceAgainst: evidence.traceback
          ? []
          : ['No explicit traceback or exception line was reported in stdout'],
        whyExplanation:
          'An uncaught exception (e.g. IndexError) terminates the process before reaching the return statement.',
      });
      hypotheses.push({
        rank: 3,
        cause: 'Infinite loop / Execution timeout',
        score: 0.06,
        evidenceFor: ['Unadvancing while-loop stops return statement from executing'],
        evidenceAgainst: [
          'Online judge did not explicitly flag Time Limit Exceeded',
        ],
        whyExplanation:
          'If a while loop does not decrement or increment pointers, execution hangs and is terminated before reaching return.',
      });
      break;

    case 'WRONG_VALUE':
      hypotheses.push({
        rank: 1,
        cause: 'Conditional branch or character comparison inverted / off-by-one',
        score: 0.75,
        evidenceFor: [
          `Expected \`${evidence.expected}\`, but algorithm returned \`${evidence.actual}\``,
        ],
        evidenceAgainst: [],
        whyExplanation: `The code ran to completion and returned a boolean or value, but the decision condition diverged on input \`${
          evidence.input || 'given'
        }\`.`,
      });
      hypotheses.push({
        rank: 2,
        cause: 'Edge case divergence (single character, spaces, or casing)',
        score: 0.25,
        evidenceFor: ['Input may contain non-alphanumeric characters or uppercase letters'],
        evidenceAgainst: [],
        whyExplanation:
          'Case sensitivity (`.lower()`) or symbol filtering (`.isalnum()`) may filter valid characters or accept invalid ones.',
      });
      break;

    case 'RUNTIME_EXCEPTION':
      hypotheses.push({
        rank: 1,
        cause: `${evidence.traceback?.errorName || 'IndexError'} on boundary access`,
        score: 0.9,
        evidenceFor: [
          `Explicit exception: ${evidence.traceback?.errorName || 'RuntimeError'}`,
          evidence.traceback?.line ? `Line ${evidence.traceback.line}` : 'Line flagged in traceback',
        ],
        evidenceAgainst: [],
        whyExplanation:
          'Pointers advanced past the string boundary (left >= len(s) or right < 0) before an inner while loop checked `left < right`.',
      });
      break;

    case 'TIMEOUT':
      hypotheses.push({
        rank: 1,
        cause: 'Pointer step variables missing in while loop branch',
        score: 0.95,
        evidenceFor: ['Execution timed out'],
        evidenceAgainst: [],
        whyExplanation:
          'If `left += 1` or `right -= 1` is trapped inside an `if` branch that evaluated to False, the loop runs forever.',
      });
      break;

    case 'COMPILE_ERROR':
      hypotheses.push({
        rank: 1,
        cause: 'Mismatched indentation or missing colon',
        score: 0.98,
        evidenceFor: [evidence.traceback?.message || 'Syntax/Indentation flag'],
        evidenceAgainst: [],
        whyExplanation:
          'Python requires 4-space indentation alignment and colons after control flow statements.',
      });
      break;

    default:
      hypotheses.push({
        rank: 1,
        cause: 'Algorithmic invariant evaluation',
        score: 0.5,
        evidenceFor: [],
        evidenceAgainst: [],
        whyExplanation: 'Review the two-pointer invariant and check boundary handling.',
      });
      break;
  }

  // Sort hypotheses descending by score
  hypotheses.sort((a, b) => b.score - a.score);

  // 5. Contradiction Detection
  let contradiction: DiagnosticReport['contradiction'] | undefined;

  if (
    convFacts.previousSolutionProvided &&
    (convFacts.userAskedForCorrection || convFacts.sameFailureRepeated)
  ) {
    contradiction = {
      detected: true,
      explanation:
        'A working solution was already shared earlier in this conversation that passes all test cases. Since the test result is failing locally with (no output) or wrong answer, the code currently running in the student’s editor likely differs from that solution.',
      actionableAdvice:
        'Do NOT re-generate identical code. Acknowledge that the posted solution is correct, explain that local editor divergence (unsaved edits, indentation shift on paste, or missing return) is causing the failure, and ask the student to paste their exact current editor code.',
    };
  }

  // 6. Missing / Requested Evidence
  const requestedEvidence: string[] = [];
  if (convFacts.editorCodeMissing) {
    requestedEvidence.push('Student current editor implementation');
  }
  if (!evidence.traceback && failureKind === 'RUNTIME_EXCEPTION') {
    requestedEvidence.push('Exact exception message and line number');
  }

  // 7. Teaching Summary
  const teachingSummary = [
    `DIAGNOSTIC EVIDENCE: FailureKind=${failureKind}`,
    counterfactual ? `Counterfactual Insight: ${counterfactual}` : '',
    contradiction
      ? `Contradiction: ${contradiction.explanation}\nAction: ${contradiction.actionableAdvice}`
      : '',
    'INSTRUCTION: Base your response ONLY on these observations and hypotheses. Do not invent unrelated causes (like regex or string cleaning). If the student’s code is missing, state the ranked hypotheses honestly and ask them to paste their code.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return Object.freeze({
    failureKind,
    observations,
    inferences,
    counterfactual,
    hypotheses,
    contradiction,
    requestedEvidence,
    teachingSummary,
  });
}
