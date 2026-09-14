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
      responseText: `Restricted capability detected: \`${securityError}\`. The environment restricts low-level system modules ('os', 'sys', 'subprocess'). Focus on pure algorithmic logic.`,
    };
  }

  // 2. Syntax / Compilation Error
  if (stderr.includes('SyntaxError') || stderr.includes('IndentationError')) {
    const lineMatch = stderr.match(/line (\d+)/i);
    const lineInfo = lineMatch ? ` around line ${lineMatch[1]}` : '';
    return {
      mood: 'debugging',
      responseText: `Syntax issue${lineInfo}. Check your indentation, colons after control statements, and matching brackets or quotes.`,
    };
  }

  // 3. NameError (unbound variable or typo)
  if (stderr.includes('NameError')) {
    const varMatch = stderr.match(/name '([^']+)' is not defined/);
    const varName = varMatch ? ` '${varMatch[1]}'` : ' a variable';
    return {
      mood: 'curious',
      responseText: `NameError: ${varName} isn't defined. Check for a typo or make sure it's assigned before this line.`,
    };
  }

  // 4. TypeError
  if (stderr.includes('TypeError')) {
    return {
      mood: 'coaching',
      responseText: `TypeError: an operation was called on incompatible types. Check the types of your variables at this point.`,
    };
  }

  // 5. ZeroDivisionError
  if (stderr.includes('ZeroDivisionError')) {
    return {
      mood: 'coaching',
      responseText: `ZeroDivisionError: division by zero. Check your denominator expressions and guard against 0.`,
    };
  }

  // 6. IndexError / KeyError
  if (stderr.includes('IndexError') || stderr.includes('KeyError')) {
    return {
      mood: 'debugging',
      responseText: `IndexError or KeyError. A lookup went out of bounds or accessed a missing key. Check your loop bounds and key names.`,
    };
  }

  // 7. Generic Runtime Error
  if (!runRes.success && stderr) {
    const cleanErr = stderr.split('\n').filter((l) => l.trim()).slice(-1)[0] || 'Runtime Error';
    return {
      mood: 'debugging',
      responseText: `Runtime error: \`${cleanErr}\`. Check where the state diverges from what's expected.`,
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
      responseText: `All ${total} tests passed in ${duration}ms. The solution vault is unlocked if you want to inspect alternative approaches.`,
    };
  }

  if (total > 0 && passedCount > 0 && passedCount < total) {
    const firstFailed = testResults.find((t) => !t.passed);
    const expected = firstFailed?.expected_output?.trim();
    const actual = firstFailed?.actual_output?.trim();
    return {
      mood: 'coaching',
      responseText: `${passedCount} of ${total} tests passed. Test case #${firstFailed?.test_case_index || 1} failed: expected "${expected}", got "${actual}".`,
    };
  }

  if (total > 0 && passedCount === 0) {
    const firstExpected = testResults[0]?.expected_output?.trim();
    const actual = stdout.trim();
    return {
      mood: 'coaching',
      responseText: `Output didn't match the expected case. Expected "${firstExpected}", got "${actual || '(empty)'}". Check your print statement or logic.`,
    };
  }

  // Standard run without predefined tests
  return {
    mood: 'neutral',
    responseText: `Output:\n\`\`\`\n${stdout || '(no output)'}\n\`\`\`\nSubmit when you're ready to evaluate against all test cases.`,
  };
}
