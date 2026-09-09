import { ChallengeDetail } from './types';
import { ALL_50_SOLUTIONS } from './solutions-data';

export interface UserMethodAnalysis {
  methodName: string;
  rankTitle: string;
  timeComplexity: string;
  spaceComplexity: string;
  isOptimal: boolean;
  assessment: string;
  keyFeatures: string[];
}

export interface RankedSolution {
  rank: number;
  rankBadge: string;
  title: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  simplestExplanation: string;
  mentalModel: string;
  lineByLine: Array<{ line: string; explanation: string }>;
  visualDiagram?: string;
  beginnerTraps?: string[];
  keyTakeaway: string;
  interviewPros: string;
  interviewCons: string;
}

export interface LearnerGuide {
  fourWays: Array<{
    number: number;
    title: string;
    description: string;
    concept: string;
  }>;
  walkthroughStages: Array<{
    stageNumber: number;
    stageTitle: string;
    mission: string;
    codeSnippet?: string;
    interactiveHint: string;
    actionLabel: string;
  }>;
}

/**
 * Inspects user code using syntax pattern matching to detect what method they used,
 * congratulating them and evaluating their approach for interview readiness.
 */
export function analyzeUserSubmittedMethod(code: string, problem?: ChallengeDetail | null): UserMethodAnalysis {
  const cleanCode = code.trim();
  const problemId = problem?.id || 1;

  // Level 1: Valid Palindrome
  if (problemId === 1) {
    if (cleanCode.includes('left') && cleanCode.includes('right') && (cleanCode.includes('<') || cleanCode.includes('<='))) {
      return {
        methodName: 'Two-Pointer In-Place Verification',
        rankTitle: 'Rank 1 (Top Interview Standard)',
        timeComplexity: 'O(n) Linear Time',
        spaceComplexity: 'O(1) Auxiliary Space',
        isOptimal: true,
        assessment: 'Outstanding interview solution! The two-pointer technique avoids allocating extra memory for reversed strings, achieving O(1) auxiliary space which FAANG interviewers prioritize.',
        keyFeatures: ['Two-pointer left/right scan', 'O(1) memory footprint', 'Early exit on mismatch'],
      };
    }
    if (cleanCode.includes('[::-1]')) {
      return {
        methodName: 'Extended Slicing & Alphanumeric Filter',
        rankTitle: 'Rank 2 (Idiomatic Pythonic Standard)',
        timeComplexity: 'O(n) Linear Time',
        spaceComplexity: 'O(n) Memory',
        isOptimal: true,
        assessment: 'Clean and highly idiomatic Python! Filtering with isalnum() followed by string reversal with [::-1] executes in optimized C bytecode. In an interview, be prepared to explain the O(1) space two-pointer alternative.',
        keyFeatures: ['Pythonic [::-1] slice', 'C-level bytecode execution', 'Readable comprehension filter'],
      };
    }
    if (cleanCode.includes('re.sub')) {
      return {
        methodName: 'Regular Expression Sanitization',
        rankTitle: 'Rank 3 (Regex Preprocessing)',
        timeComplexity: 'O(n) Linear Time',
        spaceComplexity: 'O(n) Memory',
        isOptimal: false,
        assessment: 'Regex successfully strips punctuation! Note that compiling regular expressions adds slight runtime overhead compared to char.isalnum() or two pointers.',
        keyFeatures: ['Regex pattern stripping', 'Explicit string substitution'],
      };
    }
  }

  // Level 2: Reverse Words in a Sentence
  if (problemId === 2) {
    if (cleanCode.includes('.split()') && (cleanCode.includes('[::-1]') || cleanCode.includes('reversed('))) {
      return {
        methodName: 'Tokenization & Sliced Reversal',
        rankTitle: 'Rank 1 (Optimal Pythonic Standard)',
        timeComplexity: 'O(n) Linear Time',
        spaceComplexity: 'O(n) Memory',
        isOptimal: true,
        assessment: "Perfect! Using `s.split()` without arguments elegantly handles arbitrary whitespace, trims leading/trailing spaces, and ' '.join(words[::-1]) outputs normalized words.",
        keyFeatures: ['Automatic whitespace collapse via s.split()', 'C-speed list reversal', 'Single-pass join'],
      };
    }
    if (cleanCode.includes('left') && cleanCode.includes('right')) {
      return {
        methodName: 'Two-Pointer In-Place Word Inversion',
        rankTitle: 'Rank 2 (Classical Array Algorithm)',
        timeComplexity: 'O(n) Linear Time',
        spaceComplexity: 'O(n) Memory (Strings are immutable)',
        isOptimal: true,
        assessment: 'Great systems-level thinking! In mutable languages like C/C++, reversing characters then reversing each word achieves O(1) space. In Python, string immutability makes list allocation necessary.',
        keyFeatures: ['Two-pointer word swapping', 'Low-level interview classic'],
      };
    }
  }

  // Level 3: First Non-Repeating Character
  if (problemId === 3) {
    if ((cleanCode.includes('counts') || cleanCode.includes('freq') || cleanCode.includes('Counter')) && cleanCode.includes('== 1')) {
      return {
        methodName: 'Two-Pass Frequency Map Lookup',
        rankTitle: 'Rank 1 (Optimal Hash Table Pattern)',
        timeComplexity: 'O(n) Linear Time',
        spaceComplexity: 'O(k) where k <= 26',
        isOptimal: true,
        assessment: 'Masterful hash table usage! Pass 1 counts character frequencies in O(n) time, and Pass 2 iterates through the original string order to identify the first unique character in O(1) per lookup.',
        keyFeatures: ['Linear O(n) time complexity', 'Alphabet-bounded O(k) memory', 'Order-preserving scan'],
      };
    }
    if (cleanCode.includes('.count(')) {
      return {
        methodName: 'Nested String Count Search',
        rankTitle: 'Rank 3 (Suboptimal O(n^2))',
        timeComplexity: 'O(n^2) Quadratic Time',
        spaceComplexity: 'O(1) Auxiliary Space',
        isOptimal: false,
        assessment: 'Be careful! Calling `s.count(c)` inside a loop causes a full O(n) scan for every character, degrading overall complexity to O(n^2). Use a frequency dictionary for O(n) interview-ready performance.',
        keyFeatures: ['Nested linear search', 'Quadratic time trap'],
      };
    }
  }

  // General Pattern Matchers across any problem:
  if (cleanCode.includes('[') && cleanCode.includes('for') && cleanCode.includes('in') && cleanCode.includes(']')) {
    return {
      methodName: 'List Comprehension / Declarative Filtering',
      rankTitle: 'Rank 1 (Idiomatic Python)',
      timeComplexity: 'O(n) Linear Time',
      spaceComplexity: 'O(n) Memory',
      isOptimal: true,
      assessment: 'Clean, expressive Python! List comprehensions execute in optimized C-loop bytecode, outperforming manual append loops while keeping logic concise.',
      keyFeatures: ['Declarative transformation', 'Bytecode optimized loop', 'High readability'],
    };
  }

  if (cleanCode.includes('[::-1]')) {
    return {
      methodName: 'Extended Slicing [::-1]',
      rankTitle: 'Rank 1 (Optimal Pythonic Standard)',
      timeComplexity: 'O(n) Linear Time',
      spaceComplexity: 'O(n) Memory',
      isOptimal: true,
      assessment: 'Most efficient reversal method in Python! Memory slicing is implemented directly in C, running significantly faster than manual character swapping.',
      keyFeatures: ['Step parameter -1', 'C-level memory copying', 'Minimal code'],
    };
  }

  if (cleanCode.includes('def ') && (cleanCode.includes('(') && cleanCode.split('def ')[1]?.split('(')[0]?.trim() && cleanCode.includes(cleanCode.split('def ')[1]?.split('(')[0]?.trim() + '('))) {
    return {
      methodName: 'Recursive Call Stack Method',
      rankTitle: 'Rank 2 (Algorithmic Recursive)',
      timeComplexity: 'O(n) Stack Depth',
      spaceComplexity: 'O(n) Call Stack',
      isOptimal: false,
      assessment: 'You solved this with recursion! Interviewers love seeing base-case handling, but will test you on Python\'s recursion depth limit (default 1,000) and space overhead.',
      keyFeatures: ['Base case handling', 'Call stack traversal'],
    };
  }

  if (cleanCode.includes('for ') || cleanCode.includes('while ')) {
    return {
      methodName: 'Iterative Loop with State Accumulation',
      rankTitle: 'Rank 2 (Standard Explicit Control Flow)',
      timeComplexity: 'O(n) Linear Time',
      spaceComplexity: 'O(1) Auxiliary Space',
      isOptimal: true,
      assessment: 'Rock-solid algorithmic foundation! Step-by-step iteration with explicit state tracking is easy to trace, explain, and debug on a whiteboard.',
      keyFeatures: ['Deterministic iteration', 'Explicit state mutation', 'Minimal auxiliary overhead'],
    };
  }

  return {
    methodName: 'Direct Functional / Native Python Solution',
    rankTitle: 'Rank 1 (Optimal Interview Solution)',
    timeComplexity: 'O(1) - O(n)',
    spaceComplexity: 'O(1)',
    isOptimal: true,
    assessment: 'Clean and functional implementation! You utilized Python\'s standard primitives to achieve the required output with low cognitive overhead.',
    keyFeatures: ['Native primitives', 'Clean execution'],
  };
}

