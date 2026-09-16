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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sleek ChatGPT-style text parser for code blocks, inline code, bolding, and lists
  const renderFormattedMessage = (text: string, msgId: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
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
          <div key={index} className="my-3 rounded-lg border border-[#30363D] bg-[#0D1117] overflow-hidden font-mono text-xs shadow-md">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161B22] border-b border-[#30363D] text-[#8B949E] text-[11px]">
              <span className="lowercase font-semibold text-[#58A6FF]">{language || 'code'}</span>
              <button
                onClick={() => handleCopyCode(code, blockId)}
                className="flex items-center gap-1 hover:text-[#E6EDF3] transition-colors py-0.5 px-1.5 rounded bg-[#21262D]/60 hover:bg-[#30363D]"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3FB950]" />
                    <span className="text-[#3FB950]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto text-[#E6EDF3] leading-relaxed select-text font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format inline elements: **bold**, `inline code`, bullet lines
      const lines = part.split('\n');
      return (
        <span key={index} className="block whitespace-pre-wrap leading-relaxed">
          {lines.map((line, lIdx) => {
            // Render bullet points cleanly
            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
            const lineContent = isBullet ? line.trim().substring(2) : line;

            // Parse inline bold and inline code
            const inlineTokens = lineContent.split(/(\*\*.*?\*\*|`[^`]+`)/g);

            const renderedLine = inlineTokens.map((token, tIdx) => {
              if (token.startsWith('**') && token.endsWith('**')) {
                return <strong key={tIdx} className="font-semibold text-white">{token.slice(2, -2)}</strong>;
              }
              if (token.startsWith('`') && token.endsWith('`')) {
                return (
                  <code key={tIdx} className="px-1.5 py-0.5 rounded bg-[#21262D] text-[#58A6FF] font-mono text-[12px] border border-[#30363D]">
                    {token.slice(1, -1)}
                  </code>
                );
              }
              return token;
            });

            return (
              <React.Fragment key={lIdx}>
                {isBullet ? (
                  <span className="flex items-start gap-2 my-1 pl-1">
                    <span className="text-[#58A6FF] font-bold select-none">•</span>
                    <span>{renderedLine}</span>
                  </span>
                ) : (
                  <span>{renderedLine}</span>
                )}
                {lIdx < lines.length - 1 && !isBullet && <br />}
              </React.Fragment>
            );
          })}
        </span>
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
          <span className="font-semibold text-sm text-[#E6EDF3]">ChatGPT AI Assistant</span>
        </div>
        <span className="text-[11px] font-mono text-[#58A6FF] bg-[#1F6FEB]/10 px-2 py-0.5 rounded-full border border-[#1F6FEB]/30 font-medium">
          GPT-4o / Gemini
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {messages.length === 0 && (
          <div className="text-center py-14 text-[#8B949E] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1F6FEB]/20 border border-[#1F6FEB]/40 flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5 text-[#58A6FF]" />
            </div>
            <p className="font-semibold text-base text-[#E6EDF3]">How can I help you solve this challenge?</p>
            <p className="text-xs max-w-xs mx-auto text-[#8B949E]">Ask for a hint, solution code in the starter template format, or help debugging your logic.</p>
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
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
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
            <span className="animate-pulse">Generating response...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#21262D] bg-[#0E131C] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ChatGPT anything about this problem..."
          disabled={isThinking}
          className="flex-1 bg-[#161B22] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] transition-colors"
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
