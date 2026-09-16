// Failure Diagnostic Engine (Production Senior Mentor Reasoning)
// RESPONSIBILITY: Pure rule-based causal inference over StructuredEvidence, Observations, and ConversationFacts.
// 100% Problem-Agnostic: Zero hardcoded challenge specifics (no "palindrome", "pointers", or "regex").
// Rules:
// 1. Diagnostic Mode: DIAGNOSIS vs INFORMATION_GATHERING (starvation detection).
// 2. Hierarchical Failure Taxonomy: Category + Subcategory.
// 3. Weighted Evidence Completeness vs Diagnostic Confidence.
// 4. Diagnostic Stopping Rules (collapsing hypothesis search tree on confirmed errors).
// 5. Evidence-Weighted Scoring with verbal Confidence Calibration ('Nearly certain', 'Likely', etc.).
// 6. Typed Contradictions vs Information Gaps.
// 7. Observation-Grounded Reasoning Trace (Observation -> Language Rule -> Deduction).

import {
  ConfidenceCalibration,
  ContradictionType,
  ConversationFacts,
  DiagnosticHypothesis,
  DiagnosticMode,
  DiagnosticReport,
  FailureCategory,
  FailureKind,
  FailureSubcategory,
  InformationGap,
  Observation,
  ReasoningTraceStep,
  StructuredEvidence,
  WeightedCompleteness,
} from '../types';

export function calibrateConfidence(score: number): ConfidenceCalibration {
  if (score >= 0.90) return 'Nearly certain';
  if (score >= 0.70) return 'Likely';
  if (score >= 0.40) return 'Possible';
  return 'Weak hypothesis';
}

