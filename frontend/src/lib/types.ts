export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  xp: number;
  coins: number;
  level: number;
  lives: number;
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
  xp_reward: number;
  coin_reward: number;
  is_boss: boolean;
  boss_name?: string;
  difficulty: string;
  passed: boolean;
  stars: number;
  locked: boolean;
}

export interface ChapterGroup {
  chapter_id: number;
  chapter_title: string;
  levels: ChallengeSummary[];
  completion_percentage: number;
  total_xp: number;
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
  xp_reward: number;
  coin_reward: number;
  is_boss: boolean;
  boss_name?: string;
  boss_hp?: number;
  difficulty: string;
  passed: boolean;
  stars: number;
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
  stars_earned: number;
  xp_earned: number;
  coins_earned: number;
  combo_bonus: number;
  speed_bonus: number;
  lives_remaining: number;
  level_up: boolean;
  new_level: number;
  test_results: TestCaseResult[];
  next_challenge_id?: number;
  new_achievements: Achievement[];
  message: string;
  boss_defeated: boolean;
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

export interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xp_bonus: number;
  coin_bonus: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  stars: number;
  streak: number;
}

export interface ChapterMastery {
  chapter_id: number;
  chapter_title: string;
  total_levels: number;
  completed_levels: number;
  stars_earned: number;
  total_stars: number;
  percentage: number;
}

export interface ProfileResponse {
  user: User;
  total_completed: number;
  total_challenges: number;
  total_stars: number;
  max_stars: number;
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

