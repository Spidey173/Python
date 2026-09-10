'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Code, BookOpen, LayoutDashboard, BarChart2,
  Terminal, Sidebar, ArrowRight, CornerDownLeft, ExternalLink,
  RotateCcw, Copy, Check
} from 'lucide-react';
import { DifficultyBadge } from './Badge';

export interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Modules' | 'Problems';
  title: string;
  subtitle?: string;
  badge?: string;
  shortcut?: string;
  icon: React.ReactNode;
  perform: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleSidebar?: () => void;
  onToggleConsole?: () => void;
  onResetCode?: () => void;
  currentProblemId?: number;
}

const MODULES = [
  { id: 1, title: 'Module 1: Strings & Text Manipulation' },
  { id: 2, title: 'Module 2: Array & List Operations' },
  { id: 3, title: 'Module 3: Hashing, Dictionaries & Sets' },
  { id: 4, title: 'Module 4: Two Pointers & Binary Search' },
  { id: 5, title: 'Module 5: Math, Logic & Bitwise Operations' },
  { id: 6, title: 'Module 6: Recursion & Divide-and-Conquer' },
  { id: 7, title: 'Module 7: Stacks & Queues' },
  { id: 8, title: 'Module 8: Matrices & 2D Grids' },
  { id: 9, title: 'Module 9: Sliding Window & Intermediate DSA' },
  { id: 10, title: 'Module 10: Advanced Interview Classics' },
  { id: 11, title: 'Module 11: Top LeetCode - Arrays & Two Pointers' },
  { id: 12, title: 'Module 12: Top LeetCode - Strings & Parsing' },
  { id: 13, title: 'Module 13: Top LeetCode - Math & Numerical Logic' },
  { id: 14, title: 'Module 14: Top LeetCode - Lists, Stacks & Dynamic Programming' },
];

