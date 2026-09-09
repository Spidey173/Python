'use client';

import React from 'react';

interface DifficultyBadgeProps {
  difficulty: string;
  size?: 'sm' | 'md';
}

export function DifficultyBadge({ difficulty, size = 'sm' }: DifficultyBadgeProps) {
  const diff = (difficulty || 'easy').toLowerCase();

  const config = {
    easy: {
      label: 'Easy',
      border: 'border-[#238636]/50',
      bg: 'bg-[#238636]/15',
      text: 'text-[#3FB950]',
    },
    medium: {
      label: 'Medium',
      border: 'border-[#D29922]/50',
      bg: 'bg-[#D29922]/15',
      text: 'text-[#D29922]',
    },
    hard: {
      label: 'Hard',
      border: 'border-[#DA3633]/50',
      bg: 'bg-[#DA3633]/15',
      text: 'text-[#F85149]',
    },
  }[diff] || {
    label: difficulty,
    border: 'border-[#30363D]',
    bg: 'bg-[#21262D]',
    text: 'text-[#8B949E]',
  };

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[11px] font-medium leading-none'
    : 'px-2.5 py-1 text-xs font-semibold leading-none';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.border} ${config.bg} ${config.text} ${sizeClasses}`}
      role="status"
    >
      {config.label}
    </span>
  );
}

interface StatusPillProps {
  status: 'passed' | 'failed' | 'unattempted' | 'running';
  label?: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  switch (status) {
    case 'passed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-[#3FB950] bg-[#238636]/15 border border-[#238636]/40 rounded-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#238636]" aria-hidden="true" />
          {label || 'Passed'}
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-[#F85149] bg-[#DA3633]/15 border border-[#DA3633]/40 rounded-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#DA3633]" aria-hidden="true" />
          {label || 'Failed'}
        </span>
      );
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-[#D29922] bg-[#D29922]/15 border border-[#D29922]/40 rounded-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D29922] animate-pulse" aria-hidden="true" />
          {label || 'Running'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-[#8B949E] bg-[#21262D] border border-[#30363D] rounded-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8B949E]" aria-hidden="true" />
          {label || 'Unattempted'}
        </span>
      );
  }
}
