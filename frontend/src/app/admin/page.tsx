'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { soundFX } from '@/lib/audio';
import { User, ChapterGroup } from '@/lib/types';
import { Shield } from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<{
    total_users: number;
    total_challenges: number;
    total_submissions: number;
    overall_pass_rate: number;
    popular_challenges: Array<{ level: number; title: string; runs: number }>;
  } | null>(null);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [chapters, setChapters] = useState<ChapterGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'challenges' | 'users'>('analytics');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, u, c] = await Promise.all([
        api.getAdminMetrics().catch(() => null),
        api.getAdminUsers().catch(() => []),
        api.getChapters().catch(() => []),
      ]);
      if (m) setMetrics(m);
      setUsersList(u);
      setChapters(c);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustUser = async (userId: number, updates: Partial<User>) => {
    soundFX.playClick();
    try {
      await api.updateAdminUser(userId, updates);
      soundFX.playSuccessFanfare();
      loadData();
    } catch (err) {
      alert('Failed to update user: ' + err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-violet-400 font-mono uppercase mb-1">
              <Shield className="h-4 w-4" /> Platform Control Center
            </div>
            <h1 className="text-3xl font-black text-white">Platform Administration</h1>
            <p className="text-xs text-zinc-400">
              Manage curriculum challenges, live telemetry metrics, and user accounts
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-1 text-xs">
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('analytics');
              }}
              className={`rounded-lg px-3.5 py-1.5 font-bold transition cursor-pointer ${
                activeTab === 'analytics' ? 'bg-violet-600 text-white' : 'text-zinc-400'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('challenges');
              }}
              className={`rounded-lg px-3.5 py-1.5 font-bold transition cursor-pointer ${
                activeTab === 'challenges' ? 'bg-violet-600 text-white' : 'text-zinc-400'
              }`}
            >
              Challenges ({metrics?.total_challenges ?? 70})
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('users');
              }}
              className={`rounded-lg px-3.5 py-1.5 font-bold transition cursor-pointer ${
                activeTab === 'users' ? 'bg-violet-600 text-white' : 'text-zinc-400'
              }`}
            >
              Users
            </button>
          </div>
        </div>

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur-xl">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Total Developers</span>
                <p className="text-2xl font-black text-white mt-1">{metrics.total_users}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur-xl">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Total Challenges</span>
                <p className="text-2xl font-black text-white mt-1">{metrics.total_challenges}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur-xl">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Code Submissions</span>
                <p className="text-2xl font-black text-white mt-1">{metrics.total_submissions}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur-xl">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Overall Pass Rate</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.overall_pass_rate}%</p>
              </div>
            </div>

            {/* Popular Challenges */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                High-Frequency Problems Tested
              </h2>
              <div className="space-y-2">
                {metrics.popular_challenges.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-300">
                      <span className="font-mono text-violet-400 mr-2">#{c.level}</span>
                      {c.title}
                    </span>
                    <span className="font-mono text-zinc-400">{c.runs} submissions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHALLENGES */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">70 Python Challenges Curriculum</h2>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden backdrop-blur-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {chapters.flatMap((c) => c.levels).map((lvl) => (
                    <tr key={lvl.id} className="hover:bg-violet-950/10 transition">
                      <td className="px-4 py-3 font-bold text-cyan-400">#{lvl.level_number}</td>
                      <td className="px-4 py-3 text-zinc-400">Module {lvl.chapter_id}</td>
                      <td className="px-4 py-3 font-sans font-bold text-white">{lvl.title}</td>
                      <td className="px-4 py-3 text-zinc-400">{lvl.difficulty}</td>
                      <td className="px-4 py-3 text-emerald-400 font-sans">
                        {lvl.passed ? '✓ Solved' : 'Available'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden backdrop-blur-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Streak</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-violet-950/10 transition">
                      <td className="px-4 py-3 font-sans font-bold text-white">
                        {u.username}
                        <span className="block font-mono text-[10px] text-zinc-500">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-violet-900/60 text-violet-300 border border-violet-700/50'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-amber-400">{u.streak}d active</td>
                      <td className="px-4 py-3 text-zinc-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          {u.role === 'user' ? (
                            <button
                              onClick={() => handleAdjustUser(u.id, { role: 'admin' })}
                              className="rounded bg-violet-500/20 border border-violet-500/40 px-2.5 py-1 text-[10px] font-bold text-violet-300 hover:bg-violet-500/40 cursor-pointer"
                              title="Promote to Administrator"
                            >
                              Make Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdjustUser(u.id, { role: 'user' })}
                              className="rounded bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                              title="Demote to Standard Developer"
                            >
                              Make User
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
