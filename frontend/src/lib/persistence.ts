// PyForge Persistence Layer
// Pluggable persistence service conforming to docs/engineering.md specification

export interface SubmissionLogEntry {
  id: string;
  problemId: number;
  problemTitle: string;
  passed: boolean;
  runtimeMs: number;
  timestamp: number;
  code: string;
}

export interface LayoutSettings {
  navigatorCollapsed: boolean;
  consoleCollapsed: boolean;
  consoleHeight: number;
  activeDocTab: 'spec' | 'context' | 'hints';
}

export interface PersistenceProvider {
  saveDraft(problemId: number, code: string): Promise<void>;
  loadDraft(problemId: number): Promise<string | null>;
  saveLayoutSettings(settings: Partial<LayoutSettings>): Promise<void>;
  loadLayoutSettings(): Promise<LayoutSettings>;
  getSolvedIds(): Promise<number[]>;
  markSolved(problemId: number): Promise<void>;
  getLastActiveProblemId(): Promise<number>;
  setLastActiveProblemId(id: number): Promise<void>;
  getSubmissions(): Promise<SubmissionLogEntry[]>;
  recordSubmission(entry: Omit<SubmissionLogEntry, 'id' | 'timestamp'>): Promise<SubmissionLogEntry>;
  clearUserData(): Promise<void>;
}

const DEFAULT_SETTINGS: LayoutSettings = {
  navigatorCollapsed: false,
  consoleCollapsed: false,
  consoleHeight: 220,
  activeDocTab: 'spec',
};

class LocalPersistenceProvider implements PersistenceProvider {
  private isBrowser = typeof window !== 'undefined';

  async saveDraft(problemId: number, code: string): Promise<void> {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(`pyforge_draft_${problemId}`, code);
      localStorage.setItem(`pyforge_last_saved_${problemId}`, Date.now().toString());
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  }

  async loadDraft(problemId: number): Promise<string | null> {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(`pyforge_draft_${problemId}`);
    } catch {
      return null;
    }
  }

  async saveLayoutSettings(settings: Partial<LayoutSettings>): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const current = await this.loadLayoutSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem('pyforge_layout_settings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save layout settings:', e);
    }
  }

  async loadLayoutSettings(): Promise<LayoutSettings> {
    if (!this.isBrowser) return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem('pyforge_layout_settings');
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async getSolvedIds(): Promise<number[]> {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem('pyforge_solved_ids');
      if (!raw) return []; // Real initial: 0 solved
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async markSolved(problemId: number): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const solved = await this.getSolvedIds();
      if (!solved.includes(problemId)) {
        solved.push(problemId);
        localStorage.setItem('pyforge_solved_ids', JSON.stringify(solved));
      }
    } catch (e) {
      console.warn('Failed to mark problem solved:', e);
    }
  }

  async getLastActiveProblemId(): Promise<number> {
    if (!this.isBrowser) return 1;
    try {
      const id = localStorage.getItem('pyforge_last_active_problem');
      return id ? parseInt(id, 10) : 1;
    } catch {
      return 1;
    }
  }

  async setLastActiveProblemId(id: number): Promise<void> {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('pyforge_last_active_problem', id.toString());
    } catch (e) {
      console.warn('Failed to set last active problem:', e);
    }
  }

  async getSubmissions(): Promise<SubmissionLogEntry[]> {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem('pyforge_submissions_log');
      if (!raw) return []; // Real initial: 0 submissions
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async recordSubmission(entry: Omit<SubmissionLogEntry, 'id' | 'timestamp'>): Promise<SubmissionLogEntry> {
    const fullEntry: SubmissionLogEntry = {
      ...entry,
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };
    if (!this.isBrowser) return fullEntry;
    try {
      const logs = await this.getSubmissions();
      logs.unshift(fullEntry);
      // Keep up to 100 most recent submissions
      localStorage.setItem('pyforge_submissions_log', JSON.stringify(logs.slice(0, 100)));
      if (entry.passed) {
        await this.markSolved(entry.problemId);
      }
    } catch (e) {
      console.warn('Failed to record submission:', e);
    }
    return fullEntry;
  }

  async clearUserData(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem('pyforge_solved_ids');
      localStorage.removeItem('pyforge_submissions_log');
      localStorage.removeItem('pyforge_last_active_problem');
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('pyforge_draft_') || k.startsWith('pyforge_last_saved_'))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to clear persistence user data:', e);
    }
  }
}

export const persistence: PersistenceProvider = new LocalPersistenceProvider();

/**
 * Calculates real consecutive active days streak from real submission timestamps.
 */
export function calculateRealStreak(submissions: SubmissionLogEntry[]): number {
  if (!submissions || submissions.length === 0) return 0;

  const datesWithActivity = new Set<string>();
  submissions.forEach((sub) => {
    const d = new Date(sub.timestamp);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    datesWithActivity.add(dateStr);
  });

  const now = new Date();
  const formatDay = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todayStr = formatDay(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDay(yesterday);

  // If no activity today or yesterday, streak is broken
  if (!datesWithActivity.has(todayStr) && !datesWithActivity.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let curr = new Date(now);
  // If no activity today, start counting backward from yesterday
  if (!datesWithActivity.has(todayStr)) {
    curr = yesterday;
  }

  while (datesWithActivity.has(formatDay(curr))) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  }

  return streak;
}

/**
 * Calculates real average execution runtime in milliseconds from submissions.
 */
export function calculateRealAverageRuntime(submissions: SubmissionLogEntry[]): number {
  if (!submissions || submissions.length === 0) return 0;
  const total = submissions.reduce((acc, s) => acc + (s.runtimeMs || 0), 0);
  return Math.round(total / submissions.length);
}

/**
 * Debounces a callback function by the specified delay in milliseconds (default 2000ms per engineering spec).
 */
export function createDebouncedSaver(
  saveFn: (code: string) => void | Promise<void>,
  delayMs = 2000
) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (code: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      saveFn(code);
      timeoutId = null;
    }, delayMs);
  };
}
