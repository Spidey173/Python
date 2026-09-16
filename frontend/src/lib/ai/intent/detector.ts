// Weighted Scoring Intent & Context Detector (<1ms, 0 LLM tokens)
// Replaces rigid regex with a multi-signal weighted feature accumulator

import { StudentIntent, LearningSubIntent } from '../types';

export interface DetectedIntentResult {
  intent: StudentIntent;
  subIntent?: LearningSubIntent;
  confidence: number;
  scores: Record<string, number>;
  flags: {
    askingForFullCode: boolean;
    askingForSkeleton: boolean;
    hasErrorTrace: boolean;
    isGreeting: boolean;
    mentionsTerminalOutput: boolean;
  };
}

interface IntentScoringRule {
  intent: StudentIntent;
  subIntent?: LearningSubIntent;
  positive: Array<{ pattern: RegExp; weight: number }>;
  negative?: Array<{ pattern: RegExp; weight: number }>;
}

const RULES: IntentScoringRule[] = [
  // 1. Greeting
  {
    intent: 'greeting',
    positive: [
      { pattern: /^(hi|hello|hey|hola|sup|yo|howdy|greetings)[\s!.]*$/i, weight: 6 },
      { pattern: /\b(good\s+(morning|afternoon|evening)|hey\s+there)\b/i, weight: 5 },
      { pattern: /\b(hi|hello|hey)\b/i, weight: 3 },
    ],
    negative: [
      { pattern: /\b(error|bug|code|solution|test|line|while|for)\b/i, weight: 4 },
    ],
  },

  // 2. Debugging
  {
    intent: 'debugging',
    positive: [
      { pattern: /\b(why is my code wrong|what('s| is) wrong with my code|where is my mistake|why is this wrong)\b/i, weight: 7 },
      { pattern: /\b(indexerror|keyerror|typeerror|attributeerror|syntaxerror|zerodivisionerror|valueerror|recursionerror)\b/i, weight: 6 },
      { pattern: /\b(traceback|exception|line \d+|error:|failed test)\b/i, weight: 5 },
      { pattern: /\b(debug|bug|fail|fails|failing|failed|broken|crash|not working|infinite loop|stuck in loop)\b/i, weight: 5 },
      { pattern: /\b(wrong|returns? none|unexpected output|differs from)\b/i, weight: 4 },
    ],
    negative: [
      { pattern: /\b(give me the solution|full code|hire me)\b/i, weight: 3 },
    ],
  },

  // 3. Reviewing
  {
    intent: 'reviewing',
    positive: [
      { pattern: /\b(review( my)? code|check my code|rate my code|critique my code)\b/i, weight: 5 },
      { pattern: /\b(feedback on( my)? code|is (my code|this) (good|optimal|clean|correct))\b/i, weight: 4 },
      { pattern: /\b(how can i improve my code|clean up my code|refactor)\b/i, weight: 4 },
    ],
    negative: [
      { pattern: /\b(syntaxerror|traceback|line \d+)\b/i, weight: 2 },
    ],
  },

  // 4. Career / Interview Advice
  {
    intent: 'career',
    positive: [
      { pattern: /\b(interview prep|mock interview|faang|maang|resume|job offer|salary|recruiter)\b/i, weight: 5 },
      { pattern: /\b(behavioral question|coding screen|system design|career advice)\b/i, weight: 4 },
    ],
    negative: [
      { pattern: /\b(this problem|in my code|test case|debug)\b/i, weight: 2 },
    ],
  },

  // 5. Learning: Complexity
  {
    intent: 'learning',
    subIntent: 'complexity',
    positive: [
      { pattern: /\b(time complexity|space complexity|big o|o\(n\)|o\(1\)|o\(n\^2\)|runtime analysis)\b/i, weight: 5 },
      { pattern: /\b(how fast|efficiency|scales|memory usage)\b/i, weight: 3 },
    ],
  },

  // 6. Learning: Walkthrough / Solution Request
  {
    intent: 'learning',
    subIntent: 'walkthrough',
    positive: [
      { pattern: /\b(give me the code|give me code|show me the code|give code)\b/i, weight: 8 },
      { pattern: /\b(give me the solution|show (the )?solution|just show me the code)\b/i, weight: 6 },
      { pattern: /\b(full (code|solution|answer)|what is the (answer|solution)|give up|show answer)\b/i, weight: 5 },
    ],
    negative: [
      { pattern: /\b(hint|nudge|don't give|without spoiling)\b/i, weight: 4 },
    ],
  },

  // 7. Learning: Pattern & Skeleton
  {
    intent: 'learning',
    subIntent: 'pattern',
    positive: [
      { pattern: /\b(pattern skeleton|template|scaffold|code structure|code skeleton|boilerplate)\b/i, weight: 5 },
      { pattern: /\b(what pattern|general archetype|standard approach)\b/i, weight: 3 },
    ],
    negative: [
      { pattern: /\b(give me the solution|full code)\b/i, weight: 3 },
    ],
  },

  // 8. Learning: Pseudocode
  {
    intent: 'learning',
    subIntent: 'pseudocode',
    positive: [
      { pattern: /\b(pseudocode|pseudo-code|step by step logic|algorithm outline|blueprint steps)\b/i, weight: 5 },
      { pattern: /\b(steps to solve|how to structure the logic)\b/i, weight: 3 },
    ],
  },

  // 9. Learning: Concept
  {
    intent: 'learning',
    subIntent: 'concept',
    positive: [
      { pattern: /\b(what is this problem asking|what is the problem asking|what does this problem mean|what is it asking|explain the problem|understand the problem)\b/i, weight: 8 },
      { pattern: /\b(i don't understand|i do not understand|confused|didn't get it|did not get it)\b/i, weight: 7 },
      { pattern: /\b(what is|how does|explain|concept behind|intuition of|meaning of)\b/i, weight: 4 },
      { pattern: /\b(difference between|why do we use|analogy)\b/i, weight: 3 },
    ],
    negative: [
      { pattern: /\b(my code|error|bug|traceback)\b/i, weight: 3 },
    ],
  },

  // 10. Learning: Hint (Default Learning)
  {
    intent: 'learning',
    subIntent: 'hint',
    positive: [
      { pattern: /\b(give me a hint|need a hint|another hint|clue|nudge|stuck|help me start)\b/i, weight: 5 },
      { pattern: /\b(where do i start|point me in the right direction|direction|guidance)\b/i, weight: 3 },
    ],
    negative: [
      { pattern: /\b(give me the solution|full code|just show me)\b/i, weight: 5 },
    ],
  },
];

export function detectIntent(message: string, code?: string): DetectedIntentResult {
  const text = message.trim();
  const lower = text.toLowerCase();

  const scores: Record<string, number> = {};
  const subScores: Record<string, number> = {};

  // Accumulate weighted scores across rules
  for (const rule of RULES) {
    let score = 0;

    for (const p of rule.positive) {
      if (p.pattern.test(lower)) {
        score += p.weight;
      }
    }

    if (rule.negative) {
      for (const n of rule.negative) {
        if (n.pattern.test(lower)) {
          score -= n.weight;
        }
      }
    }

    if (score > 0) {
      const intentKey = rule.intent;
      scores[intentKey] = (scores[intentKey] || 0) + score;

      if (rule.subIntent) {
        subScores[rule.subIntent] = (subScores[rule.subIntent] || 0) + score;
      }
    }
  }

  // Identify highest scoring top-level intent
  let topIntent: StudentIntent = 'conversation';
  let topScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > topScore) {
      topScore = score;
      topIntent = intent as StudentIntent;
    }
  }

  // Identify highest scoring sub-intent if learning
  let topSubIntent: LearningSubIntent | undefined;
  if (topIntent === 'learning') {
    let topSubScore = 0;
    for (const [sub, score] of Object.entries(subScores)) {
      if (score > topSubScore) {
        topSubScore = score;
        topSubIntent = sub as LearningSubIntent;
      }
    }
    if (!topSubIntent) topSubIntent = 'hint';
  }

  // Context flags
  const hasErrorTrace = /(error|exception|traceback|line \d+|failed)/i.test(lower);
  const mentionsTerminalOutput = /(print|stdout|terminal|output|returned)/i.test(lower);
  const askingForFullCode = topSubIntent === 'walkthrough' || /\b(solution|full code|give up)\b/i.test(lower);
  const askingForSkeleton = topSubIntent === 'pattern' || /\b(skeleton|scaffold|boilerplate)\b/i.test(lower);
  const isGreeting = topIntent === 'greeting';

  // Calculate confidence based on margin
  const confidence = Math.min(0.99, Math.max(0.7, 0.7 + topScore * 0.05));

  return {
    intent: topIntent,
    subIntent: topSubIntent,
    confidence,
    scores,
    flags: {
      askingForFullCode,
      askingForSkeleton,
      hasErrorTrace,
      isGreeting,
      mentionsTerminalOutput,
    },
  };
}