// All 50 Tech Interview Problems Index (40 Easy, 8 Medium, 2 Hard)
const PROBLEMS_INDEX = [
  // Module 1 (Easy)
  { id: 1, title: 'Valid Palindrome', module: 1, difficulty: 'Easy' },
  { id: 2, title: 'Reverse Words in a Sentence', module: 1, difficulty: 'Easy' },
  { id: 3, title: 'First Non-Repeating Character', module: 1, difficulty: 'Easy' },
  { id: 4, title: 'Valid Anagram', module: 1, difficulty: 'Easy' },
  { id: 5, title: 'Run-Length String Compression', module: 1, difficulty: 'Easy' },

  // Module 2 (Easy)
  { id: 6, title: 'Move Zeroes to End', module: 2, difficulty: 'Easy' },
  { id: 7, title: 'Two Sum (Target Pair Indices)', module: 2, difficulty: 'Easy' },
  { id: 8, title: 'Majority Element (Boyer-Moore)', module: 2, difficulty: 'Easy' },
  { id: 9, title: 'Missing Number in Sequence', module: 2, difficulty: 'Easy' },
  { id: 10, title: 'Rotate Array by K Steps', module: 2, difficulty: 'Easy' },

  // Module 3 (Easy)
  { id: 11, title: 'Word Frequency Counter', module: 3, difficulty: 'Easy' },
  { id: 12, title: 'Intersection of Two Arrays', module: 3, difficulty: 'Easy' },
  { id: 13, title: 'Contains Duplicate II', module: 3, difficulty: 'Easy' },
  { id: 14, title: 'Isomorphic Strings', module: 3, difficulty: 'Easy' },
  { id: 15, title: 'Subarray with Zero Sum', module: 3, difficulty: 'Easy' },

  // Module 4 (Easy)
  { id: 16, title: 'Binary Search (Sorted Array)', module: 4, difficulty: 'Easy' },
  { id: 17, title: 'Remove Duplicates from Sorted Array', module: 4, difficulty: 'Easy' },
  { id: 18, title: 'Squares of a Sorted Array', module: 4, difficulty: 'Easy' },
  { id: 19, title: 'Search Insert Position', module: 4, difficulty: 'Easy' },
  { id: 20, title: 'Valid Mountain Array', module: 4, difficulty: 'Easy' },

  // Module 5 (Easy)
  { id: 21, title: 'Single Number (Bitwise XOR)', module: 5, difficulty: 'Easy' },
  { id: 22, title: 'Number of 1 Bits (Hamming Weight)', module: 5, difficulty: 'Easy' },
  { id: 23, title: 'Power of Two', module: 5, difficulty: 'Easy' },
  { id: 24, title: 'FizzBuzz Enterprise', module: 5, difficulty: 'Easy' },
  { id: 25, title: 'Greatest Common Divisor & LCM', module: 5, difficulty: 'Easy' },

  // Module 6 (Easy)
  { id: 26, title: 'Fibonacci Number (Nth Term)', module: 6, difficulty: 'Easy' },
  { id: 27, title: 'Trailing Zeroes in Factorial', module: 6, difficulty: 'Easy' },
  { id: 28, title: 'Fast Exponentiation (Pow)', module: 6, difficulty: 'Easy' },
  { id: 29, title: 'Digital Root (Add Digits)', module: 6, difficulty: 'Easy' },
  { id: 30, title: 'Monotonic Array Verification', module: 6, difficulty: 'Easy' },

  // Module 7 (Easy)
  { id: 31, title: 'Valid Parentheses', module: 7, difficulty: 'Easy' },
  { id: 32, title: 'Implement Queue using Two Stacks', module: 7, difficulty: 'Easy' },
  { id: 33, title: 'Next Greater Element I', module: 7, difficulty: 'Easy' },
  { id: 34, title: 'Backspace String Compare', module: 7, difficulty: 'Easy' },
  { id: 35, title: 'Simplify Unix File Path', module: 7, difficulty: 'Easy' },

  // Module 8 (Easy)
  { id: 36, title: 'Matrix Transposition', module: 8, difficulty: 'Easy' },
  { id: 37, title: 'Matrix Diagonal Sum', module: 8, difficulty: 'Easy' },
  { id: 38, title: 'Search in a 2D Matrix', module: 8, difficulty: 'Easy' },
  { id: 39, title: 'Flood Fill (2D Component)', module: 8, difficulty: 'Easy' },
  { id: 40, title: 'Rotate Matrix 90 Degrees Clockwise', module: 8, difficulty: 'Easy' },

  // Module 9 (Medium)
  { id: 41, title: 'Longest Substring Without Repeating Characters', module: 9, difficulty: 'Medium' },
  { id: 42, title: 'Group Anagrams', module: 9, difficulty: 'Medium' },
  { id: 43, title: 'Container With Most Water', module: 9, difficulty: 'Medium' },
  { id: 44, title: 'Subarray Sum Equals K', module: 9, difficulty: 'Medium' },
  { id: 45, title: 'Merge Overlapping Intervals', module: 9, difficulty: 'Medium' },

  // Module 10 (Medium & Hard)
  { id: 46, title: '3Sum (Three Elements Zero Sum)', module: 10, difficulty: 'Medium' },
  { id: 47, title: 'Longest Consecutive Sequence', module: 10, difficulty: 'Medium' },
  { id: 48, title: 'Daily Temperatures (Monotonic Stack)', module: 10, difficulty: 'Medium' },
  { id: 49, title: 'Trapping Rain Water', module: 10, difficulty: 'Hard' },
  { id: 50, title: 'Sliding Window Maximum', module: 10, difficulty: 'Hard' },
  // Advanced Top 20 LeetCode Classics (51..70)
  { id: 51, title: 'Two Sum (LeetCode #1)', module: 11, difficulty: 'Easy' },
  { id: 52, title: 'Container With Most Water (LeetCode #11)', module: 11, difficulty: 'Medium' },
  { id: 53, title: '3Sum (LeetCode #15)', module: 11, difficulty: 'Medium' },
  { id: 54, title: '3Sum Closest (LeetCode #16)', module: 11, difficulty: 'Medium' },
  { id: 55, title: '4Sum (LeetCode #18)', module: 11, difficulty: 'Medium' },
  { id: 56, title: 'Longest Substring Without Repeating Characters (LeetCode #3)', module: 12, difficulty: 'Medium' },
  { id: 57, title: 'Longest Palindromic Substring (LeetCode #5)', module: 12, difficulty: 'Medium' },
  { id: 58, title: 'Zigzag Conversion (LeetCode #6)', module: 12, difficulty: 'Medium' },
  { id: 59, title: 'String to Integer (atoi) (LeetCode #8)', module: 12, difficulty: 'Medium' },
  { id: 60, title: 'Longest Common Prefix (LeetCode #14)', module: 12, difficulty: 'Easy' },
  { id: 61, title: 'Reverse Integer (LeetCode #7)', module: 13, difficulty: 'Medium' },
  { id: 62, title: 'Palindrome Number (LeetCode #9)', module: 13, difficulty: 'Easy' },
  { id: 63, title: 'Integer to Roman (LeetCode #12)', module: 13, difficulty: 'Medium' },
  { id: 64, title: 'Roman to Integer (LeetCode #13)', module: 13, difficulty: 'Easy' },
  { id: 65, title: 'Median of Two Sorted Arrays (LeetCode #4)', module: 13, difficulty: 'Hard' },
  { id: 66, title: 'Add Two Numbers (LeetCode #2)', module: 14, difficulty: 'Medium' },
  { id: 67, title: 'Remove Nth Node From End of List (LeetCode #19)', module: 14, difficulty: 'Medium' },
  { id: 68, title: 'Valid Parentheses (LeetCode #20)', module: 14, difficulty: 'Easy' },
  { id: 69, title: 'Letter Combinations of a Phone Number (LeetCode #17)', module: 14, difficulty: 'Medium' },
  { id: 70, title: 'Regular Expression Matching (LeetCode #10)', module: 14, difficulty: 'Hard' },
];

