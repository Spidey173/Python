'use client';

import React, { useEffect } from 'react';
import { sounds } from '@/lib/audio-engine';
import { CodeSubmitResponse } from '@/lib/types';
import { Heart, RotateCcw, HelpCircle, Gift } from 'lucide-react';
import Link from 'next/link';

interface FailureModalProps {
  isOpen: boolean;
  data: CodeSubmitResponse | null;
  onClose: () => void;
  onAskTutor: () => void;
}

export default function FailureModal({ isOpen, data, onClose, onAskTutor }: FailureModalProps) {
  useEffect(() => {
    if (isOpen) {
      sounds.playError();
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const livesLeft = data.lives_remaining;
  const isOutOfLives = livesLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/50 bg-[#140b10] p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center overflow-hidden">
        {/* Header Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 shadow-[0_0_25px_rgba(239,68,68,0.5)]">
          <Heart className="h-8 w-8 text-white fill-white" />
        </div>

        <h2 className="text-2xl font-black tracking-wider text-white">
          TEST VERIFICATION FAILED
        </h2>
        <p className="mt-1 text-xs text-rose-400 font-medium">
          The mainframe security protocol detected an anomaly in output.
        </p>

        {/* Lives Count Tracker */}
        <div className="my-5 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4">
          <p className="text-xs text-zinc-400 mb-2 font-semibold">HEARTS REMAINING</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((h) => {
              const isAlive = h <= livesLeft;
              return (
                <Heart
                  key={h}
                  className={`h-6 w-6 transition-all duration-300 ${
                    isAlive
                      ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      : 'fill-zinc-800 text-zinc-700'
                  }`}
                />
              );
            })}
          </div>
          {isOutOfLives && (
            <p className="mt-2 text-xs font-bold text-rose-400">
              ⚠️ Out of lives! Refill hearts via Mystery Box with coins to continue.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {!isOutOfLives ? (
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 py-3 font-bold text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] transition hover:opacity-90 active:scale-98"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Challenge</span>
            </button>
          ) : (
            <Link
              href="/mystery-box"
              onClick={() => sounds.playClick()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-3 font-bold text-black shadow-[0_0_25px_rgba(245,158,11,0.4)] transition hover:opacity-90 active:scale-98"
            >
              <Gift className="h-4 w-4" />
              <span>Open Mystery Box for Hearts</span>
            </Link>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
              onAskTutor();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-600/40 bg-violet-950/30 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-violet-900/40 transition"
          >
            <HelpCircle className="h-4 w-4 text-cyan-400" />
            <span>Ask Byte (AI Tutor) for Guidance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
