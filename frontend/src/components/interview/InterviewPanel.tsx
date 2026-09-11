'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Check,
  Copy,
  Building2,
  Volume2,
  ChevronDown,
  ChevronUp,
  Search,
  Code,
  X,
  Maximize2,
  Lock
} from 'lucide-react';
import { ChallengeDetail } from '@/lib/types';
import { getProblemStudyData } from '@/lib/interview-engine';
import { soundFX } from '@/lib/audio';

interface InterviewPanelProps {
  problem: ChallengeDetail;
  isSolved?: boolean;
  onClose?: () => void;
}

type TabType = 'interview' | 'mistakes';

export const InterviewPanel: React.FC<InterviewPanelProps> = ({ problem, isSolved = false, onClose }) => {
  const data = getProblemStudyData(problem);
  const [activeTab, setActiveTab] = useState<TabType>('interview');
  const [isOpen, setIsOpen] = useState(true);

  // Interview Q&A State
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAnswerId, setCopiedAnswerId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedQA, setExpandedQA] = useState<Record<string, boolean>>({
    q1: true,
    q2: true,
    q3: true,
    q4: true,
    q5: true,
    q6: true,
    q7: true,
    'fallback-q1': true,
  });

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswerId(id);
    soundFX.playHintDing();
    setTimeout(() => setCopiedAnswerId(null), 2000);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    soundFX.playHintDing();
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const toggleQA = (id: string) => {
    setExpandedQA((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Filter questions by search
  const filteredQuestions = data.questions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.bestReplyScript.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Strictly lock Interview Q&A if challenge has not been solved/submitted
  if (!isSolved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
        <div className="w-full max-w-lg flex flex-col items-center justify-center p-8 bg-[#0D1117] border border-[#30363D] rounded-2xl shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-purple-500/10 via-amber-500/10 to-blue-500/10 blur-3xl pointer-events-none" />

          {/* Holographic Lock */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1F242C] to-[#161B22] border border-[#30363D] flex items-center justify-center shadow-xl">
            <Lock className="w-8 h-8 text-[#D29922]" />
          </div>

          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D29922]/15 text-[#D29922] text-[11px] font-mono font-semibold border border-[#D29922]/30">
              <Lock className="w-3 h-3" /> INTERVIEW PREP HUB LOCKED
            </span>
            <h3 className="text-xl font-bold text-[#F0F6FC] tracking-tight">
              Submit Your Code to Unlock
            </h3>
            <p className="text-xs text-[#8B949E] leading-relaxed max-w-sm mx-auto">
              Unlock 15+ spoken interview scripts, CPython internals, and rookie pitfalls once your code passes all test suites!
            </p>
          </div>

          {/* Unlock Requirements */}
          <div className="relative z-10 w-full rounded-xl border border-[#21262D] bg-[#161B22]/80 backdrop-blur-md p-4 text-left space-y-2.5">
            <span className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider font-semibold block">
              How to Unlock:
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-[#E6EDF3]">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold">
                  1
                </div>
                <span>Implement your solution in <strong>solution.py</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-[#E6EDF3]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">
                  2
                </div>
                <span>Click <strong>Submit</strong> and pass all test cases</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full pt-1">
            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-xl bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-xs font-bold text-[#F0F6FC] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Back to Code Editor</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0D1117] text-[#C9D1D9]">
        <div className="p-4 rounded-2xl bg-[#161B22] border border-[#30363D] max-w-md space-y-4 shadow-xl">
          <MessageSquare className="w-10 h-10 text-[#58A6FF] mx-auto" />
          <h3 className="text-lg font-bold text-[#F0F6FC]">Interview & Common Mistakes Hub</h3>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            15+ high-yield spoken interview Q&As and rookie mistake traps ready in full-screen modal mode.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="w-full py-2.5 rounded-xl bg-[#58A6FF] hover:bg-[#4F8CFF] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Open Full-Screen Interview Hub</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-text font-sans">
      {/* Main Full-Screen Modal Window */}
      <div className="w-full max-w-6xl h-[92vh] flex flex-col bg-[#0D1117] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Top Header Bar with Close Button */}
        <div className="px-5 py-3.5 border-b border-[#30363D] bg-[#161B22] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-[#30363D] bg-[#0D1117] text-[#58A6FF]">
              {data.difficulty}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F0F6FC] flex items-center gap-2">
                <span>{data.problemTitle} — Interview Study Hub</span>
              </h2>
              <p className="text-xs text-[#8B949E]">
                Master technical interview spoken scripts, CPython internals, and rookie coding traps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#8B949E]">
              <Building2 className="w-3.5 h-3.5 text-[#58A6FF]" />
              <span>Asked by:</span>
              {data.companyTags.slice(0, 4).map((company) => (
                <span key={company} className="px-2 py-0.5 rounded border border-[#30363D] bg-[#0D1117] text-[#C9D1D9] text-xs font-medium">
                  {company}
                </span>
              ))}
            </div>

            {/* Prominent Top-Right Close Button (X) */}
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC] transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Close Interview Hub (Esc)"
            >
              <span className="hidden sm:inline text-xs text-[#8B949E]">Back to Code</span>
              <X className="w-5 h-5 text-[#F85149]" />
            </button>
          </div>
        </div>

        {/* 2 Focused Mode Buttons */}
        <div className="px-5 py-2.5 border-b border-[#30363D]/60 bg-[#161B22]/80 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('interview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'interview'
                ? 'bg-[#58A6FF] text-white shadow-md'
                : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Interview Q&A ({data.questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'mistakes'
                ? 'bg-[#58A6FF] text-white shadow-md'
                : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#F85149]" />
            <span>⚠️ Common Rookie Mistakes ({data.mistakes.length})</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: INTERVIEW QUESTIONS & ANSWERS                     */}
          {/* ======================================================== */}
          {activeTab === 'interview' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Top Banner & Search */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#F0F6FC] tracking-tight">
                      💬 Technical Interview Q&A Bank ({filteredQuestions.length} Questions)
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8B949E] mt-1">
                      Complete interview questions, spoken reply scripts, CPython internals, and full code follow-ups.
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8B949E]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 15+ questions (e.g. 'Elevator Pitch', 'Memory', 'GIL', 'Built-in', 'Unicode')..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#161B22] border border-[#30363D] text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] shadow-inner"
                  />
                </div>
              </div>

              {/* Questions List with Generous Spacing */}
              <div className="space-y-6">
                {filteredQuestions.map((q, idx) => {
                  const isExpanded = expandedQA[q.id] ?? true;

                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-[#30363D] bg-[#161B22] overflow-hidden shadow-lg transition-all"
                    >
                      {/* Question Header */}
                      <div
                        onClick={() => toggleQA(q.id)}
                        className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#21262D]/50 transition-colors"
                      >
                        <div className="space-y-2.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-md border border-[#58A6FF]/40 bg-[#58A6FF]/10 text-[#58A6FF]">
                              Q{idx + 1}
                            </span>
                            <span className="text-xs font-mono px-3 py-1 rounded-md border border-[#30363D] bg-[#0D1117] text-[#8B949E]">
                              {q.category}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-[#F0F6FC] leading-snug">
                            {q.question}
                          </h3>
                          <div className="text-xs sm:text-sm text-[#8B949E] flex items-center gap-1.5 pt-0.5">
                            <span className="font-semibold text-[#C9D1D9]">What interviewer evaluates:</span>
                            <span>{q.whatInterviewerChecks}</span>
                          </div>
                        </div>

                        <button className="p-2 rounded-xl bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC]">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Expanded Answer Body with Generous Whitespace */}
                      {isExpanded && (
                        <div className="p-6 sm:p-7 pt-2 border-t border-[#30363D]/80 space-y-6 bg-[#0D1117]/60">
                          {/* 1. Spoken Answer Quote Card */}
                          <div className="rounded-2xl border-l-4 border-l-[#58A6FF] border border-[#30363D] bg-[#0D1117] p-5 sm:p-6 space-y-3.5 shadow-inner">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-[#58A6FF] flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                Best Spoken Answer to Reply:
                              </span>
                              <button
                                onClick={() => handleCopyAnswer(q.id, q.bestReplyScript)}
                                className="px-3.5 py-1.5 rounded-xl border border-[#30363D] bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] hover:text-[#F0F6FC] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                              >
                                {copiedAnswerId === q.id ? (
                                  <>
                                    <Check className="w-4 h-4 text-[#58A6FF]" />
                                    <span className="text-[#58A6FF]">Copied Script</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Script</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-sm sm:text-base text-[#F0F6FC] leading-relaxed font-medium">
                              &ldquo;{q.bestReplyScript}&rdquo;
                            </p>
                          </div>

                          {/* 2. Key Terms Badges */}
                          {q.keyPoints && q.keyPoints.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#8B949E] block">
                                Key Technical Concepts to Mention:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {q.keyPoints.map((point, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-3 py-1.5 rounded-lg border border-[#30363D] bg-[#161B22] text-xs font-medium text-[#C9D1D9]"
                                  >
                                    • {point}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 3. Full Complete Code Follow-Up Snippet */}
                          {q.codeSnippet && (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs text-[#8B949E] pt-1">
                                <span className="font-extrabold uppercase tracking-wider text-[#58A6FF] flex items-center gap-1.5">
                                  <Code className="w-4 h-4 text-[#58A6FF]" />
                                  Full Code Follow-Up Implementation:
                                </span>
                                <button
                                  onClick={() => handleCopyCode(q.id, q.codeSnippet!)}
                                  className="px-2.5 py-1 rounded-lg border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] text-xs text-[#C9D1D9] hover:text-white flex items-center gap-1.5 transition-colors"
                                >
                                  {copiedCodeId === q.id ? <Check className="w-3.5 h-3.5 text-[#58A6FF]" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedCodeId === q.id ? 'Copied Code' : 'Copy Code'}</span>
                                </button>
                              </div>

                              <div className="rounded-2xl border border-[#30363D] bg-[#080B10] p-5 font-mono text-xs sm:text-sm text-[#E6EDF3] leading-relaxed overflow-x-auto shadow-inner">
                                <pre className="whitespace-pre">{q.codeSnippet}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: COMMON MISTAKES                                   */}
          {/* ======================================================== */}
          {activeTab === 'mistakes' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-[#30363D] pb-4">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#F0F6FC]">
                  ⚠️ Common Rookie Mistakes & Traps
                </h3>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1">
                  Top coding bugs candidates make on this problem during technical interviews.
                </p>
              </div>

              <div className="space-y-5">
                {data.mistakes.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-4 shadow-md">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#F85149] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-base sm:text-lg font-extrabold text-[#F0F6FC]">{m.title}</h4>
                        <p className="text-xs sm:text-sm text-[#C9D1D9] leading-relaxed mt-1">
                          {m.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-[#F85149]/30 bg-[#F85149]/5 p-4 space-y-1.5">
                        <span className="text-xs font-mono font-extrabold text-[#F85149] block">❌ Buggy Code</span>
                        <code className="text-xs font-mono text-[#F0F6FC] block whitespace-pre">{m.badSnippet}</code>
                      </div>

                      <div className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4 space-y-1.5">
                        <span className="text-xs font-mono font-extrabold text-[#8B949E] block">📥 Failing Test Input</span>
                        <code className="text-xs font-mono text-[#58A6FF] block whitespace-pre">{m.failingInput}</code>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#58A6FF]/30 bg-[#58A6FF]/5 p-4 space-y-1.5">
                      <span className="text-xs font-mono font-extrabold text-[#58A6FF] block">✅ How to Fix It</span>
                      <p className="text-xs sm:text-sm text-[#F0F6FC] font-semibold leading-relaxed">{m.howToFix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