/**
 * Returns 3-4 ranked solutions for any problem in the curriculum.
 */
export function getProblemRankedSolutions(problem?: ChallengeDetail | null): RankedSolution[] {
  const pId = problem?.id || 1;

  if (pId === 1) {
    return [
      {
        rank: 1,
        rankBadge: '🏆 Optimal Interview Standard',
        title: 'Two-Pointer In-Place Verification (O(1) Space)',
        code: `s = input()
left, right = 0, len(s) - 1
is_palindrome = True

while left < right:
    while left < right and not s[left].isalnum():
        left += 1
    while left < right and not s[right].isalnum():
        right -= 1
    if s[left].lower() != s[right].lower():
        is_palindrome = False
        break
    left += 1
    right -= 1

print(is_palindrome)
`,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1) Auxiliary',
        simplestExplanation: 'Compares characters inward from both ends of the string, skipping non-alphanumerics without creating any secondary string copies.',
        mentalModel: 'Imagine two fingers starting at opposite ends of a sentence and walking toward each other. Whenever a finger touches a space or comma, it steps forward. When both fingers land on real letters, they check if the letters match. If they meet in the middle without any disagreement, it is a palindrome!',
        lineByLine: [
          {
            line: 'left, right = 0, len(s) - 1',
            explanation: 'Places pointer `left` at the first character (index 0) and `right` at the final character (index len(s) - 1).'
          },
          {
            line: 'while left < right and not s[left].isalnum(): left += 1',
            explanation: 'Advances `left` forward until it points to an alphanumeric letter or digit.'
          },
          {
            line: 'while left < right and not s[right].isalnum(): right -= 1',
            explanation: 'Walks `right` backward until it also rests on an alphanumeric character.'
          },
          {
            line: 'if s[left].lower() != s[right].lower(): is_palindrome = False; break',
            explanation: 'Normalizes case and checks for mismatch. If different, exits early immediately.'
          }
        ],
        visualDiagram: '  "A man, a plan, a canal: Panama"\n   ▲                            ▲\n  left                        right\n   └────── matched \'a\' == \'a\' ────┘',
        beginnerTraps: [
          '⚠️ Forgetting inner boundary checks `left < right`: skipping consecutive punctuation can run out of bounds without this condition!',
          '⚠️ Comparing cases directly: "A" != "a" in ASCII, so `.lower()` is mandatory.'
        ],
        keyTakeaway: 'Two pointers allow you to validate symmetric constraints in O(n) time while preserving O(1) constant auxiliary memory.',
        interviewPros: 'The exact optimal O(1) space solution FAANG interviewers look for.',
        interviewCons: 'Slightly more pointer boundary management than slicing.',
      },
      {
        rank: 2,
        rankBadge: '🥈 Idiomatic Pythonic Standard',
        title: 'Filtered List Comprehension & Slicing ([::-1])',
        code: `s = input()
cleaned = [c.lower() for c in s if c.isalnum()]
print(cleaned == cleaned[::-1])
`,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        simplestExplanation: 'Filters alphanumeric characters into lowercase tokens, then compares the list directly with its reverse using [::-1].',
        mentalModel: 'Strip away all spaces and commas into a clean strip of letters, make a second photocopy flipped backwards, and hold them up to the light to see if they align.',
        lineByLine: [
          {
            line: 'cleaned = [c.lower() for c in s if c.isalnum()]',
            explanation: 'List comprehension filters characters where `c.isalnum()` is True and converts to lowercase in a single C-speed pass.'
          },
          {
            line: 'print(cleaned == cleaned[::-1])',
            explanation: '`[::-1]` creates a reversed copy. Equality `==` checks if every element matches symmetrically.'
          }
        ],
        visualDiagram: '  "race a car" ──► cleaned = [\'r\',\'a\',\'c\',\'e\',\'a\',\'c\',\'a\',\'r\']\n  cleaned[::-1] = [\'r\',\'a\',\'c\',\'a\',\'e\',\'c\',\'a\',\'r\'] ──► False',
        beginnerTraps: [
          '⚠️ Writing `s == s[::-1]` before stripping spaces or punctuation.'
        ],
        keyTakeaway: 'List comprehensions with [::-1] are concise and execute in optimized C bytecode.',
        interviewPros: 'Extremely clean, expressive, and impossible to have off-by-one pointer bugs.',
        interviewCons: 'Uses O(n) extra space to store the filtered list.',
      },
    ];
  }

  if (pId === 2) {
    return [
      {
        rank: 1,
        rankBadge: '🏆 Optimal Interview Standard',
        title: 'Whitespace Splitting & Sliced Reversal',
        code: `s = input()
words = s.split()
print(" ".join(words[::-1]))
`,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        simplestExplanation: 'Tokenizes words ignoring irregular spacing, reverses the token array, and joins words with single spaces.',
        mentalModel: 'Think of words as index cards in a row. `s.split()` picks up only the cards, discarding any extra whitespace. You flip the stack upside-down and lay them back down separated by a single space.',
        lineByLine: [
          {
            line: 'words = s.split()',
            explanation: 'Calling `split()` without parameters automatically splits on consecutive whitespace characters and trims leading/trailing spaces.'
          },
          {
            line: 'print(" ".join(words[::-1]))',
            explanation: 'Reverses the list of word tokens in O(n) time and joins them with `" "`.'
          }
        ],
        visualDiagram: '  "  the sky   is blue  "\n            │ (s.split())\n            ▼\n    ["the", "sky", "is", "blue"]\n            │ (words[::-1])\n            ▼\n    ["blue", "is", "sky", "the"] ──► "blue is sky the"',
        beginnerTraps: [
          '⚠️ Writing `s.split(" ")` with an explicit space! That preserves empty strings `""` when multiple spaces exist. Always use `s.split()` with no arguments.'
        ],
        keyTakeaway: 'Python\'s argument-free .split() is custom-built for whitespace normalization in natural language processing.',
        interviewPros: 'The standard idiomatic Python answer in real-world interviews.',
        interviewCons: 'Creates an intermediary list of word strings.',
      },
      {
        rank: 2,
        rankBadge: '🥈 Two-Pointer Word Inversion',
        title: 'Two-Pointer In-Place Word Swap',
        code: `s = input()
words = s.split()
left, right = 0, len(words) - 1
while left < right:
    words[left], words[right] = words[right], words[left]
    left += 1
    right -= 1
print(" ".join(words))
`,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        simplestExplanation: 'Splits words and uses two pointers at opposite ends to swap words until they meet.',
        mentalModel: 'Swap the first and last word, then second and second-to-last word, stepping inward.',
        lineByLine: [
          {
            line: 'words[left], words[right] = words[right], words[left]',
            explanation: 'Tuple unpacking swaps two words symmetrically in O(1) time.'
          }
        ],
        visualDiagram: '  [blue, sky, is, the] ── swap left & right ──► [the, is, sky, blue]',
        beginnerTraps: [
          '⚠️ Attempting to mutate string characters directly in Python: strings in Python are immutable.'
        ],
        keyTakeaway: 'Demonstrates classical two-pointer array manipulation.',
        interviewPros: 'Shows cross-language algorithmic foundation (C++/Java style).',
        interviewCons: 'More lines of code than words[::-1].',
      },
    ];
  }

  if (pId === 3) {
    return [
      {
        rank: 1,
        rankBadge: '🏆 Optimal Interview Standard',
        title: 'Two-Pass Frequency Map (Hash Table)',
        code: `s = input()
counts = {}
for c in s:
    counts[c] = counts.get(c, 0) + 1

ans = "-1"
for c in s:
    if counts[c] == 1:
        ans = c
        break

print(ans)
`,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(k) where k <= 26',
        simplestExplanation: 'Pass 1 builds frequency tally in a dictionary; Pass 2 scans original order to find the first character with count 1.',
        mentalModel: 'Pass 1 is like taking attendance with tally marks next to names. Pass 2 walks down the hallway in original arrival order and picks the first person who only has one tally mark.',
        lineByLine: [
          {
            line: 'counts[c] = counts.get(c, 0) + 1',
            explanation: 'Increments the count for character c, defaulting to 0 if not seen yet.'
          },
          {
            line: 'for c in s: if counts[c] == 1: ans = c; break',
            explanation: 'Scans the original string order to preserve earliest occurrence, terminating on first match.'
          }
        ],
        visualDiagram: '  "leetcode"\n  counts: {\'l\': 1, \'e\': 3, \'t\': 1, \'c\': 1, \'o\': 1, \'d\': 1}\n  Scan: \'l\' has count 1 ──► Found \'l\'!',
        beginnerTraps: [
          '⚠️ Iterating through counts.keys() in Pass 2: While Python 3.7+ preserves dictionary insertion order, iterating over s is safer and guarantees sequence order.',
          '⚠️ Using `s.count(c)` inside a loop: that causes O(n^2) time complexity!'
        ],
        keyTakeaway: 'Hash tables turn O(n^2) nested lookups into linear O(n) streaming algorithms.',
        interviewPros: 'Demonstrates clean O(n) algorithmic design and dictionary mastery.',
        interviewCons: 'Requires two passes over the input string.',
      },
      {
        rank: 2,
        rankBadge: '🥈 Collections Module Standard',
        title: 'Counter Frequency Dictionary',
        code: `from collections import Counter
s = input()
counts = Counter(s)
ans = "-1"
for c in s:
    if counts[c] == 1:
        ans = c
        break
print(ans)
`,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(k)',
        simplestExplanation: 'Leverages Python\'s standard library `collections.Counter` to build character frequencies in optimized C.',
        mentalModel: 'Delegates frequency aggregation to Python\'s built-in counting tool.',
        lineByLine: [
          {
            line: 'counts = Counter(s)',
            explanation: 'Populates a specialized dictionary subclass tracking item counts directly in C.'
          }
        ],
        visualDiagram: '  Counter("loveleetcode") ──► Counter({\'e\': 4, \'l\': 2, \'o\': 2, \'v\': 1, \'t\': 1, \'c\': 1, \'d\': 1})',
        beginnerTraps: [
          '⚠️ Forgetting to return -1 when all characters repeat.'
        ],
        keyTakeaway: 'collections.Counter is a production-grade Python tool for frequency counting.',
        interviewPros: 'High readability, standard Python library usage.',
        interviewCons: 'In some initial screening rounds, interviewers may ask to implement without imports.',
      },
    ];
  }

  // Lookup verified solution for any problem in the 50 DSA Curriculum
  const solRecord = ALL_50_SOLUTIONS[pId] || (problem?.level_number ? ALL_50_SOLUTIONS[problem.level_number] : null);
  const solutionCode = solRecord ? solRecord.optimalCode : (problem?.starter_code || '# Solution\npass\n');
  const solLines = solutionCode.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));

  return [
    {
      rank: 1,
      rankBadge: '🏆 Optimal Interview Solution',
      title: solRecord ? `${solRecord.title} — Verified Solution` : 'Optimal Pythonic Solution',
      code: solutionCode,
      timeComplexity: solRecord ? solRecord.timeComplexity : 'O(n)',
      spaceComplexity: solRecord ? solRecord.spaceComplexity : 'O(1)',
      simplestExplanation: solRecord ? solRecord.explanation : `Optimal, idiomatic solution for "${problem?.title || 'this challenge'}" passing all test suites.`,
      mentalModel: solRecord ? solRecord.keyTakeaway : 'Pipeline: take input, apply targeted DSA pattern, output result.',
      lineByLine: solLines.slice(0, 3).map((line) => ({
        line,
        explanation: 'Core algorithmic execution step.'
      })),
      visualDiagram: `  Input Stream ──► [ ${problem?.title || 'Algorithm'} ] ──► Verified Output`,
      beginnerTraps: [
        '⚠️ Boundary conditions: test empty inputs, single elements, and max ranges.'
      ],
      keyTakeaway: solRecord ? solRecord.keyTakeaway : 'Clean Python syntax and proper data structures optimize time and space complexity.',
      interviewPros: 'Optimal complexity, verified against all edge cases.',
      interviewCons: 'Ensure you explain time and space complexity to the interviewer before running.',
    }
  ];
}

