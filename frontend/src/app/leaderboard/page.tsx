'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { sounds } from '@/lib/audio-engine';
import { LeaderboardEntry } from '@/lib/types';
import { Trophy, Medal, Crown, Star, Flame, Zap } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'weekly'>('global');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#080808] text-white py-12 px-4 sm:px-6 lg:px-8 cyber-grid-bg">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/20 px-4 py-1 text-xs font-bold text-amber-400 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Trophy className="h-4 w-4" /> GLOBAL RUNNER ARCHIVES
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Cyber Hall of Fame
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            Top Python hackers ranked by algorithmic XP, total stars, and daily streaks
          </p>

          {/* Filter Tabs */}
          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950/80 p-1 mt-6 text-xs">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('global');
              }}
              className={`rounded-lg px-4 py-1.5 font-bold transition ${
                activeTab === 'global'
                  ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All-Time Legends
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('weekly');
              }}
              className={`rounded-lg px-4 py-1.5 font-bold transition ${
                activeTab === 'weekly'
                  ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Weekly Sprint
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="mt-4 text-xs font-mono text-zinc-400">Scanning neural scores...</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-12 items-end">
                {/* Silver (Rank 2) */}
                <div className="relative rounded-2xl border border-zinc-400/30 bg-gradient-to-b from-zinc-800/60 to-zinc-950/80 p-4 text-center backdrop-blur-xl shadow-lg order-1">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-300 text-black font-black text-sm mb-2 shadow-[0_0_15px_rgba(212,212,216,0.5)]">
                    #2
                  </div>
                  <h3 className="font-bold text-sm text-white truncate">{topThree[1]?.username}</h3>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">LVL {topThree[1]?.level}</p>
                  <div className="mt-2 text-xs font-bold text-violet-300 font-mono">
                    {topThree[1]?.xp} XP
                  </div>
                </div>

                {/* Gold (Rank 1) */}
                <div className="relative rounded-2xl border border-amber-500/50 bg-gradient-to-b from-amber-950/40 via-zinc-900/90 to-black p-6 text-center backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.25)] order-2 scale-105">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                    <Crown className="h-5 w-5 fill-black" />
                  </div>
                  <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black text-xl mb-3 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                    #1
                  </div>
                  <h3 className="font-black text-base text-white truncate">{topThree[0]?.username}</h3>
                  <p className="text-xs font-mono text-amber-300 mt-1">LVL {topThree[0]?.level}</p>
                  <div className="mt-3 text-sm font-black text-amber-400 font-mono">
                    {topThree[0]?.xp} XP
                  </div>
                </div>

                {/* Bronze (Rank 3) */}
                <div className="relative rounded-2xl border border-amber-800/30 bg-gradient-to-b from-amber-950/30 to-zinc-950/80 p-4 text-center backdrop-blur-xl shadow-lg order-3">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-white font-black text-sm mb-2 shadow-[0_0_15px_rgba(180,83,9,0.5)]">
                    #3
                  </div>
                  <h3 className="font-bold text-sm text-white truncate">{topThree[2]?.username}</h3>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">LVL {topThree[2]?.level}</p>
                  <div className="mt-2 text-xs font-bold text-violet-300 font-mono">
                    {topThree[2]?.xp} XP
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden backdrop-blur-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Cyber Runner</th>
                    <th className="px-5 py-3">Level</th>
                    <th className="px-5 py-3">Stars</th>
                    <th className="px-5 py-3">Streak</th>
                    <th className="px-5 py-3 text-right">Total XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {leaderboard.map((user) => (
                    <tr
                      key={user.user_id}
                      className="hover:bg-violet-950/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold font-mono text-zinc-400">
                        #{user.rank}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-950 border border-violet-700/50 text-xs">
                          🐍
                        </div>
                        <span>{user.username}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-cyan-300">
                        LVL {user.level}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{user.stars}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-orange-400 font-mono font-bold">
                          <Flame className="h-3.5 w-3.5" />
                          <span>{user.streak}d</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-black text-violet-400">
                        {user.xp.toLocaleString()} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
