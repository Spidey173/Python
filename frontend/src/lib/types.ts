export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  streak: number;
  avatar: string;
  theme: string;
  created_at: string;
}

export interface TestCase {
  input: string;
  expected: string;
  hidden?: boolean;
  description?: string;
}

export interface ChallengeSummary {
  id: number;
  chapter_id: number;
  chapter_title: string;
  level_number: number;
  title: string;
  difficulty: string;
  passed: boolean;
  locked: boolean;
}

export interface ChapterGroup {
  chapter_id: number;
  chapter_title: string;
  levels: ChallengeSummary[];
  completion_percentage: number;
}

export interface ChallengeDetail {
  id: number;
  chapter_id: number;
  chapter_title: string;
  level_number: number;
  title: string;
  story: string;
  objective: string;
  starter_code: string;
  expected_output: string;
  hints: string[];
  visible_test_cases: TestCase[];
  total_test_cases: number;
  explanation?: string;
  difficulty: string;
  passed: boolean;
  saved_code?: string;
}

export interface TestCaseResult {
  test_case_index: number;
  description: string;
  passed: boolean;
  input: string;
  expected_output: string;
  actual_output: string;
  error?: string;
  execution_time_ms: number;
  hidden: boolean;
}

export interface CodeRunResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  test_results: TestCaseResult[];
  passed_all: boolean;
  execution_time_ms: number;
  security_error?: string;
}

export interface CodeSubmitResponse {
  success: boolean;
  passed_all: boolean;
  execution_time_ms?: number;
  test_results: TestCaseResult[];
  next_challenge_id?: number;
  message?: string;
}

export interface ExplainResponse {
  line_by_line: Array<{ line: number; code: string; explanation: string }>;
  beginner_summary: string;
  time_complexity: string;
  space_complexity: string;
  common_mistakes: string[];
  better_approach: string;
  optimized_code: string;
  dry_run_trace: Array<{ step: number; action: string; variables: Record<string, string>; output: string }>;
}

export interface ChapterMastery {
  chapter_id: number;
  chapter_title: string;
  total_levels: number;
  completed_levels: number;
  percentage: number;
}

export interface ProfileResponse {
  user: User;
  total_completed: number;
  total_challenges: number;
  accuracy_percentage: number;
  chapter_mastery: ChapterMastery[];
  weak_topics: string[];
  strengths: string[];
  recent_activity: Array<{
    challenge_title: string;
    level_number: number;
    status: string;
    execution_time_ms: number;
    date: string;
  }>;
}

export interface SubmissionLogEntry {
  id: string;
  problemId: number;
  problemTitle: string;
  passed: boolean;
  runtimeMs: number;
  timestamp: number;
  code: string;
}
