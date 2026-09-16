'use client';

import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { api } from '@/lib/api';
import { persistence, createDebouncedSaver, isProblemSolved, getCanonicalProblemId } from '@/lib/persistence';
import { registerGlobalShortcuts } from '@/lib/shortcuts';
import {
  ChallengeDetail, CodeRunResponse,
  ChapterGroup, ChallengeSummary
} from '@/lib/types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useAuth } from '@/lib/auth-context';
import { soundFX } from '@/lib/audio';
import { SolutionVault } from '@/components/mentor/SolutionVault';
import { MissionCompleteModal } from '@/components/mentor/MissionCompleteModal';
import { InterviewPanel } from '@/components/interview/InterviewPanel';
import { ChatbotPanel, ChatMessage } from '@/components/chatbot/ChatbotPanel';
import {
  Play, RotateCcw, ArrowLeft, Clock, BookOpen,
  Check, X, Terminal, ChevronDown, ChevronUp, Copy, Trash2,
  CheckSquare, RefreshCw, Bot, Lock, Unlock,
  Briefcase, Zap, Sparkles, Code
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

import { getProblemRankedSolutions } from '@/lib/problem-intelligence';

interface TerminalHistoryEntry {
  id: string;
  command: string;
  stdin?: string;
  interactivePrompts?: Array<{ prompt: string; value: string }>;
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

  // Layout & Tabs
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [dockHeight, setDockHeight] = useState<'normal' | 'expanded'>('normal');
  // Left Panel Tab: Problem Spec, Chatbot, Solution Vault, Interview Q&A
  const [activeTab, setActiveTab] = useState<'spec' | 'chat' | 'vault' | 'interview'>('spec');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'terminal' | 'tests'>('terminal');
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Mobile Workspace States
  const [mobileTab, setMobileTab] = useState<'spec' | 'code' | 'interview'>('code');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showMobileConsoleLogs, setShowMobileConsoleLogs] = useState(false);

  // Solution Vault & Modal State
  const hintTier = 1;
  const [isSolutionUnlocked, setIsSolutionUnlocked] = useState<boolean>(false);
  const [showMissionCompleteModal, setShowMissionCompleteModal] = useState<boolean>(false);
  const [lastExecutionRuntime, setLastExecutionRuntime] = useState<number>(24);

  // Execution & Terminal State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResponse, setRunResponse] = useState<CodeRunResponse | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<TerminalHistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isTerminalFocused, setIsTerminalFocused] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const terminalInputRef = useRef<HTMLInputElement | null>(null);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [interactiveSession, setInteractiveSession] = useState<{
    active: boolean;
    prompts: string[];
    collectedInputs: string[];
    currentStep: number;
  }>({
    active: false,
    prompts: [],
    collectedInputs: [],
    currentStep: 0,
  });
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

  // Auto-scroll Terminal canvas to bottom
  useEffect(() => {
    if (activeConsoleTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, isRunning, interactiveSession, activeConsoleTab]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };



  // 3. Load Problem, Restore Draft & Initialize Mentor Greeting
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const [prob, chapters, solved, savedDraft, layoutSettings] = await Promise.all([
          api.getChallenge(problemId),
          api.getChapters().catch(() => [] as ChapterGroup[]),
          persistence.getSolvedIds(),
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
        const isAlreadySolved = isProblemSolved(prob, resolvedSolved, flatProblems) || Boolean(prob.passed);
        if (isAlreadySolved) {
          stopTimer();
        }

        // Code restoration: Always load the problem's clean starter_code so the user solves it independently
        let initialCode = prob.starter_code;
        // Only restore draft if user actively edited their own code and it's not a pre-filled solution
        if (savedDraft && savedDraft.trim() !== '' && savedDraft !== prob.starter_code) {
          const rankedSols = getProblemRankedSolutions(prob);
          const isOfficialSolution = rankedSols.some(
            (s) => s.code.trim() === savedDraft.trim() || (s.code.trim().length > 15 && savedDraft.includes(s.code.trim()))
          );
          const isLeakedSolution = isOfficialSolution ||
                                  savedDraft.includes('while left < right and not') || 
                                  savedDraft.includes('cleaned == cleaned[::-1]') ||
                                  savedDraft.includes('words[::-1]') ||
                                  savedDraft.includes('counts[c] = counts.get');
          if (!isLeakedSolution) {
            initialCode = savedDraft;
          } else {
            // Clean out the stale/leaked solution from localStorage so it never re-appears
            persistence.saveDraft(problemId, prob.starter_code);
          }
        }
        setCode(initialCode);

        // Layout restore
        setConsoleCollapsed(layoutSettings.consoleCollapsed);
        await persistence.setLastActiveProblemId(problemId);

        // Solution is strictly locked until the user submits code and passes all test suites in this session
        setIsSolutionUnlocked(false);
      } catch (err) {
        console.error('Failed to load problem workspace:', err);
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

  // Monaco Editor Reference
  const monacoEditorRef = useRef<any>(null);

  // 6. Interactive VS Code Terminal & Code Pipeline
  const extractInputPrompts = (codeStr: string): string[] => {
    // Strip single-line comments to avoid matching commented-out inputs
    const cleanCode = codeStr.replace(/#.*$/gm, '');
    const regex = /input\s*\(\s*(?:(['"`])(.*?)\1)?\s*\)/g;
    const prompts: string[] = [];
    let match;
    while ((match = regex.exec(cleanCode)) !== null) {
      prompts.push(match[2] !== undefined ? match[2] : '');
    }
    return prompts;
  };

  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim() || isChatThinking) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: msgText,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatThinking(true);

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const lastErr = runResponse
        ? runResponse.passed_all
          ? null
          : (runResponse.test_results || []).find((t: any) => !t.passed)?.error || runResponse.stderr || 'Test case failed'
        : null;

      const res = await api.chatWithTutor(
        msgText,
        code,
        problem?.id,
        history,
        problem?.starter_code,
        lastErr || undefined
      );
      if (res?.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            sender: 'assistant',
            text: res.reply,
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: 'assistant',
          text: "I couldn't complete that request right now. Please try asking again!",
        },
      ]);
    } finally {
      setIsChatThinking(false);
    }
  };

  const executeWithStdin = async (
    stdinText: string,
    customCommand: string = 'python3 solution.py',
    interactivePrompts?: Array<{ prompt: string; value: string }>
  ) => {
    if (!problem || isRunning || isSubmitting) return;

    try {
      setIsRunning(true);
      setConsoleCollapsed(false);
      setActiveConsoleTab('terminal');

      const res = await api.runCode(problemId, code, stdinText);
      setRunResponse(res);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileDrawerOpen(true);
      }

      const exitCode = res.success ? 0 : 1;
      const duration = Math.round(res.execution_time_ms || 24);
      setLastExecutionRuntime(duration);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setTerminalHistory((prev) => [
        ...prev.slice(-25),
        {
          id: Math.random().toString(36).substring(7),
          command: customCommand,
          stdin: stdinText || undefined,
          interactivePrompts,
          stdout: res.stdout || '',
          stderr: res.stderr || (res.security_error ? `[Security Error] ${res.security_error}` : ''),
          exitCode,
          durationMs: duration,
          timestamp: timeStr,
        },
      ]);

      if (!res.success) {
        soundFX.playFailureThud();
      } else {
        soundFX.playSuccessChime();
      }
    } catch (err: any) {
      soundFX.playFailureThud();
      setTerminalHistory((prev) => [
        ...prev.slice(-25),
        {
          id: Math.random().toString(36).substring(7),
          command: customCommand,
          stdin: stdinText || undefined,
          interactivePrompts,
          stdout: '',
          stderr: `Execution error: ${err?.message || 'Failed to connect to runner'}.`,
          exitCode: 1,
          durationMs: 0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);
    } finally {
      setIsRunning(false);
      setInteractiveSession({ active: false, prompts: [], collectedInputs: [], currentStep: 0 });
      setTimeout(() => {
        terminalInputRef.current?.focus();
      }, 60);
    }
  };

  const handleRunCode = async (overrideStdin?: string) => {
    if (!problem || isRunning || isSubmitting) return;

    if (overrideStdin !== undefined) {
      await executeWithStdin(overrideStdin, 'python3 solution.py');
      return;
    }

    const prompts = extractInputPrompts(code);
    if (prompts.length > 0) {
      setConsoleCollapsed(false);
      setActiveConsoleTab('terminal');
      setInteractiveSession({
        active: true,
        prompts,
        collectedInputs: [],
        currentStep: 0,
      });
      setTerminalInput('');
      setTimeout(() => {
        terminalInputRef.current?.focus();
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
      return;
    }

    await executeWithStdin('', 'python3 solution.py');
  };

  const handleRunTestCases = async () => {
    if (!problem || isRunning || isSubmitting) return;

    try {
      setIsRunning(true);
      setConsoleCollapsed(false);
      setActiveConsoleTab('tests');

      const res = await api.runCode(problemId, code);
      setRunResponse(res);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileDrawerOpen(true);
      }

      const exitCode = res.success ? 0 : 1;
      const duration = Math.round(res.execution_time_ms || 24);
      setLastExecutionRuntime(duration);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const passedCount = res.test_results?.filter((t) => t.passed).length || 0;
      const totalCount = res.test_results?.length || 0;
      const testSummary = res.test_results && res.test_results.length > 0
        ? `rootdir: ~/Python\ncollected ${totalCount} items\n\n` +
          res.test_results.map((t) => `test_solution.py::test_case_${t.test_case_index} ${t.passed ? 'PASSED' : 'FAILED'}${!t.passed && t.actual_output ? ` (got: ${t.actual_output.trim()})` : ''}`).join('\n') +
          `\n\n============================== ${passedCount}/${totalCount} passed in ${(duration / 1000).toFixed(2)}s ==============================`
        : (res.stdout || '');

      setTerminalHistory((prev) => [
        ...prev.slice(-25),
        {
          id: Math.random().toString(36).substring(7),
          command: 'pytest tests/ -v',
          stdin: undefined,
          stdout: testSummary,
          stderr: res.stderr || (res.security_error ? `[Security Error] ${res.security_error}` : ''),
          exitCode,
          durationMs: duration,
          timestamp: timeStr,
        },
      ]);

      if (!res.success || (res.test_results && res.test_results.some((t) => !t.passed))) {
        soundFX.playFailureThud();
      } else {
        soundFX.playSuccessChime();
      }
    } catch (err: any) {
      soundFX.playFailureThud();
      setTerminalHistory((prev) => [
        ...prev.slice(-25),
        {
          id: Math.random().toString(36).substring(7),
          command: 'pytest tests/ -v',
          stdin: undefined,
          stdout: '',
          stderr: `Execution error: ${err?.message || 'Failed to connect to runner'}.`,
          exitCode: 1,
          durationMs: 0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleInteractiveInputSubmit = () => {
    const currentVal = terminalInput;
    const nextCollected = [...interactiveSession.collectedInputs, currentVal];
    const nextStep = interactiveSession.currentStep + 1;

    if (nextStep < interactiveSession.prompts.length) {
      setInteractiveSession((prev) => ({
        ...prev,
        collectedInputs: nextCollected,
        currentStep: nextStep,
      }));
      setTerminalInput('');
    } else {
      const promptsWithValues = interactiveSession.prompts.map((p, idx) => ({
        prompt: p,
        value: nextCollected[idx] || '',
      }));
      const fullStdin = nextCollected.join('\n');
      setInteractiveSession({ active: false, prompts: [], collectedInputs: [], currentStep: 0 });
      setTerminalInput('');
      executeWithStdin(fullStdin, 'python3 solution.py', promptsWithValues);
    }
  };

  const handleTerminalCommandSubmit = () => {
    const trimmed = terminalInput.trim();
    setTerminalInput('');

    if (trimmed) {
      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
    }

    if (!trimmed) {
      handleRunCode();
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (trimmed === 'clear' || trimmed === 'cls') {
      setTerminalHistory([]);
      return;
    }

    if (trimmed === 'pwd') {
      setTerminalHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: trimmed,
          stdout: '~/Python',
          stderr: '',
          exitCode: 0,
          durationMs: 4,
          timestamp: timeStr,
        },
      ]);
      return;
    }

    if (trimmed === 'whoami') {
      setTerminalHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: trimmed,
          stdout: 'developer',
          stderr: '',
          exitCode: 0,
          durationMs: 3,
          timestamp: timeStr,
        },
      ]);
      return;
    }

    if (trimmed === 'ls' || trimmed === 'dir') {
      setTerminalHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: trimmed,
          stdout: 'solution.py   test_cases.py   README.md',
          stderr: '',
          exitCode: 0,
          durationMs: 6,
          timestamp: timeStr,
        },
      ]);
      return;
    }

    if (trimmed === 'python --version' || trimmed === 'python3 --version' || trimmed === 'py --version') {
      setTerminalHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: trimmed,
          stdout: 'Python 3.12.3',
          stderr: '',
          exitCode: 0,
          durationMs: 8,
          timestamp: timeStr,
        },
      ]);
      return;
    }

    if (trimmed === 'date') {
      setTerminalHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: trimmed,
          stdout: new Date().toString(),
          stderr: '',
          exitCode: 0,
          durationMs: 3,
          timestamp: timeStr,
        },
      ]);
      return;
    }

    if (trimmed.startsWith('echo ')) {
      const echoText = trimmed.replace(/^echo\s+/, '').replace(/^["']|["']$/g, '');
      setTerminalHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: trimmed,
          stdout: echoText,
          stderr: '',
          exitCode: 0,
          durationMs: 3,
          timestamp: timeStr,
        },
      ]);
      return;
    }

    if (trimmed === 'help') {
      setTerminalHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: 'help',
          stdout: `VS Code Terminal Commands:\n  python3 solution.py     Run current Python code in sandbox\n  pytest                  Run test cases\n  clear                   Clear terminal scrollback (Ctrl+L)\n  pwd, ls, whoami, echo   Standard shell utilities\n  <value>                 Pass input directly to script stdin`,
          stderr: '',
          exitCode: 0,
          durationMs: 0,
          timestamp: timeStr,
        },
      ]);
      return;
    }

    if (trimmed === 'pytest' || trimmed === 'pytest tests/' || trimmed === 'test') {
      handleRunTestCases();
      return;
    }

    if (trimmed === 'python' || trimmed === 'python3' || trimmed === 'run') {
      handleRunCode();
      return;
    }

    if (trimmed.startsWith('python3 solution.py') || trimmed.startsWith('python solution.py')) {
      const customArg = trimmed.replace(/^python3?\s+solution\.py\s*/, '').trim();
      if (customArg) {
        executeWithStdin(customArg, trimmed);
      } else {
        handleRunCode();
      }
      return;
    }

    // Treat arbitrary input typed at prompt as custom stdin
    executeWithStdin(trimmed, `python3 solution.py << '${trimmed}'`);
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
      return;
    }

    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      setTerminalHistory([]);
      return;
    }

    if (e.key === 'Escape' || (e.ctrlKey && (e.key === 'c' || e.key === 'C'))) {
      e.preventDefault();
      if (interactiveSession.active) {
        setInteractiveSession({ active: false, prompts: [], collectedInputs: [], currentStep: 0 });
        setTerminalInput('');
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTerminalHistory((prev) => [
          ...prev.slice(-25),
          {
            id: Math.random().toString(36).substring(7),
            command: 'python3 solution.py',
            stdout: '^C',
            stderr: '',
            exitCode: 130,
            durationMs: 0,
            timestamp: timeStr,
          },
        ]);
      }
    }
  };

  // 7. Submit Code Pipeline with Mission Complete Celebration
  const handleSubmitCode = async () => {
    if (!problem || isRunning || isSubmitting) return;

    // Freeze mission timer immediately upon clicking Submit
    stopTimer();

    try {
      setIsSubmitting(true);
      setIsSubmitting(true);
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
        const canonicalNum = problem.level_number || (problem.id > 150 ? problem.id - 150 : problem.id);
        setSolvedIds((prev) => Array.from(new Set([...prev, canonicalNum, problem.id])));
        await persistence.markSolved(canonicalNum);
        if (problem.id && problem.id !== canonicalNum) {
          await persistence.markSolved(problem.id);
        }

        // Auto-advance lastActiveProblemId to next challenge so dashboard resumes next problem
        const nextId = canonicalNum + 1;
        if (nextId <= (allProblems.length || 70)) {
          await persistence.setLastActiveProblemId(nextId);
        }

        window.dispatchEvent(new CustomEvent('pyforge_problem_solved', { detail: { problemId: canonicalNum } }));
        setShowMissionCompleteModal(true);
      } else {
        soundFX.playFailureThud();
      }

      const runRes = await api.runCode(problemId, code);
      setRunResponse(runRes);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileDrawerOpen(true);
      }
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
      onRun: () => handleRunCode(),
      onSubmit: handleSubmitCode,
      onToggleConsole: () => setConsoleCollapsed((p) => !p),
      onOpenCommandPalette: () => setCommandPaletteOpen(true),
    });
    return unregister;
  }, [handleRunCode, handleSubmitCode]);

  const isCurrentProblemSolved = solvedIds.includes(problemId) || problem?.passed;

  return (
    <div className="h-[calc(100dvh-48px)] max-h-[calc(100dvh-48px)] md:h-[calc(100vh-48px)] md:max-h-[calc(100vh-48px)] flex flex-col bg-[#070A0F] text-[#E6EDF3] overflow-hidden select-none">

      {/* 1. Futuristic Mission Sub-Header (Compact Responsive Header) */}
      <header className="h-12 md:h-13 border-b border-[#21262D] bg-[#0E131C]/90 backdrop-blur-md px-3 md:px-4 flex items-center justify-between gap-2 md:gap-3 shrink-0 z-20">
        {/* Left: Curriculum Back Link, Prev/Next Navigation, Challenge Info */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 md:flex-initial">
          <Link
            href={`/quest?track=${problemId <= 50 ? 'basics' : 'advanced'}`}
            className="p-1.5 md:p-2 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors shrink-0"
            title="Back to Curriculum"
          >
            <ArrowLeft className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Link>

          {/* Quick Challenge Stepper */}
          <div className="flex items-center gap-1.5 md:gap-2 border border-white/10 rounded-lg bg-[#111622] px-2 py-0.5 md:px-2.5 md:py-1 text-xs md:text-sm font-mono shrink-0">
            <button
              onClick={() => router.push(`/quest/${problemId - 1}`)}
              disabled={problemId <= 1}
              className="text-[#8B949E] hover:text-[#E6EDF3] disabled:opacity-30 px-1 py-0.5 rounded transition-colors font-semibold"
              title="Previous Challenge"
            >
              ‹
            </button>
            <span className="text-[#30363D]">|</span>
            <span className="font-bold text-[#58A6FF]">#{problem?.level_number || problemId}</span>
            <span className="text-[#30363D]">|</span>
            <button
              onClick={() => router.push(`/quest/${problemId + 1}`)}
              disabled={problemId >= (allProblems.length > 0 ? allProblems.length : 70)}
              className="text-[#8B949E] hover:text-[#E6EDF3] disabled:opacity-30 disabled:cursor-not-allowed px-1 py-0.5 rounded transition-colors font-semibold cursor-pointer"
              title="Next Challenge"
            >
              ›
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="text-sm md:text-lg font-bold text-[#E6EDF3] truncate">
              {problem?.title || 'Loading challenge...'}
            </span>
            {problem && (
              <span className="hidden sm:inline-flex">
                <DifficultyBadge difficulty={problem.difficulty} size="sm" />
              </span>
            )}
            {(problemId >= 51 || (problem?.chapter_id && problem.chapter_id >= 11)) && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#1F6FEB]/15 text-[#58A6FF] border border-[#1F6FEB]/30 font-semibold shrink-0">
                <Zap className="h-3 w-3 text-amber-400" />
                Advanced
              </span>
            )}
            {isCurrentProblemSolved && (
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                <Check className="h-3 w-3" /> <span className="hidden sm:inline">Solved</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Mission Timer (Desktop) */}
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

        {/* Mobile Timer Pill */}
        <div className="flex md:hidden items-center gap-1.5 px-2 py-1 rounded-md bg-[#111622] border border-white/5 text-xs font-mono text-[#8B949E] shrink-0">
          <Clock className="h-3 w-3 text-[#58A6FF]" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Right: Code Actions (Reset, Run, Submit) — Desktop Only */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={handleResetCode}
            className="p-2 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
            title="Reset code template"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => handleRunCode()}
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

      {/* 2. Desktop Workspace Layout (MD+ Only): 2 Focused Panes (Mentor Cockpit + Editor & Terminal) */}
      <div className="hidden md:flex flex-1 overflow-hidden relative min-h-0">

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

            {/* Tab 2: AI Chatbot */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-[#1F6FEB]/20 text-[#58A6FF] border border-[#1F6FEB]/40 shadow-sm'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22]'
              }`}
            >
              <Bot className="w-4 h-4 text-[#58A6FF]" />
              <span>AI Chat</span>
            </button>

            {/* Tab 2: Solution */}
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

            {/* Tab 3: Interview Q&A */}
            <button
              onClick={() => setActiveTab('interview')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'interview'
                  ? isSolutionUnlocked
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                    : 'bg-[#D29922]/20 text-[#D29922] border border-[#D29922]/40 shadow-sm'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22]'
              }`}
            >
              {isSolutionUnlocked ? (
                <Briefcase className="w-4 h-4 text-purple-400" />
              ) : (
                <Lock className="w-4 h-4 text-[#D29922]" />
              )}
              <span>Interview Q&A</span>
            </button>
          </div>

          {/* Cockpit Content Panes */}
          <div className="flex-1 overflow-hidden">

            {/* VIEW 1: CHATBOT */}
            {activeTab === 'chat' && (
              <ChatbotPanel
                messages={chatMessages}
                isThinking={isChatThinking}
                onSendMessage={handleSendChatMessage}
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
                isSolved={isSolutionUnlocked}
                onClose={() => setActiveTab('spec')}
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

          {/* Real Interactive VS Code Terminal Console Dock */}
          {!consoleCollapsed && (
            <div
              className={`border-t border-[#2b2b2b] bg-[#181818] flex flex-col shrink-0 transition-all duration-200 select-text ${
                dockHeight === 'expanded' ? 'h-80' : 'h-64'
              }`}
            >
              {/* VS Code Terminal Dock Header */}
              <div className="h-[35px] border-b border-[#2b2b2b] bg-[#181818] px-3 flex items-center justify-between shrink-0 select-none">
                {/* Left Tabs (VS Code Panel Tabs) */}
                <div className="flex items-center h-full gap-4 text-[11px] font-sans font-medium tracking-wide">
                  <button
                    onClick={() => setActiveConsoleTab('terminal')}
                    className={`h-full flex items-center gap-1.5 px-0.5 transition-colors cursor-pointer relative ${
                      activeConsoleTab === 'terminal'
                        ? 'text-[#ffffff] border-b-2 border-[#007acc]'
                        : 'text-[#969696] hover:text-[#cccccc]'
                    }`}
                  >
                    <span>TERMINAL</span>
                    {interactiveSession.active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    {isRunning && (
                      <span className="flex items-center gap-1 text-[10px] text-[#38bdf8] font-mono lowercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                        running
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveConsoleTab('tests')}
                    className={`h-full flex items-center gap-1.5 px-0.5 transition-colors cursor-pointer relative ${
                      activeConsoleTab === 'tests'
                        ? 'text-[#ffffff] border-b-2 border-[#007acc]'
                        : 'text-[#969696] hover:text-[#cccccc]'
                    }`}
                  >
                    <span>TEST CASES</span>
                    {runResponse?.test_results && runResponse.test_results.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b2b2b] text-[#cccccc]">
                        {runResponse.test_results.filter((t) => t.passed).length}/{runResponse.test_results.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Right Action Toolbar (VS Code Terminal Actions) */}
                <div className="flex items-center gap-1 text-[#cccccc]">
                  {/* Active Terminal / Shell Dropdown Badge */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[#2b2b2b] text-[#cccccc] text-xs font-mono transition-colors cursor-pointer mr-1">
                    <Terminal className="h-3.5 w-3.5 text-[#858585]" />
                    <span className="text-[11px]">1: zsh</span>
                  </div>

                  {/* Run Code / Run Tests Quick Action */}
                  <button
                    onClick={handleRunTestCases}
                    disabled={isRunning || isSubmitting}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#cccccc] hover:bg-[#2b2b2b] hover:text-white transition-colors cursor-pointer disabled:opacity-40 mr-1"
                    title="Run visible test cases"
                  >
                    <Play className="h-3 w-3 fill-current text-[#4ec9b0]" />
                    <span className="text-[11px]">Run Tests</span>
                  </button>

                  {/* Clear Terminal Icon */}
                  <button
                    onClick={() => setTerminalHistory([])}
                    className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#2b2b2b] transition-colors cursor-pointer"
                    title="Clear Terminal (Ctrl+L)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Expand / Minimize Height */}
                  <button
                    onClick={() => setDockHeight((p) => (p === 'normal' ? 'expanded' : 'normal'))}
                    className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#2b2b2b] transition-colors cursor-pointer"
                    title={dockHeight === 'expanded' ? 'Collapse Terminal' : 'Maximize Terminal'}
                  >
                    {dockHeight === 'expanded' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  </button>

                  {/* Close Terminal Dock */}
                  <button
                    onClick={() => setConsoleCollapsed(true)}
                    className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#2b2b2b] transition-colors cursor-pointer"
                    title="Close Terminal Panel (Ctrl+J)"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* VS Code Terminal Shell Canvas */}
              <div
                onClick={() => terminalInputRef.current?.focus()}
                className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-[1.45] text-[#cccccc] bg-[#181818] cursor-text selection:bg-[#264f78]"
                style={{
                  fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
                }}
              >
                {/* 1. Terminal Stream Tab */}
                {activeConsoleTab === 'terminal' && (
                  <div className="space-y-1">
                    {/* Command History Stream */}
                    {terminalHistory.map((item) => (
                      <div key={item.id} className="space-y-0.5">
                        {/* Authentic zsh Prompt */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#22c55e] font-bold select-none">➜</span>
                          <span className="text-[#38bdf8] font-medium select-none">Python</span>
                          <span className="text-[#22c55e] select-none">❯</span>
                          <span className="text-[#ffffff] ml-1">{item.command}</span>
                        </div>

                        {/* Interactive Prompts / Stdin echo */}
                        {item.interactivePrompts && item.interactivePrompts.length > 0 && (
                          <div className="space-y-0.5 text-[#cccccc]">
                            {item.interactivePrompts.map((ip, idx) => (
                              <div key={idx} className="flex items-baseline">
                                <span>{ip.prompt || 'Input: '}</span>
                                <span className="text-[#ffffff] ml-1">{ip.value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Stdout Output (natural terminal formatting) */}
                        {item.stdout && (
                          <pre className="text-[#cccccc] whitespace-pre-wrap font-mono m-0 p-0 leading-[1.45]">
                            {item.stdout}
                          </pre>
                        )}

                        {/* Stderr Output (VS Code red text) */}
                        {item.stderr && (
                          <pre className="text-[#f48771] whitespace-pre-wrap font-mono m-0 p-0 leading-[1.45]">
                            {item.stderr}
                          </pre>
                        )}

                        {(item.exitCode !== 0 || !!item.stderr) && (
                          <div className="pt-1 pb-0.5 flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-[#858585] font-mono">• exit {item.exitCode}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Interactive Active Session (Waiting for Python input() prompt) */}
                    {interactiveSession.active && (
                      <div className="space-y-0.5 pt-0.5">
                        {/* Command line */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#22c55e] font-bold select-none">➜</span>
                          <span className="text-[#38bdf8] font-medium select-none">Python</span>
                          <span className="text-[#22c55e] select-none">❯</span>
                          <span className="text-[#ffffff] ml-1">python3 solution.py</span>
                        </div>

                        {/* Previously answered prompts in this run */}
                        {interactiveSession.collectedInputs.map((val, idx) => (
                          <div key={idx} className="flex items-baseline text-[#cccccc]">
                            <span>{interactiveSession.prompts[idx] || 'Input: '}</span>
                            <span className="text-[#ffffff] ml-1">{val}</span>
                          </div>
                        ))}

                        {/* Current Interactive input prompt line */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleInteractiveInputSubmit();
                          }}
                          className="flex items-center flex-wrap"
                        >
                          <span className="text-[#cccccc]">
                            {interactiveSession.prompts[interactiveSession.currentStep] || 'Enter input: '}
                          </span>
                          <div className="relative inline-flex items-center ml-1 flex-1">
                            <input
                              ref={terminalInputRef}
                              type="text"
                              value={terminalInput}
                              onChange={(e) => setTerminalInput(e.target.value)}
                              onKeyDown={handleTerminalKeyDown}
                              onFocus={() => setIsTerminalFocused(true)}
                              onBlur={() => setIsTerminalFocused(false)}
                              autoFocus
                              spellCheck={false}
                              autoComplete="off"
                              className="w-full bg-transparent border-none outline-none text-[#ffffff] font-mono text-[13px] p-0 m-0 caret-[#ffffff]"
                            />
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Active Running State (Executing sandbox command) */}
                    {isRunning && !interactiveSession.active && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#22c55e] font-bold select-none animate-pulse">➜</span>
                          <span className="text-[#38bdf8] font-medium select-none">Python</span>
                          <span className="text-[#22c55e] select-none">❯</span>
                          <span className="text-[#ffffff] ml-1">python3 solution.py</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#858585] pl-1 font-mono">
                          <span className="inline-block w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                          <span>Running in sandbox...</span>
                        </div>
                      </div>
                    )}

                    {/* Ready Prompt (Exact VS Code prompt line with cursor) */}
                    {!isRunning && !interactiveSession.active && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleTerminalCommandSubmit();
                        }}
                        className="flex items-center gap-1.5 flex-wrap pt-0.5"
                      >
                        <span className="text-[#22c55e] font-bold select-none">➜</span>
                        <span className="text-[#38bdf8] font-medium select-none">Python</span>
                        <span className="text-[#22c55e] select-none">❯</span>
                        <div className="relative inline-flex items-center ml-1 flex-1">
                          <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={handleTerminalKeyDown}
                            onFocus={() => setIsTerminalFocused(true)}
                            onBlur={() => setIsTerminalFocused(false)}
                            spellCheck={false}
                            autoComplete="off"
                            className="w-full bg-transparent border-none outline-none text-[#ffffff] font-mono text-[13px] p-0 m-0 caret-[#ffffff]"
                          />
                        </div>
                      </form>
                    )}

                    <div ref={terminalEndRef} />
                  </div>
                )}

                {/* 2. Test Cases Tab */}
                {activeConsoleTab === 'tests' && (
                  <div className="space-y-3 font-sans text-xs">
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
                            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#094771] text-white border border-[#007acc]'
                                : 'bg-[#252526] text-[#cccccc] hover:bg-[#2d2d2d] border border-transparent'
                            }`}
                          >
                            {result !== undefined && (
                              <span className={`w-2 h-2 rounded-full ${result.passed ? 'bg-[#4ec9b0]' : 'bg-[#f48771]'}`} />
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
                        <div className="p-3 rounded border border-[#2b2b2b] bg-[#1e1e1e] space-y-2 font-mono text-xs">
                          {testCase?.input && (
                            <div>
                              <span className="text-[#858585] text-[11px] block font-sans">Input:</span>
                              <div className="p-2 rounded bg-[#181818] border border-[#2b2b2b] text-[#9cdcfe] mt-1 font-mono">{testCase.input}</div>
                            </div>
                          )}
                          <div>
                            <span className="text-[#858585] text-[11px] block font-sans">Expected:</span>
                            <div className="p-2 rounded bg-[#181818] border border-[#2b2b2b] text-[#4ec9b0] mt-1 font-mono">
                              {result?.expected_output || testCase?.expected || 'Output value'}
                            </div>
                          </div>
                          {result && (
                            <div>
                              <span className="text-[#858585] text-[11px] block font-sans">Your Output:</span>
                              <div className={`p-2 rounded mt-1 font-mono border ${result.passed ? 'bg-[#181818] text-[#4ec9b0] border-[#4ec9b0]/30' : 'bg-[#181818] text-[#f48771] border-[#f48771]/30'}`}>
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

      {/* 3. Mobile Workspace Layout (< MD Only) */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-hidden relative bg-[#070A0F]">
        {/* Mobile Segmented Mode Switcher */}
        <div className="h-11 border-b border-[#21262D] bg-[#111622] px-2 py-1.5 flex items-center gap-1.5 shrink-0 select-none">
          <button
            onClick={() => setMobileTab('spec')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'spec'
                ? 'bg-[#21262D] text-[#58A6FF] border border-[#30363D] shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Problem</span>
          </button>

          <button
            onClick={() => setMobileTab('code')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'code'
                ? 'bg-[#1F6FEB]/20 text-[#58A6FF] border border-[#1F6FEB]/40 shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            onClick={() => setMobileTab('interview')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'interview'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Interview</span>
          </button>
        </div>

        {/* Mobile Tab 1: Problem Spec */}
        {mobileTab === 'spec' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#070A0F] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
              <div>
                <h2 className="text-xl font-bold text-[#E6EDF3] tracking-tight mb-1">
                  {problem?.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8B949E]">
                    {problem?.chapter_title}
                  </span>
                  {problem && <DifficultyBadge difficulty={problem.difficulty} size="sm" />}
                </div>
              </div>

              {/* Problem Story & Objective */}
              <div className="prose prose-invert max-w-none text-[#E6EDF3] text-sm leading-relaxed">
                <p>{problem?.story || problem?.objective}</p>
              </div>

              {problem?.objective && (
                <div className="rounded-xl border border-white/10 bg-[#161B22]/70 p-3.5 space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#58A6FF] uppercase tracking-wider block">
                    Target Objective
                  </span>
                  <p className="text-sm text-[#E6EDF3] leading-relaxed">
                    {problem.objective}
                  </p>
                </div>
              )}

              {/* Examples */}
              {problem?.visible_test_cases && problem.visible_test_cases.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8B949E] font-bold block">
                    Examples
                  </span>
                  {problem.visible_test_cases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#30363D] bg-[#0D1117] p-3 space-y-2 font-mono text-xs"
                    >
                      <div className="text-[10px] text-[#8B949E] uppercase font-bold">
                        Example {idx + 1}
                      </div>
                      {tc.input && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#8B949E]">Input:</span>
                          <div className="p-2 rounded bg-[#161B22] text-[#58A6FF] font-semibold break-all">
                            {tc.input}
                          </div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#8B949E]">Expected Output:</span>
                        <div className="p-2 rounded bg-[#161B22] text-emerald-400 font-semibold break-all">
                          {tc.expected}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              <div className="rounded-xl border border-white/5 bg-[#161B22]/40 p-3.5 space-y-1 text-xs text-[#8B949E]">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6EDF3] font-bold block">
                  Execution Constraints
                </span>
                <p>• Python 3.12 Sandboxed Runtime</p>
                <p>• Execution Timeout: 3,000ms</p>
                <p>• Restricted libraries: `os`, `sys`, `subprocess`</p>
              </div>
            </div>

            {/* Bottom Action: Jump to Code */}
            <div className="border-t border-[#21262D] bg-[#0E131C] p-3 shrink-0">
              <button
                onClick={() => setMobileTab('code')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1F6FEB] to-[#38BDF8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-950/40 cursor-pointer"
              >
                <span>Open Code Editor</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Tab 2: Code Editor (Distraction-free, No Terminal cluttering screen) */}
        {mobileTab === 'code' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#080B12] overflow-hidden relative">
            {/* Editor Sub-Bar */}
            <div className="h-8 px-3 border-b border-[#21262D] bg-[#0E131C] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#E6EDF3]">solution.py</span>
                <span className="text-[10px] text-[#8B949E] font-mono">Python 3.12</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1 rounded text-[#8B949E] hover:text-white transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {runResponse?.test_results && runResponse.test_results.length > 0 && (
                  <button
                    onClick={() => setMobileDrawerOpen(true)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer ${
                      runResponse.test_results.every((t) => t.passed)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    <span>
                      {runResponse.test_results.filter((t) => t.passed).length}/
                      {runResponse.test_results.length} Tests
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Full-Height Mobile Monaco Editor (Distraction-Free, No Symbol Bar) */}
            <div className="flex-1 relative min-h-0 bg-[#080B12] pb-24">
              <MonacoEditor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                onMount={(editor) => {
                  monacoEditorRef.current = editor;
                }}
                options={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                  fontSize: 13,
                  lineHeight: 21,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  insertSpaces: true,
                  padding: { top: 12, bottom: 84 },
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  fontLigatures: true,
                  wordWrap: 'on',
                }}
              />
            </div>

            {/* Floating Ultra-Premium Mobile Action Dock (Guaranteed 100% Visible & Pinned to Viewport) */}
            <div className="fixed bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2.5 p-2 px-3 rounded-2xl bg-[#161B22]/95 backdrop-blur-xl border border-[#30363D] shadow-2xl shadow-black/90">
              <button
                onClick={handleResetCode}
                className="p-3 rounded-xl border border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-white active:scale-95 transition-all cursor-pointer shrink-0 shadow-inner"
                title="Reset code"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleRunTestCases()}
                disabled={isRunning || isSubmitting}
                className="flex-1 py-3 px-3.5 rounded-xl border border-[#30363D] bg-[#21262D] hover:bg-[#30363D] active:scale-[0.98] text-xs font-bold text-[#E6EDF3] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-[#58A6FF]" />
                ) : (
                  <Play className="h-4 w-4 fill-current text-emerald-400" />
                )}
                <span>Run</span>
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="flex-[1.6] py-3 px-4 rounded-xl bg-gradient-to-r from-[#238636] via-[#2EA043] to-[#3FB950] hover:from-[#2EA043] hover:to-[#3FB950] active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all disabled:opacity-50 cursor-pointer relative overflow-hidden"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-white shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 stroke-[3] text-white" />
                  </div>
                )}
                <span className="tracking-wide uppercase text-[11px]">Submit Solution</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Tab 3: Interview Q&A */}
        {mobileTab === 'interview' && problem && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#070A0F] overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <InterviewPanel
                problem={problem}
                isSolved={isSolutionUnlocked}
                onClose={() => setMobileTab('code')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Test Results Bottom Sheet / Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="flex-1"
            aria-hidden="true"
          />
          <div className="bg-[#161B22] border-t border-[#30363D] rounded-t-2xl max-h-[82vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-[#21262D] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {runResponse?.success &&
                (!runResponse.test_results || runResponse.test_results.every((t) => t.passed)) ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Check className="h-5 w-5 bg-emerald-500/20 rounded-full p-1 border border-emerald-500/40" />
                    <span>All Test Cases Passed!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <X className="h-5 w-5 bg-red-500/20 rounded-full p-1 border border-red-500/40" />
                    <span>
                      {runResponse?.test_results
                        ? `${runResponse.test_results.filter((t) => t.passed).length}/${runResponse.test_results.length} Tests Passed`
                        : 'Execution Finished'}
                    </span>
                  </div>
                )}
                {lastExecutionRuntime > 0 && (
                  <span className="text-[11px] font-mono text-[#8B949E]">
                    {lastExecutionRuntime}ms
                  </span>
                )}
              </div>

              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sheet Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Test Case Selection Pills */}
              {problem?.visible_test_cases && problem.visible_test_cases.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {problem.visible_test_cases.map((_, idx) => {
                    const res = runResponse?.test_results?.[idx];
                    const isSelected = selectedCaseIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCaseIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1F6FEB] text-white'
                            : 'bg-[#21262D] text-[#8B949E] border border-[#30363D]'
                        }`}
                      >
                        {res !== undefined && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              res.passed ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                        )}
                        <span>Case {idx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected Test Case Details */}
              {(() => {
                const result = runResponse?.test_results?.[selectedCaseIndex];
                const testCase = problem?.visible_test_cases?.[selectedCaseIndex];

                return (
                  <div className="p-3.5 rounded-xl border border-[#30363D] bg-[#0D1117] space-y-3 font-mono text-xs">
                    {testCase?.input && (
                      <div>
                        <span className="text-[#8B949E] text-[11px] block font-sans font-semibold mb-1">
                          Input:
                        </span>
                        <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] text-[#58A6FF] font-semibold break-all">
                          {testCase.input}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[#8B949E] text-[11px] block font-sans font-semibold mb-1">
                        Expected Output:
                      </span>
                      <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] text-emerald-400 font-semibold break-all">
                        {result?.expected_output || testCase?.expected || 'Output value'}
                      </div>
                    </div>

                    {result && (
                      <div>
                        <span className="text-[#8B949E] text-[11px] block font-sans font-semibold mb-1">
                          Your Output:
                        </span>
                        <div
                          className={`p-2.5 rounded-lg font-semibold break-all border ${
                            result.passed
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-950/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {result.actual_output || '(no output)'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Optional Console Output Toggle */}
              <div className="pt-1">
                <button
                  onClick={() => setShowMobileConsoleLogs((p) => !p)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#30363D] bg-[#161B22] text-xs font-semibold text-[#8B949E] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[#58A6FF]" />
                    <span>Console Logs & Diagnostics</span>
                  </div>
                  {showMobileConsoleLogs ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showMobileConsoleLogs && (
                  <div className="mt-2 p-3 rounded-xl bg-[#0D1117] border border-[#21262D] font-mono text-xs text-[#C9D1D9] max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {runResponse?.stdout || runResponse?.stderr || 'No console log output recorded.'}
                  </div>
                )}
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="p-3 border-t border-[#21262D] bg-[#0E131C] flex items-center gap-2">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Code Editor
              </button>
            </div>
          </div>
        </div>
      )}

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
