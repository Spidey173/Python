import { ChallengeDetail } from './types';
import {
  ALL_50_STUDY_DATA,
  ProblemStudyData
} from './interview-data';

export function getProblemStudyData(problem: ChallengeDetail): ProblemStudyData {
  const key = problem.level_number || problem.id;
  if (ALL_50_STUDY_DATA[key]) {
    return ALL_50_STUDY_DATA[key];
  }
  if (ALL_50_STUDY_DATA[problem.id]) {
    return ALL_50_STUDY_DATA[problem.id];
  }

  // Fallback for custom challenges
  const title = problem.title || 'Technical Challenge';
  const diff = (problem.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy';

  return {
    problemId: problem.id,
    problemTitle: title,
    difficulty: diff,
    companyTags: ['Amazon', 'Microsoft', 'Google', 'TCS'],
    tracing: {
      code: "1: # Code Tracing\n2: result = 0\n3: print(result)",
      steps: [
        { step: 1, lineNumber: 1, vars: { result: "0" }, explanation: "Initialize state variable." },
        { step: 2, lineNumber: 3, vars: { output: "0" }, explanation: "Print result to standard output." }
      ]
    },
    questions: [
      {
        id: 'fallback-q1',
        category: '30-Second Interview Pitch',
        question: `How would you explain your solution for ${title} in 30 seconds?`,
        whatInterviewerChecks: 'Verbal communication and algorithmic clarity.',
        bestReplyScript: `I process the input in a single pass in O(n) time and O(1) space. We maintain running variables without allocating supplementary memory, ensuring minimal heap overhead and linear performance.`,
        keyPoints: ['Optimal O(n) time', 'O(1) auxiliary space', 'No extra memory copies']
      }
    ],
    mistakes: [
      {
        id: 'm1',
        title: 'Nested Loops Causing O(n²) TLE',
        description: 'Using nested loops when a linear pass is possible.',
        badSnippet: 'for i in range(n):\n    for j in range(n): ...',
        failingInput: 'Large array of 100,000 items',
        consequence: 'Time Limit Exceeded in online assessments.',
        howToFix: 'Use a single pass with two pointers or a hash table.'
      }
    ]
  };
}
