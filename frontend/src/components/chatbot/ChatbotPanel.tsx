import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Copy, Check } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatbotPanelProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSendMessage: (msg: string) => void;
}

export function ChatbotPanel({ messages, isThinking, onSendMessage }: ChatbotPanelProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sleek Notion × Linear × Stripe Docs text parser
  const renderFormattedMessage = (text: string, msgId: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // 1. Code Blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const raw = part.slice(3, -3).trim();
        const firstNewline = raw.indexOf('\n');
        let language = 'python';
        let code = raw;
        if (firstNewline !== -1 && /^[a-zA-Z0-9_-]+$/.test(raw.substring(0, firstNewline).trim())) {
          language = raw.substring(0, firstNewline).trim();
          code = raw.substring(firstNewline + 1);
        }

        const blockId = `${msgId}-code-${index}`;
        const isCopied = copiedId === blockId;

        return (
          <div key={index} className="my-4 rounded-xl border border-white/10 bg-[#0B1220] overflow-hidden font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#111827] border-b border-white/10 text-[#9CA3AF] text-[12px]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80" />
                </div>
                <span className="text-[#9CA3AF] text-[13px] font-mono ml-1">solution.py</span>
              </div>
              <button
                onClick={() => handleCopyCode(code, blockId)}
                className="flex items-center gap-1.5 hover:text-[#F3F4F6] transition-all py-1 px-2.5 rounded-md bg-[#1F2937] hover:bg-[#374151] text-[12px] font-medium border border-white/5"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981] font-semibold">✓ Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[#E5E7EB] leading-relaxed select-text font-mono text-[13px]">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // 2. Headings, Callouts, Lists, and Text
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-3 leading-relaxed text-[#D1D5DB]">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-1.5" />;

            // TL;DR Card
            if (trimmed.includes('TL;DR') || trimmed.includes('TLDR')) {
              return (
                <div key={lIdx} className="my-3 rounded-xl border border-[#3B82F6]/40 bg-[#1E293B]/70 p-4 text-[13px] text-[#E2E8F0] space-y-2 shadow-md">
                  <div className="font-bold text-[#60A5FA] flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-1.5">
                      <span>💡</span>
                      <span>TL;DR Solution Summary</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0F172A] px-2 py-0.5 rounded border border-white/10">
                      ~2 min read
                    </span>
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed">
                    {trimmed.replace(/^[>#*\s💡]+/, '').replace(/^TL;?DR:?\s*/i, '')}
                  </p>
                </div>
              );
            }

            // Callout: Tips (💡)
            if (trimmed.startsWith('💡') || trimmed.startsWith('> ## 💡') || trimmed.startsWith('**Interview Tip**') || trimmed.startsWith('💡 Interview Tip')) {
              return (
                <div key={lIdx} className="my-3 rounded-xl border border-[#3B82F6]/30 bg-[#1E293B]/60 p-4 text-[13px] text-[#E2E8F0] space-y-1.5 shadow-sm">
                  <div className="font-semibold text-[#60A5FA] flex items-center gap-1.5 text-[13px]">
                    <span>💡</span>
                    <span>Interview Tip / Core Idea</span>
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed pl-5">
                    {trimmed.replace(/^[>#*\s💡]+/, '').replace(/^Interview Tip:?\s*/i, '')}
                  </p>
                </div>
              );
            }

            // Callout: Warning / Common Mistake (⚠️ or ❌)
            if (trimmed.startsWith('⚠️') || trimmed.startsWith('❌') || trimmed.startsWith('**Common Mistake**')) {
              return (
                <div key={lIdx} className="my-3 rounded-xl border border-[#EF4444]/30 bg-[#7F1D1D]/20 p-4 text-[13px] text-[#FECACA] space-y-1.5 shadow-sm">
                  <div className="font-semibold text-[#F87171] flex items-center gap-1.5 text-[13px]">
                    <span>⚠️</span>
                    <span>Common Mistake</span>
                  </div>
                  <p className="text-[#FCA5A5] leading-relaxed pl-5">
                    {trimmed.replace(/^[⚠️❌*\s]+/, '').replace(/^Common Mistake:?\s*/i, '')}
                  </p>
                </div>
              );
            }

            // Callout: Complexity (⏱)
            if (trimmed.startsWith('⏱') || trimmed.includes('Complexity')) {
              return (
                <div key={lIdx} className="my-3 rounded-xl border border-[#F59E0B]/30 bg-[#78350F]/20 p-4 text-[13px] text-[#FEF3C7] space-y-1.5 shadow-sm">
                  <div className="font-semibold text-[#FBBF24] flex items-center gap-1.5 text-[13px]">
                    <span>⏱</span>
                    <span>Complexity</span>
                  </div>
                  <p className="text-[#FDE68A] leading-relaxed pl-5">
                    {trimmed.replace(/^[⏱*\s]+/, '').replace(/^Complexity:?\s*/i, '')}
                  </p>
                </div>
              );
            }

            // Callout: Success / Recap (✅)
            if (trimmed.startsWith('✅') && (trimmed.includes('Recap') || trimmed.includes('Done') || trimmed.includes('Summary'))) {
              return (
                <div key={lIdx} className="my-3 rounded-xl border border-[#10B981]/30 bg-[#064E3B]/20 p-4 text-[13px] text-[#D1FAE5] space-y-1.5 shadow-sm">
                  <div className="font-semibold text-[#34D399] flex items-center gap-1.5 text-[13px]">
                    <span>✅</span>
                    <span>Quick Recap</span>
                  </div>
                  <p className="text-[#A7F3D0] leading-relaxed pl-5">
                    {trimmed.replace(/^[✅*\s]+/, '')}
                  </p>
                </div>
              );
            }

            // Section Headings (## or ###)
            if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
              const headingText = trimmed.replace(/^#+\s*/, '');
              return (
                <div key={lIdx} className="pt-3 pb-1 border-b border-white/10">
                  <h4 className="text-[15px] font-bold text-[#F9FAFB] tracking-tight flex items-center gap-2">
                    {headingText}
                  </h4>
                </div>
              );
            }

            // Bullet Points (- or * or •)
            const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('✅ ');
            const bulletIcon = trimmed.startsWith('✅ ') ? '✅' : '•';
            const rawContent = isBullet ? trimmed.replace(/^[-*•✅]\s*/, '') : line;

            // Parse inline variable badges, code pills, and bolding
            const inlineTokens = rawContent.split(/(\*\*.*?\*\*|`[^`]+`)/g);
            const renderedContent = inlineTokens.map((token, tIdx) => {
              if (token.startsWith('**') && token.endsWith('**')) {
                return <strong key={tIdx} className="font-semibold text-[#F3F4F6]">{token.slice(2, -2)}</strong>;
              }
              if (token.startsWith('`') && token.endsWith('`')) {
                return (
                  <code key={tIdx} className="px-1.5 py-0.5 rounded-md bg-[#1F2937] text-[#60A5FA] font-mono text-[12px] border border-[#374151]">
                    {token.slice(1, -1)}
                  </code>
                );
              }
              return token;
            });

            if (isBullet) {
              return (
                <div key={lIdx} className="flex items-start gap-2.5 my-1 pl-1 text-[13px]">
                  <span className="text-[#60A5FA] font-bold select-none shrink-0">{bulletIcon}</span>
                  <span className="text-[#E2E8F0] leading-relaxed">{renderedContent}</span>
                </div>
              );
            }

            return (
              <p key={lIdx} className="text-[13px] leading-relaxed text-[#CBD5E1]">
                {renderedContent}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F17] text-[#E6EDF3] border-r border-[#21262D]">
      {/* Header */}
      <div className="h-12 px-4 border-b border-[#21262D] bg-[#111622] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#1F6FEB]/20 border border-[#1F6FEB]/40 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-[#58A6FF]" />
          </div>
          <span className="font-semibold text-sm text-[#E6EDF3]">AI Assistant</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[15px]">
        {messages.length === 0 && (
          <div className="text-center py-14 text-[#8B949E] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1F6FEB]/20 border border-[#1F6FEB]/40 flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5 text-[#58A6FF]" />
            </div>
            <p className="font-semibold text-base text-[#E6EDF3]">How can I help you solve this challenge?</p>
            <p className="text-xs max-w-xs mx-auto text-[#8B949E]">Ask for a hint, solution code, or help debugging your logic.</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#1F6FEB]/20 border border-[#1F6FEB]/40 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-[#58A6FF]" />
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] shadow-sm ${
                m.sender === 'user'
                  ? 'bg-[#1F6FEB] text-white rounded-tr-none'
                  : 'bg-[#161B22] border border-[#30363D] text-[#E6EDF3] rounded-tl-none'
              }`}
            >
              {renderFormattedMessage(m.text, m.id)}
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#21262D] border border-[#30363D] flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-[#8B949E]" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 items-center text-[#8B949E] text-xs font-mono py-1">
            <div className="w-7 h-7 rounded-full bg-[#1F6FEB]/20 border border-[#1F6FEB]/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#58A6FF] animate-pulse" />
            </div>
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#21262D] bg-[#0E131C] flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isThinking ? "Thinking..." : "Ask a question or get help with this problem..."}
          className="flex-1 bg-[#161B22] border border-[#30363D] rounded-xl px-4 py-2.5 text-[15px] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="px-4 py-2.5 bg-[#1F6FEB] hover:bg-[#388BFD] text-white rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
