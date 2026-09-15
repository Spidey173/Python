'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from './types';
import { api, ApiError } from './api';
import { persistence } from './persistence';
import { sessionManager, CachedIdentity } from './session-manager';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isSubmitting: boolean;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocally: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronous initialization from minimal cached identity (zero flicker on reload)
  const initialCached = typeof window !== 'undefined' ? sessionManager.getCachedIdentity() : null;
  
  const [user, setUser] = useState<User | null>(() => {
    if (initialCached) {
      return {
        id: initialCached.id,
        username: initialCached.username,
        email: `${initialCached.username}@pythonquest.io`,
        role: initialCached.role as ('user' | 'admin' | 'guest'),
        avatar: initialCached.avatar,
        xp: 0,
        coins: 100,
        level: 1,
        lives: 5,
        streak: 1,
        theme: 'cyber-dark',
        created_at: new Date().toISOString(),
      };
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!initialCached);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const activeSubmissionRef = useRef<boolean>(false);

  // Background revalidation on mount
  const revalidateSession = useCallback(async () => {
    try {
      const fullUser = await api.getMe();
      setUser(fullUser);
      sessionManager.setCachedIdentity(fullUser);
    } catch (err: any) {
      // If unauthorized and no active session, clear cached identity
      if (err instanceof ApiError && (err.status === 401 || err.code === 'UNAUTHORIZED' || err.code === 'SESSION_EXPIRED')) {
        sessionManager.clearSession();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    revalidateSession();

    // Cross-tab synchronization via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pyforge_identity') {
        if (!e.newValue) {
          // Another tab logged out
          setUser(null);
          persistence.clearUserData();
        } else {
          // Another tab logged in or changed user
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.username) {
              revalidateSession();
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    // Listen for session expiry from silent refresh
    const handleAuthExpired = () => {
      setUser(null);
      sessionManager.clearSession();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pyforge_auth_expired', handleAuthExpired);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pyforge_auth_expired', handleAuthExpired);
    };
  }, [revalidateSession]);

  const isGuest = Boolean(
    user && (user.role === 'guest' || user.username.startsWith('runner_') || user.email.startsWith('guest_'))
  );

  const login = async (username: string, pass: string) => {
    if (activeSubmissionRef.current) return;
    activeSubmissionRef.current = true;
    setIsSubmitting(true);
    try {
      const data = await api.login(username, pass);
      sessionManager.setCachedIdentity(data.user);
      setUser(data.user);
    } finally {
      activeSubmissionRef.current = false;
      setIsSubmitting(false);
    }
  };

  const register = async (username: string, email: string, pass: string) => {
    if (activeSubmissionRef.current) return;
    activeSubmissionRef.current = true;
    setIsSubmitting(true);
    try {
      const data = await api.register(username, email, pass);
      sessionManager.setCachedIdentity(data.user);
      setUser(data.user);
    } finally {
      activeSubmissionRef.current = false;
      setIsSubmitting(false);
    }
  };

  const guestLogin = async () => {
    if (activeSubmissionRef.current) return;
    activeSubmissionRef.current = true;
    setIsSubmitting(true);
    try {
      const data = await api.guestLogin();
      sessionManager.setCachedIdentity(data.user);
      setUser(data.user);
    } finally {
      activeSubmissionRef.current = false;
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      sessionManager.clearSession();
      persistence.clearUserData();
      setUser(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pyforge_auth_logout'));
      }
    }
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
      sessionManager.setCachedIdentity(u);
    } catch {
      // Ignore background errors
    }
  };

  const updateUserLocally = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      if (updates.username || updates.role || updates.avatar) {
        sessionManager.setCachedIdentity(next);
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        isSubmitting,
        login,
        register,
        guestLogin,
        logout,
        refreshUser,
        updateUserLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
