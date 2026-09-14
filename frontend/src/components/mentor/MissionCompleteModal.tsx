'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy, Sparkles, CheckCircle2, ArrowRight,
  Unlock, Award, Zap
} from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface MissionCompleteModalProps {
  problemTitle: string;
  problemId: number;
  xpReward: number;
  runtimeMs: number;
  onViewSolution: () => void;
  onNextChallenge: () => void;
  onClose: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  problemTitle,
  problemId,
  xpReward,
  runtimeMs,
  onViewSolution,
  onNextChallenge,
  onClose,
}) => {
  // Staggered unlock animation stages (1 through 6)
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    // 1. Play Synthesizer Fanfare
    soundFX.playSuccessFanfare();

    // 2. Fire dual cannon confetti
    try {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { x: 0.25, y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { x: 0.75, y: 0.6 },
        });
      }, 250);
    } catch {}

    // 3. Staggered unlock cascade
    const intervals = [300, 700, 1100, 1500, 1900, 2300];
    intervals.forEach((delay, idx) => {
      setTimeout(() => {
        setStage(idx + 1);
      }, delay);
    });
  }, []);

  const unlockedItems = [
    { id: 1, title: 'Official Optimal Solution', desc: 'Production-ready Python 3.12 reference' },
    { id: 2, title: 'Mentor Architectural Breakdown', desc: 'Conceptual deep-dive into why it works' },
    { id: 3, title: 'Ranked Interview Alternatives', desc: '4 distinct algorithmic approaches compared' },
    { id: 4, title: 'Big-O Complexity Matrix', desc: 'Time and space asymptotes evaluated' },
    { id: 5, title: 'Common Pitfalls & Edge Cases', desc: 'What top tech interviewers probe for' },
    { id: 6, title: 'Curriculum Progression Unlocked', desc: 'Next algorithmic milestone unlocked' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Background ambient glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-cyan-500/15 to-blue-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full rounded-3xl border border-emerald-500/40 bg-[#0B0F17]/95 shadow-2xl p-6 sm:p-8 text-center space-y-6 overflow-hidden">
        {/* Glowing Trophy Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#238636] to-[#161B22] border border-emerald-400/50 flex items-center justify-center shadow-xl shadow-emerald-950/80">
            <Trophy className="w-10 h-10 text-emerald-300 animate-bounce" />
          </div>
        </div>

        {/* Mission Complete Headers */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> MISSION COMPLETE
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            You conquered #{problemId}{problemTitle ? `: ${problemTitle}` : ''}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-300/90 font-medium">
            You solved it without looking at the answer.
          </p>
        </div>

        {/* Live Performance Cockpit */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#161B22]/80 border border-[#30363D] rounded-2xl p-3 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-[#8B949E]">Runtime</span>
            <div className="text-sm sm:text-base font-mono font-bold text-white flex items-center justify-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#58A6FF]" />
              <span>{runtimeMs}ms</span>
            </div>
          </div>
          <div className="space-y-0.5 border-x border-[#30363D]">
            <span className="text-[10px] font-mono uppercase text-[#8B949E]">Reward</span>
            <div className="text-sm sm:text-base font-mono font-bold text-[#D29922] flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>+{xpReward} XP</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-[#8B949E]">Status</span>
            <div className="text-sm sm:text-base font-mono font-bold text-[#3FB950] flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Passed</span>
            </div>
          </div>
        </div>

        {/* Staggered Unlock Cascade */}
        <div className="space-y-2 text-left bg-[#0D1117]/80 rounded-2xl border border-white/5 p-4 max-h-48 overflow-y-auto">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] font-semibold block">
            Vault Rewards Unlocked:
          </span>
          <div className="space-y-1.5">
            {unlockedItems.map((item, idx) => {
              const isUnlocked = stage > idx;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 text-xs transition-all duration-500 ${
                    isUnlocked
                      ? 'text-[#E6EDF3] translate-x-0 opacity-100'
                      : 'text-[#8B949E]/40 -translate-x-2 opacity-30'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    isUnlocked ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {isUnlocked ? '✓' : '•'}
                  </div>
                  <span className="font-semibold">{item.title}</span>
                  <span className="hidden sm:inline text-[11px] text-[#8B949E]">— {item.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              onViewSolution();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-[#30363D] bg-[#21262D] hover:bg-[#30363D] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span>Examine Solution Vault</span>
          </button>

          <button
            onClick={onNextChallenge}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#238636] to-[#2EA043] hover:from-[#2EA043] hover:to-[#3FB950] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
          >
            <span>Next Challenge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
