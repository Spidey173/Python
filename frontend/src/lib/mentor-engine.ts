// Mentor Intelligence Engine for PyForge
// Powering natural, conversational guidance, 5-tier progressive hints, and reactive execution coaching.

import { ChallengeDetail, CodeRunResponse, TestCaseResult } from './types';

export interface MentorMessage {
  id: string;
  sender: 'mentor' | 'user' | 'system';
  text: string;
  fullText: string;
  status: 'streaming' | 'done';
  mood: 'neutral' | 'curious' | 'thinking' | 'celebrating' | 'debugging' | 'coaching';
  quickActions?: Array<{ id: string; label: string; icon?: string }>;
  codeSnippet?: string;
  timestamp: string;
}

export type HintTier = 1 | 2 | 3 | 4 | 5;

export interface ProgressiveHintData {
  tier: HintTier;
  title: string;
  nudge: string;
  reflectionQuestion: string;
  codeSnippet?: string;
}

export interface ProblemMentorKnowledge {
  greeting: string;
  conceptName: string;
  conceptExplanation: string;
  patternExample: string;
  hints: [
    ProgressiveHintData, // Tier 1: Very vague conceptual nudge
    ProgressiveHintData, // Tier 2: Point toward the bug / structure
    ProgressiveHintData, // Tier 3: Mention the exact concept
    ProgressiveHintData, // Tier 4: Suggest what line/expression to inspect
    ProgressiveHintData  // Tier 5: Almost reveal it (blueprint skeleton)
  ];
  interviewTrap: string;
}

import { ALL_50_MENTOR_KNOWLEDGE } from './mentor-data';

// Master curriculum knowledge loaded from ALL_50_MENTOR_KNOWLEDGE for all 50 challenges
export function getMentorKnowledge(problem: ChallengeDetail): ProblemMentorKnowledge {
  const levelKey = problem.level_number || problem.id;
  if (ALL_50_MENTOR_KNOWLEDGE[levelKey]) {
    return ALL_50_MENTOR_KNOWLEDGE[levelKey];
  }
  if (ALL_50_MENTOR_KNOWLEDGE[problem.id]) {
    return ALL_50_MENTOR_KNOWLEDGE[problem.id];
  }

  const title = problem.title || 'Coding Challenge';
  const objective = problem.objective || 'Solve the given challenge';

  return {
    greeting: `Welcome to "${title}"! I'm your Mentor. I'm actively monitoring your code and tests. Take a crack at it, or tap one of the quick clues below if you get stuck.`,
    conceptName: `${title} Logic`,
    conceptExplanation: `This challenge focuses on ${objective.toLowerCase()}. Break the problem down into input parsing, algorithmic transformation, and standard output format.`,
    patternExample: `# General algorithmic pattern\n# 1. Read input\n# 2. Process data\n# 3. Output result`,
    interviewTrap: "Pay close attention to edge cases: empty collections, single elements, negative numbers, and boundary limits.",
    hints: [
      {
        tier: 1,
        title: "Conceptual Foundation",
        nudge: `Focus on the core goal: ${objective.slice(0, 80)}. What is the initial transformation needed?`,
        reflectionQuestion: "What input types are you working with?",
      },
      {
        tier: 2,
        title: "Logical Direction",
        nudge: "Think about the data structures and control flow needed. Are you iterating, filtering, or calculating a value?",
        reflectionQuestion: "Can this be solved iteratively or with standard Python built-in functions?",
      },
      {
        tier: 3,
        title: "Algorithmic Core",
        nudge: "Identify the exact operation. If working with numbers, watch precision. If working with collections, watch index boundaries.",
        reflectionQuestion: "What happens with edge-case inputs like zero or empty values?",
      },
      {
        tier: 4,
        title: "Line Inspection",
        nudge: "Inspect the return or print statements in your code. Ensure the output format strictly matches the expected contract.",
        reflectionQuestion: "Does your solution match the terminal output example?",
      },
      {
        tier: 5,
        title: "Structural Blueprint",
        nudge: "Here is the structural framework to guide your implementation:",
        reflectionQuestion: "Can you fill in the transformation logic?",
        codeSnippet: "# Read inputs\n# ...\n# Apply transformation\n# ...\n# Output answer\nprint(result)",
      },
    ],
  };
}

