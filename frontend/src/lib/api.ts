import {
  ChapterGroup, ChallengeDetail, CodeRunResponse,
  CodeSubmitResponse, ExplainResponse,
  ProfileResponse, User, SubmissionLogEntry
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pq_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<T> {
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
      // Handle expired/invalid token — auto-logout
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pq_token');
          localStorage.removeItem('pq_local_user');
          window.dispatchEvent(new Event('pyforge_auth_logout'));
        }
        throw new Error('Session expired. Please sign in again.');
      }

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

  async getMe(): Promise<User> {
    return request('/auth/me', {}, 3000);
  },

  // Challenges
  async getChapters(): Promise<ChapterGroup[]> {
    return request('/challenges/chapters');
  },

  async getChallenge(id: number): Promise<ChallengeDetail> {
    return request(`/challenges/${id}`);
  },

  // Code Execution
  async runCode(challengeId: number, code: string, customInput?: string): Promise<CodeRunResponse> {
    return request('/execution/run', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, custom_input: customInput }),
    });
  },

  async submitCode(challengeId: number, code: string, hintsUsed: number = 0): Promise<CodeSubmitResponse> {
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


  // Profile
  async getProfile(): Promise<ProfileResponse> {
    return request('/profile/me');
  },

  async getUserSubmissions(): Promise<SubmissionLogEntry[]> {
    return request<SubmissionLogEntry[]>('/profile/submissions', {}, 4000).catch(() => []);
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
