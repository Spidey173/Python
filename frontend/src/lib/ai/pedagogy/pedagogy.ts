// Core Pedagogical Cognitive Engine (PyForge Senior Mentor System)
// Implements the 7 high-impact pedagogical features:
// 1. Learning Goal Classifier (Understand | Hint | Debug | ShowCode | Review | Compare | Interview)
// 2. Teaching Mode (Teacher | Coach | Debugger | Interviewer | PairProgrammer)
// 3. Adaptive Depth Deriver (tiny | short | normal | deep)
// 4. Confidence Level Detector (low | medium | high)
// 5. DSA Pattern Graph & Transfer Clues
// 6. Top 5 Misconception Detector (Zero false precision)
// 7. Next Best Teaching Step Engine

import {
  ConfidenceLevel,
  ExplanationDepth,
  LearningGoal,
  LearningSubIntent,
  Misconception,
  NextBestStep,
  PatternStep,
  StudentIntent,
  TeachingMode,
} from '../types';

// ============================================================================
// 1. Learning Goal Classifier
// ============================================================================

export function classifyLearningGoal(
  message: string,
  intent: StudentIntent,
  subIntent?: LearningSubIntent,
  askingForFullCode: boolean = false,
  hasErrorTrace: boolean = false
): LearningGoal {
  const lower = message.toLowerCase().trim();

  // ShowCode
  if (
    askingForFullCode ||
    /\b(give (me )?(the )?code|provide (me )?(the )?code|show (me )?(the )?code|full code|give code|provide code|show code|give solution|provide solution|full solution|just code|write the code)\b/i.test(lower)
  ) {
    return 'ShowCode';
  }

  // Interview
  if (
    intent === 'career' ||
    /\b(interview|mock interview|faang|maang|interviewer question|test my knowledge)\b/i.test(lower)
  ) {
    return 'Interview';
  }

  // Debug
  if (
    hasErrorTrace ||
    intent === 'debugging' ||
    /\b(why is my code wrong|what('s| is) wrong with my code|where is my mistake|why is this wrong|why does it fail|bug|traceback|syntaxerror|typeerror|indexerror|keyerror|returning none|returns none)\b/i.test(lower)
  ) {
    return 'Debug';
  }

  // Review
  if (
    intent === 'reviewing' ||
    /\b(review( my)? code|check my code|rate my code|feedback on( my)? code|critique|clean this up)\b/i.test(lower)
  ) {
    return 'Review';
  }

  // Compare
  if (
    /\b(compare|difference between|which is better|versus|\bvs\b|alternative approach|tradeoff)\b/i.test(lower)
  ) {
    return 'Compare';
  }

  // Hint
  if (
    /\b(i('m| am) stuck|stuck|give me a hint|need a hint|another hint|clue|nudge|where do i start|help me start|didn't get it|how to approach|what to do)\b/i.test(lower) ||
    subIntent === 'hint'
  ) {
    return 'Hint';
  }

  // Understand (Default for concept explanations, problem statement, big-o, etc.)
  return 'Understand';
}

// ============================================================================
// 2. Adaptive Depth Deriver (Phrasing cues → tiny | short | normal | deep)
// ============================================================================

export function deriveAdaptiveDepth(message: string): ExplanationDepth {
  const lower = message.toLowerCase();

  // Tiny (~35 words)
  if (/\b(simply|simple terms|eli5|briefly|short|quick|tldr|in a nutshell|one sentence)\b/i.test(lower)) {
    return 'tiny';
  }

  // Deep (~200 words)
  if (/\b(step by step|deep dive|in detail|line by line|thoroughly|walkthrough|full breakdown)\b/i.test(lower)) {
    return 'deep';
  }

  // Normal (~120 words)
  if (/\b(why does this work|how does it work|explain why|help me understand|why)\b/i.test(lower)) {
    return 'normal';
  }

  // Default: Short (~70 words)
  return 'short';
}

// ============================================================================
// 3. Confidence Level Detector (low | medium | high)
// ============================================================================

export function detectConfidence(message: string): ConfidenceLevel {
  const lower = message.toLowerCase();

  // Low confidence cues
  if (
    /\b(no idea|clueless|completely lost|so lost|i don't get it|so confused|give up|have no clue|what do i do|i'm dumb|i feel stuck|zero sense)\b/i.test(
      lower
    )
  ) {
    return 'low';
  }

  // High confidence cues (points to specific lines, invariants, or precise technical terminology)
  if (
    /\b(i think line|line \d+|pointer|invariant|time complexity|edge case|almost done|off by one|syntaxerror|typeerror|indexerror|tested with|passed \d+ tests)\b/i.test(
      lower
    )
  ) {
    return 'high';
  }

  // Default: Medium confidence
  return 'medium';
}

// ============================================================================
// 4. Teaching Mode Selector
// ============================================================================

export function selectTeachingMode(
  goal: LearningGoal,
  message: string,
  intent?: StudentIntent
): TeachingMode {
  const lower = message.toLowerCase();

  // Pair Programmer (explicit collaborative cues)
  if (/\b(pair program|code together|let('s| us) do it together|work with me|pair up)\b/i.test(lower)) {
    return 'PairProgrammer';
  }

  // Interviewer
  if (goal === 'Interview' || intent === 'career') {
    return 'Interviewer';
  }

  // Debugger
  if (goal === 'Debug') {
    return 'Debugger';
  }

  // Coach (hint, nudge, active problem solving)
  if (goal === 'Hint') {
    return 'Coach';
  }

  // Teacher (concepts, understanding, comparisons, reviews)
  return 'Teacher';
}

export function getTeachingModeDirective(mode: TeachingMode, confidence: ConfidenceLevel = 'medium'): string {
  let base = '';
  switch (mode) {
    case 'Teacher':
      base = 'TEACHING MODE [TEACHER]: Explain concepts clearly with a concrete example or visual. Answer directly.';
      break;
    case 'Coach':
      base = 'TEACHING MODE [COACH]: Give one focused hint or nudge. If the student asked for code, give the code.';
      break;
    case 'Debugger':
      base = 'TEACHING MODE [DEBUGGER]: Trace through execution with real values to show where the state breaks.';
      break;
    case 'Interviewer':
      base = 'TEACHING MODE [INTERVIEWER]: Ask one focused technical question. Keep it conversational.';
      break;
    case 'PairProgrammer':
      base = 'TEACHING MODE [PAIR PROGRAMMER]: Suggest the next concrete step together.';
      break;
  }

  let tone = '';
  if (confidence === 'low') {
    tone = ' Tone: [Low confidence] Be warm, reassuring, and start with the simplest possible intuition.';
  } else if (confidence === 'high') {
    tone = ' Tone: [High confidence] Crisp, technical, and precise.';
  }

  return `${base}${tone}`.trim();
}

// ============================================================================
// 5. Top 5 Misconception Detector (Deterministic & Lean)
// ============================================================================

const TOP_MISCONCEPTIONS: Array<{
  id: string;
  name: string;
  test: (message: string, code: string) => boolean;
  correction: string;
}> = [
  {
    id: 'SORT_RETURNS_NONE',
    name: 'list.sort() returns None',
    test: (msg, code) =>
      /\b([a-zA-Z_]\w*)\s*=\s*\1\.sort\(\)/i.test(code) ||
      /\b(\w+)\s*=\s*arr\.sort\(\)/i.test(msg) ||
      /\b(sort\(\) returns|does sort return a list)\b/i.test(msg),
    correction:
      'Remember: `arr.sort()` sorts the list in-place and returns `None`. If you want a new sorted list, use `sorted(arr)`.',
  },
  {
    id: 'LIST_ALIAS_ASSIGNMENT',
    name: 'b = a copies a list',
    test: (msg, code) =>
      /\b(copies the list|b equals a copies|assigning a list makes a copy)\b/i.test(msg) ||
      /([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\s*\n\s*\1\.append\(/i.test(code),
    correction:
      'In Python, `b = a` assigns a reference, not a copy. Modifying `b` will also change `a`. To make an independent copy, use `b = a.copy()` or `b = a[:]`.',
  },
  {
    id: 'BINARY_SEARCH_UNSORTED',
    name: 'Binary search on unsorted input',
    test: (msg, code) =>
      /\b(binary search (on|with) unsorted|unsorted array binary search|binary search without sorting)\b/i.test(
        msg
      ),
    correction:
      'Binary search requires sorted input. Without sorted order, we cannot safely discard half the elements at each step.',
  },
  {
    id: 'MUTATING_WHILE_ITERATING',
    name: 'Modifying a list while iterating',
    test: (msg, code) =>
      /for\s+.*\s+in\s+([a-zA-Z_]\w*):[\s\S]*?\1\.(remove|pop)\(/i.test(code) ||
      /\b(remove while iterating|delete elements in for loop|pop in for loop)\b/i.test(msg),
    correction:
      'Modifying a list (with `.remove()` or `.pop()`) while iterating over it shifts indices and silently skips items. Iterate over a copy (`for x in arr[:]:`) or build a new filtered list.',
  },
  {
    id: 'FLOAT_DIVISION_INDEX',
    name: '/ vs // for indices',
    test: (msg, code) =>
      /\[[^\]]*\/\s*2[^\]]*\]/i.test(code) ||
      /mid\s*=\s*\(?[a-zA-Z0-9_+\s-]+\)?\s*\/\s*2/i.test(code) ||
      /\b(single slash division index|division gives float index)\b/i.test(msg),
    correction:
      'In Python 3, `/` performs float division (e.g. `5 / 2 = 2.5`), causing `TypeError: slice indices must be integers`. Use `//` for integer floor division (`5 // 2 = 2`).',
  },
];

export function detectMisconception(message: string, code: string = ''): Misconception | null {
  for (const m of TOP_MISCONCEPTIONS) {
    if (m.test(message, code)) {
      return {
        id: m.id,
        name: m.name,
        correction: m.correction,
      };
    }
  }
  return null;
}

// ============================================================================
// 6. DSA Pattern Graph & Pattern Transfer Clues
// ============================================================================

const PATTERN_GRAPH: Record<string, PatternStep> = {
  'two pointers': {
    pattern: 'Two Pointers',
    nextPattern: 'Sliding Window',
    prerequisite: 'Array Traversal',
    transferClue: 'Uses two converging or parallel pointers to compare pairs without quadratic loops.',
  },
  'sliding window': {
    pattern: 'Sliding Window',
    nextPattern: 'Fast & Slow Pointers',
    prerequisite: 'Two Pointers',
    transferClue: 'A dynamic Two Pointer pattern where a window expands to find validity and contracts to optimize.',
  },
  'fast & slow pointers': {
    pattern: 'Fast & Slow Pointers',
    nextPattern: 'Binary Search',
    prerequisite: 'Two Pointers',
    transferClue: 'Pointers move at different speeds (1x vs 2x) to find cycles or midpoints in O(N) time and O(1) space.',
  },
  'binary search': {
    pattern: 'Binary Search',
    nextPattern: 'Search Space Reduction',
    prerequisite: 'Two Pointers',
    transferClue: 'Halves the search space every iteration by checking the midpoint against the target.',
  },
  'hash map': {
    pattern: 'Hash Map (Frequency & Lookup)',
    nextPattern: 'Prefix Sum',
    prerequisite: 'Array Traversal',
    transferClue: 'Trades O(N) auxiliary space for O(1) instantaneous lookups to eliminate nested loops.',
  },
  'prefix sum': {
    pattern: 'Prefix Sum',
    nextPattern: 'Subarray Sums with Hash Map',
    prerequisite: 'Hash Map',
    transferClue: 'Precomputes cumulative sums so any subarray sum (i..j) can be computed in O(1) as P[j] - P[i-1].',
  },
  sorting: {
    pattern: 'Sorting',
    nextPattern: 'Intervals',
    prerequisite: 'Array Traversal',
    transferClue: 'Sorting first simplifies messy inputs so adjacent elements can be compared directly.',
  },
  intervals: {
    pattern: 'Intervals (Merge & Overlap)',
    nextPattern: 'Sweep Line',
    prerequisite: 'Sorting',
    transferClue: 'Sort intervals by start time; overlapping intervals will then always be directly adjacent.',
  },
  stack: {
    pattern: 'Stack (LIFO)',
    nextPattern: 'Monotonic Stack',
    prerequisite: 'Array Traversal',
    transferClue: 'Processes elements in Last-In-First-Out order to track nested matching (parentheses, history).',
  },
  'monotonic stack': {
    pattern: 'Monotonic Stack',
    nextPattern: 'Next Greater Element',
    prerequisite: 'Stack',
    transferClue: 'Maintains elements in strictly increasing or decreasing order to find nearest greater/smaller in O(N).',
  },
  recursion: {
    pattern: 'Recursion & Backtracking',
    nextPattern: 'Dynamic Programming',
    prerequisite: 'Functions',
    transferClue: 'Breaks a problem into smaller instances of itself until hitting a base case.',
  },
  'dynamic programming': {
    pattern: 'Dynamic Programming',
    nextPattern: '2D DP & Knapsack',
    prerequisite: 'Recursion & Memoization',
    transferClue: 'Solves overlapping subproblems once and caches the answers to prevent exponential repetition.',
  },
};

export function resolvePatternStep(topicOrTitle: string): PatternStep {
  const lower = topicOrTitle.toLowerCase();
  for (const [key, step] of Object.entries(PATTERN_GRAPH)) {
    if (lower.includes(key)) {
      return step;
    }
  }

  // Default fallback pattern step
  return {
    pattern: 'Core Problem Solving',
    nextPattern: 'Two Pointers or Hash Map',
    prerequisite: 'Basic Python Loops',
    transferClue: 'Identify the bottleneck (e.g. nested loop) and select a data structure that eliminates it.',
  };
}

// ============================================================================
// 7. "Next Best Teaching Step" Engine
// ============================================================================

export function resolveNextBestStep(
  topicOrTitle: string,
  isSolved: boolean,
  confidence: ConfidenceLevel = 'medium'
): NextBestStep {
  const pattern = resolvePatternStep(topicOrTitle);

  if (isSolved || confidence === 'high') {
    if (pattern.nextPattern) {
      return {
        topic: pattern.nextPattern,
        suggestion: `You've nailed ${pattern.pattern}! The natural next step to master is ${pattern.nextPattern}.`,
      };
    }
    return {
      topic: 'Optimal Space & Time',
      suggestion: `Great job! Next, check if you can optimize space complexity or handle larger constraints.`,
    };
  }

  if (confidence === 'low') {
    return {
      topic: pattern.prerequisite || 'Fundamental Syntax',
      suggestion: `Before moving forward, focus on one concrete example with pencil and paper to visualize the ${pattern.pattern} steps.`,
    };
  }

  return {
    topic: pattern.pattern,
    suggestion: `Practice 1-2 more problems on ${pattern.pattern} until the core invariant feels automatic.`,
  };
}