// Reactive execution analysis: analyzes test results and compiler output to produce real conversational coaching
export function analyzeExecutionForMentor(
  runRes: CodeRunResponse,
  problem: ChallengeDetail,
  userCode: string
): { mood: MentorMessage['mood']; responseText: string; codeSnippet?: string } {
  const stderr = runRes.stderr || '';
  const stdout = runRes.stdout || '';
  const securityError = runRes.security_error;

  // 1. Security or Sandbox restriction
  if (securityError) {
    return {
      mood: 'debugging',
      responseText: `Careful! Your code attempted to access a restricted module or capability: \`${securityError}\`. Python runs in a sandboxed interview environment where low-level system modules ('os', 'sys', 'subprocess') are disallowed. Focus on pure Python algorithms!`,
    };
  }

  // 2. Syntax / Compilation Error
  if (stderr.includes('SyntaxError') || stderr.includes('IndentationError')) {
    const lineMatch = stderr.match(/line (\d+)/i);
    const lineInfo = lineMatch ? ` around line ${lineMatch[1]}` : '';
    return {
      mood: 'debugging',
      responseText: `Looks like Python caught a syntax issue${lineInfo} before your code could finish executing. Python is very particular about indentation, colons at the end of statements (\`if:\`, \`for:\`, \`def:\`), and matching parentheses or quotation marks. Check your syntax!`,
    };
  }

  // 3. NameError (unbound variable or typo)
  if (stderr.includes('NameError')) {
    const varMatch = stderr.match(/name '([^']+)' is not defined/);
    const varName = varMatch ? ` '${varMatch[1]}'` : ' a variable';
    return {
      mood: 'curious',
      responseText: `Python couldn't find the definition for${varName}. Did you misspell it, or forget to declare it before using it? Remember that Python identifiers are strictly case-sensitive.`,
    };
  }

  // 4. TypeError
  if (stderr.includes('TypeError')) {
    return {
      mood: 'coaching',
      responseText: `Caught a \`TypeError\`! This usually happens when an operation is performed on incompatible data types—like trying to concatenate a string with an integer, or calling something that isn't a function. Check your variable types!`,
    };
  }

  // 5. ZeroDivisionError
  if (stderr.includes('ZeroDivisionError')) {
    return {
      mood: 'coaching',
      responseText: `A mathematical crash: division by zero! Check your divisor expressions. When testing edge cases, denominators can sometimes evaluate to zero unless guarded by an \`if\` condition.`,
    };
  }

  // 6. IndexError / KeyError
  if (stderr.includes('IndexError') || stderr.includes('KeyError')) {
    return {
      mood: 'debugging',
      responseText: `An out-of-bounds lookup occurred! In Python, list indexing is 0-based, so for a list of length N, valid indices are 0 to N-1. Check your loop boundaries or dictionary keys.`,
    };
  }

  // 7. Generic Runtime Error
  if (!runRes.success && stderr) {
    const cleanErr = stderr.split('\n').filter((l) => l.trim()).slice(-1)[0] || 'Runtime Error';
    return {
      mood: 'debugging',
      responseText: `Interesting... your code crashed with: \`${cleanErr}\`. Let's trace your variables step by step to see where the state diverged from expectations.`,
    };
  }

  // 8. Test Cases Evaluation
  const testResults: TestCaseResult[] = runRes.test_results || [];
  const total = testResults.length;
  const passedCount = testResults.filter((t) => t.passed).length;

  if (total > 0 && passedCount === total) {
    const duration = Math.round(runRes.execution_time_ms || 20);
    return {
      mood: 'celebrating',
      responseText: `🎉 Mission Complete! Your code executed cleanly in ${duration}ms and passed every single test case! You solved this without looking at the locked solution. The Solution Vault is now completely unlocked for you!`,
    };
  }

  if (total > 0 && passedCount > 0 && passedCount < total) {
    const firstFailed = testResults.find((t) => !t.passed);
    const expected = firstFailed?.expected_output?.trim();
    const actual = firstFailed?.actual_output?.trim();
    return {
      mood: 'coaching',
      responseText: `You're incredibly close! You passed ${passedCount} out of ${total} tests. Notice test case #${firstFailed?.test_case_index || 1}: expected output was "${expected}", but your code produced "${actual}". Check if there is an edge case or extra newline!`,
    };
  }

  if (total > 0 && passedCount === 0) {
    const firstExpected = testResults[0]?.expected_output?.trim();
    const actual = stdout.trim();
    return {
      mood: 'coaching',
      responseText: `The test cases didn't match yet. The expected output is "${firstExpected}", but your standard output was "${actual || '(empty)'}". Let's double check your print statements and calculation logic. Want a hint?`,
    };
  }

  // Standard run without predefined tests
  return {
    mood: 'neutral',
    responseText: `Execution complete. Output captured:\n\`\`\`\n${stdout || '(no output)'}\n\`\`\`\nDoes this match what you anticipated? When you're confident, click 'Submit' to grade against all test suites.`,
  };
}
