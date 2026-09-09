'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { sounds } from '@/lib/audio-engine';
import { Bot, X, Send, Sparkles, HelpCircle, MessageSquare, ChevronDown } from 'lucide-react';

interface AITutorDrawerProps {
  challengeId?: number;
  currentCode?: string;
}

export default function AITutorDrawer({ challengeId, currentCode }: AITutorDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "👋 Sssup, runner! I'm **Byte**, your cyber snake AI tutor. Stuck on a problem, confused by syntax, or need a gentle hint? Ask me anything!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    sounds.playClick();
    const userMsg = { role: 'user' as const, text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.text }));
      const res = await api.chatWithTutor(text, currentCode, challengeId, history);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
      sounds.playSuccess();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "🐍 **Byte:** Looks like the communications link had a micro-glitch! Make sure your Python code is set up properly and try checking intermediate variables with `print()`!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Why is my code failing?',
    'Give me a gentle hint',
    'What is a loop?',
    'Explain syntax error',
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            sounds.playClick();
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-violet-500/50 bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3 font-semibold text-white shadow-[0_0_25px_rgba(124,58,237,0.5)] transition hover:scale-105 active:scale-95"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-base">
            🐍
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide">AI TUTOR</span>
        </button>
      )}

      {/* Expanded Cyber Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[370px] flex-col rounded-2xl border border-violet-500/40 bg-[#0c0f18]/95 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-violet-900/30 bg-gradient-to-r from-violet-900/40 via-cyan-950/20 to-transparent px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/30 border border-violet-500/50 text-xl shadow-[0_0_12px_rgba(124,58,237,0.4)]">
                🐍
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  BYTE <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">AI TUTOR</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Socratic Python Copilot</p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setIsOpen(false);
              }}
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-800/60 bg-black/30 p-2 scrollbar-none">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="shrink-0 rounded-full border border-violet-800/40 bg-violet-950/40 px-2.5 py-1 text-[11px] font-medium text-violet-300 transition hover:border-cyan-500/50 hover:bg-cyan-950/40 hover:text-cyan-200"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-900/60 text-xs border border-violet-600/40">
                    🐍
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-bl-none prose-invert'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-zinc-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-900/60 text-xs">
                  🐍
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-zinc-900/80 px-3 py-2 border border-zinc-800">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="border-t border-zinc-800/80 bg-black/40 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Byte for a hint or explanation..."
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