/**
 * Returns the unique Learner's Guide:
 * 1) 4 Ways to Solve the Code
 * 2) Game-Like 4-Stage Interactive Walkthrough
 */
export function getProblemLearnerGuide(problem?: ChallengeDetail | null): LearnerGuide {
  const pId = problem?.id || 1;

  if (pId === 1) {
    return {
      fourWays: [
        {
          number: 1,
          title: 'The Two-Pointer Approach (Optimal O(1) Space)',
          description: 'Place pointers at left and right boundaries, skip non-alphanumerics, and verify symmetric character equality moving inward.',
          concept: 'Two Pointers & In-Place Verification',
        },
        {
          number: 2,
          title: 'The Filtered Slicing Approach ([::-1])',
          description: 'Extract lowercase alphanumeric characters into a list and compare with its reverse `cleaned == cleaned[::-1]`.',
          concept: 'List Comprehension & Python Slicing',
        },
        {
          number: 3,
          title: 'The Regular Expression Approach',
          description: 'Strip all non-alphanumerics using `re.sub(r"[^a-zA-Z0-9]", "", s).lower()`, then check palindrome equality.',
          concept: 'Regex Pattern Normalization',
        },
        {
          number: 4,
          title: 'The Recursive Palindrome Verification',
          description: 'Recursively verify first and last characters, passing the inner substring `s[1:-1]` until base case len <= 1.',
          concept: 'Divide and Conquer Recursion',
        },
      ],
      walkthroughStages: [
        {
          stageNumber: 1,
          stageTitle: 'Read & Normalize',
          mission: 'Read input string and filter only alphanumeric characters in lowercase.',
          codeSnippet: 's = input()\ncleaned = [c.lower() for c in s if c.isalnum()]',
          interactiveHint: 'Use c.isalnum() to ignore spaces, punctuation, and colons.',
          actionLabel: 'Stage 1 Complete: Next Step →',
        },
        {
          stageNumber: 2,
          stageTitle: 'Symmetric Comparison',
          mission: 'Check whether the cleaned list matches its exact reverse.',
          codeSnippet: 'is_pal = (cleaned == cleaned[::-1])',
          interactiveHint: '[::-1] reverses sequences with negative step in Python.',
          actionLabel: 'Stage 2 Complete: Next Step →',
        },
        {
          stageNumber: 3,
          stageTitle: 'Output Boolean Standard',
          mission: 'Print True if valid palindrome, otherwise False.',
          codeSnippet: 'print(is_pal)',
          interactiveHint: 'Standard output expects True or False matching test cases.',
          actionLabel: 'Stage 3 Complete: Next Step →',
        },
        {
          stageNumber: 4,
          stageTitle: 'Run & Victory Verification',
          mission: 'Click "Run" or press Ctrl+Enter to test edge cases!',
          codeSnippet: 's = input()\ncleaned = [c.lower() for c in s if c.isalnum()]\nprint(cleaned == cleaned[::-1])',
          interactiveHint: 'Look at the terminal: all visible test cases should pass with flying colors!',
          actionLabel: 'Quest Completed! 🎉',
        },
      ],
    };
  }

  if (pId === 3) {
    return {
      fourWays: [
        {
          number: 1,
          title: 'Two-Pass Frequency Map (The #1 Interview Standard)',
          description: 'Count character frequencies in pass 1 with a dictionary. In pass 2, find the first character with count 1.',
          concept: 'Hash Table Frequency Counting',
        },
        {
          number: 2,
          title: 'Collections Counter Standard',
          description: 'Use `from collections import Counter` to count characters in C-level speed, then find the first unique key.',
          concept: 'Standard Library Counter',
        },
        {
          number: 3,
          title: 'Ordered Dictionary / First-Seen Index Map',
          description: 'Store first seen index and repeat flags in a single pass to handle infinite character streams.',
          concept: 'Stream Processing Algorithm',
        },
        {
          number: 4,
          title: 'Fixed Array Frequency (26 Letters)',
          description: 'Use a fixed-size integer array of length 26 mapped via ord(c) - ord("a") for strict O(1) space.',
          concept: 'ASCII Integer Bucket Mapping',
        },
      ],
      walkthroughStages: [
        {
          stageNumber: 1,
          stageTitle: 'Read Input Stream',
          mission: 'Read string s from input and initialize a frequency dictionary.',
          codeSnippet: 's = input()\ncounts = {}',
          interactiveHint: 'A Python dictionary acts as our fast O(1) lookup table.',
          actionLabel: 'Stage 1 Complete: Next Step →',
        },
        {
          stageNumber: 2,
          stageTitle: 'First Pass: Build Frequencies',
          mission: 'Count every character occurrence in s.',
          codeSnippet: 'for c in s:\n    counts[c] = counts.get(c, 0) + 1',
          interactiveHint: 'counts.get(c, 0) + 1 safely increments without KeyError.',
          actionLabel: 'Stage 2 Complete: Next Step →',
        },
        {
          stageNumber: 3,
          stageTitle: 'Second Pass: Find First Unique',
          mission: 'Scan original string order and find the first character with count == 1.',
          codeSnippet: 'ans = "-1"\nfor c in s:\n    if counts[c] == 1:\n        ans = c\n        break',
          interactiveHint: 'Scanning s preserves original sequence order. Default to "-1" if none found.',
          actionLabel: 'Stage 3 Complete: Next Step →',
        },
        {
          stageNumber: 4,
          stageTitle: 'Run & Victory Verification',
          mission: 'Print ans and test against test cases!',
          codeSnippet: 'print(ans)',
          interactiveHint: 'Press Run to execute your linear O(n) solution!',
          actionLabel: 'Quest Completed! 🎉',
        },
      ],
    };
  }

  // Generic learner guide for any other challenge
  return {
    fourWays: [
      {
        number: 1,
        title: 'The Idiomatic Python Approach (Most Optimal)',
        description: 'Use Python\'s standard libraries and direct language idioms to solve the problem in the fewest readable lines.',
        concept: 'Core Pythonic Idiom',
      },
      {
        number: 2,
        title: 'The Step-by-Step Iterative Technique',
        description: 'Iterate item by item through the input with an explicit loop, accumulating results in a dedicated state buffer.',
        concept: 'Explicit Iteration & State Management',
      },
      {
        number: 3,
        title: 'The Functional / Built-in Technique',
        description: 'Leverage Python\'s built-in mathematical functions, list comprehensions, or generators for high efficiency.',
        concept: 'Built-in C-Optimized Primitives',
      },
      {
        number: 4,
        title: 'The Defensive Edge-Case Technique',
        description: 'Guard against empty inputs, zero values, or boundary conditions before applying the core transformation logic.',
        concept: 'Defensive Architecture',
      },
    ],
    walkthroughStages: [
      {
        stageNumber: 1,
        stageTitle: 'Stage 1: The Input/Output Contract',
        mission: 'Understand what types are provided as inputs, and exactly what format standard output expects.',
        codeSnippet: `# Input: ${problem?.visible_test_cases?.[0]?.input || 'Standard values'}\n# Output: ${problem?.expected_output || 'Expected output'}`,
        interactiveHint: 'Always check if input is received via input() or function arguments.',
        actionLabel: 'Stage 1 Complete: Next Step →',
      },
      {
        stageNumber: 2,
        stageTitle: 'Stage 2: Setup Variables & State',
        mission: 'Initialize your variables or data structures needed to store intermediate calculations.',
        codeSnippet: '# Declare variables to hold values\nresult = ...',
        interactiveHint: 'Keep variable names descriptive and in snake_case per PEP 8 guidelines.',
        actionLabel: 'Stage 2 Complete: Next Step →',
      },
      {
        stageNumber: 3,
        stageTitle: 'Stage 3: Core Algorithmic Logic',
        mission: 'Apply the main transformation: whether arithmetic, loops, conditionals, or data structure methods.',
        codeSnippet: '# Apply transformation logic\n...',
        interactiveHint: 'Break complex operations into smaller, verifiable logical chunks.',
        actionLabel: 'Stage 3 Complete: Next Step →',
      },
      {
        stageNumber: 4,
        stageTitle: 'Stage 4: Return & Test Verification',
        mission: 'Output the final formatted answer and run tests in the terminal.',
        codeSnippet: 'print(result)',
        interactiveHint: 'Click Run (Ctrl+Enter) in the top bar to inspect output in the terminal!',
        actionLabel: 'Quest Completed! 🎉',
      },
    ],
  };
}
