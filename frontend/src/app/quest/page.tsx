'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { persistence } from '@/lib/persistence';
import { ChapterGroup, ChallengeSummary } from '@/lib/types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Search, CheckCircle2, Circle, ArrowRight, BookOpen,
  Filter, Check, Code, Layers, SlidersHorizontal
} from 'lucide-react';

function CurriculumExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialModule = searchParams.get('module');
  const { user } = useAuth();

  const [chapters, setChapters] = useState<ChapterGroup[]>([]);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | 'all'>(
    initialModule ? parseInt(initialModule, 10) : 'all'
  );
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const chaps = await api.getChapters().catch(() => []);
        if (!user) {
          setChapters(chaps);
          setSolvedIds([]);
          return;
        }
        const localSolved = await persistence.getSolvedIds();
        const backendSolved = chaps.flatMap((c) => c.levels).filter((l) => l.passed).map((l) => l.id);
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

    const handleLogout = () => {
      setSolvedIds([]);
    };
    window.addEventListener('pyforge_auth_logout', handleLogout);
    return () => window.removeEventListener('pyforge_auth_logout', handleLogout);
  }, [user]);

  const allProblems = useMemo(() => {
    return chapters.flatMap((c) => c.levels);
  }, [chapters]);

  const totalCount = allProblems.length;
  const solvedCount = solvedIds.length;

  // Filter problems
  const filteredProblems = useMemo(() => {
    return allProblems.filter((p) => {
      const matchesModule = selectedModule === 'all' || p.chapter_id === selectedModule;
      const matchesDifficulty =
        difficultyFilter === 'all' || p.difficulty.toLowerCase() === difficultyFilter;
      const isSolved = solvedIds.includes(p.id);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'solved' && isSolved) ||
        (statusFilter === 'unsolved' && !isSolved);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.id.toString().includes(q) ||
        (p.chapter_title && p.chapter_title.toLowerCase().includes(q));

      return matchesModule && matchesDifficulty && matchesStatus && matchesSearch;
    });
  }, [allProblems, selectedModule, difficultyFilter, statusFilter, searchQuery, solvedIds]);

  return (
    <div className="flex-1 bg-[#0D1117] text-[#E6EDF3] flex flex-col min-h-0 overflow-hidden">
      {/* Top Filter Sub-bar */}
      <div className="h-14 border-b border-[#30363D] bg-[#161B22] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#8B949E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title or #..."
              className="w-full h-9 pl-9 pr-3 bg-[#0D1117] border border-[#30363D] rounded-md text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#1F6FEB]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Difficulty Dropdown */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="h-9 px-3 bg-[#0D1117] border border-[#30363D] rounded-md text-xs sm:text-sm text-[#E6EDF3] focus:outline-none focus:border-[#1F6FEB]"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 bg-[#0D1117] border border-[#30363D] rounded-md text-xs sm:text-sm text-[#E6EDF3] focus:outline-none focus:border-[#1F6FEB]"
          >
            <option value="all">All Statuses</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar (288px): Modules list with larger font */}
        <aside className="w-72 border-r border-[#30363D] bg-[#161B22] flex flex-col min-h-0 shrink-0 hidden md:flex">
          <div className="p-4 border-b border-[#30363D] flex items-center justify-between shrink-0">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8B949E]">
              Modules ({chapters.length})
            </span>
            <span className="text-xs font-mono font-semibold text-[#8B949E]">
              {solvedCount} / {totalCount} Solved
            </span>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto flex-1" aria-label="Curriculum Modules">
            <button
              onClick={() => setSelectedModule('all')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between transition-all ${
                selectedModule === 'all'
                  ? 'bg-[#21262D] text-white border border-[#30363D] shadow-sm'
                  : 'text-[#9198A1] hover:bg-[#21262D]/60 hover:text-white'
              }`}
            >
              <span>All Challenges</span>
              <span className="font-mono text-xs text-[#8B949E] font-semibold">{allProblems.length}</span>
            </button>

            {chapters.map((chap) => {
              const chapLevels = chap.levels || [];
              const chapSolved = chapLevels.filter((l) => solvedIds.includes(l.id)).length;
              const isSelected = selectedModule === chap.chapter_id;

              return (
                <button
                  key={chap.chapter_id}
                  onClick={() => setSelectedModule(chap.chapter_id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${
                    isSelected
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
              <span>
                Showing {filteredProblems.length} of {allProblems.length} problems
              </span>
              <span className="font-mono">
                {Math.round((solvedCount / (totalCount || 1)) * 100)}% Syllabus Complete
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
                {filteredProblems.length === 0 ? (
                  <div className="py-16 text-center text-sm text-[#8B949E]">
                    No challenges found matching your current filters.
                  </div>
                ) : (
                  filteredProblems.map((problem) => {
                    const isSolved = solvedIds.includes(problem.id);

                    return (
                      <div
                        key={problem.id}
                        onClick={() => router.push(`/quest/${problem.id}`)}
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

                        {/* Number */}
                        <div className="col-span-1 font-mono text-xs text-[#8B949E]">
                          {String(problem.id).padStart(2, '0')}
                        </div>

                        {/* Title */}
                        <div className="col-span-5 font-semibold text-[#E6EDF3] group-hover:text-[#58A6FF] transition-colors truncate pr-3 flex items-center gap-2">
                          <span className="truncate">{problem.title}</span>
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

