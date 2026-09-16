// Chat Message Types for PyForge Coding Assistant
// Mentor functions completely removed.

export interface MentorMessage {
  id: string;
  sender: 'mentor' | 'user' | 'system';
  text: string;
  fullText: string;
  status: 'streaming' | 'done';
  mood: 'neutral' | 'curious' | 'thinking' | 'celebrating' | 'debugging' | 'coaching';
  quickActions?: Array<{ id: string; label: string; icon?: string }>;
  codeSnippet?: string;
  timestamp: string;
}

export type HintTier = 1 | 2 | 3 | 4 | 5;
