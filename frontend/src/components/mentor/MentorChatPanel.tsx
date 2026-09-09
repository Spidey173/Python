'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Sparkles, Send, Lightbulb, Compass, HelpCircle,
  CheckCircle2, AlertCircle, ArrowRight, Code2, RefreshCw,
  Cpu, Zap, BookOpen, Lock, Unlock, Volume2, VolumeX
} from 'lucide-react';
import { ChallengeDetail } from '@/lib/types';
import {
  MentorMessage,
  HintTier,
} from '@/lib/mentor-engine';
import { soundFX } from '@/lib/audio';

interface MentorChatPanelProps {
  problem: ChallengeDetail;
  currentCode: string;
  messages: MentorMessage[];
  hintTier: HintTier;
  isThinking: boolean;
  thinkingPhase: string;
  isSolutionUnlocked: boolean;
  onOpenSolutionVault: () => void;
  onRequestHint: (tier: HintTier) => void;
  onRequestConcept: () => void;
  onRequestExample: () => void;
  onSendCustomPrompt: (prompt: string) => void;
}

// Clean Formatted Text Renderer (strips raw asterisks, formats bold/italic/code cleanly)
function renderFormattedText(text: string) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-1" />;

        // Clean out literal raw ** and * from the text
        const cleanText = trimmed
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1');

        const isHeader = trimmed.startsWith('Tier ') || trimmed.startsWith('🧠') || trimmed.startsWith('💡') || trimmed.startsWith('**');
        if (isHeader) {
          return (
            <div key={lIdx} className="font-bold text-[#E6EDF3] text-xs sm:text-sm tracking-wide pt-0.5">
              {cleanText}
            </div>
          );
        }

        const isQuestionOrNote = trimmed.startsWith('*') && trimmed.endsWith('*');
        if (isQuestionOrNote) {
          return (
            <p key={lIdx} className="text-xs italic text-[#8B949E] pt-0.5">
              {cleanText}
            </p>
          );
        }

        // Inline backticks `code` handling
        const parts = cleanText.split(/(`[^`]+`)/g);
        return (
          <p key={lIdx} className="text-sm sm:text-base leading-relaxed">
            {parts.map((part, pIdx) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={pIdx} className="px-1.5 py-0.5 mx-0.5 rounded bg-[#0D1117] border border-[#30363D] font-mono text-[#58A6FF] text-xs sm:text-sm">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export const MentorChatPanel: React.FC<MentorChatPanelProps> = ({
  problem,
  currentCode,
  messages,
  hintTier,
  isThinking,
  thinkingPhase,
  isSolutionUnlocked,
  onOpenSolutionVault,
  onRequestHint,
  onRequestConcept,
  onRequestExample,
  onSendCustomPrompt,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or streaming update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    const prompt = inputText.trim();
    setInputText('');
    onSendCustomPrompt(prompt);
  };

  const toggleMute = () => {
    const next = soundFX.toggleMute();
    setIsMuted(next);
  };

  const getNextHintTier = (): HintTier => {
    if (hintTier >= 5) return 5;
    return (hintTier + 1) as HintTier;
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F17]/95 backdrop-blur-xl border-r border-[#21262D] overflow-hidden select-none">
      {/* 1. Mentor HUD Header */}
      <div className="h-14 px-4 border-b border-[#21262D] bg-[#111622]/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Holographic Glowing Mentor Avatar */}
          <div className="relative">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-lg transition-colors ${isThinking
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              }`}>
              <Bot className="w-5 h-5" />
            </div>
            {/* Online Status Dot */}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#161B22] ${isThinking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-[#E6EDF3] tracking-tight">Mentor</span>
            </div>
            <span className="text-xs text-[#8B949E] font-medium block">
              {isThinking ? thinkingPhase || 'Analyzing solution...' : 'Observing code • Ready to coach'}
            </span>
          </div>
        </div>

        {/* Audio Mute Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
            title={isMuted ? 'Unmute audio effects' : 'Mute audio effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#58A6FF]" />}
          </button>
        </div>
      </div>

      {/* 2. Quick Action Chips — Clean & Legible */}
      <div className="px-4 py-2.5 border-b border-[#21262D] bg-[#0E131E]/80 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => onRequestHint(1)}
            disabled={isThinking}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#161B22] hover:bg-[#21262D] hover:border-[#D29922] text-xs font-bold text-[#E6EDF3] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#D29922]" />
            <span>Tiny Hint</span>
          </button>

          <button
            onClick={() => onRequestHint(getNextHintTier())}
            disabled={isThinking || hintTier >= 5}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#161B22] hover:bg-[#21262D] hover:border-[#58A6FF] text-xs font-bold text-[#E6EDF3] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Compass className="w-3.5 h-3.5 text-[#58A6FF]" />
            <span>Bigger Clue</span>
          </button>

          <button
            onClick={onRequestConcept}
            disabled={isThinking}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#161B22] hover:bg-[#21262D] hover:border-[#A371F7] text-xs font-bold text-[#E6EDF3] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#A371F7]" />
            <span>Concept</span>
          </button>

          <button
            onClick={onRequestExample}
            disabled={isThinking}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#161B22] hover:bg-[#21262D] hover:border-emerald-400 text-xs font-bold text-[#E6EDF3] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Example</span>
          </button>
        </div>
      </div>

      {/* 3. Chat Message Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 select-text">
        {messages.map((msg) => {
          const isMentor = msg.sender === 'mentor';
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 animate-fadeIn ${isUser ? 'items-end' : 'items-start'
                }`}
            >
              {/* Sender Name & Mood */}
              <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E] px-1">
                {isMentor && (
                  <>
                    <Bot className="w-3.5 h-3.5 text-[#58A6FF]" />
                    <span className="font-bold text-[#58A6FF]">Mentor</span>
                    <span>•</span>
                    <span className="capitalize text-xs text-[#8B949E]">
                      {msg.mood || 'coaching'}
                    </span>
                  </>
                )}
                {isUser && <span className="font-bold text-[#8B949E]">You</span>}
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[94%] sm:max-w-[90%] rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed shadow-md ${isUser
                    ? 'bg-[#1F6FEB] text-white rounded-tr-sm font-medium'
                    : 'bg-[#161B22]/90 border border-white/10 text-[#F0F6FC] rounded-tl-sm backdrop-blur-md'
                  }`}
              >
                {/* Clean Formatted Message Text */}
                <div className="font-sans space-y-2.5">
                  {renderFormattedText(msg.text)}
                  {msg.status === 'streaming' && (
                    <span className="inline-block w-2.5 h-4.5 ml-1 bg-[#58A6FF] animate-pulse align-middle" />
                  )}
                </div>

                {/* Optional Embedded Code Snippet */}
                {msg.codeSnippet && (
                  <div className="mt-3 rounded-xl bg-[#0D1117] border border-[#30363D] overflow-hidden">
                    <div className="px-3.5 py-2 bg-[#161B22] border-b border-[#21262D] text-xs font-mono text-[#8B949E] flex items-center justify-between">
                      <span className="font-bold text-[#C9D1D9]">Python Pattern</span>
                      <Code2 className="w-4 h-4 text-[#58A6FF]" />
                    </div>
                    <pre className="p-3.5 font-mono text-xs sm:text-sm text-[#58A6FF] overflow-x-auto whitespace-pre leading-relaxed">
                      {msg.codeSnippet}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking Multi-Stage Indicator */}
        {isThinking && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-[#161B22] border border-amber-500/30 p-4 text-sm sm:text-base text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-mono font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{thinkingPhase || 'Mentor thinking...'}</span>
              </div>
              <p className="text-xs text-[#8B949E]">
                Analyzing AST semantics & comparing against interview benchmarks...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Compact Input Prompt Form */}
      <div className="p-4 border-t border-[#21262D] bg-[#111622]/90 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
            placeholder="Ask mentor about your code logic..."
            className="flex-1 bg-[#090C14] border border-[#21262D] rounded-xl px-4 py-3 text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-3 rounded-xl bg-[#1F6FEB] hover:bg-[#388BFD] text-white disabled:opacity-40 transition-colors shrink-0 shadow-md shadow-[#1F6FEB]/20 cursor-pointer"
            title="Send to Mentor"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );

};