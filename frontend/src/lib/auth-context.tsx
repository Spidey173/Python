'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { api } from './api';
import { persistence } from './persistence';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isGuest: boolean;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocally: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    if (typeof window === 'undefined') return;
    try {
      const storedToken = localStorage.getItem('pq_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const u = await api.getMe();
          setUser(u);
          setLoading(false);
          return;
        } catch {
          // Token invalid, expired or backend unreachable
          const savedLocal = localStorage.getItem('pq_local_user');
          if (savedLocal) {
            try {
              setUser(JSON.parse(savedLocal));
              setLoading(false);
              return;
            } catch {}
          }
          if (storedToken.startsWith('local_guest_')) {
            setUser({
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
            });
            setLoading(false);
            return;
          }
          localStorage.removeItem('pq_token');
          localStorage.removeItem('pq_local_user');
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.warn('Auth initialization error:', e);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const isGuest = Boolean(
    user && (user.role === 'guest' || user.username.startsWith('runner_') || user.email.startsWith('guest_'))
  );

  const login = async (username: string, pass: string) => {
    const data = await api.login(username, pass);
    localStorage.setItem('pq_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pyforge_auth_login'));
      window.dispatchEvent(new Event('pyforge_problem_solved'));
    }
  };

  const register = async (username: string, email: string, pass: string) => {
    const data = await api.register(username, email, pass);
    localStorage.setItem('pq_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pyforge_auth_login'));
      window.dispatchEvent(new Event('pyforge_problem_solved'));
    }
  };

  const guestLogin = async () => {
    const data = await api.guestLogin();
    localStorage.setItem('pq_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pyforge_auth_login'));
      window.dispatchEvent(new Event('pyforge_problem_solved'));
    }
  };

  const logout = () => {
    localStorage.removeItem('pq_token');
    localStorage.removeItem('pq_local_user');
    persistence.clearUserData();
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pyforge_auth_logout'));
    }
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      // ignore
    }
  };

  const updateUserLocally = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isGuest,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
