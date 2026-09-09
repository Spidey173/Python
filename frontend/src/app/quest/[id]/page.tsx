'use client';

import React, { useState, useEffect, use, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { api } from '@/lib/api';
import { persistence, createDebouncedSaver } from '@/lib/persistence';
import { registerGlobalShortcuts } from '@/lib/shortcuts';
import {
  ChallengeDetail, CodeRunResponse, TestCaseResult,
  ChapterGroup, ChallengeSummary
} from '@/lib/types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useAuth } from '@/lib/auth-context';
import { soundFX } from '@/lib/audio';
import {
  MentorMessage, HintTier, getMentorKnowledge,
  analyzeExecutionForMentor, ProblemMentorKnowledge
} from '@/lib/mentor-engine';
import { MentorChatPanel } from '@/components/mentor/MentorChatPanel';
import { SolutionVault } from '@/components/mentor/SolutionVault';
import { MissionCompleteModal } from '@/components/mentor/MissionCompleteModal';
import { InterviewPanel } from '@/components/interview/InterviewPanel';
import {
  Play, RotateCcw, ArrowLeft, Clock, BookOpen,
  Code2, Check, ArrowRight, X, AlertCircle, Sidebar,
  Terminal, ChevronDown, ChevronUp, Copy, Trash2,
  Award, Sparkles, Trophy, Compass, ShieldCheck,
  CheckSquare, Layers, Circle, RefreshCw, Bot, Lock, Unlock,
  Briefcase
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface TerminalHistoryEntry {
  id: string;
  command: string;
  stdin?: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timestamp: string;
}

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const resolvedParams = use(params);
  const problemId = parseInt(resolvedParams.id, 10) || 1;

  // Workspace Data
  const [problem, setProblem] = useState<ChallengeDetail | null>(null);
  const [allProblems, setAllProblems] = useState<ChallengeSummary[]>([]);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Layout & Tabs
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [dockHeight, setDockHeight] = useState<'normal' | 'expanded'>('normal');
  // Left Panel Tab: Problem Spec, Mentor, Solution Vault, Interview Q&A
  const [activeTab, setActiveTab] = useState<'spec' | 'mentor' | 'vault' | 'interview'>('spec');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'terminal' | 'tests'>('terminal');
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [customStdin, setCustomStdin] = useState<string>('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Mentor & Hint State
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [hintTier, setHintTier] = useState<HintTier>(1);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<string>('');
  const [isSolutionUnlocked, setIsSolutionUnlocked] = useState<boolean>(false);
  const [showMissionCompleteModal, setShowMissionCompleteModal] = useState<boolean>(false);
  const [lastExecutionRuntime, setLastExecutionRuntime] = useState<number>(24);

  // Execution & Terminal State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResponse, setRunResponse] = useState<CodeRunResponse | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<TerminalHistoryEntry[]>([]);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Timer HUD
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTimerRunningRef = useRef(true);

  // Debounced autosave
  const debouncedSaveRef = useRef(
    createDebouncedSaver((draftCode: string) => {
      persistence.saveDraft(problemId, draftCode);
    }, 2000)
  );

  const stopTimer = useCallback(() => {
    isTimerRunningRef.current = false;
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    isTimerRunningRef.current = true;
    setIsTimerRunning(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = setInterval(() => {
      if (!isTimerRunningRef.current) return;
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  // 1. Solve Timer per problem
  useEffect(() => {
    setElapsedSeconds(0);
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [problemId, startTimer]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 2. Stream Typewriter Effect for Mentor
  const streamMentorText = useCallback((fullText: string, mood: MentorMessage['mood'], codeSnippet?: string) => {
    const msgId = Math.random().toString(36).substring(7);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Insert empty streaming message
    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        sender: 'mentor',
        text: '',
        fullText,
        status: 'streaming',
        mood,
        codeSnippet,
        timestamp: timeStr,
      },
    ]);

    const words = fullText.split(' ');
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= words.length) {
        clearInterval(interval);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text: fullText, status: 'done' } : m))
        );
        return;
      }

      currentIdx++;
      const partial = words.slice(0, currentIdx).join(' ');
      soundFX.playTypewriterBlip();

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, text: partial } : m))
      );
    }, 22);
  }, []);

  // 3. Load Problem, Restore Draft & Initialize Mentor Greeting
  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        const [prob, chapters, solved, unlockedSolutions, savedDraft, layoutSettings] = await Promise.all([
          api.getChallenge(problemId),
          api.getChapters().catch(() => [] as ChapterGroup[]),
          persistence.getSolvedIds(),
          persistence.getUnlockedSolutionIds(),
          persistence.loadDraft(problemId),
          persistence.loadLayoutSettings(),
        ]);

        setProblem(prob);
        const flatProblems = (chapters as ChapterGroup[]).flatMap((c) => c.levels);
        setAllProblems(flatProblems);
        const backendSolved = flatProblems.filter((p) => p.passed).map((p) => p.id);
        const resolvedSolved = Array.from(new Set([...backendSolved, ...solved]));
        setSolvedIds(resolvedSolved);

        // If challenge was already solved, stop timer immediately
        const isAlreadySolved = resolvedSolved.includes(problemId) || Boolean(prob.passed);
        if (isAlreadySolved) {
          stopTimer();
        }

        // Code restoration:
        // Priority 1: User's saved draft (if non-empty and not just blank starter)
        // Priority 2: Submitted passing code from backend (prob.saved_code)
        // Priority 3: Problem starter template
        let initialCode = prob.starter_code;
        if (savedDraft && savedDraft.trim() !== '' && savedDraft !== prob.starter_code) {
          initialCode = savedDraft;
        } else if (prob.saved_code && prob.saved_code.trim() !== '' && prob.saved_code !== prob.starter_code) {
          initialCode = prob.saved_code;
          await persistence.saveDraft(problemId, prob.saved_code);
        } else if (savedDraft && savedDraft.trim() !== '') {
          initialCode = savedDraft;
        }
        setCode(initialCode);

        // Layout restore
        setSidebarCollapsed(layoutSettings.navigatorCollapsed);
        setConsoleCollapsed(layoutSettings.consoleCollapsed);
        await persistence.setLastActiveProblemId(problemId);

        // Solution is unlocked if the challenge has been solved OR manually unlocked previously
        const isUnlockedInStorage = unlockedSolutions.includes(problemId);
        setIsSolutionUnlocked(isAlreadySolved || isUnlockedInStorage);

        // Initialize Mentor with welcoming greeting
        const knowledge = getMentorKnowledge(prob);
        setMessages([
          {
            id: 'init-greeting',
            sender: 'mentor',
            text: knowledge.greeting,
            fullText: knowledge.greeting,
            status: 'done',
            mood: 'neutral',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err) {
        console.error('Failed to load problem workspace:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();

    const handleLogout = () => {
      setSolvedIds([]);
    };
    window.addEventListener('pyforge_auth_logout', handleLogout);
    return () => window.removeEventListener('pyforge_auth_logout', handleLogout);
  }, [problemId, stopTimer]);

  // Sync solved state when user status changes without re-initializing code editor
  useEffect(() => {
    async function syncUserProgress() {
      if (!user) {
        setSolvedIds([]);
        return;
      }
      try {
        const [chapters, localSolved] = await Promise.all([
          api.getChapters().catch(() => [] as ChapterGroup[]),
          persistence.getSolvedIds(),
        ]);
        const backendSolved = (chapters as ChapterGroup[]).flatMap((c) => c.levels).filter((l) => l.passed).map((l) => l.id);
        const resolved = Array.from(new Set([...backendSolved, ...localSolved]));
        setSolvedIds(resolved);
        if (resolved.includes(problemId)) {
          stopTimer();
          setIsSolutionUnlocked(true);
        }
      } catch (e) {
        console.error('Failed to sync user solved progress:', e);
      }
    }
    syncUserProgress();
  }, [user, problemId, stopTimer]);

  // 4. Code Change Handler
  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || '';
    setCode(val);
    debouncedSaveRef.current(val);

    // Resume timer if it was stopped after an attempt and challenge is not yet solved
    if (!isTimerRunningRef.current && !solvedIds.includes(problemId)) {
      startTimer();
    }
  };

  // 5. Progressive Hint Requests
  const handleRequestHint = (tier: HintTier) => {
    if (!problem || isThinking) return;
    const knowledge = getMentorKnowledge(problem);
    const targetHint = knowledge.hints[tier - 1] || knowledge.hints[0];

    setHintTier(tier);
    soundFX.playHintDing();

    // Append user request
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userPrompt = tier === 1 ? 'Give me a clue' : 'Give me another clue';

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        text: userPrompt,
        fullText: userPrompt,
        status: 'done',
        mood: 'curious',
        timestamp: timeStr,
      },
    ]);

    // Stream Mentor Clue
    const cleanTitle = targetHint.title.replace(/^Tier\s*\d+:\s*/i, '');
    const tipText = targetHint.reflectionQuestion ? `\n\n${targetHint.reflectionQuestion}` : '';
    const mentorNudge = `💡 **${cleanTitle}**\n\n${targetHint.nudge}${tipText}`;
    setTimeout(() => {
      streamMentorText(mentorNudge, 'coaching', targetHint.codeSnippet);
    }, 200);
  };

  const handleRequestConcept = () => {
    if (!problem || isThinking) return;
    const knowledge = getMentorKnowledge(problem);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        text: 'Explain the core concept behind this challenge.',
        fullText: 'Explain the core concept behind this challenge.',
        status: 'done',
        mood: 'curious',
        timestamp: timeStr,
      },
    ]);

    const conceptText = `🧠 Concept: ${knowledge.conceptName}\n\n${knowledge.conceptExplanation}\n\n💡 Interview Note: ${knowledge.interviewTrap}`;
    setTimeout(() => {
      streamMentorText(conceptText, 'coaching');
    }, 200);
  };

  const handleRequestExample = () => {
    if (!problem || isThinking) return;
    const knowledge = getMentorKnowledge(problem);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        text: 'Show me an example pattern without giving the answer.',
        fullText: 'Show me an example pattern without giving the answer.',
        status: 'done',
        mood: 'curious',
        timestamp: timeStr,
      },
    ]);

    const exampleIntro = "Here is an idiomatic structural pattern demonstrating how this concept functions. Adapt this logic to match your specific challenge:";
    setTimeout(() => {
      streamMentorText(exampleIntro, 'coaching', knowledge.patternExample);
    }, 200);
  };

  const handleSendCustomPrompt = async (prompt: string) => {
    if (!problem || isThinking) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        text: prompt,
        fullText: prompt,
        status: 'done',
        mood: 'curious',
        timestamp: timeStr,
      },
    ]);

    setIsThinking(true);
    setThinkingPhase('Mentor pondering...');

    // Directly query the backend AI Chatbot model for all custom questions & greetings
    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'mentor' ? 'assistant' : 'user',
        content: m.fullText || m.text,
      }));
      const tutorRes = await api.chatWithTutor(prompt, code, problem.id, history);
      if (tutorRes?.reply) {
        const cleanReply = tutorRes.reply
          .replace(/🐍\s*\**Byte\s*says:\**/gi, '')
          .trim();
        setIsThinking(false);
        streamMentorText(cleanReply, 'coaching');
        return;
      }
    } catch (err) {
      console.warn('AI Chatbot request error, using fallback:', err);
    }

    // Fallback if backend API is unreachable
    const lower = prompt.trim().toLowerCase();
    const knowledge = getMentorKnowledge(problem);
    let coachReply = '';

    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      coachReply = `Hello! 👋 Ready to tackle **${problem.title}**? I'm your AI Mentor. Ask me any question about logic, Python syntax, edge cases, or algorithm efficiency!`;
    } else {
      coachReply = `Regarding **"${prompt}"**: For **${problem.title}**, focus on input transformation and optimal time complexity. Write out your code in \`solution.py\` and hit **Run** to verify!`;
    }

    setIsThinking(false);
    streamMentorText(coachReply, 'coaching');
  };

  // 6. Run Code Pipeline with Cinematic AI Analysis
  const handleRunCode = async () => {
    if (!problem || isRunning || isSubmitting) return;

    try {
      setIsRunning(true);
      setIsThinking(true);
      setConsoleCollapsed(false);
      setActiveConsoleTab('terminal');

      // Cinematic multi-stage reasoning
      setThinkingPhase('Thinking...');
      await new Promise((r) => setTimeout(r, 200));

      setThinkingPhase('Running in Python 3.12 sandbox...');
      const res = await api.runCode(problemId, code);
      setRunResponse(res);

      setThinkingPhase('Analyzing AST and stdout...');
      await new Promise((r) => setTimeout(r, 300));

      setThinkingPhase('Generating mentor coaching...');
      await new Promise((r) => setTimeout(r, 250));

      const exitCode = res.success ? 0 : 1;
      const duration = Math.round(res.execution_time_ms || 24);
      setLastExecutionRuntime(duration);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Append Terminal record with test case feedback summary
      const testSummary = res.test_results && res.test_results.length > 0
        ? res.test_results.map(t => `  • Case ${t.test_case_index} (${t.description}): ${t.passed ? 'PASSED' : 'FAILED'}${t.actual_output ? ` -> Output: ${t.actual_output.trim()}` : ''}`).join('\n')
        : '';

      const terminalStdout = testSummary
        ? `${res.stdout ? res.stdout + '\n' : ''}[Visible Test Cases Evaluation]:\n${testSummary}`
        : (res.stdout || '');

      setTerminalHistory((prev) => [
        ...prev.slice(-15),
        {
          id: Math.random().toString(36).substring(7),
          command: 'python3 solution.py',
          stdin: undefined,
          stdout: terminalStdout,
          stderr: res.stderr || (res.security_error ? `[Security Error] ${res.security_error}` : ''),
          exitCode,
          durationMs: duration,
          timestamp: timeStr,
        },
      ]);

      // Sound and Mentor Feedback
      const feedback = analyzeExecutionForMentor(res, problem, code);

      if (!res.success || (res.test_results && res.test_results.some((t) => !t.passed))) {
        soundFX.playFailureThud();
      }

      streamMentorText(feedback.responseText, feedback.mood, feedback.codeSnippet);
    } catch (err: any) {
      soundFX.playFailureThud();
      streamMentorText(
        `Execution encountered an error: ${err?.message || 'Failed to connect to the runner'}. Please verify syntax.`,
        'debugging'
      );
    } finally {
      setIsRunning(false);
      setIsThinking(false);
      setThinkingPhase('');
    }
  };

  // 7. Submit Code Pipeline with Mission Complete Celebration
  const handleSubmitCode = async () => {
    if (!problem || isRunning || isSubmitting) return;

    // Freeze mission timer immediately upon clicking Submit
    stopTimer();

    try {
      setIsSubmitting(true);
      setIsThinking(true);
      setThinkingPhase('Verifying solution against all interview test suites...');
      await persistence.saveDraft(problemId, code);

      setConsoleCollapsed(false);
      setActiveConsoleTab('tests');

      const res = await api.submitCode(problemId, code, hintTier);
      const duration = 22;
      setLastExecutionRuntime(duration);

      await persistence.recordSubmission({
        problemId: problem.id,
        problemTitle: problem.title,
        passed: res.passed_all,
        runtimeMs: duration,
        code,
      });

      // Guarantee timer stays stopped
      stopTimer();

      if (res.passed_all) {
        // Unlock solution and automatically open it normally!
        setIsSolutionUnlocked(true);
        setActiveTab('vault');
        setSolvedIds((prev) => (prev.includes(problem.id) ? prev : [...prev, problem.id]));
        await persistence.markSolved(problem.id);
        window.dispatchEvent(new CustomEvent('pyforge_problem_solved', { detail: { problemId: problem.id } }));
        setShowMissionCompleteModal(true);

        streamMentorText(
          `🎉 Magnificent work! Your code passed every single test case cleanly in ${duration}ms without needing to unlock the solution. The Solution Vault is now completely open for you to review optimal interview patterns!`,
          'celebrating'
        );
      } else {
        soundFX.playFailureThud();
        streamMentorText(
          `Submission evaluated, but some test cases failed. I paused your mission timer so you can analyze the failure at your own pace. Modify your code to resume!`,
          'coaching'
        );
      }

      const runRes = await api.runCode(problemId, code);
      setRunResponse(runRes);
      setConsoleCollapsed(false);
      setActiveConsoleTab('tests');
      await refreshUser();
      await persistence.saveDraft(problemId, code);
    } catch (err: any) {
      stopTimer();
      soundFX.playFailureThud();
      alert(err?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
      setIsThinking(false);
      setThinkingPhase('');
    }
  };

  // Reset starter template
  const handleResetCode = () => {
    if (!problem) return;
    if (confirm('Reset code to starter template? Current draft will be overwritten.')) {
      setCode(problem.starter_code);
      persistence.saveDraft(problemId, problem.starter_code);
      soundFX.playLockBreak();
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const unregister = registerGlobalShortcuts({
      onRun: handleRunCode,
      onSubmit: handleSubmitCode,
      onToggleSidebar: () => setSidebarCollapsed((p) => !p),
      onToggleConsole: () => setConsoleCollapsed((p) => !p),
      onOpenCommandPalette: () => setCommandPaletteOpen(true),
    });
    return unregister;
  }, [handleRunCode, handleSubmitCode]);

  const isCurrentProblemSolved = solvedIds.includes(problemId) || problem?.passed;

  return (
    <div className="h-[calc(100vh-48px)] max-h-[calc(100vh-48px)] flex flex-col bg-[#070A0F] text-[#E6EDF3] overflow-hidden select-none">

      {/* 1. Futuristic Mission Sub-Header (44px) */}
      <header className="h-13 border-b border-[#21262D] bg-[#0E131C]/90 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Curriculum Back Link, Prev/Next Navigation, Challenge Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/quest"
            className="p-2 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
            title="Back to Curriculum"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>

          {/* Quick Challenge Stepper */}
          <div className="flex items-center gap-2 border border-white/10 rounded-lg bg-[#111622] px-2.5 py-1 text-sm font-mono">
            <button
              onClick={() => router.push(`/quest/${problemId - 1}`)}
              disabled={problemId <= 1}
              className="text-[#8B949E] hover:text-[#E6EDF3] disabled:opacity-30 px-1.5 py-0.5 rounded transition-colors font-semibold"
              title="Previous Challenge"
            >
              ‹ Prev
            </button>
            <span className="text-[#30363D]">|</span>
            <span className="font-bold text-[#58A6FF]">#{problem?.level_number || problemId}</span>
            <span className="text-[#30363D]">|</span>
            <button
              onClick={() => router.push(`/quest/${problemId + 1}`)}
              disabled={problemId >= (allProblems.length || 50)}
              className="text-[#8B949E] hover:text-[#E6EDF3] disabled:opacity-30 px-1.5 py-0.5 rounded transition-colors font-semibold"
              title="Next Challenge"
            >
              Next ›
            </button>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base sm:text-lg font-bold text-[#E6EDF3] truncate max-w-xs md:max-w-md">
              {problem?.title || 'Loading challenge...'}
            </span>
            {problem && <DifficultyBadge difficulty={problem.difficulty} size="md" />}
            {isCurrentProblemSolved && (
              <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                <Check className="h-3.5 w-3.5" /> Solved
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Mission Timer */}
        <button
          type="button"
          onClick={() => {
            if (isCurrentProblemSolved) return;
            if (isTimerRunning) {
              stopTimer();
            } else {
              startTimer();
            }
          }}
          className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-mono transition-all ${
            isCurrentProblemSolved
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : !isTimerRunning
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer'
              : 'border-white/10 bg-[#0B0F17] text-[#8B949E] hover:border-white/20 cursor-pointer'
          }`}
          title={
            isCurrentProblemSolved
              ? 'Problem Completed'
              : isTimerRunning
              ? 'Timer running — Click to pause'
              : 'Timer paused — Click to resume'
          }
        >
          <Clock className={`h-4 w-4 ${
            isCurrentProblemSolved
              ? 'text-emerald-400'
              : !isTimerRunning
              ? 'text-amber-400'
              : 'text-[#58A6FF]'
          }`} />
          <span>{formatTimer(elapsedSeconds)}</span>
          {isCurrentProblemSolved ? (
            <span className="text-xs font-sans font-bold text-emerald-400 uppercase tracking-wider ml-0.5">
              Solved
            </span>
          ) : !isTimerRunning ? (
            <span className="text-xs font-sans font-bold text-amber-300 uppercase tracking-wider ml-0.5">
              Paused
            </span>
          ) : null}
        </button>

        {/* Right: Code Actions (Reset, Run, Submit) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetCode}
            className="p-2 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
            title="Reset code template"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-[#161B22] hover:bg-[#21262D] hover:border-[#58A6FF] text-sm font-semibold text-[#E6EDF3] transition-all shadow-md disabled:opacity-50 cursor-pointer"
            title="Run code in Terminal (Ctrl+Enter)"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin text-[#58A6FF]" />
            ) : (
              <Play className="h-4 w-4 fill-current text-emerald-400" />
            )}
            <span>Run</span>
            <kbd className="hidden lg:inline-block font-mono text-xs text-[#8B949E] bg-[#0D1117] px-1.5 py-0.5 rounded border border-[#30363D]">
              ↵
            </kbd>
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#238636] to-[#2EA043] hover:from-[#2EA043] hover:to-[#3FB950] text-sm font-bold text-white transition-all shadow-lg shadow-emerald-950/60 disabled:opacity-50 cursor-pointer"
            title="Submit solution for evaluation (Ctrl+Shift+Enter)"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 stroke-[3]" />
            )}
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout: 2 Focused Panes (Mentor Cockpit + Editor & Terminal) */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">

        {/* Left Cockpit Panel (480px / 520px) — Problem Spec / Mentor / Solution Vault */}
        <section className="w-[480px] lg:w-[540px] border-r border-[#21262D] bg-[#0B0F17]/90 flex flex-col shrink-0 overflow-hidden">
          {/* Cockpit Navigation Tabs */}
          <div className="h-11 border-b border-[#21262D] bg-[#111622] px-3 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
            {/* Tab 1: Problem Spec */}
            <button
              onClick={() => setActiveTab('spec')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'spec'
                  ? 'bg-[#21262D] text-[#E6EDF3] border border-[#30363D] shadow-sm'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22]'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'spec' ? 'text-[#58A6FF]' : 'text-[#8B949E]'}`} />
              <span>Problem Spec</span>
            </button>

            {/* Tab 2: Mentor */}
            <button
              onClick={() => setActiveTab('mentor')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'mentor'
                  ? 'bg-[#1F6FEB]/20 text-[#58A6FF] border border-[#1F6FEB]/40 shadow-sm'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22]'
              }`}
            >
              <Bot className="w-4 h-4 text-[#58A6FF]" />
              <span>Mentor</span>
            </button>

            {/* Tab 3: Solution */}
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'vault'
                  ? isSolutionUnlocked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-[#D29922]/20 text-[#D29922] border border-[#D29922]/40 shadow-sm'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22]'
              }`}
            >
              {isSolutionUnlocked ? (
                <Unlock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-[#D29922]" />
              )}
              <span>Solution</span>
            </button>

            {/* Tab 4: Interview Q&A */}
            <button
              onClick={() => setActiveTab('interview')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'interview'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22]'
              }`}
            >
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Interview Q&A</span>
            </button>
          </div>

          {/* Cockpit Content Panes */}
          <div className="flex-1 overflow-hidden">
            {/* VIEW: MENTOR CHAT */}
            {activeTab === 'mentor' && (
              <MentorChatPanel
                problem={problem || ({ id: problemId, title: 'Challenge', objective: '' } as any)}
                currentCode={code}
                messages={messages}
                hintTier={hintTier}
                isThinking={isThinking}
                thinkingPhase={thinkingPhase}
                isSolutionUnlocked={isSolutionUnlocked}
                onOpenSolutionVault={() => setActiveTab('vault')}
                onRequestHint={handleRequestHint}
                onRequestConcept={handleRequestConcept}
                onRequestExample={handleRequestExample}
                onSendCustomPrompt={handleSendCustomPrompt}
              />
            )}

            {/* VIEW 2: PROBLEM SPEC */}
            {activeTab === 'spec' && (
              <div className="h-full overflow-y-auto p-5 sm:p-6 space-y-5 select-text">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#E6EDF3] tracking-tight mb-1.5">
                    {problem?.title}
                  </h3>
                  <p className="text-sm font-mono text-[#8B949E]">
                    {problem?.chapter_title}
                  </p>
                </div>

                {/* Problem Story & Objective */}
                <div className="prose prose-invert max-w-none text-[#E6EDF3] text-base leading-relaxed">
                  <p>{problem?.story || problem?.objective}</p>
                </div>

                {problem?.objective && (
                  <div className="rounded-2xl border border-white/10 bg-[#161B22]/70 p-4 sm:p-5 space-y-2">
                    <span className="text-xs font-mono font-bold text-[#58A6FF] uppercase tracking-wider block">
                      Target Objective
                    </span>
                    <p className="text-base text-[#E6EDF3] leading-relaxed">
                      {problem.objective}
                    </p>
                  </div>
                )}

                {/* Examples */}
                {problem?.visible_test_cases && problem.visible_test_cases.length > 0 && (
                  <div className="space-y-3.5">
                    <span className="text-sm font-mono uppercase tracking-wider text-[#8B949E] font-bold block">
                      Terminal Output Contract
                    </span>
                    {problem.visible_test_cases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4 space-y-2.5 font-mono text-sm"
                      >
                        <div className="text-xs text-[#8B949E] uppercase font-bold">
                          Example {idx + 1}
                        </div>
                        {tc.input && (
                          <div className="space-y-1.5">
                            <span className="text-xs text-[#8B949E]">Input:</span>
                            <div className="p-2.5 rounded-lg bg-[#161B22] text-[#58A6FF] font-semibold">
                              {tc.input}
                            </div>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <span className="text-xs text-[#8B949E]">Expected Output:</span>
                          <div className="p-2.5 rounded-lg bg-[#161B22] text-emerald-400 font-semibold">
                            {tc.expected}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                <div className="rounded-xl border border-white/5 bg-[#161B22]/40 p-4 space-y-2 text-sm text-[#8B949E]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#E6EDF3] font-bold block">
                    Execution Constraints
                  </span>
                  <p>• Python 3.12 Sandboxed Runtime</p>
                  <p>• Execution Timeout: 3,000ms</p>
                  <p>• Restricted libraries: `os`, `sys`, `subprocess`</p>
                </div>
              </div>
            )}

            {/* VIEW 3: SOLUTION VAULT (LOCKED / UNLOCKED) */}
            {activeTab === 'vault' && problem && (
              <SolutionVault
                problem={problem}
                isSolved={Boolean(isCurrentProblemSolved)}
                unlocked={isSolutionUnlocked}
                hintsUsedCount={hintTier}
                onUnlock={() => {
                  setIsSolutionUnlocked(true);
                  persistence.markSolutionUnlocked(problemId);
                }}
                onSubmitCode={handleSubmitCode}
                onLoadCodeToEditor={(solCode) => {
                  setCode(solCode);
                  persistence.saveDraft(problemId, solCode);
                }}
              />
            )}

            {/* VIEW 4: INTERVIEW Q&A PREP */}
            {activeTab === 'interview' && problem && (
              <InterviewPanel
                problem={problem}
                isSolved={Boolean(isCurrentProblemSolved)}
              />
            )}
          </div>
        </section>

        {/* Right Pane: Monaco Code Canvas + Real Interactive Terminal Dock */}
        <div className="flex-1 flex flex-col bg-[#080B12] overflow-hidden">
          {/* Editor Header Bar */}
          <div className="h-11 border-b border-[#21262D] bg-[#0E131C] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-sm text-[#E6EDF3]">solution.py</span>
              <span className="text-xs text-[#8B949E] font-mono">Python 3.12</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (problem) {
                    setCode(problem.starter_code);
                    persistence.saveDraft(problemId, problem.starter_code);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] border border-transparent hover:border-[#30363D] transition-colors"
                title="Reset solution.py to clean starter code"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset Code</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
                title="Copy code"
              >
                {copiedCode ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
              </button>

              <button
                onClick={() => setConsoleCollapsed((p) => !p)}
                className={`p-1.5 rounded-lg transition-colors ${
                  !consoleCollapsed ? 'bg-[#161B22] text-[#58A6FF]' : 'text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
                title="Toggle Terminal Dock (Ctrl+J)"
              >
                <Terminal className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Monaco Code Editor Canvas (Crisp 16px Code Font) */}
          <div className="flex-1 relative overflow-hidden bg-[#080B12]">
            <MonacoEditor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
                fontSize: 16,
                lineHeight: 26,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                fontLigatures: true,
              }}
            />
          </div>

          {/* Real Interactive Terminal Console Dock */}
          {!consoleCollapsed && (
            <div
              className={`border-t border-[#21262D] bg-[#020408] flex flex-col shrink-0 transition-all duration-200 ${
                dockHeight === 'expanded' ? 'h-80' : 'h-64'
              }`}
            >
              {/* Terminal Dock Header */}
              <div className="h-10 border-b border-[#161B22] bg-[#0A0E17] px-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveConsoleTab('terminal')}
                    className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${
                      activeConsoleTab === 'terminal'
                        ? 'bg-[#161B22] text-[#E6EDF3] border border-white/10'
                        : 'text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                  >
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span>Terminal</span>
                    {isRunning && <span className="h-2 w-2 rounded-full bg-[#58A6FF] animate-ping" />}
                  </button>

                  <button
                    onClick={() => setActiveConsoleTab('tests')}
                    className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${
                      activeConsoleTab === 'tests'
                        ? 'bg-[#161B22] text-[#E6EDF3] border border-white/10'
                        : 'text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                  >
                    <CheckSquare className="h-4 w-4 text-[#58A6FF]" />
                    <span>Test Cases</span>
                    {runResponse?.test_results && runResponse.test_results.length > 0 && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#21262D] text-emerald-400 font-semibold">
                        {runResponse.test_results.filter((t) => t.passed).length}/{runResponse.test_results.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Right Controls: Exit code badge, Clear, Height toggle */}
                <div className="flex items-center gap-2">
                  {runResponse && (
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md border ${
                        runResponse.success
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                          : 'border-red-500/40 bg-red-500/15 text-red-400'
                      }`}
                    >
                      {runResponse.success ? 'Exit 0' : 'Exit 1'}
                    </span>
                  )}

                  <button
                    onClick={() => setTerminalHistory([])}
                    className="p-1 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
                    title="Clear Terminal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setDockHeight((p) => (p === 'normal' ? 'expanded' : 'normal'))}
                    className="p-1 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
                    title={dockHeight === 'expanded' ? 'Shrink' : 'Expand'}
                  >
                    {dockHeight === 'expanded' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={() => setConsoleCollapsed(true)}
                    className="p-1 rounded-md text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
                    title="Close Dock"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal Shell Canvas */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm select-text bg-[#020408]">
                {/* 1. Real Terminal Stream */}
                {activeConsoleTab === 'terminal' && (
                  <div className="space-y-3">
                    {terminalHistory.map((item) => (
                      <div key={item.id} className="space-y-1">
                        {/* Terminal Command Line */}
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">python@workspace</span>
                          <span className="text-[#8B949E]">:</span>
                          <span className="text-[#58A6FF] font-medium">~/workspace</span>
                          <span className="text-[#8B949E]">$</span>
                          <span className="text-[#E6EDF3] font-semibold">{item.command}</span>
                        </div>

                        {/* Stdin Echo */}
                        {item.stdin && (
                          <div className="text-[#8B949E] text-xs pl-2 border-l-2 border-[#30363D]">
                            [stdin feed]: {item.stdin}
                          </div>
                        )}

                        {/* Stdout Output */}
                        {item.stdout && (
                          <pre className="text-[#E6EDF3] whitespace-pre-wrap leading-relaxed">
                            {item.stdout}
                          </pre>
                        )}

                        {/* Stderr Output */}
                        {item.stderr && (
                          <pre className="text-red-400 whitespace-pre-wrap leading-relaxed bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">
                            {item.stderr}
                          </pre>
                        )}

                        {/* Process Exit Badge */}
                        <div className="text-[11px] text-[#8B949E] flex items-center gap-3 pt-1">
                          <span className={item.exitCode === 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                            [Process completed with exit code {item.exitCode}]
                          </span>
                          <span>•</span>
                          <span>{item.durationMs}ms</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    ))}

                    {/* Active Running State */}
                    {isRunning && (
                      <div className="space-y-1 animate-pulse">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">python@workspace</span>
                          <span className="text-[#8B949E]">:</span>
                          <span className="text-[#58A6FF] font-medium">~/workspace</span>
                          <span className="text-[#8B949E]">$</span>
                          <span className="text-[#E6EDF3]">python3 solution.py</span>
                        </div>
                        <div className="text-xs text-[#58A6FF] flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Executing code in Python 3.12 sandbox...</span>
                        </div>
                      </div>
                    )}

                    {/* Ready Prompt with Cursor */}
                    {!isRunning && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-emerald-400 font-bold">python@workspace</span>
                        <span className="text-[#8B949E]">:</span>
                        <span className="text-[#58A6FF] font-medium">~/workspace</span>
                        <span className="text-[#8B949E]">$</span>
                        <span className="inline-block w-2 h-4 bg-[#58A6FF] animate-pulse" />
                      </div>
                    )}

                    <div ref={terminalEndRef} />
                  </div>
                )}

                {/* 2. Test Cases Tab */}
                {activeConsoleTab === 'tests' && (
                  <div className="space-y-3 font-sans">
                    <div className="flex items-center gap-2">
                      {(runResponse?.test_results && runResponse.test_results.length > 0
                        ? runResponse.test_results
                        : problem?.visible_test_cases || []
                      ).map((_, idx) => {
                        const result = runResponse?.test_results?.[idx];
                        const isSelected = selectedCaseIndex === idx;

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedCaseIndex(idx)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#1F6FEB] text-white'
                                : 'bg-[#161B22] text-[#8B949E] hover:bg-[#21262D]'
                            }`}
                          >
                            {result !== undefined && (
                              <span className={`w-2 h-2 rounded-full ${result.passed ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            )}
                            <span>Case {idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Case Result Details */}
                    {(() => {
                      const result = runResponse?.test_results?.[selectedCaseIndex];
                      const testCase = problem?.visible_test_cases?.[selectedCaseIndex];

                      return (
                        <div className="p-3.5 rounded-xl border border-[#21262D] bg-[#0A0E17] space-y-2 font-mono text-xs">
                          {testCase?.input && (
                            <div>
                              <span className="text-[#8B949E] text-[10px] block">Input:</span>
                              <div className="p-2 rounded bg-[#161B22] text-[#58A6FF] mt-1">{testCase.input}</div>
                            </div>
                          )}
                          <div>
                            <span className="text-[#8B949E] text-[10px] block">Expected:</span>
                            <div className="p-2 rounded bg-[#161B22] text-emerald-400 mt-1">
                              {result?.expected_output || testCase?.expected || 'Output value'}
                            </div>
                          </div>
                          {result && (
                            <div>
                              <span className="text-[#8B949E] text-[10px] block">Your Output:</span>
                              <div className={`p-2 rounded mt-1 ${result.passed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                                {result.actual_output || '(no output)'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Celebratory Mission Complete Overlay */}
      {showMissionCompleteModal && problem && (
        <MissionCompleteModal
          problemTitle={problem.title}
          problemId={problem.id}
          xpReward={problem.xp_reward || 50}
          runtimeMs={lastExecutionRuntime}
          onViewSolution={() => {
            setShowMissionCompleteModal(false);
            setActiveTab('vault');
          }}
          onNextChallenge={() => {
            setShowMissionCompleteModal(false);
            const nextId = problemId + 1;
            router.push(`/quest/${nextId}`);
          }}
          onClose={() => setShowMissionCompleteModal(false)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}
