'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { persistence, isProblemSolved, getCanonicalProblemId } from '@/lib/persistence';
import { ChapterGroup } from '@/lib/types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { AuthModal } from '@/components/ui/AuthModal';
import {
  Search, CheckCircle2, Circle, ArrowRight, Zap, Lock
} from 'lucide-react';

function CurriculumExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialModule = searchParams.get('module');
  const initialTrack = searchParams.get('track');
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [chapters, setChapters] = useState<ChapterGroup[]>([]);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [activeTrack, setActiveTrack] = useState<'basics' | 'advanced' | 'all'>(
    (initialTrack as 'basics' | 'advanced' | 'all') || 'basics'
  );
  const [selectedModule, setSelectedModule] = useState<number | 'all'>(
    initialModule ? parseInt(initialModule, 10) : 'all'
  );
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Instant Cache Hydration for 0ms load speed with v3 key
    try {
      const cached = localStorage.getItem('pq_cached_chapters_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChapters(parsed);
          setLoading(false);
        }
      }
    } catch {
      // ignore
    }

    async function loadData() {
      try {
        const [chaps, localSolved] = await Promise.all([
          api.getChapters().catch(() => [] as ChapterGroup[]),
          persistence.getSolvedIds().catch(() => [] as number[]),
        ]);
        if (Array.isArray(chaps) && chaps.length > 0) {
          try {
            localStorage.setItem('pq_cached_chapters_v3', JSON.stringify(chaps));
          } catch {
            // ignore
          }
        }
        const flatLevels = (chaps || []).flatMap((c) => c.levels || []);
        const backendSolved = flatLevels.filter((l) => l.passed).map((l) => l.id);
        const merged = Array.from(new Set([...backendSolved, ...localSolved]));
        setChapters(chaps);
        setSolvedIds(merged);
      } catch (err) {
        console.error('Failed to load curriculum:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener('pyforge_auth_logout', handleRefresh);
    window.addEventListener('pyforge_auth_login', handleRefresh);
    window.addEventListener('pyforge_problem_solved', handleRefresh);
    return () => {
      window.removeEventListener('pyforge_auth_logout', handleRefresh);
      window.removeEventListener('pyforge_auth_login', handleRefresh);
      window.removeEventListener('pyforge_problem_solved', handleRefresh);
    };
  }, [user]);

  // Track-scoped chapters (Basics: 1-10, Advanced: 11-14, All: 1-14)
  const trackChapters = useMemo(() => {
    if (activeTrack === 'basics') {
      return chapters.filter((c) => c.chapter_id <= 10);
    }
    if (activeTrack === 'advanced') {
      return chapters.filter((c) => c.chapter_id >= 11);
    }
    return chapters;
  }, [chapters, activeTrack]);

  // All problems within current track scope
  const trackProblems = useMemo(() => {
    return trackChapters.flatMap((c) => c.levels);
  }, [trackChapters]);

  // Global counts for track headers
  const trackTotalCount = trackProblems.length;
  const trackSolvedCount = useMemo(() => {
    return trackProblems.filter((p) => isProblemSolved(p, solvedIds, trackProblems)).length;
  }, [trackProblems, solvedIds]);

  const allProblemsTotal = useMemo(() => chapters.flatMap((c) => c.levels), [chapters]);
  const basicsCount = useMemo(() => chapters.filter((c) => c.chapter_id <= 10).flatMap((c) => c.levels).length, [chapters]);
  const advancedCount = useMemo(() => chapters.filter((c) => c.chapter_id >= 11).flatMap((c) => c.levels).length, [chapters]);

  // Filter problems within active track
  const filteredProblems = useMemo(() => {
    return trackProblems.filter((p) => {
      const matchesModule = selectedModule === 'all' || p.chapter_id === selectedModule;
      const pDiff = (p.difficulty || 'Easy').toLowerCase();
      const matchesDifficulty =
        difficultyFilter === 'all' || pDiff === difficultyFilter;
      const isSolved = isProblemSolved(p, solvedIds, trackProblems);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'solved' && isSolved) ||
        (statusFilter === 'unsolved' && !isSolved);
      const q = searchQuery.toLowerCase().trim();
      const numStr = (p.level_number || p.id || '').toString();
      const pTitle = p.title || '';
      const pChapTitle = p.chapter_title || '';
      const matchesSearch =
        !q ||
        pTitle.toLowerCase().includes(q) ||
        numStr.includes(q) ||
        p.id.toString().includes(q) ||
        pChapTitle.toLowerCase().includes(q);

      return matchesModule && matchesDifficulty && matchesStatus && matchesSearch;
    });
  }, [trackProblems, selectedModule, difficultyFilter, statusFilter, searchQuery, solvedIds]);

  return (
    <div className="flex-1 bg-[#0D1117] text-[#E6EDF3] flex flex-col min-h-0 overflow-hidden">
      {/* Top Track Switcher & Filter Sub-bar */}
      <div className="h-auto sm:h-14 border-b border-[#30363D] bg-[#161B22] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">
        {/* Track Selector Pills (Basics vs Advanced vs All) */}
        <div className="flex items-center p-1 bg-[#0D1117] border border-[#30363D] rounded-lg shrink-0">
          <button
            onClick={() => {
              setActiveTrack('basics');
              setSelectedModule('all');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${activeTrack === 'basics'
                ? 'bg-[#238636] text-white shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Basics ({basicsCount || 50})</span>
          </button>
          <button
            onClick={() => {
              setActiveTrack('advanced');
              setSelectedModule('all');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${activeTrack === 'advanced'
                ? 'bg-[#1F6FEB] text-white shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
          >
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Advanced ({advancedCount || 20})</span>
          </button>
          <button
            onClick={() => {
              setActiveTrack('all');
              setSelectedModule('all');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTrack === 'all'
                ? 'bg-[#21262D] text-white shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
          >
            All ({allProblemsTotal.length || 70})
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="h-8.5 px-2.5 bg-[#0D1117] border border-[#30363D] rounded-md text-xs sm:text-sm text-[#E6EDF3] focus:outline-none focus:border-[#1F6FEB]"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8.5 px-2.5 bg-[#0D1117] border border-[#30363D] rounded-md text-xs sm:text-sm text-[#E6EDF3] focus:outline-none focus:border-[#1F6FEB]"
          >
            <option value="all">All Statuses</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar (288px): Modules list for active track */}
        <aside className="w-72 border-r border-[#30363D] bg-[#161B22] flex flex-col min-h-0 shrink-0 hidden md:flex">
          <div className="p-4 border-b border-[#30363D] flex items-center justify-between shrink-0">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8B949E]">
              {activeTrack === 'basics' ? 'Basics Modules' : activeTrack === 'advanced' ? 'Advanced Modules' : 'All Modules'} ({trackChapters.length})
            </span>
            <span className="text-xs font-mono font-semibold text-[#8B949E]">
              {trackSolvedCount} / {trackTotalCount} Solved
            </span>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto flex-1" aria-label="Curriculum Modules">
            <button
              onClick={() => setSelectedModule('all')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between transition-all ${selectedModule === 'all'
                  ? 'bg-[#21262D] text-white border border-[#30363D] shadow-sm'
                  : 'text-[#9198A1] hover:bg-[#21262D]/60 hover:text-white'
                }`}
            >
              <span>{activeTrack === 'basics' ? 'All Basics (50)' : activeTrack === 'advanced' ? 'All Advanced (20)' : 'All Challenges'}</span>
              <span className="font-mono text-xs text-[#8B949E] font-semibold">{trackProblems.length}</span>
            </button>

            {trackChapters.map((chap) => {
              const chapLevels = chap.levels || [];
              const chapSolved = chapLevels.filter((l) => isProblemSolved(l, solvedIds, trackProblems)).length;
              const isSelected = selectedModule === chap.chapter_id;

              return (
                <button
                  key={chap.chapter_id}
                  onClick={() => setSelectedModule(chap.chapter_id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${isSelected
                      ? 'bg-[#21262D] text-white border border-[#30363D] shadow-sm font-semibold'
                      : 'text-[#9198A1] hover:bg-[#21262D]/60 hover:text-white font-medium'
                    }`}
                >
                  <div className="truncate pr-2">
                    <div className={`truncate text-sm font-semibold ${isSelected ? 'text-white' : 'text-[#E6EDF3]'}`}>
                      {chap.chapter_title.replace(/^Module \d+:\s*/, '')}
                    </div>
                    <div className="text-xs text-[#8B949E] font-mono mt-0.5">
                      Module {chap.chapter_id}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 font-mono text-xs font-semibold">
                    {chapSolved === chapLevels.length && chapLevels.length > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-[#3FB950]" />
                    ) : (
                      <span className="text-[#8B949E]">{chapSolved}/{chapLevels.length}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Area: Dense Linear-style Data Table with Smooth Scroll */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#0D1117] p-4 sm:p-6 lg:p-8">
          <div className="w-full space-y-4">
            {/* Table Header Summary */}
            <div className="flex items-center justify-between text-xs text-[#8B949E]">
              <div className="flex items-center gap-2">
                <span>
                  Showing {filteredProblems.length} of {trackProblems.length} {activeTrack === 'basics' ? 'Basics' : activeTrack === 'advanced' ? 'Advanced' : ''} problems
                </span>
                {activeTrack === 'advanced' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#1F6FEB]/15 text-[#58A6FF] border border-[#1F6FEB]/30">
                    Advanced Track
                  </span>
                )}
              </div>
              <span className="font-mono">
                {Math.round((trackSolvedCount / (trackTotalCount || 1)) * 100)}% Section Complete
              </span>
            </div>

            {/* Dense Problem Table */}
            <div className="rounded-xl border border-[#30363D] bg-[#161B22] overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-3 border-b border-[#30363D] bg-[#161B22] text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
                <div className="col-span-1">Status</div>
                <div className="col-span-1">#</div>
                <div className="col-span-5">Title</div>
                <div className="col-span-3">Module</div>
                <div className="col-span-2 text-right">Difficulty</div>
              </div>

              <div className="divide-y divide-[#21262D]">
                {loading && filteredProblems.length === 0 ? (
                  // Sleek Shimmer Skeleton Loader for fast visual feedback
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 px-5 py-4 items-center animate-pulse">
                      <div className="col-span-1"><div className="h-4 w-4 rounded-full bg-[#21262D]" /></div>
                      <div className="col-span-1"><div className="h-3 w-6 rounded bg-[#21262D]" /></div>
                      <div className="col-span-5"><div className="h-3.5 w-48 rounded bg-[#21262D]" /></div>
                      <div className="col-span-3"><div className="h-3 w-32 rounded bg-[#21262D]" /></div>
                      <div className="col-span-2 flex justify-end"><div className="h-5 w-14 rounded-full bg-[#21262D]" /></div>
                    </div>
                  ))
                ) : filteredProblems.length === 0 ? (
                  <div className="py-16 text-center text-sm text-[#8B949E]">
                    No challenges found matching your current filters.
                  </div>
                ) : (
                  filteredProblems.map((problem) => {
                    const isSolved = isProblemSolved(problem, solvedIds, trackProblems);
                    const displayNum = problem.level_number || problem.id;
                    const isAdvanced = displayNum >= 51 || problem.chapter_id >= 11;

                    return (
                      <div
                        key={problem.id}
                        onClick={() => {
                          if (!user) {
                            setAuthModalOpen(true);
                          } else {
                            router.push(`/quest/${displayNum}`);
                          }
                        }}
                        className="grid grid-cols-12 px-5 py-3.5 items-center text-sm hover:bg-[#21262D]/60 cursor-pointer transition-colors duration-100 group"
                      >
                        {/* Status */}
                        <div className="col-span-1 flex items-center">
                          {isSolved ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-[#3FB950]" aria-label="Solved" />
                          ) : (
                            <Circle className="h-4 w-4 text-[#30363D]" aria-label="Unsolved" />
                          )}
                        </div>

                        {/* Number: Clean 01 - 70 ordering */}
                        <div className="col-span-1 font-mono text-xs text-[#8B949E] font-medium">
                          {String(displayNum).padStart(2, '0')}
                        </div>

                        {/* Title */}
                        <div className="col-span-5 font-semibold text-[#E6EDF3] group-hover:text-[#58A6FF] transition-colors truncate pr-3 flex items-center gap-2">
                          <span className="truncate">{problem.title}</span>
                          {isAdvanced && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#1F6FEB]/15 text-[#58A6FF] border border-[#1F6FEB]/30 shrink-0">
                              Advanced
                            </span>
                          )}
                        </div>

                        {/* Module */}
                        <div className="col-span-3 text-xs text-[#8B949E] truncate pr-2">
                          {problem.chapter_title?.replace(/^Module \d+:\s*/, '')}
                        </div>

                        {/* Difficulty */}
                        <div className="col-span-2 flex items-center justify-end gap-3">
                          <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                          <span className="text-[#8B949E] group-hover:text-[#E6EDF3] transition-colors hidden sm:inline-block">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="signin"
      />
    </div>
  );
}

export default function CurriculumExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-[#0D1117] flex items-center justify-center text-xs text-[#8B949E]">
          Loading curriculum explorer...
        </div>
      }
    >
      <CurriculumExplorerContent />
    </Suspense>
  );
}
