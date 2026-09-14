'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Code2, RefreshCw, Volume2, VolumeX
} from 'lucide-react';
import { MentorMessage } from '@/lib/mentor-engine';
import { soundFX } from '@/lib/audio';

interface MentorChatPanelProps {
  messages: MentorMessage[];
  isThinking: boolean;
  thinkingPhase: string;
  onSendCustomPrompt: (prompt: string) => void;
}

// Rich Markdown Text Renderer supporting code blocks, bold, headers, lists, and quotes
function renderFormattedText(text: string) {
  if (!text) return null;

  // Check if text has code fences ```
  const segments: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', lang: match[1] || 'python', content: match[2].trimEnd() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // Render inline text with bold, inline code, and links
  const renderInline = (line: string, keyPrefix: string) => {
    // Parse inline code `code`
    const codeParts = line.split(/(`[^`]+`)/g);
    return codeParts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={`${keyPrefix}-code-${pIdx}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-[#0D1117] border border-[#30363D] font-mono text-[#58A6FF] text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Parse bold **bold**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
          return (
            <strong key={`${keyPrefix}-b-${bIdx}`} className="font-bold text-white">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  return (
    <div className="space-y-2 leading-relaxed text-sm sm:text-base">
      {segments.map((seg, sIdx) => {
        if (seg.type === 'code') {
          return (
            <div key={sIdx} className="my-2.5 rounded-lg border border-[#30363D] bg-[#0A0E17] overflow-hidden shadow-inner">
              <div className="px-3 py-1 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                <span>{seg.lang || 'python'}</span>
                <span className="text-[10px] text-[#58A6FF]">code snippet</span>
              </div>
              <pre className="p-3 font-mono text-xs text-[#7EE787] overflow-x-auto leading-relaxed select-text">
                <code>{seg.content}</code>
              </pre>
            </div>
          );
        }

        const lines = seg.content.split('\n');
        return (
          <div key={sIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              // Headers
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="font-bold text-[#58A6FF] text-sm sm:text-base pt-1">
                    {renderInline(trimmed.slice(4), `h3-${lIdx}`)}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                return (
                  <h3 key={lIdx} className="font-extrabold text-[#E6EDF3] text-base sm:text-lg pt-1.5">
                    {renderInline(trimmed.replace(/^#+\s*/, ''), `h2-${lIdx}`)}
                  </h3>
                );
              }

              // Blockquotes
              if (trimmed.startsWith('> ')) {
                return (
                  <div
                    key={lIdx}
                    className="border-l-2 border-[#58A6FF] bg-[#161B22]/50 pl-3 py-1 my-1 rounded-r text-xs sm:text-sm text-[#8B949E]"
                  >
                    {renderInline(trimmed.slice(2), `quote-${lIdx}`)}
                  </div>
                );
              }

              // Bullet points
              if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 text-sm">
                    <span className="text-[#58A6FF] mt-1 shrink-0">•</span>
                    <span>{renderInline(trimmed.slice(2), `bullet-${lIdx}`)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-sm sm:text-base leading-relaxed">
                  {renderInline(line, `p-${lIdx}`)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const MentorChatPanel: React.FC<MentorChatPanelProps> = ({
  messages,
  isThinking,
  thinkingPhase,
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
              <span className="text-sm font-bold text-[#E6EDF3] tracking-tight">AI</span>
            </div>
            <span className="text-xs text-[#8B949E] font-normal block">
              {isThinking ? 'Thinking...' : 'Online'}
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

      {/* 2. Chat Message Canvas */}
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
              {/* Sender Name */}
              <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E] px-1">
                {isMentor && (
                  <>
                    <Bot className="w-3.5 h-3.5 text-[#58A6FF]" />
                    <span className="font-bold text-[#58A6FF]">AI</span>
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
                <span>{thinkingPhase || 'Thinking...'}</span>
              </div>
              <p className="text-xs text-[#8B949E]">
                Thinking through your approach...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Subtle Suggested Prompts */}
      <div className="px-4 py-2 border-t border-[#21262D] bg-[#0E131E]/40 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none scrollbar-none text-xs">
          <span className="text-[11px] text-[#6E7681] mr-0.5">Suggested:</span>
          <button
            type="button"
            onClick={() => onSendCustomPrompt("I'm stuck.")}
            disabled={isThinking}
            className="px-2.5 py-1 rounded-full border border-white/10 bg-[#161B22]/70 hover:bg-[#21262D] hover:border-[#58A6FF]/30 text-xs text-[#C9D1D9] hover:text-white transition-all shrink-0 disabled:opacity-40 cursor-pointer"
          >
            I&apos;m stuck
          </button>
          <button
            type="button"
            onClick={() => onSendCustomPrompt("Can you explain what this problem is asking?")}
            disabled={isThinking}
            className="px-2.5 py-1 rounded-full border border-white/10 bg-[#161B22]/70 hover:bg-[#21262D] hover:border-[#58A6FF]/30 text-xs text-[#C9D1D9] hover:text-white transition-all shrink-0 disabled:opacity-40 cursor-pointer"
          >
            Explain the problem
          </button>
          <button
            type="button"
            onClick={() => onSendCustomPrompt("Is there another way to approach this?")}
            disabled={isThinking}
            className="px-2.5 py-1 rounded-full border border-white/10 bg-[#161B22]/70 hover:bg-[#21262D] hover:border-[#58A6FF]/30 text-xs text-[#C9D1D9] hover:text-white transition-all shrink-0 disabled:opacity-40 cursor-pointer"
          >
            Show another way
          </button>
        </div>
      </div>

      {/* 4. Compact Input Prompt Form */}
      <div className="p-4 border-t border-[#21262D] bg-[#111622]/90 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
            placeholder="Ask a question or discuss your approach..."
            className="flex-1 bg-[#090C14] border border-[#21262D] rounded-xl px-4 py-3 text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-3 rounded-xl bg-[#1F6FEB] hover:bg-[#388BFD] text-white disabled:opacity-40 transition-colors shrink-0 shadow-md shadow-[#1F6FEB]/20 cursor-pointer"
            title="Send"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );

};