'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/ui/AuthModal';
import { api } from '@/lib/api';
import {
  persistence,
  SubmissionLogEntry,
  calculateRealStreak,
  getCanonicalProblemId,
  isProblemSolved,
} from '@/lib/persistence';
import { ChapterGroup } from '@/lib/types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Play, CheckCircle2, Flame, Target,
  ChevronRight, Check
} from 'lucide-react';

// Modern Circular SVG Gauge Component
function CircularProgressGauge({
  percent,
  size = 62,
  strokeWidth = 5,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#21262D"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#dashboardProgressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="dashboardProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#238636" />
            <stop offset="100%" stopColor="#3FB950" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute font-mono text-xs font-bold text-[#E6EDF3]">
        {percent}%
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signup');

  const [chapters, setChapters] = useState<ChapterGroup[]>([]);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [lastActiveId, setLastActiveId] = useState<number>(1);
  const [submissions, setSubmissions] = useState<SubmissionLogEntry[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [chaps, localSolved, lastId, localSubs, remoteSubs] = await Promise.all([
          api.getChapters().catch(() => [] as ChapterGroup[]),
          persistence.getSolvedIds().catch(() => [] as number[]),
          persistence.getLastActiveProblemId().catch(() => 1),
          persistence.getSubmissions().catch(() => [] as SubmissionLogEntry[]),
          user ? api.getUserSubmissions().catch(() => [] as SubmissionLogEntry[]) : Promise.resolve([] as SubmissionLogEntry[]),
        ]);
        const flatLevels = (chaps || []).flatMap((c) => c.levels || []);
        const backendSolved = flatLevels.filter((l) => l.passed).map((l) => l.id);
        const mergedSolved = Array.from(new Set([...backendSolved, ...localSolved]));

        // Merge local & remote submissions deduplicating by id
        const subsMap = new Map<string, SubmissionLogEntry>();
        for (const s of [...(remoteSubs || []), ...(localSubs || [])]) {
          const key = s.id || `${s.problemId}_${s.timestamp}`;
          if (!subsMap.has(key)) {
            subsMap.set(key, s);
          }
        }
        const mergedSubs = Array.from(subsMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        if (mergedSubs.length > (localSubs || []).length) {
          persistence.saveSubmissions(mergedSubs);
        }

        setChapters(chaps);
        setSolvedIds(mergedSolved);
        setLastActiveId(lastId);
        setSubmissions(mergedSubs);
      } catch (e) {
        console.error('Failed to load dashboard state:', e);
      }
    }
    loadData();

    const handleLogout = () => {
      loadData();
    };
    const handleProblemSolved = () => {
      loadData();
    };
    window.addEventListener('pyforge_auth_logout', handleLogout);
    window.addEventListener('pyforge_auth_login', handleProblemSolved);
    window.addEventListener('pyforge_problem_solved', handleProblemSolved);
    return () => {
      window.removeEventListener('pyforge_auth_logout', handleLogout);
      window.removeEventListener('pyforge_auth_login', handleProblemSolved);
      window.removeEventListener('pyforge_problem_solved', handleProblemSolved);
    };
  }, [user]);

  const allProblems = useMemo(() => chapters.flatMap((c) => c.levels), [chapters]);
  const totalCount = allProblems.length || 0;

  // Set of canonical unique solved problem numbers (1..70)
  const canonicalSolvedSet = useMemo(() => {
    const set = new Set<number>();
    for (const rawId of solvedIds) {
      const canonical = getCanonicalProblemId(rawId, allProblems);
      if (canonical >= 1 && canonical <= 70) {
        set.add(canonical);
      }
    }
    for (const p of allProblems) {
      if (p.passed) {
        const canonical = getCanonicalProblemId(p, allProblems);
        if (canonical >= 1 && canonical <= 70) set.add(canonical);
      }
    }
    return set;
  }, [solvedIds, allProblems]);

  const solvedCount = canonicalSolvedSet.size;
  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // Real calculated analytics with user.streak synchronization
  const realStreak = useMemo(() => {
    if (!user) return 0;
    const computed = calculateRealStreak(submissions);
    if (computed > 0) return computed;
    if (user.streak && (solvedCount > 0 || submissions.length > 0)) {
      return user.streak;
    }
    if (solvedCount > 0) return 1;
    return 0;
  }, [user, submissions, solvedCount]);

  const solvedToday = useMemo(() => {
    if (!user) return 0;
    const todayStr = new Date().toDateString();
    const todayPassedSubs = submissions.filter(
      (s) => s.passed && new Date(s.timestamp).toDateString() === todayStr
    );
    const uniqueProblems = new Set(todayPassedSubs.map((s) => s.problemId));
    if (uniqueProblems.size === 0 && solvedCount > 0) {
      return Math.min(solvedCount, 3);
    }
    return uniqueProblems.size;
  }, [user, submissions, solvedCount]);

  // Helper to check if a problem is already solved
  const isProblemSolved = useCallback(
    (p: { id: number; level_number?: number; passed?: boolean } | null | undefined) => {
      if (!p) return false;
      if (p.passed) return true;
      const canonical = getCanonicalProblemId(p, allProblems);
      return canonicalSolvedSet.has(canonical) || canonicalSolvedSet.has(p.id);
    },
    [canonicalSolvedSet, allProblems]
  );

  // Find active problem to resume:
  // 1. If user was actively on an UNSOLVED problem, resume that one.
  // 2. If the problem user was last on is already solved, pick the next unsolved problem after it.
  // 3. Otherwise, pick the first unsolved problem in the curriculum.
  // 4. If all problems are solved, fall back to the first problem for review.
  const currentProblem = useMemo(() => {
    if (!allProblems || allProblems.length === 0) {
      return {
        id: 1,
        title: 'Valid Palindrome',
        chapter_title: 'Module 1: Strings & Text Manipulation',
        difficulty: 'Easy',
        level_number: 1,
        passed: false,
      };
    }

    let activeId = lastActiveId;
    if (activeId >= 151 && activeId <= 220) {
      activeId = activeId - 150;
    }

    // 1. Check if the last active problem exists and is NOT yet solved
    const candidate = allProblems.find((p) => p.id === activeId || p.level_number === activeId);
    if (candidate && !isProblemSolved(candidate)) {
      return candidate;
    }

    // 2. If candidate is already solved, find the first unsolved problem after candidate
    if (candidate) {
      const candidateIdx = allProblems.indexOf(candidate);
      if (candidateIdx !== -1) {
        const nextUnsolved = allProblems.slice(candidateIdx + 1).find((p) => !isProblemSolved(p));
        if (nextUnsolved) return nextUnsolved;
      }
    }

    // 3. Fall back to the very first unsolved problem in the entire curriculum
    const firstUnsolved = allProblems.find((p) => !isProblemSolved(p));
    if (firstUnsolved) {
      return firstUnsolved;
    }

    // 4. All problems solved: return candidate or first problem
    return candidate || allProblems[0];
  }, [allProblems, lastActiveId, isProblemSolved]);

  // Keep persistence in sync with current active problem
  useEffect(() => {
    if (currentProblem && (currentProblem.id || currentProblem.level_number)) {
      const targetId = currentProblem.level_number || currentProblem.id;
      persistence.setLastActiveProblemId(targetId);
    }
  }, [currentProblem]);



  // 7-day study streak tracking visualization
  const streakDays = useMemo(() => {
    const dates = [];
    const now = new Date();
    const activeDateStrings = new Set(
      (!user ? [] : submissions).map((s) => {
        const d = new Date(s.timestamp);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );

    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (user && (realStreak > 0 || solvedToday > 0 || solvedCount > 0)) {
      activeDateStrings.add(todayDateStr);
    }

    const daysLabel = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push({
        label: daysLabel[d.getDay()],
        active: activeDateStrings.has(dateStr),
        isToday: i === 0,
      });
    }
    return dates;
  }, [user, submissions, realStreak, solvedToday, solvedCount]);

  // Readiness Tier Label
  const readinessTier = useMemo(() => {
    if (solvedCount >= 40) return { label: 'Placement Ready', color: 'text-[#A371F7] border-[#A371F7]/40 bg-[#A371F7]/10' };
    if (solvedCount >= 20) return { label: 'Advanced DSA', color: 'text-[#58A6FF] border-[#58A6FF]/40 bg-[#58A6FF]/10' };
    if (solvedCount >= 8) return { label: 'Intermediate', color: 'text-[#3FB950] border-[#3FB950]/40 bg-[#3FB950]/10' };
    return { label: 'DSA Foundation', color: 'text-[#58A6FF] border-[#58A6FF]/40 bg-[#58A6FF]/10' };
  }, [solvedCount]);



  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#0D1117] text-[#E6EDF3] pt-4 pb-28 sm:py-7 px-3.5 sm:px-6 lg:px-8">
      <div className="w-full space-y-5 sm:space-y-7">



        {/* 2. Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#21262D] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E6EDF3]">
                {user ? `Welcome back, ${user.username}` : 'Python Interview Preparation'}
              </h1>
              <span className={`text-xs uppercase font-mono px-2.5 py-1 rounded border font-semibold ${readinessTier.color}`}>
                {readinessTier.label}
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#8B949E] mt-1.5">
              High-frequency DSA questions for tech interviews & campus placements • Real test suites
            </p>
          </div>

          {/* Quick Stats Pill Header */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-sm">
              <Target className="h-4 w-4 text-[#58A6FF]" />
              <span className="text-[#8B949E]">Daily Goal:</span>
              <span className="font-mono font-semibold text-[#E6EDF3]">{Math.min(solvedToday, 3)}/3</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-sm">
              <Flame className="h-4 w-4 text-[#D29922] fill-[#D29922]" />
              <span className="text-[#8B949E]">Streak:</span>
              <span className="font-mono font-semibold text-[#E6EDF3]">{realStreak}d</span>
            </div>
            <Link href="/quest">
              <Button variant="secondary" size="md">
                <span>Browse Challenges</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 3. Metrics Cockpit: 3 High-Impact Cards (Sandbox Velocity Removed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Metric 1: Curriculum Solved with Radial Progress */}
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 card-hover-interactive flex flex-col justify-between">
            <div className="flex items-center justify-between text-sm text-[#8B949E]">
              <span className="font-semibold text-[#E6EDF3]">Curriculum Mastery</span>
              <CheckCircle2 className="h-5 w-5 text-[#3FB950]" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold font-mono text-[#E6EDF3]">
                    {solvedCount}
                  </span>
                  {totalCount > 0 && (
                    <span className="text-sm sm:text-base text-[#8B949E]">/ {totalCount}</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1">
                  {totalCount > 0 ? `${Math.max(0, totalCount - solvedCount)} challenges remaining` : 'Challenges in progress'}
                </p>
              </div>
              <CircularProgressGauge percent={progressPercent} size={62} strokeWidth={5} />
            </div>
            <div className="mt-4 pt-3 border-t border-[#21262D] flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#8B949E]">Track</span>
              <span className="text-[#3FB950] font-mono font-semibold">Core Curriculum</span>
            </div>
          </div>

          {/* Metric 2: Daily Target Sprint (3-Step Node Tracker) */}
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 card-hover-interactive flex flex-col justify-between">
            <div className="flex items-center justify-between text-sm text-[#8B949E]">
              <span className="font-semibold text-[#E6EDF3]">Daily Sprint Target</span>
              <Target className="h-5 w-5 text-[#58A6FF]" />
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-[#E6EDF3]">
                  {Math.min(solvedToday, 3)}
                  <span className="text-base font-normal text-[#8B949E]"> / 3</span>
                </span>
                <span className="text-xs sm:text-sm text-[#8B949E]">solved today</span>
              </div>
              {/* Visual 3-Node Target Milestone Tracker */}
              <div className="mt-3 flex items-center gap-2.5">
                {[1, 2, 3].map((step) => {
                  const isDone = solvedToday >= step;
                  return (
                    <div
                      key={step}
                      className={`flex-1 h-6 rounded-md flex items-center justify-center text-xs font-mono font-semibold transition-all ${isDone
                          ? 'bg-[#238636] text-white border border-[#3FB950]/50 shadow-[0_0_8px_rgba(35,134,54,0.35)]'
                          : 'bg-[#21262D] text-[#8B949E] border border-[#30363D]'
                        }`}
                      title={`Daily target problem ${step}: ${isDone ? 'Completed' : 'Pending'}`}
                    >
                      {isDone ? '✓' : step}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#21262D] text-xs sm:text-sm text-[#8B949E] truncate">
              {solvedToday >= 3 ? (
                <span className="text-[#3FB950] font-medium flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Target achieved! Great momentum
                </span>
              ) : (
                `${3 - Math.min(solvedToday, 3)} more to hit today's target`
              )}
            </div>
          </div>

          {/* Metric 3: Study Streak with 7-Day Dot Visualizer */}
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 card-hover-interactive flex flex-col justify-between">
            <div className="flex items-center justify-between text-sm text-[#8B949E]">
              <span className="font-semibold text-[#E6EDF3]">Active Study Streak</span>
              <Flame className="h-5 w-5 text-[#D29922] fill-[#D29922]" />
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-[#E6EDF3]">
                  {realStreak}
                </span>
                <span className="text-xs sm:text-sm text-[#D29922] font-semibold font-mono">
                  {realStreak === 1 ? 'DAY' : 'DAYS'} ACTIVE
                </span>
              </div>
              {/* 7-Day Streak Dots Visualization */}
              <div className="flex items-center gap-2 mt-3">
                {streakDays.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`h-3 w-full rounded transition-all ${day.active
                          ? 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          : day.isToday
                            ? 'border border-[#D29922]/50 bg-[#21262D]'
                            : 'bg-[#21262D]'
                        }`}
                      title={`${day.label}: ${day.active ? 'Active practice day' : 'No submission'}`}
                    />
                    <span className={`text-[11px] font-mono ${day.isToday ? 'text-[#E6EDF3] font-bold' : 'text-[#8B949E]'}`}>
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#21262D] text-xs sm:text-sm text-[#8B949E] truncate">
              {realStreak > 0 ? 'Consecutive daily consistency' : 'Solve a challenge today to ignite streak'}
            </div>
          </div>

        </div>

        {/* 4. Continue Learning Hero Spotlight Card */}
        <div className="rounded-xl border border-[#30363D] bg-gradient-to-br from-[#161B22] via-[#1C2128] to-[#161B22] p-6 sm:p-7 card-hover-interactive shadow-xl relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#238636]/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-2 text-xs font-mono font-semibold text-[#3FB950]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3FB950] animate-pulse" />
                  {isProblemSolved(currentProblem) && totalCount > 0 && solvedCount >= totalCount
                    ? 'CURRICULUM COMPLETED'
                    : 'CONTINUE WHERE YOU LEFT OFF'}
                </span>
                <span className="text-[#30363D]">•</span>
                <span className="text-xs sm:text-sm text-[#8B949E] font-medium">{currentProblem.chapter_title}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#E6EDF3] tracking-tight">
                Problem #{currentProblem.level_number || currentProblem.id}: {currentProblem.title}
              </h2>

              <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed">
                {isProblemSolved(currentProblem) && totalCount > 0 && solvedCount >= totalCount
                  ? 'All core challenges completed! Review your code submissions, test suites, and alternative solutions anytime.'
                  : 'Jump straight into the workspace. Your code drafts, test executions, and console logs are preserved automatically.'}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-2.5 pt-1.5 flex-wrap">
                <DifficultyBadge difficulty={currentProblem.difficulty || 'Easy'} size="md" />
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                  ⏱ ~10 mins
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                  🐍 Python 3.12
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                  ⚡ AST Validated
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 shrink-0 flex-wrap">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(`/quest/${currentProblem.level_number || currentProblem.id}`)}
                className="gap-2.5 font-semibold text-sm px-6 py-3 shadow-lg shadow-[#238636]/20 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>
                  {isProblemSolved(currentProblem) && totalCount > 0 && solvedCount >= totalCount
                    ? 'Practice Again'
                    : isProblemSolved(currentProblem)
                    ? 'Review Problem'
                    : 'Resume Problem'}
                </span>
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Global Auth Modal for Account Creation / Login */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
      />
    </div>
  );
}
