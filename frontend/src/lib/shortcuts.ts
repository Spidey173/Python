// PyForge Keyboard Shortcuts Registry
// Conforming to docs/engineering.md Section 5

export interface ShortcutHandlers {
  onRun?: () => void;
  onSubmit?: () => void;
  onToggleSidebar?: () => void;
  onToggleConsole?: () => void;
  onOpenCommandPalette?: () => void;
  onNextProblem?: () => void;
  onPrevProblem?: () => void;
  onEscape?: () => void;
}

export function registerGlobalShortcuts(handlers: ShortcutHandlers): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Cmd+K / Ctrl+K - Command Palette
    if (modifier && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      handlers.onOpenCommandPalette?.();
      return;
    }

    // Escape - Dismiss overlay / modal
    if (e.key === 'Escape') {
      handlers.onEscape?.();
      return;
    }

    // Ctrl+B / Cmd+B - Toggle Sidebar Navigator
    if (modifier && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      handlers.onToggleSidebar?.();
      return;
    }

    // Ctrl+J / Cmd+J - Toggle Console Dock
    if (modifier && (e.key === 'j' || e.key === 'J')) {
      e.preventDefault();
      handlers.onToggleConsole?.();
      return;
    }

    // Ctrl+Shift+Enter / Cmd+Shift+Enter - Submit Solution
    if (modifier && e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      handlers.onSubmit?.();
      return;
    }

    // Ctrl+Enter / Cmd+Enter - Run Code
    if (modifier && !e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      handlers.onRun?.();
      return;
    }

    // Alt + Right Arrow - Next Problem
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      handlers.onNextProblem?.();
      return;
    }

    // Alt + Left Arrow - Previous Problem
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      handlers.onPrevProblem?.();
      return;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