export function diagnoseFailure(
  evidence: StructuredEvidence,
  convFacts: ConversationFacts
): DiagnosticReport {
  // ---------------------------------------------------------------------------
  // 1. Information Gaps & Weighted Evidence Completeness
  // Weights: Editor code (0.40), Traceback (0.30), Input/Output (0.20), Convo (0.10)
  // ---------------------------------------------------------------------------
  const informationGaps: InformationGap[] = [];
  const observed: string[] = [];
  const missing: string[] = [];
  let completenessScore = 0;

  if (evidence.codeFacts.hasCode) {
    observed.push('Editor implementation code');
    completenessScore += 0.40;
  } else {
    missing.push('Editor implementation code');
    informationGaps.push(InformationGap.USER_CODE_MISSING);
  }

  if (evidence.traceback) {
    observed.push(`Runtime traceback (${evidence.traceback.errorName})`);
    completenessScore += 0.30;
  } else {
    missing.push('Runtime traceback');
    informationGaps.push(InformationGap.TRACEBACK_MISSING);
  }

  if (evidence.hasTestEvidence) {
    observed.push('Test input and output values');
    completenessScore += 0.20;
    if (evidence.actual === undefined) {
      informationGaps.push(InformationGap.ACTUAL_OUTPUT_MISSING);
    }
  } else {
    missing.push('Test input and output values');
    informationGaps.push(InformationGap.TEST_CASE_MISSING);
    informationGaps.push(InformationGap.ACTUAL_OUTPUT_MISSING);
  }

  if (convFacts.turnsCount > 0) {
    observed.push('Conversation history');
    completenessScore += 0.10;
  }

  completenessScore = Math.min(1.0, Math.round(completenessScore * 100) / 100);

  const isCompletelyStarved =
    !evidence.codeFacts.hasCode &&
    !evidence.traceback &&
    !evidence.hasTestEvidence;

  let evidenceQuality: WeightedCompleteness['quality'] = 'medium';
  if (isCompletelyStarved) {
    evidenceQuality = 'starved';
  } else if (completenessScore >= 0.70) {
    evidenceQuality = 'high';
  } else if (completenessScore >= 0.40) {
    evidenceQuality = 'medium';
  } else {
    evidenceQuality = 'low';
  }

  const completeness: WeightedCompleteness = {
    score: completenessScore,
    quality: evidenceQuality,
    observed,
    missing,
  };

  // ---------------------------------------------------------------------------
  // 2. Factual Observations
  // ---------------------------------------------------------------------------
  const observations: Observation[] = [];
  if (evidence.input !== undefined) {
    observations.push({ kind: 'input', label: 'Test Input', value: evidence.input });
  }
  if (evidence.expected !== undefined) {
    observations.push({ kind: 'expected', label: 'Expected Output', value: evidence.expected });
  }
  if (evidence.actual !== undefined) {
    observations.push({ kind: 'actual', label: 'Actual Output', value: evidence.actual });
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
    label: 'Editor State',
    value: evidence.codeFacts.hasCode
      ? `${evidence.codeFacts.lineCount} lines present (${evidence.codeFacts.hasReturn ? 'has return' : 'no return statement'})`
      : 'No editor code provided',
  });

  // ---------------------------------------------------------------------------
  // 3. Evidence Starvation Guard (Diagnostic Mode: INFORMATION_GATHERING)
  // When user says "it failed" or "not working" with no code, no test values, and no traceback.
  // DO NOT invent speculative hypotheses.
  // ---------------------------------------------------------------------------
  if (isCompletelyStarved) {
    const requestedEvidence = [
      'Current Python code in the editor',
      'The exact test case input, expected output, and your actual output',
      'Traceback message if an exception was thrown',
    ];

    const teachingSummary =
      'EVIDENCE STARVATION DETECTED: The student reported a failure without providing code, test inputs/outputs, or an error traceback. Do NOT invent hypothetical causes. Prompt the student to paste their editor code and test results so we can diagnose the exact line.';

    return Object.freeze({
      mode: 'INFORMATION_GATHERING',
      category: 'UNKNOWN',
      subcategory: 'UNKNOWN',
      failureKind: 'UNKNOWN',
      completeness,
      confidenceScore: 0.15,
      confidenceCalibration: 'Weak hypothesis',
      informationGaps,
      observations,
      inferences: ['Insufficient factual evidence to form a reliable causal diagnosis.'],
      counterfactual: '',
      reasoningTrace: [],
      hypotheses: [],
      requestedEvidence,
      teachingSummary,
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Hierarchical Failure Taxonomy (Category + Subcategory)
  // ---------------------------------------------------------------------------
  const lowerText = evidence.rawText.toLowerCase();
  let category: FailureCategory = 'UNKNOWN';
  let subcategory: FailureSubcategory = 'UNKNOWN';
  let failureKind: FailureKind = 'UNKNOWN';

  if (evidence.traceback?.errorName) {
    const err = evidence.traceback.errorName.toLowerCase();
    if (err.includes('syntax')) {
      category = 'COMPILATION';
      subcategory = 'SYNTAX';
      failureKind = 'COMPILE_ERROR';
    } else if (err.includes('indentation')) {
      category = 'COMPILATION';
      subcategory = 'INDENTATION';
      failureKind = 'COMPILE_ERROR';
    } else if (err.includes('memory')) {
      category = 'PERFORMANCE';
      subcategory = 'MEMORY';
      failureKind = 'MEMORY_LIMIT';
    } else if (err.includes('index')) {
      category = 'EXECUTION';
      subcategory = 'INDEX_ERROR';
      failureKind = 'RUNTIME_EXCEPTION';
    } else if (err.includes('key')) {
      category = 'EXECUTION';
      subcategory = 'KEY_ERROR';
      failureKind = 'RUNTIME_EXCEPTION';
    } else if (err.includes('type')) {
      category = 'EXECUTION';
      subcategory = 'TYPE_ERROR';
      failureKind = 'RUNTIME_EXCEPTION';
    } else if (err.includes('attribute')) {
      category = 'EXECUTION';
      subcategory = 'ATTRIBUTE_ERROR';
      failureKind = 'RUNTIME_EXCEPTION';
    } else {
      category = 'EXECUTION';
      subcategory = 'RUNTIME_EXCEPTION';
      failureKind = 'RUNTIME_EXCEPTION';
    }
  } else if (/\b(timeout|timed out|infinite loop|time limit exceeded)\b/i.test(lowerText)) {
    category = 'PERFORMANCE';
    subcategory = 'TIMEOUT';
    failureKind = 'TIMEOUT';
  } else if (
    evidence.actual === '(no output)' ||
    evidence.actual === '' ||
    evidence.actual === 'None' ||
    /\b(no output|missing output|stdout empty|returned none|returning none)\b/i.test(lowerText)
  ) {
    category = 'OUTPUT';
    subcategory = 'NONE_RETURNED';
    failureKind = 'RETURN_VALUE';
  } else if (
    evidence.hasTestEvidence &&
    evidence.expected !== undefined &&
    evidence.actual !== undefined &&
    evidence.expected !== evidence.actual
  ) {
    category = 'OUTPUT';
    const exp = evidence.expected.trim().toLowerCase();
    if (exp === 'true' || exp === 'false') {
      subcategory = 'WRONG_BOOLEAN';
    } else if (/^-?\d+(\.\d+)?$/.test(exp)) {
      subcategory = 'WRONG_NUMBER';
    } else if (exp.startsWith('[') || exp.startsWith('{') || exp.startsWith('(')) {
      subcategory = 'WRONG_COLLECTION';
    } else if (exp.startsWith('"') || exp.startsWith("'")) {
      subcategory = 'WRONG_STRING';
    } else {
      subcategory = 'WRONG_VALUE';
    }
    failureKind = 'WRONG_VALUE';
  } else if (/\bassertionerror\b/i.test(lowerText)) {
    category = 'INFRASTRUCTURE';
    subcategory = 'ASSERTION';
    failureKind = 'ASSERTION';
  } else if (/\b(syntaxerror|unexpected indent)\b/i.test(lowerText)) {
    category = 'COMPILATION';
    subcategory = 'SYNTAX';
    failureKind = 'COMPILE_ERROR';
  } else if (/\bindentationerror\b/i.test(lowerText)) {
    category = 'COMPILATION';
    subcategory = 'INDENTATION';
    failureKind = 'COMPILE_ERROR';
  }

  // ---------------------------------------------------------------------------
  // 5. Diagnostic Stopping Rules (Collapse Search Space)
  // When compilation or confirmed runtime exceptions occur, prune the search tree.
  // ---------------------------------------------------------------------------
  let stoppingRuleApplied: string | undefined;
  const hypotheses: DiagnosticHypothesis[] = [];
  const inferences: string[] = [];
  let counterfactual = '';
  const reasoningTrace: ReasoningTraceStep[] = [];

  if (category === 'COMPILATION') {
    stoppingRuleApplied = 'COMPILATION_ERROR_COLLAPSE: Syntax or indentation error prevents execution from starting.';
    inferences.push('Python parser halted before execution; no runtime logic or test assertions were reached.');
    counterfactual = 'Since the code failed during compilation, runtime logic, loops, and return values were never evaluated.';

    hypotheses.push({
      rank: 1,
      cause: subcategory === 'INDENTATION' ? 'Indentation alignment mismatch' : 'Syntax error (e.g. missing colon or unclosed parenthesis)',
      score: 0.98,
      calibration: 'Nearly certain',
      evidenceFor: [evidence.traceback?.message || 'Syntax/Indentation flag detected'],
      evidenceAgainst: [],
      whyExplanation: 'Python requires exact 4-space indentation and colons after control flow statements.',
    });

    reasoningTrace.push({
      step: 1,
      observation: evidence.traceback?.message || 'Compilation error flagged in output',
      languageRule: 'Python interprets and compiles source files into bytecode prior to runtime execution',
      deduction: 'Execution halted before invoking the function or evaluating test cases',
    });
  } else if (category === 'EXECUTION' && evidence.traceback) {
    stoppingRuleApplied = `RUNTIME_EXCEPTION_COLLAPSE: Confirmed ${evidence.traceback.errorName} collapses competing search tree.`;
    inferences.push(`Execution terminated prematurely due to an unhandled ${evidence.traceback.errorName}.`);
    counterfactual = `If boundary guards were valid, execution would produce an output value. The ${evidence.traceback.errorName} halts the program immediately on line ${evidence.traceback.line || 'flagged'}.`;

    hypotheses.push({
      rank: 1,
      cause: `${evidence.traceback.errorName} on ${evidence.traceback.line ? `line ${evidence.traceback.line}` : 'boundary access'}`,
      score: 0.95,
      calibration: 'Nearly certain',
      evidenceFor: [
        `Explicit traceback: ${evidence.traceback.errorName}${evidence.traceback.line ? ` on line ${evidence.traceback.line}` : ''}`,
        evidence.traceback.message,
      ],
      evidenceAgainst: [],
      whyExplanation: 'An index or key operation was executed without prior bounds verification.',
    });

    reasoningTrace.push(
      {
        step: 1,
        observation: `${evidence.traceback.errorName} flagged${evidence.traceback.line ? ` on line ${evidence.traceback.line}` : ''}: ${evidence.traceback.message}`,
        languageRule: 'Python raises runtime exceptions immediately when an invalid memory, index, or type access occurs',
        deduction: `The exception halted the program before any return statement could execute`,
      },
      {
        step: 2,
        observation: 'Program halted abnormally before reaching normal completion',
        languageRule: 'Uncaught exceptions bubble up and terminate the test runner process',
        deduction: 'Competing hypotheses (such as missing return or logic divergence) are ruled out',
      }
    );
  } else if (category === 'OUTPUT' && subcategory === 'NONE_RETURNED') {
    inferences.push('The function terminated execution without producing an explicit return value (Python evaluated to None).');
    counterfactual =
      'If the condition or comparison logic were simply incorrect, the function would return False (or an evaluated value). Because the output is (no output), the return statement itself was never reached or returned None.';

    // Evidence-weighted scores
    // Prior: Missing return (0.80), Unhandled exception (0.14), Timeout (0.06)
    let scoreMissingReturn = 0.82;
    let scoreException = 0.12;
    let scoreTimeout = 0.06;

    if (evidence.codeFacts.hasCode && !evidence.codeFacts.hasReturn) {
      scoreMissingReturn = 0.96;
      scoreException = 0.03;
      scoreTimeout = 0.01;
    }

    hypotheses.push({
      rank: 1,
      cause: 'Function returned None (missing or bypassed return statement)',
      score: scoreMissingReturn,
      calibration: calibrateConfidence(scoreMissingReturn),
      evidenceFor: [
        'Actual output is empty / (no output)',
        'In Python, reaching the end of a function without reaching a return statement evaluates to None',
      ],
      evidenceAgainst: [],
      whyExplanation:
        'Online judge test harnesses inspect the returned value. Reaching the end of a function without an explicit return statement yields None, which displays as (no output).',
    });

    hypotheses.push({
      rank: 2,
      cause: 'Unhandled exception terminated process before return',
      score: scoreException,
      calibration: calibrateConfidence(scoreException),
      evidenceFor: ['Exceptions abort execution immediately prior to returning a value'],
      evidenceAgainst: ['No explicit exception name or traceback was reported in test output'],
      whyExplanation: 'An uncaught error would abort execution before reaching the return statement.',
    });

    hypotheses.push({
      rank: 3,
      cause: 'Infinite loop / Execution timeout before return',
      score: scoreTimeout,
      calibration: calibrateConfidence(scoreTimeout),
      evidenceFor: ['An unadvancing loop traps execution indefinitely'],
      evidenceAgainst: ['Test harness did not flag Time Limit Exceeded'],
      whyExplanation: 'If a while-loop progression condition is skipped, execution never reaches the return statement.',
    });

    reasoningTrace.push(
      {
        step: 1,
        observation: `Actual output was '(no output)', while expected output was '${evidence.expected || 'a value'}'`,
        languageRule: 'In Python, a function that finishes execution without hitting a return statement returns None',
        deduction: 'Execution completed without reaching an explicit return statement',
      },
      {
        step: 2,
        observation: 'Actual output is (no output) rather than False or a computed wrong value',
        languageRule: 'If comparison logic diverged, Python would evaluate the expression to False and return it',
        deduction: 'The issue is NOT comparison logic or string cleaning; the return statement was never reached',
      },
      {
        step: 3,
        observation: evidence.codeFacts.hasCode
          ? `Code has ${evidence.codeFacts.hasReturn ? 'a return statement' : 'no return statement'}`
          : 'Editor code not provided',
        languageRule: 'Online judges capture the function return value, not console stdout',
        deduction: 'Ensure every execution path terminates with an explicit return statement',
      }
    );
  } else if (category === 'OUTPUT' && subcategory !== 'NONE_RETURNED') {
    inferences.push(
      `The function executed to completion and returned \`${evidence.actual}\`, diverging from expected \`${evidence.expected}\`.`
    );
    counterfactual =
      `If a runtime exception or timeout had occurred, the test harness would report an execution error. Since the code finished and returned \`${evidence.actual}\`, the algorithm reached a return statement, but the decision condition diverged on input \`${evidence.input || 'given'}\`.`;

    hypotheses.push({
      rank: 1,
      cause: 'Conditional branch logic or comparison condition inverted / off-by-one',
      score: 0.75,
      calibration: calibrateConfidence(0.75),
      evidenceFor: [`Expected \`${evidence.expected}\`, but algorithm returned \`${evidence.actual}\``],
      evidenceAgainst: [],
      whyExplanation: `The algorithm evaluated to completion, but a decision branch diverged on input \`${evidence.input || 'given'}\`.`,
    });

    hypotheses.push({
      rank: 2,
      cause: 'Boundary condition / Edge case handling diverged',
      score: 0.25,
      calibration: calibrateConfidence(0.25),
      evidenceFor: ['Inputs with boundary values, duplicates, or edge lengths often trigger off-by-one paths'],
      evidenceAgainst: [],
      whyExplanation: 'Check loop boundaries and strict inequalities (< vs <=).',
    });

    reasoningTrace.push(
      {
        step: 1,
        observation: `Input: ${evidence.input || 'test case'}, Expected: ${evidence.expected}, Actual: ${evidence.actual}`,
        languageRule: 'Python executed the algorithm to normal completion and captured the returned value',
        deduction: 'Syntax, compilation, and runtime boundaries all succeeded without crashing',
      },
      {
        step: 2,
        observation: `Actual output \`${evidence.actual}\` differed from expected \`${evidence.expected}\``,
        languageRule: 'Control flow branches on boolean predicates determine which return path executes',
        deduction: 'A conditional branch made an incorrect decision on this specific input',
      }
    );
  } else if (category === 'PERFORMANCE' && subcategory === 'TIMEOUT') {
    inferences.push('Execution exceeded the allocated time limit, indicating a loop condition never reached termination.');
    counterfactual = 'In terminating algorithms, loop progression variables advance toward the termination boundary every iteration.';

    hypotheses.push({
      rank: 1,
      cause: 'Loop progression variable missing or bypassed in conditional branch',
      score: 0.95,
      calibration: calibrateConfidence(0.95),
      evidenceFor: ['Execution timed out'],
      evidenceAgainst: [],
      whyExplanation: 'If counter/pointer increments are trapped inside an if-condition that evaluated to False, the loop runs indefinitely.',
    });

    reasoningTrace.push({
      step: 1,
      observation: 'Process exceeded time limit',
      languageRule: 'While loops continue executing until the predicate evaluates to False',
      deduction: 'The loop predicate invariant is not advancing on every iteration branch',
    });
  } else {
    hypotheses.push({
      rank: 1,
      cause: 'Algorithmic invariant evaluation',
      score: 0.50,
      calibration: calibrateConfidence(0.50),
      evidenceFor: [],
      evidenceAgainst: [],
      whyExplanation: 'Review problem constraints and verify boundary handling.',
    });
  }

  // Sort hypotheses descending by score
  hypotheses.sort((a, b) => b.score - a.score);

  // ---------------------------------------------------------------------------
  // 6. Contradiction Detection (Typed)
  // ---------------------------------------------------------------------------
  let contradiction: DiagnosticReport['contradiction'] | undefined;

  if (
    convFacts.previousSolutionProvided &&
    (convFacts.userAskedForCorrection || convFacts.sameFailureRepeated)
  ) {
    contradiction = {
      type: ContradictionType.PREVIOUS_SOLUTION_REPORTED_FAILING,
      detected: true,
      explanation:
        'A verified working solution was already shared earlier in this conversation that passes all test cases. Since the test result is failing locally with (no output) or wrong answer, the code currently running in the student’s editor likely differs from that solution.',
      actionableAdvice:
        'Do NOT re-generate identical code. Acknowledge that the posted solution is correct, explain that local editor divergence (unsaved edits, indentation shift on paste, or missing return) is causing the failure, and ask the student to paste their exact current editor code.',
    };
  }

  // ---------------------------------------------------------------------------
  // 7. Requested Evidence & Overall Confidence
  // ---------------------------------------------------------------------------
  const requestedEvidence: string[] = [];
  if (convFacts.editorCodeMissing) {
    requestedEvidence.push('Current editor implementation code');
  }
  if (!evidence.traceback && category === 'EXECUTION') {
    requestedEvidence.push('Exact traceback message and line number');
  }

  const topHypothesis = hypotheses[0];
  const confidenceScore = topHypothesis ? topHypothesis.score : 0.40;
  const confidenceCalibration = calibrateConfidence(confidenceScore);

  // ---------------------------------------------------------------------------
  // 8. Teaching Summary for Prompt Builder
  // ---------------------------------------------------------------------------
  const teachingSummary = [
    `DIAGNOSTIC EVIDENCE: Category=${category}, Subcategory=${subcategory}`,
    `Completeness: ${Math.round(completeness.score * 100)}% (${completeness.quality}) | Certainty: ${confidenceCalibration}`,
    stoppingRuleApplied ? `Stopping Rule: ${stoppingRuleApplied}` : '',
    counterfactual ? `Counterfactual Insight: ${counterfactual}` : '',
    reasoningTrace.length > 0
      ? `Reasoning Trace:\n${reasoningTrace
          .map((t) => `• Step ${t.step}: [Obs: ${t.observation}] -> [Rule: ${t.languageRule}] -> [Deduction: ${t.deduction}]`)
          .join('\n')}`
      : '',
    contradiction
      ? `Contradiction [${contradiction.type}]: ${contradiction.explanation}\nAction: ${contradiction.actionableAdvice}`
      : '',
    requestedEvidence.length > 0
      ? `Missing Evidence: ${requestedEvidence.join(', ')} — ask student to paste their editor implementation.`
      : '',
    'INSTRUCTION: Base your response ONLY on these observations and hypotheses. Do NOT invent unrelated causes. Never expose raw numeric probabilities to the student—use verbal certainty ("Likely", "Nearly certain"). Never suggest print() statements (platform evaluates function returns).',
  ]
    .filter(Boolean)
    .join('\n\n');

  return Object.freeze({
    mode: 'DIAGNOSIS',
    category,
    subcategory,
    failureKind,
    completeness,
    confidenceScore,
    confidenceCalibration,
    informationGaps,
    observations,
    inferences,
    counterfactual,
    reasoningTrace,
    hypotheses,
    stoppingRuleApplied,
    contradiction,
    requestedEvidence,
    teachingSummary,
  });
}
