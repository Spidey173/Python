'use client';

import React, { useState } from 'react';
import { ExplainResponse } from '@/lib/types';
import { sounds } from '@/lib/audio-engine';
import {
  X, Sparkles, Check, Copy, Clock, Cpu, AlertTriangle,
  Lightbulb, Code, Table, ArrowRight
} from 'lucide-react';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExplainResponse | null;
  loading: boolean;
}

export default function ExplainModal({ isOpen, onClose, data, loading }: ExplainModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'dryrun' | 'complexity' | 'optimized'>('summary');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!data?.optimized_code) return;
    navigator.clipboard.writeText(data.optimized_code);
    setCopied(true);
    sounds.playCoin();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-violet-500/40 bg-[#0c0f18] shadow-[0_0_50px_rgba(124,58,237,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-violet-900/30 bg-gradient-to-r from-violet-950/60 via-zinc-900/50 to-[#0c0f18] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Copilot AI Code Inspector
                <span className="rounded-full bg-cyan-950/70 border border-cyan-700/40 px-2 py-0.5 text-[10px] text-cyan-300 font-mono uppercase tracking-wider">
                  Deep Analysis
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Line-by-line breakdown, complexity analysis, and dry-run execution trace
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/40 px-6 pt-2 gap-2">
          {[
            { id: 'summary', label: 'Overview & Lines', icon: Lightbulb },
            { id: 'dryrun', label: 'Dry Run Simulator', icon: Table },
            { id: 'complexity', label: 'Complexity & Traps', icon: Cpu },
            { id: 'optimized', label: 'Optimized Code', icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-950/40 border border-violet-700/50 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                <Sparkles className="h-8 w-8 text-cyan-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Synthesizing Code Breakdown...</p>
                <p className="text-xs text-zinc-400">Parsing AST, tracing variable states, evaluating Big-O</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* TAB 1: SUMMARY & LINE-BY-LINE */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Beginner Summary Card */}
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4" /> Beginner Friendly Summary
                    </h3>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {data.beginner_summary}
                    </p>
                  </div>

                  {/* Line by Line Breakdown */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Line-By-Line Inspection
                    </h3>
                    <div className="space-y-2">
                      {data.line_by_line?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-xs"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-zinc-500 w-8">L{item.line}</span>
                            <code className="rounded bg-black/60 px-2 py-1 font-mono text-cyan-300 border border-zinc-800">
                              {item.code}
                            </code>
                          </div>
                          <div className="hidden sm:block text-zinc-600">→</div>
                          <div className="text-zinc-300 flex-1">
                            {item.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DRY RUN SIMULATOR */}
              {activeTab === 'dryrun' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Variable State Trace Table
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Step-by-step memory snapshot showing variable alterations during execution
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
                          <th className="px-4 py-3 font-semibold">Step</th>
                          <th className="px-4 py-3 font-semibold">Executed Action</th>
                          <th className="px-4 py-3 font-semibold">Variables in Memory</th>
                          <th className="px-4 py-3 font-semibold">Output Emitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {data.dry_run_trace?.map((step) => (
                          <tr key={step.step} className="hover:bg-violet-950/10 transition">
                            <td className="px-4 py-3 text-violet-400 font-bold">#{step.step}</td>
                            <td className="px-4 py-3 text-zinc-200">{step.action}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(step.variables || {}).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="rounded bg-zinc-900 border border-zinc-700/60 px-1.5 py-0.5 text-[11px] text-cyan-300"
                                  >
                                    {k}: <span className="text-amber-300">{v}</span>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">
                              {step.output || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: COMPLEXITY & TRAPS */}
              {activeTab === 'complexity' && (
                <div className="space-y-6">
                  {/* Big-O Badges */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-violet-800/40 bg-violet-950/20 p-4">
                      <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Clock className="h-4 w-4" /> Time Complexity
                      </div>
                      <p className="font-mono text-base font-bold text-white">
                        {data.time_complexity}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Theoretical operations scaling as input size N grows.
                      </p>
                    </div>

                    <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-4">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Cpu className="h-4 w-4" /> Space Complexity
                      </div>
                      <p className="font-mono text-base font-bold text-white">
                        {data.space_complexity}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Auxiliary memory allocated for collections and recursion.
                      </p>
                    </div>
                  </div>

                  {/* Common Traps */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Common Mistakes & Traps to Avoid
                    </h3>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {data.common_mistakes?.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Better Approach */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4" /> Recommended Idiomatic Approach
                    </h3>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {data.better_approach}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: OPTIMIZED CODE */}
              {activeTab === 'optimized' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Clean Idiomatic Python Solution
                    </h3>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 rounded-lg border border-violet-600/40 bg-violet-600/20 px-3 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-600/40 transition"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>

                  <div className="relative rounded-xl border border-zinc-800 bg-black/80 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <pre>{data.optimized_code}</pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-zinc-500 text-sm py-12">
              No analysis available. Click "Explain" in the editor toolbar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
