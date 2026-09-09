'use client';

import React, { useState } from 'react';
import {
  Lock, Unlock, ShieldAlert, Sparkles, Trophy, Check,
  Copy, ArrowRight, Zap, AlertTriangle, BookOpen, Clock,
  Cpu, Award, ExternalLink, HelpCircle
} from 'lucide-react';
import { ChallengeDetail } from '@/lib/types';
import { soundFX } from '@/lib/audio';
import { getProblemRankedSolutions, RankedSolution } from '@/lib/problem-intelligence';

interface SolutionVaultProps {
  problem: ChallengeDetail;
  isSolved: boolean;
  unlocked: boolean;
  hintsUsedCount: number;
  onUnlock: () => void;
  onLoadCodeToEditor: (code: string) => void;
  onSubmitCode?: () => void;
}

export const SolutionVault: React.FC<SolutionVaultProps> = ({
  problem,
  isSolved,
  unlocked,
  hintsUsedCount,
  onUnlock,
  onLoadCodeToEditor,
  onSubmitCode,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBreakingLock, setIsBreakingLock] = useState(false);
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loadedRank, setLoadedRank] = useState<number | null>(null);

  const rankedSolutions: RankedSolution[] = React.useMemo(() => {
    return getProblemRankedSolutions(problem);
  }, [problem]);

  const activeSolution = rankedSolutions.find((s) => s.rank === selectedRank) || rankedSolutions[0];

  const handleConfirmGiveUp = () => {
    setShowConfirmModal(false);
    setIsBreakingLock(true);
    soundFX.playLockBreak();

    setTimeout(() => {
      setIsBreakingLock(false);
      onUnlock();
    }, 900);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLoad = (code: string, rank: number) => {
    onLoadCodeToEditor(code);
    setLoadedRank(rank);
    setTimeout(() => setLoadedRank(null), 2500);
  };

  // 1. LOCKED VAULT VIEW
  if (!unlocked) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
        {/* Background glow orb */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500/10 via-purple-500/10 to-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full space-y-5">
          {/* Animated holographic lock */}
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-2xl bg-[#D29922]/10 border border-[#D29922]/30 ${isBreakingLock ? 'scale-150 opacity-0 transition-all duration-700' : 'animate-pulse-glow'}`} />
            <div className="relative w-14 h-14 rounded-xl bg-gradient-to-b from-[#1F242C] to-[#161B22] border border-[#30363D] flex items-center justify-center shadow-xl">
              {isBreakingLock ? (
                <Unlock className="w-7 h-7 text-emerald-400 animate-bounce" />
              ) : (
                <Lock className="w-7 h-7 text-[#D29922]" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D29922]/15 text-[#D29922] text-[11px] font-mono font-semibold border border-[#D29922]/30">
              <Lock className="w-3 h-3" /> OFFICIAL SOLUTION LOCKED
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#E6EDF3] tracking-tight">
              Submit Your Code to Unlock
            </h3>
            <p className="text-xs text-[#8B949E] leading-relaxed max-w-sm mx-auto">
              Write your logic in the editor and click <span className="text-emerald-400 font-semibold">Submit</span>. Once your solution passes all test cases, the official solution and intuitive deep-dive unlock automatically!
            </p>
          </div>

          {/* Unlock Requirements */}
          <div className="rounded-xl border border-[#21262D] bg-[#111622]/80 backdrop-blur-md p-3.5 text-left space-y-2">
            <span className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider font-semibold block">
              How to Unlock:
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#E6EDF3]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px]">
                  1
                </div>
                <span>Click <strong>Submit</strong> and pass the test cases</span>
              </div>
              <div className="flex items-center gap-2 text-[#8B949E]">
                <div className="w-4 h-4 rounded-full bg-[#21262D] text-[#8B949E] flex items-center justify-center text-[10px]">
                  2
                </div>
                <span>Or reveal if completely stuck</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {onSubmitCode && (
              <button
                onClick={onSubmitCode}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#238636] to-[#2EA043] hover:from-[#2EA043] hover:to-[#3FB950] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Submit My Code to Unlock</span>
              </button>
            )}

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#161B22] hover:bg-[#21262D] hover:border-[#DA3633]/40 text-[11px] font-medium text-[#8B949E] hover:text-[#F85149] transition-all flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#8B949E]" />
              <span>I'm Completely Stuck — Reveal Official Solution</span>
            </button>
          </div>
        </div>

        {/* High-Stakes Give Up Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="max-w-md w-full rounded-2xl border border-[#DA3633]/50 bg-[#161B22] p-6 space-y-5 shadow-2xl relative">
              <div className="w-12 h-12 rounded-full bg-[#DA3633]/20 border border-[#DA3633]/40 flex items-center justify-center mx-auto text-[#F85149]">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h4 className="text-lg font-bold text-[#E6EDF3]">
                  Are you sure you want to give up?
                </h4>
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  You only get one chance to experience the breakthrough of solving this independently. Once revealed, the solution cannot be re-locked.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-[#D29922] flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Tip: You can ask the Mentor for a progressive hint instead without forfeiting!</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 rounded-lg border border-[#30363D] bg-[#21262D] text-xs font-semibold text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
                >
                  Keep Trying
                </button>
                <button
                  onClick={handleConfirmGiveUp}
                  className="flex-1 py-2 rounded-lg bg-[#DA3633] hover:bg-[#B62324] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#DA3633]/30"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Yes, Unlock Solution</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. UNLOCKED VAULT VIEW
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6 select-text">
      {/* Unlocked Header Banner */}
      <div className="rounded-2xl border border-[#238636]/40 bg-gradient-to-r from-[#238636]/15 via-[#161B22] to-[#161B22] p-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#238636]/20 border border-[#238636]/40 flex items-center justify-center text-[#3FB950]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-[#3FB950] font-bold uppercase tracking-wider block">
              {isSolved ? '🎉 Challenge Solved by You!' : 'Official Solution Unlocked'}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-[#E6EDF3]">
              Interview Architectural Mastery
            </h4>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#21262D] border border-[#30363D] text-[#8B949E]">
          {rankedSolutions.length} Approaches
        </span>
      </div>

      {/* Solution Approach Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[#8B949E] uppercase tracking-wider font-semibold">
            Ranked Approaches for Interviews
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {rankedSolutions.map((sol) => (
            <button
              key={sol.rank}
              onClick={() => setSelectedRank(sol.rank)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                selectedRank === sol.rank
                  ? 'border-[#58A6FF] bg-[#1F6FEB]/20 text-[#E6EDF3] shadow-md shadow-[#1F6FEB]/10'
                  : 'border-[#30363D] bg-[#161B22]/60 text-[#8B949E] hover:border-[#8B949E] hover:bg-[#21262D]'
              }`}
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                sol.rank === 1 ? 'bg-[#238636]/20 text-[#3FB950] border border-[#238636]/40' : 'bg-[#21262D] text-[#8B949E]'
              }`}>
                Rank {sol.rank}
              </span>
              <span className="text-[11px] text-[#8B949E] font-normal">
                {sol.timeComplexity}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Solution Deep-Dive Card */}
      {activeSolution && (
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Solution Header & Complexities */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#30363D] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#3FB950]">
                  {activeSolution.rankBadge}
                </span>
                <span className="text-xs text-[#8B949E]">•</span>
                <span className="text-xs text-[#8B949E] font-medium font-mono">Rank #{activeSolution.rank}</span>
              </div>
              <h5 className="text-base font-bold text-[#E6EDF3] mt-0.5">
                {activeSolution.title}
              </h5>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-[#0D1117] border border-[#30363D] text-[#58A6FF] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time: {activeSolution.timeComplexity}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#0D1117] border border-[#30363D] text-[#A371F7] flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Space: {activeSolution.spaceComplexity}
              </span>
            </div>
          </div>

          {/* Code Canvas with Load/Copy buttons */}
          <div className="rounded-xl border border-[#30363D] bg-[#0D1117] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[#161B22]/80 border-b border-[#21262D] text-xs">
              <span className="font-mono text-[#8B949E] text-[11px]">Python 3.12 Solution</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(activeSolution.code)}
                  className="px-2.5 py-1 rounded-md border border-[#30363D] bg-[#21262D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#8B949E] transition-all flex items-center gap-1 text-[11px] font-medium"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleLoad(activeSolution.code, activeSolution.rank)}
                  className="px-2.5 py-1 rounded-md bg-[#1F6FEB] hover:bg-[#388BFD] text-white transition-all flex items-center gap-1 text-[11px] font-semibold shadow-md shadow-[#1F6FEB]/20"
                >
                  {loadedRank === activeSolution.rank ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  <span>{loadedRank === activeSolution.rank ? 'Loaded in Monaco!' : 'Load to Editor'}</span>
                </button>
              </div>
            </div>
            <pre className="p-4 sm:p-5 font-mono text-sm sm:text-base text-[#E6EDF3] leading-relaxed overflow-x-auto whitespace-pre selection:bg-[#58A6FF]/20">
              {activeSolution.code}
            </pre>
          </div>

          {/* 1. The Intuitive Mental Model */}
          {activeSolution.mentalModel && (
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#58A6FF] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#58A6FF]" /> The Intuitive Mental Model (The "Aha!" Concept)
              </span>
              <div className="text-sm sm:text-base text-[#E6EDF3] leading-relaxed bg-[#0D1117] p-4 sm:p-5 rounded-xl border border-[#30363D] space-y-2 shadow-inner">
                <p>{activeSolution.mentalModel}</p>
              </div>
            </div>
          )}

          {/* 2. Visual Data Flow Diagram */}
          {activeSolution.visualDiagram && (
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> How Data Moves in Memory
              </span>
              <pre className="p-4 rounded-xl bg-[#06080D] border border-white/10 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre">
                {activeSolution.visualDiagram}
              </pre>
            </div>
          )}

          {/* 3. Step-by-Step Line Breakdown */}
          {activeSolution.lineByLine && activeSolution.lineByLine.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A371F7] font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#A371F7]" /> Line-by-Line Breakdown (Zero Jargon)
              </span>
              <div className="space-y-2.5">
                {activeSolution.lineByLine.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-[#21262D] bg-[#0D1117] p-3.5 space-y-1.5 text-sm">
                    <div className="font-mono text-[#58A6FF] font-semibold bg-[#161B22] px-2.5 py-1 rounded w-fit text-xs sm:text-sm">
                      {item.line}
                    </div>
                    <p className="text-[#E6EDF3] leading-relaxed pl-1 pt-1 whitespace-pre-wrap">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Common Beginner Traps & "Why NOT do this?" */}
          {activeSolution.beginnerTraps && activeSolution.beginnerTraps.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#D29922] font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D29922]" /> Beginner Traps & "Why Not Do This?"
              </span>
              <div className="space-y-2">
                {activeSolution.beginnerTraps.map((trap, idx) => (
                  <div key={idx} className="rounded-xl border border-[#D29922]/20 bg-[#D29922]/10 p-3.5 text-sm text-[#E6EDF3] leading-relaxed">
                    {trap}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. The Golden Takeaway Rule */}
          {activeSolution.keyTakeaway && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#161B22] to-[#161B22] text-xs space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider block">
                🎯 The Golden Engineering Takeaway:
              </span>
              <p className="text-white font-medium leading-relaxed">
                "{activeSolution.keyTakeaway}"
              </p>
            </div>
          )}

          {/* 6. Interview Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-[#238636]/30 bg-[#238636]/10 p-3 text-xs space-y-1">
              <span className="font-bold text-[#3FB950] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Why Interviewers Love This
              </span>
              <p className="text-[#E6EDF3] leading-relaxed">{activeSolution.interviewPros}</p>
            </div>

            <div className="rounded-xl border border-[#D29922]/30 bg-[#D29922]/10 p-3 text-xs space-y-1">
              <span className="font-bold text-[#D29922] flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Questions Interviewers Will Ask
              </span>
              <p className="text-[#E6EDF3] leading-relaxed">{activeSolution.interviewCons}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
