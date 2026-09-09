'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './Button';
import {
  X, Lock, User as UserIcon, Mail, ShieldCheck,
  AlertCircle, ArrowRight, Zap, CheckCircle2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup' | 'guest';
}

export function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  const { login, register, guestLogin, user } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup' | 'guest'>(initialTab);

  // Dedicated Form states
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync tab and reset errors when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const ident = signInIdentifier.trim();
    if (!ident) {
      setError('Please enter your username or email.');
      return;
    }
    if (!signInPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(ident, signInPassword);
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => {
        onClose();
        setSignInPassword('');
      }, 350);
    } catch (err: any) {
      setError(err?.message || 'Invalid username/email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const u = signUpUsername.trim();
    const em = signUpEmail.trim();

    if (u.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!em.includes('@') || !em.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register(u, em, signUpPassword);
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        onClose();
        setSignUpUsername('');
        setSignUpEmail('');
        setSignUpPassword('');
      }, 350);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      await guestLogin();
      setSuccessMsg('Guest session initialized!');
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize guest session.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (u: string, p: string) => {
    setSignInIdentifier(u);
    setSignInPassword(p);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-[3px] animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#30363D] bg-[#161B22] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363D] bg-[#161B22]">
          <div>
            <h2 className="text-base font-bold text-[#E6EDF3] tracking-tight">
              {tab === 'signin' && 'Sign In to Python'}
              {tab === 'signup' && 'Create Your Python Account'}
              {tab === 'guest' && 'Instant Guest Session'}
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">
              {tab === 'signin' && 'Access your saved problems, streak, and interview solutions'}
              {tab === 'signup' && 'Save all your solved questions and track interview readiness'}
              {tab === 'guest' && 'Try challenges immediately without creating an account'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-[#30363D] bg-[#0D1117] p-1.5 gap-1 text-xs">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); setSuccessMsg(null); }}
            className={`py-2 font-semibold rounded-md transition-all ${
              tab === 'signin'
                ? 'bg-[#21262D] text-[#E6EDF3] border border-[#30363D] shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); setSuccessMsg(null); }}
            className={`py-2 font-semibold rounded-md transition-all ${
              tab === 'signup'
                ? 'bg-[#21262D] text-[#E6EDF3] border border-[#30363D] shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setTab('guest'); setError(null); setSuccessMsg(null); }}
            className={`py-2 font-semibold rounded-md transition-all ${
              tab === 'guest'
                ? 'bg-[#21262D] text-[#E6EDF3] border border-[#30363D] shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Guest User
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-[#DA3633]/40 bg-[#DA3633]/15 p-3 flex items-start gap-2.5 text-xs text-[#F85149]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-[#238636]/40 bg-[#238636]/15 p-3 flex items-start gap-2.5 text-xs text-[#3FB950]">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* SIGN IN TAB */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. admin or mca_student"
                    className="w-full h-9 pl-9 pr-3 bg-[#0D1117] border border-[#30363D] rounded-lg text-sm text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 pl-9 pr-3 bg-[#0D1117] border border-[#30363D] rounded-lg text-sm text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
                  />
                </div>
              </div>

              {/* Demo Account Quick Buttons */}
              <div className="rounded-lg border border-[#30363D]/70 bg-[#0D1117]/80 p-2.5 text-[11px] text-[#8B949E]">
                <span className="font-semibold text-[#C9D1D9]">Quick Demo Accounts:</span>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('admin', 'admin123')}
                    className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono transition-colors"
                  >
                    admin (pwd: admin123)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('student_dev', 'student123')}
                    className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#3FB950] font-mono transition-colors"
                  >
                    student_dev (pwd: student123)
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full justify-center font-semibold text-sm h-9"
                >
                  Sign In
                </Button>
              </div>

              <p className="text-xs text-center text-[#8B949E] pt-1">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setError(null); }}
                  className="text-[#58A6FF] hover:underline font-medium"
                >
                  Sign up now
                </button>
              </p>
            </form>
          )}

          {/* SIGN UP TAB */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                  Choose Username (min 3 chars)
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
                  <input
                    type="text"
                    required
                    autoFocus
                    minLength={3}
                    maxLength={30}
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="e.g. rahul_dev"
                    className="w-full h-9 pl-9 pr-3 bg-[#0D1117] border border-[#30363D] rounded-lg text-sm text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-[#238636] focus:ring-1 focus:ring-[#238636]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full h-9 pl-9 pr-3 bg-[#0D1117] border border-[#30363D] rounded-lg text-sm text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-[#238636] focus:ring-1 focus:ring-[#238636]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                  Create Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 pl-9 pr-3 bg-[#0D1117] border border-[#30363D] rounded-lg text-sm text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-[#238636] focus:ring-1 focus:ring-[#238636]"
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full justify-center font-semibold text-sm h-9 bg-[#238636] hover:bg-[#2EA043]"
                >
                  Create Account
                </Button>
              </div>

              <p className="text-xs text-center text-[#8B949E] pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('signin'); setError(null); }}
                  className="text-[#58A6FF] hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* GUEST ACCESS TAB */}
          {tab === 'guest' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-[#3FB950] font-semibold text-sm">
                  <Zap className="h-4 w-4" />
                  <span>Instant Guest Session</span>
                </div>
                <p className="text-[#8B949E] leading-relaxed">
                  Start coding and solving DSA questions immediately without entering an email or password.
                </p>
                <ul className="list-disc list-inside text-[#8B949E] space-y-1 pt-1 font-mono text-[11px]">
                  <li>Solve any of the 50 interview problems</li>
                  <li>Run code and view test suite execution</li>
                  <li>Can sign up or log in anytime to keep progress</li>
                </ul>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                isLoading={isLoading}
                onClick={handleGuest}
                className="w-full justify-center gap-2 font-semibold h-9 text-sm"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#30363D] bg-[#0D1117] text-[11px] text-[#8B949E] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#3FB950]" />
            <span>Secure session authentication</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-[#E6EDF3] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
