import {
  ChapterGroup, ChallengeDetail, CodeRunResponse,
  CodeSubmitResponse, ExplainResponse, LeaderboardEntry,
  Achievement, ProfileResponse, User
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pq_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}, timeoutMs: number = 4000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let msg = `Request failed with status ${res.status}`;
      if (typeof errorData.detail === 'string') {
        msg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        msg = errorData.detail
          .map((e: any) => e.msg || e.message || (typeof e === 'string' ? e : JSON.stringify(e)))
          .join('. ');
      } else if (errorData.message) {
        msg = errorData.message;
      }
      throw new Error(msg);
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timer);
    console.warn(`API call ${endpoint} failed, checking fallback...`, err);
    throw err;
  }
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    try {
      return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }, 3500);
    } catch (err: any) {
      throw err;
    }
  },

  async register(username: string, email: string, password: string): Promise<{ access_token: string; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }, 4000);
  },

  async guestLogin(): Promise<{ access_token: string; user: User }> {
    try {
      return await request('/auth/guest', {
        method: 'POST',
      }, 2500);
    } catch (err) {
      console.warn('Backend guest auth endpoint unreachable or timed out, initializing instant offline-ready guest session:', err);
      const guestId = 'runner_' + Math.random().toString(36).substring(2, 9);
      const fallbackUser: User = {
        id: Date.now(),
        username: guestId,
        email: `${guestId}@pythonquest.io`,
        role: 'guest',
        xp: 0,
        coins: 100,
        level: 1,
        lives: 5,
        streak: 1,
        avatar: 'cyber-snake',
        theme: 'cyber-dark',
        created_at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pq_local_user', JSON.stringify(fallbackUser));
      }
      return {
        access_token: 'local_guest_' + Date.now(),
        user: fallbackUser,
      };
    }
  },

  async getMe(): Promise<User> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pq_token') : null;
    if (token) {
      if (token.startsWith('local_')) {
        const saved = localStorage.getItem('pq_local_user');
        if (saved) {
          try { return JSON.parse(saved); } catch {}
        }
        return {
          id: 9999,
          username: 'runner_guest',
          email: 'guest@pythonquest.io',
          role: 'guest',
          xp: 0,
          coins: 100,
          level: 1,
          lives: 5,
          streak: 1,
          avatar: 'cyber-snake',
          theme: 'cyber-dark',
          created_at: new Date().toISOString(),
        };
      }
    }
    return request('/auth/me', {}, 3000);
  },

  // Challenges
  async getChapters(): Promise<ChapterGroup[]> {
    return request('/challenges/chapters');
  },

  async getChallenge(id: number): Promise<ChallengeDetail> {
    return request(`/challenges/${id}`);
  },

  // Sandbox Execution
  async runCode(challengeId: number, code: string, customInput?: string): Promise<CodeRunResponse> {
    return request('/execution/run', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, custom_input: customInput }),
    });
  },

  async submitCode(challengeId: number, code: string, hintsUsed: number = 0): Promise<CodeSubmitResponse> {
    if (typeof window !== 'undefined' && !localStorage.getItem('pq_token')) {
      try {
        const guestData = await api.guestLogin();
        localStorage.setItem('pq_token', guestData.access_token);
      } catch (e) {
        console.warn('Auto guest login failed:', e);
      }
    }
    return request('/execution/submit', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, hints_used: hintsUsed }),
    });
  },

  // AI Features
  async explainCode(challengeId: number, code: string, userQuestion?: string): Promise<ExplainResponse> {
    return request('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, user_question: userQuestion }),
    });
  },

  async chatWithTutor(
    message: string,
    code?: string,
    challengeId?: number,
    history: Array<{ role: string; content: string }> = [],
    starterCode?: string,
    lastError?: string
  ): Promise<{ reply: string }> {
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          code,
          challenge_id: challengeId,
          chat_history: history,
          starter_code: starterCode,
          last_error: lastError,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          return data;
        }
      }
    } catch (e) {
      console.warn('/api/ai/tutor error, falling back to backend /ai/tutor:', e);
    }

    return request('/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({
        message,
        code,
        challenge_id: challengeId,
        chat_history: history,
        starter_code: starterCode,
        last_error: lastError,
      }),
    });
  },


  // Gamification
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return request('/gamification/leaderboard');
  },

  async getAchievements(): Promise<Achievement[]> {
    return request('/gamification/achievements');
  },

  async openMysteryBox(boxType: 'BRONZE' | 'SILVER' | 'CYBER_GOLD'): Promise<{
    success: boolean;
    reward_type: string;
    reward_value: string;
    reward_display: string;
    coins_left: number;
  }> {
    return request('/gamification/mystery-box/open', {
      method: 'POST',
      body: JSON.stringify({ box_type: boxType }),
    });
  },

  async claimStreak(): Promise<{ success: boolean; new_streak: number; xp_awarded: number; coins_awarded: number; message: string }> {
    return request('/gamification/streak/claim', {
      method: 'POST',
    });
  },

  // Profile
  async getProfile(): Promise<ProfileResponse> {
    return request('/profile/me');
  },

  // Admin
  async getAdminMetrics(): Promise<{
    total_users: number;
    total_challenges: number;
    total_submissions: number;
    overall_pass_rate: number;
    popular_challenges: Array<{ level: number; title: string; runs: number }>;
  }> {
    return request('/admin/metrics');
  },

  async getAdminUsers(): Promise<User[]> {
    return request('/admin/users');
  },

  async updateAdminUser(userId: number, updates: Partial<User>): Promise<{ success: boolean; user: User }> {
    return request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};
