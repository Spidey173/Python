import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Code, Terminal } from 'lucide-react';

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

  return (
    <div className="flex flex-col h-full bg-[#0B0F17] text-[#E6EDF3] border-r border-[#21262D]">
      {/* Header */}
      <div className="h-11 px-4 border-b border-[#21262D] bg-[#111622] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#58A6FF]" />
          <span className="font-semibold text-sm text-[#E6EDF3]">AI Engineering Mentor</span>
        </div>
        <span className="text-[11px] font-mono text-[#8B949E] bg-[#161B22] px-2 py-0.5 rounded border border-[#30363D]">
          ChatGPT Style
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm leading-relaxed">
        {messages.length === 0 && (
          <div className="text-center py-12 text-[#8B949E] space-y-2">
            <Bot className="w-8 h-8 text-[#58A6FF] mx-auto opacity-70" />
            <p className="font-medium text-[#E6EDF3]">Hey! How can I help you today?</p>
            <p className="text-xs">Ask questions, request code, get hints, or debug your solution.</p>
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
              className={`max-w-[85%] rounded-xl px-4 py-2.5 whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-[#1F6FEB] text-white'
                  : 'bg-[#161B22] border border-[#30363D] text-[#E6EDF3]'
              }`}
            >
              {m.text}
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#21262D] border border-[#30363D] flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-[#8B949E]" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 items-center text-[#8B949E] text-xs font-mono">
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
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question, ask for code or hints..."
          disabled={isThinking}
          className="flex-1 bg-[#161B22] border border-[#30363D] rounded-lg px-3.5 py-2 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="px-3.5 py-2 bg-[#1F6FEB] hover:bg-[#388BFD] text-white rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
