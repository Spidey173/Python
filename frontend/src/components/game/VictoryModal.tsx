'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/audio-engine';
import { CodeSubmitResponse } from '@/lib/types';
import { Star, Zap, Coins, Flame, ArrowRight, RotateCcw, Trophy, Award } from 'lucide-react';
import Link from 'next/link';

interface VictoryModalProps {
  isOpen: boolean;
  data: CodeSubmitResponse | null;
  onClose: () => void;
  onNext: () => void;
}

export default function VictoryModal({ isOpen, data, onClose, onNext }: VictoryModalProps) {
  useEffect(() => {
    if (isOpen) {
      sounds.playVictory();

      // Confetti burst
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#22D3EE', '#10B981', '#F59E0B'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/50 bg-[#0c131a] p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Header Badge */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
          <Trophy className="h-8 w-8 text-black" />
        </div>

        <h2 className="text-2xl font-black tracking-wider text-white">
          {data.boss_defeated ? 'BOSS DESTROYED!' : 'LEVEL CLEARED!'}
        </h2>
        <p className="mt-1 text-xs text-emerald-400 font-medium">
          Mainframe Security Overridden Successfully
        </p>

        {/* Stars Display */}
        <div className="my-5 flex items-center justify-center gap-2">
          {[1, 2, 3].map((starNum) => {
            const isEarned = starNum <= data.stars_earned;
            return (
              <div
                key={starNum}
                className={`transition-all duration-500 transform ${
                  isEarned
                    ? 'scale-110 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                    : 'text-zinc-700'
                }`}
              >
                <Star className={`h-8 w-8 ${isEarned ? 'fill-amber-400' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Reward Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5 text-left">
          <div className="rounded-xl border border-violet-800/40 bg-violet-950/20 p-3">
            <div className="flex items-center gap-1.5 text-xs text-violet-400 font-bold">
              <Zap className="h-4 w-4" /> XP GAINED
            </div>
            <p className="mt-1 font-mono text-xl font-black text-white">
              +{data.xp_earned}
            </p>
            {data.speed_bonus > 0 && (
              <span className="text-[10px] text-cyan-400">+{data.speed_bonus} Speed Bonus</span>
            )}
          </div>

          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
              <Coins className="h-4 w-4" /> COINS LOOTED
            </div>
            <p className="mt-1 font-mono text-xl font-black text-amber-400">
              +{data.coins_earned}
            </p>
            {data.combo_bonus > 0 && (
              <span className="text-[10px] text-orange-400">+{data.combo_bonus} Combo Bonus</span>
            )}
          </div>
        </div>

        {/* Level Up Notification */}
        {data.level_up && (
          <div className="mb-5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 p-3 text-cyan-200 text-xs flex items-center justify-center gap-2">
            <Award className="h-4 w-4 text-cyan-400" />
            <span className="font-bold">LEVEL UP! Reached Level {data.new_level}!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {data.next_challenge_id ? (
            <button
              onClick={() => {
                sounds.playClick();
                onNext();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-bold text-black shadow-[0_0_25px_rgba(16,185,129,0.4)] transition hover:opacity-90 active:scale-98"
            >
              <span>Next Challenge</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/quest"
              onClick={() => sounds.playClick()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-bold text-black shadow-[0_0_25px_rgba(16,185,129,0.4)] transition hover:opacity-90 active:scale-98"
            >
              <span>Return to Quest Map</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Review Code & Output</span>
          </button>
        </div>
      </div>
    </div>
  );
}