export function CommandPalette({
  isOpen,
  onClose,
  onToggleSidebar,
  onToggleConsole,
  onResetCode,
  currentProblemId,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      };

      window.addEventListener('keydown', handleGlobalKeyDown, true);
      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown, true);
      };
    }
  }, [isOpen, onClose]);

  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Global navigation
    items.push(
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Open Dashboard',
        subtitle: 'View overall progress and resume workspace',
        icon: <LayoutDashboard className="h-4 w-4 text-[#8B949E]" />,
        perform: () => { router.push('/'); onClose(); },
      },
      {
        id: 'nav-curriculum',
        category: 'Navigation',
        title: 'Open Curriculum Explorer',
        subtitle: 'Browse all 50 challenges across 10 modules',
        icon: <BookOpen className="h-4 w-4 text-[#8B949E]" />,
        perform: () => { router.push('/quest'); onClose(); },
      },
      {
        id: 'nav-progress',
        category: 'Navigation',
        title: 'Open Progress & Heatmap',
        subtitle: 'Review 12-week activity and velocity stats',
        icon: <BarChart2 className="h-4 w-4 text-[#8B949E]" />,
        perform: () => { router.push('/profile'); onClose(); },
      }
    );

    // Workspace Actions
    if (currentProblemId) {
      items.push({
        id: 'action-resume',
        category: 'Actions',
        title: `Resume Problem #${currentProblemId}`,
        subtitle: 'Return to active coding buffer',
        icon: <Code className="h-4 w-4 text-[#3FB950]" />,
        perform: () => { router.push(`/quest/${currentProblemId}`); onClose(); },
      });
    }

    if (onToggleSidebar) {
      items.push({
        id: 'action-toggle-sidebar',
        category: 'Actions',
        title: 'Toggle Sidebar Navigator',
        shortcut: 'Ctrl+B',
        icon: <Sidebar className="h-4 w-4 text-[#8B949E]" />,
        perform: () => { onToggleSidebar(); onClose(); },
      });
    }

    if (onToggleConsole) {
      items.push({
        id: 'action-toggle-console',
        category: 'Actions',
        title: 'Toggle Console Dock',
        shortcut: 'Ctrl+J',
        icon: <Terminal className="h-4 w-4 text-[#8B949E]" />,
        perform: () => { onToggleConsole(); onClose(); },
      });
    }

    if (currentProblemId) {
      items.push({
        id: 'action-copy-link',
        category: 'Actions',
        title: 'Copy Problem Link',
        icon: copiedLink ? <Check className="h-4 w-4 text-[#3FB950]" /> : <Copy className="h-4 w-4 text-[#8B949E]" />,
        perform: () => {
          if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 1500);
          }
          onClose();
        },
      });
    }

    if (onResetCode) {
      items.push({
        id: 'action-reset-code',
        category: 'Actions',
        title: 'Reset Code to Starter Template',
        icon: <RotateCcw className="h-4 w-4 text-[#DA3633]" />,
        perform: () => { onResetCode(); onClose(); },
      });
    }

    // Module jumping
    MODULES.forEach((mod) => {
      items.push({
        id: `mod-${mod.id}`,
        category: 'Modules',
        title: mod.title,
        subtitle: 'Filter syllabus by this module',
        icon: <BookOpen className="h-4 w-4 text-[#58A6FF]" />,
        perform: () => { router.push(`/quest?module=${mod.id}`); onClose(); },
      });
    });

    // 50 Problems Index
    PROBLEMS_INDEX.forEach((prob) => {
      items.push({
        id: `prob-${prob.id}`,
        category: 'Problems',
        title: `Problem ${prob.id}: ${prob.title}`,
        subtitle: `Module ${prob.module}`,
        badge: prob.difficulty,
        icon: <Code className="h-4 w-4 text-[#8B949E]" />,
        perform: () => { router.push(`/quest/${prob.id}`); onClose(); },
      });
    });

    return items;
  }, [currentProblemId, onToggleSidebar, onToggleConsole, onResetCode, copiedLink, router, onClose]);

  // Filter commands by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  // Handle arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].perform();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-[2px] transition-opacity duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl rounded-lg border border-[#30363D] bg-[#161B22] shadow-2xl overflow-hidden flex flex-col max-h-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-3.5 border-b border-[#30363D] bg-[#161B22]">
          <Search className="h-4 w-4 text-[#8B949E] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, problem title, or module..."
            className="w-full h-11 bg-transparent px-3 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#8B949E] bg-[#21262D] border border-[#30363D] rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8B949E]">
              No commands or problems matching &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => item.perform()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-colors duration-75 ${
                    isSelected
                      ? 'bg-[#1F6FEB] text-white'
                      : 'text-[#E6EDF3] hover:bg-[#21262D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isSelected ? 'text-white' : 'text-[#8B949E]'}>
                      {item.icon}
                    </span>
                    <div className="truncate">
                      <span className="font-medium">{item.title}</span>
                      {item.subtitle && (
                        <span
                          className={`ml-2 text-[11px] truncate ${
                            isSelected ? 'text-blue-100' : 'text-[#8B949E]'
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <DifficultyBadge difficulty={item.badge} size="sm" />
                    )}
                    {item.shortcut && (
                      <kbd
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-[#21262D] border-[#30363D] text-[#8B949E]'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-white opacity-80" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-3 py-2 border-t border-[#30363D] bg-[#0D1117] flex items-center justify-between text-[11px] text-[#8B949E]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono text-[#E6EDF3]">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono text-[#E6EDF3]">↵</kbd> select
            </span>
          </div>
          <span className="font-mono">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>
  );
}
