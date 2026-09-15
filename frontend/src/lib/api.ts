import {
  ChapterGroup, ChallengeDetail, CodeRunResponse,
  CodeSubmitResponse, ExplainResponse, LeaderboardEntry,
  Achievement, ProfileResponse, User
} from './types';
import { sessionManager } from './session-manager';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  retryAfter?: number;

  constructor(message: string, code: string = 'ERROR', status: number = 500, requestId?: string, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }
}

// Silent Refresh Coordinator
let isRefreshing = false;
let refreshSubscribers: Array<(error: Error | null) => void> = [];

function subscribeTokenRefresh(cb: (error: Error | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(error: Error | null) {
  refreshSubscribers.forEach((cb) => cb(error));
  refreshSubscribers = [];
}

interface RequestOptions extends RequestInit {
  skipAuthRefresh?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const requestId = `req_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  const csrfToken = sessionManager.getCsrfToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...(options.headers as Record<string, string> || {}),
  };

  // Add CSRF token for state-changing operations
  const method = (options.method || 'GET').toUpperCase();
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include', // HttpOnly cookies sent automatically
      headers,
    });

    if (!res.ok) {
      // 401 Unauthorized handling: attempt silent refresh if not already an auth endpoint
      if (res.status === 401 && !options.skipAuthRefresh && !endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/login')) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', 'X-Request-ID': `ref_${requestId}` },
            });
            isRefreshing = false;
            onRefreshed(null);
          } catch (refreshErr: any) {
            isRefreshing = false;
            onRefreshed(refreshErr);
            sessionManager.clearSession();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('pyforge_auth_expired'));
            }
            throw new ApiError('Session expired. Please sign in again.', 'SESSION_EXPIRED', 401, requestId);
          }
        }

        // Wait for active refresh to complete, then retry original request
        return new Promise<T>((resolve, reject) => {
          subscribeTokenRefresh((error) => {
            if (error) {
              reject(new ApiError('Session expired. Please sign in again.', 'SESSION_EXPIRED', 401, requestId));
            } else {
              resolve(request<T>(endpoint, { ...options, skipAuthRefresh: true }));
            }
          });
        });
      }

      const errorData = await res.json().catch(() => ({}));
      const code = errorData.code || (res.status === 429 ? 'RATE_LIMITED' : res.status === 401 ? 'UNAUTHORIZED' : 'ERROR');
      let msg = errorData.message || errorData.detail || `Request failed with status ${res.status}`;
      
      if (Array.isArray(errorData.detail)) {
        msg = errorData.detail
          .map((e: any) => e.msg || e.message || (typeof e === 'string' ? e : JSON.stringify(e)))
          .join('. ');
      }

      const retryAfter = errorData.retry_after ? Number(errorData.retry_after) : undefined;
      throw new ApiError(msg, code, res.status, errorData.request_id || requestId, retryAfter);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error occurred';
    throw new ApiError(message, 'NETWORK_ERROR', 0, requestId);
  }
}

export const api = {
  // --- Auth Endpoints (Pure HttpOnly Cookies) ---
  async login(username: string, password: string, signal?: AbortSignal): Promise<{ access_token?: string; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      signal,
      skipAuthRefresh: true,
    });
  },

  async register(username: string, email: string, password: string, signal?: AbortSignal): Promise<{ access_token?: string; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
      signal,
      skipAuthRefresh: true,
    });
  },

  async guestLogin(signal?: AbortSignal): Promise<{ access_token?: string; user: User }> {
    return request('/auth/guest', {
      method: 'POST',
      signal,
      skipAuthRefresh: true,
    });
  },

  async logout(signal?: AbortSignal): Promise<{ status: string; message: string }> {
    return request('/auth/logout', {
      method: 'POST',
      signal,
      skipAuthRefresh: true,
    });
  },

  async refreshToken(signal?: AbortSignal): Promise<{ status: string; user?: User }> {
    return request('/auth/refresh', {
      method: 'POST',
      signal,
      skipAuthRefresh: true,
    });
  },

  async getMe(signal?: AbortSignal): Promise<User> {
    return request('/auth/me', { signal });
  },

  // --- Challenges ---
  async getChapters(signal?: AbortSignal): Promise<ChapterGroup[]> {
    return request('/challenges/chapters', { signal });
  },

  async getChallenge(id: number, signal?: AbortSignal): Promise<ChallengeDetail> {
    return request(`/challenges/${id}`, { signal });
  },

  // --- Sandbox Execution ---
  async runCode(challengeId: number, code: string, customInput?: string, signal?: AbortSignal): Promise<CodeRunResponse> {
    return request('/execution/run', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, custom_input: customInput }),
      signal,
    });
  },

  async submitCode(challengeId: number, code: string, hintsUsed: number = 0, signal?: AbortSignal): Promise<CodeSubmitResponse> {
    return request('/execution/submit', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, hints_used: hintsUsed }),
      signal,
    });
  },

  // --- AI Features ---
  async explainCode(challengeId: number, code: string, userQuestion?: string, signal?: AbortSignal): Promise<ExplainResponse> {
    return request('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, user_question: userQuestion }),
      signal,
    });
  },

  async chatWithTutor(
    message: string,
    code?: string,
    challengeId?: number,
    history: Array<{ role: string; content: string }> = [],
    signal?: AbortSignal
  ): Promise<{ reply: string; socratic_hint?: string }> {
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, code, challenge_id: challengeId, chat_history: history }),
        signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          return data;
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') throw e;
      console.warn('Next.js /api/ai/tutor error, falling back to backend:', e);
    }

    return request('/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({ message, code, challenge_id: challengeId, chat_history: history }),
      signal,
    });
  },

  // --- Gamification ---
  async getLeaderboard(signal?: AbortSignal): Promise<LeaderboardEntry[]> {
    return request('/gamification/leaderboard', { signal });
  },

  async getAchievements(signal?: AbortSignal): Promise<Achievement[]> {
    return request('/gamification/achievements', { signal });
  },

  async openMysteryBox(boxType: 'BRONZE' | 'SILVER' | 'CYBER_GOLD', signal?: AbortSignal): Promise<{
    success: boolean;
    reward_type: string;
    reward_value: string;
    reward_display: string;
    coins_left: number;
  }> {
    return request('/gamification/mystery-box/open', {
      method: 'POST',
      body: JSON.stringify({ box_type: boxType }),
      signal,
    });
  },

  async claimStreak(signal?: AbortSignal): Promise<{
    success: boolean;
    new_streak: number;
    xp_awarded: number;
    coins_awarded: number;
    message: string;
  }> {
    return request('/gamification/streak/claim', {
      method: 'POST',
      signal,
    });
  },

  // --- Profile ---
  async getProfile(signal?: AbortSignal): Promise<ProfileResponse> {
    return request('/profile/me', { signal });
  },

  // --- Admin ---
  async getAdminMetrics(signal?: AbortSignal): Promise<{
    total_users: number;
    total_challenges: number;
    total_submissions: number;
    overall_pass_rate: number;
    popular_challenges: Array<{ level: number; title: string; runs: number }>;
  }> {
    return request('/admin/metrics', { signal });
  },

  async getAdminUsers(signal?: AbortSignal): Promise<User[]> {
    return request('/admin/users', { signal });
  },

  async updateAdminUser(userId: number, updates: Partial<User>, signal?: AbortSignal): Promise<{ success: boolean; user: User }> {
    return request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      signal,
    });
  },
};
