'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { sounds } from '@/lib/audio-engine';
import { useAuth } from '@/lib/auth-context';
import {
  Gift, Coins, Sparkles, Heart, Zap, Award,
  Check, ArrowRight, Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RewardModalState {
  isOpen: boolean;
  rewardType: string;
  rewardDisplay: string;
}

export default function MysteryBoxPage() {
  const { user, refreshUser, updateUserLocally } = useAuth();
  const [openingBox, setOpeningBox] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<RewardModalState>({
    isOpen: false,
    rewardType: '',
    rewardDisplay: '',
  });

  const boxes = [
    {
      id: 'BRONZE' as const,
      name: 'Bronze Cyber Crate',
      cost: 50,
      description: 'Contains standard telemetry supplies: +100-200 XP, +60-90 Coins, or +2 Hearts.',
      border: 'border-amber-700/50',
      bg: 'from-amber-950/30 to-zinc-900/80',
      glow: 'shadow-[0_0_25px_rgba(180,83,9,0.2)]',
      iconColor: 'text-amber-500',
    },
    {
      id: 'SILVER' as const,
      name: 'Silver Overdrive Crate',
      cost: 120,
      description: 'Supercharged power core drops: +300-500 XP, +150-250 Coins, or FULL 5/5 Hearts Refill.',
      border: 'border-cyan-500/50',
      bg: 'from-cyan-950/30 to-zinc-900/80',
      glow: 'shadow-[0_0_25px_rgba(34,211,238,0.25)]',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'CYBER_GOLD' as const,
      name: 'Cyber Gold Grand Matrix',
      cost: 250,
      description: 'Legendary vault loot: +1,000 XP Jackpot, +500 Coins, Full Hearts, or the exclusive Cyber Overlord Title.',
      border: 'border-yellow-500/60',
      bg: 'from-yellow-950/40 via-amber-950/30 to-zinc-900/90',
      glow: 'shadow-[0_0_35px_rgba(245,158,11,0.35)]',
      iconColor: 'text-yellow-400',
    },
  ];

  const handleOpenBox = async (boxType: 'BRONZE' | 'SILVER' | 'CYBER_GOLD', cost: number) => {
    if (!user || user.coins < cost) {
      sounds.playError();
      alert(`Insufficient Coins! You need ${cost} coins to open this crate.`);
      return;
    }

    sounds.playClick();
    setOpeningBox(boxType);

    try {
      const res = await api.openMysteryBox(boxType);
      sounds.playMysteryOpen();

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#22D3EE', '#7C3AED', '#F59E0B'],
        });
      } catch {
        // ignore
      }

      updateUserLocally({ coins: res.coins_left });
      refreshUser();

      setTimeout(() => {
        setOpeningBox(null);
        setRewardModal({
          isOpen: true,
          rewardType: res.reward_type,
          rewardDisplay: res.reward_display,
        });
      }, 700);
    } catch (err: unknown) {
      setOpeningBox(null);
      const errMsg = err instanceof Error ? err.message : 'Failed to open crate';
      alert(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white py-12 px-4 sm:px-6 lg:px-8 cyber-grid-bg">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-950/20 px-4 py-1 text-xs font-bold text-violet-300 mb-3 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
            <Gift className="h-4 w-4 text-cyan-400" /> CYBER LOOT VAULT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Mystery Crates & Supply Pods
          </h1>
          <p className="text-xs text-zinc-400 mt-2 max-w-lg mx-auto">
            Spend your hard-earned Python Quest coins to unlock hearts, experience surges, and rare runner credentials.
          </p>

          {/* User Coin Balance */}
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-black/60 px-5 py-2.5 mt-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Coins className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-bold text-zinc-300">Your Coin Balance:</span>
            <span className="font-mono text-lg font-black text-amber-400">{user?.coins ?? 100}</span>
          </div>
        </div>

        {/* Crates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {boxes.map((box) => {
            const isAffordable = (user?.coins ?? 0) >= box.cost;
            const isThisOpening = openingBox === box.id;

            return (
              <div
                key={box.id}
                className={`relative flex flex-col justify-between rounded-3xl border ${box.border} bg-gradient-to-b ${box.bg} p-6 backdrop-blur-2xl ${box.glow} transition-all duration-300 hover:-translate-y-1`}
              >
                <div>
                  {/* Chest Icon */}
                  <div
                    className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-black/50 border border-zinc-700/50 text-4xl shadow-inner ${
                      isThisOpening ? 'animate-bounce' : ''
                    }`}
                  >
                    🎁
                  </div>

                  <h3 className="text-lg font-bold text-white text-center">{box.name}</h3>
                  <p className="mt-3 text-xs text-zinc-300 leading-relaxed text-center">
                    {box.description}
                  </p>
                </div>

                {/* Price & Open Button */}
                <div className="mt-8 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs mb-3 font-mono">
                    <span className="text-zinc-400">COST:</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="h-4 w-4" /> {box.cost} Coins
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenBox(box.id, box.cost)}
                    disabled={!isAffordable || openingBox !== null}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 ${
                      isAffordable
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:opacity-90'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    }`}
                  >
                    {isThisOpening ? (
                      <span className="animate-pulse">Decrypting Matrix...</span>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isAffordable ? 'Unlock Crate' : 'Insufficient Coins'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reward Modal */}
        {rewardModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl border border-cyan-500/50 bg-[#0c121d] p-6 shadow-[0_0_50px_rgba(34,211,238,0.3)] text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.5)] text-3xl">
                ✨
              </div>

              <h3 className="text-xl font-black text-white">SUPPLY CRATE OPENED!</h3>
              <p className="mt-1 text-xs text-zinc-400">Mainframe extracted payload:</p>

              <div className="my-6 rounded-xl border border-cyan-800/40 bg-cyan-950/30 p-4 font-mono text-base font-bold text-cyan-300">
                {rewardModal.rewardDisplay}
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setRewardModal({ isOpen: false, rewardType: '', rewardDisplay: '' });
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-black font-bold text-xs transition hover:opacity-90"
              >
                Claim & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
