/**
 * Session Manager for PyForge Enterprise Auth.
 * Manages minimal cached identity (non-sensitive fields only) to enable
 * instant, zero-flicker UI hydration while cookies remain the sole auth credential.
 */

export interface CachedIdentity {
  id: number;
  username: string;
  role: 'user' | 'admin' | 'guest';
  avatar: string;
}

const IDENTITY_KEY = 'pyforge_identity';

export const sessionManager = {
  getCachedIdentity(): CachedIdentity | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(IDENTITY_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.id === 'number' && typeof parsed.username === 'string') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  setCachedIdentity(user: { id: number; username: string; role: 'user' | 'admin' | 'guest'; avatar?: string }) {
    if (typeof window === 'undefined') return;
    try {
      const minimal: CachedIdentity = {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar || 'cyber-snake',
      };
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(minimal));
    } catch (e) {
      console.warn('Failed to cache identity:', e);
    }
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(IDENTITY_KEY);
      localStorage.removeItem('pq_token'); // Clean up legacy token
    } catch (e) {
      console.warn('Failed to clear session storage:', e);
    }
  },

  getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
};
