'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { persistence } from '@/lib/persistence';
import { api } from '@/lib/api';
import { ChapterGroup } from '@/lib/types';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { AuthModal } from '@/components/ui/AuthModal';
import {
  Code, BookOpen, BarChart2, LayoutDashboard,
  Search, Flame, User as UserIcon, LogOut, CheckCircle2
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isGuest } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [solvedCount, setSolvedCount] = useState<number>(0);

  useEffect(() => {
    async function loadSolved() {
      if (!user) {
        setSolvedCount(0);
        return;
      }
      try {
        const [localSolved, chaps] = await Promise.all([
          persistence.getSolvedIds(),
          api.getChapters().catch(() => [] as ChapterGroup[]),
        ]);
        const backendSolved = (chaps as ChapterGroup[]).flatMap((c: ChapterGroup) => c.levels).filter((l) => l.passed).map((l) => l.id);
        const solvedSet = new Set<number>();
        for (const rawId of [...backendSolved, ...localSolved]) {
          const norm = rawId >= 151 && rawId <= 220 ? rawId - 150 : rawId;
          if (norm >= 1 && norm <= 70) solvedSet.add(norm);
        }
        setSolvedCount(solvedSet.size);
      } catch {
        const solved = await persistence.getSolvedIds();
        const fallbackSet = new Set<number>();
        for (const rawId of solved) {
          const norm = rawId >= 151 && rawId <= 220 ? rawId - 150 : rawId;
          if (norm >= 1 && norm <= 70) fallbackSet.add(norm);
        }
        setSolvedCount(fallbackSet.size);
      }
    }
    loadSolved();

    const handleLogout = () => {
      setSolvedCount(0);
    };
    const handleProblemSolved = () => {
      loadSolved();
    };

    window.addEventListener('pyforge_auth_logout', handleLogout);
    window.addEventListener('pyforge_problem_solved', handleProblemSolved);
    return () => {
      window.removeEventListener('pyforge_auth_logout', handleLogout);
      window.removeEventListener('pyforge_problem_solved', handleProblemSolved);
    };
  }, [pathname, user]);

  // Listen for global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/quest', label: 'Curriculum', icon: BookOpen, exact: false },
    { href: '/profile', label: 'Progress', icon: BarChart2, exact: false },
  ];

  const openAuth = (tab: 'signin' | 'signup' | 'guest') => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-14 w-full border-b border-[#30363D] bg-[#161B22]/95 backdrop-blur-md shadow-sm">
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Main Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 group transition-opacity hover:opacity-95"
              aria-label="Python Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1F6FEB] to-[#38BDF8] text-white shadow-md shadow-[#1F6FEB]/25 border border-white/10">
                <Code className="h-4.5 w-4.5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-base tracking-tight text-white group-hover:text-[#38BDF8] transition-colors">
                Python
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1.5" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#21262D] text-white border border-[#30363D] shadow-sm'
                        : 'text-[#9198A1] hover:bg-[#21262D]/60 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center Search / Command Launcher — Sleek & Refined */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => setPaletteOpen(true)}
              className="group flex items-center gap-2.5 rounded-lg border border-[#30363D] bg-[#0D1117]/90 hover:bg-[#21262D] hover:border-[#58A6FF]/60 hover:shadow-[0_0_12px_rgba(88,166,255,0.12)] px-3 py-1.5 text-xs sm:text-sm text-[#9198A1] transition-all duration-150 w-52 sm:w-64 lg:w-72 justify-between shadow-sm cursor-pointer"
              aria-label="Search problems and shortcuts (⌘K)"
              title="Quick Search (⌘K)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="h-4 w-4 shrink-0 text-[#9198A1] group-hover:text-[#58A6FF] transition-colors" />
                <span className="text-xs sm:text-sm text-[#9198A1] group-hover:text-[#C9D1D9] transition-colors truncate font-medium">
                  Search challenges...
                </span>
              </div>
              <kbd className="font-mono text-xs bg-[#161B22] px-1.5 py-0.5 rounded-md border border-[#30363D] text-[#8B949E] group-hover:border-[#58A6FF]/40 group-hover:text-[#58A6FF] transition-colors shrink-0 font-semibold">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls: Solved count, Streak, Auth */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Solved Counter Pill */}
            {user && (
              <Link
                href="/quest"
                className="flex items-center gap-2 rounded-lg border border-[#238636]/50 bg-[#238636]/15 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#3FB950] hover:bg-[#238636]/25 transition-all shadow-sm"
                title="Problems Solved"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{solvedCount} Solved</span>
              </Link>
            )}

            {/* Streak Indicator */}
            {user && (
              <div
                className="hidden sm:flex items-center gap-2 rounded-lg border border-[#D29922]/50 bg-[#D29922]/15 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#F59E0B] shadow-sm"
                title="Daily Active Streak"
              >
                <Flame className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                <span>{user?.streak || 0}d</span>
              </div>
            )}

            {/* Auth Controls */}
            {user ? (
              <div className="flex items-center gap-2">
                {isGuest ? (
                  // Guest session: only show Guest Mode pill and logout (no duplicate signin/signup buttons)
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAuth('signup')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D29922]/50 bg-[#D29922]/15 text-xs sm:text-sm font-semibold text-[#F59E0B] hover:bg-[#D29922]/25 transition-all shadow-sm"
                      title="Guest Session Active — Click to save progress to cloud account"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                      <span>Guest Mode</span>
                    </button>

                    <button
                      onClick={logout}
                      className="p-1.5 rounded-lg text-[#9198A1] hover:text-[#F85149] hover:bg-[#21262D] transition-colors"
                      title="Exit session / Log out"
                      aria-label="Exit session"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  // Registered User
                  <div className="flex items-center gap-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-lg border border-[#30363D] bg-[#21262D] px-3 py-1.5 text-xs sm:text-sm text-[#E6EDF3] hover:border-[#8B949E] transition-colors font-semibold"
                    >
                      <UserIcon className="h-4 w-4 text-[#58A6FF]" />
                      <span className="max-w-[130px] truncate">{user.username}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="p-1.5 rounded-lg text-[#9198A1] hover:text-[#F85149] hover:bg-[#21262D] transition-colors"
                      title="Sign out"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Unauthenticated visitor
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('signin')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#9198A1] hover:text-[#E6EDF3] hover:bg-[#21262D] rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#238636] hover:bg-[#2EA043] rounded-lg transition-colors shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />

      {/* Real Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
      />
    </>
  );
}
