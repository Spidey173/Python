// Code Diff Engine
// Compares current editor code against the previous attempt to give the tutor perceptual awareness of iterative changes

export interface CodeDiffResult {
  hasChanges: boolean;
  summary: string;
  modifiedSections: string[];
}

export function computeCodeDiff(
  currentCode: string = '',
  previousCode?: string
): CodeDiffResult | null {
  if (!previousCode || !previousCode.trim() || !currentCode.trim()) {
    return null;
  }

  const curr = currentCode.trim();
  const prev = previousCode.trim();

  if (curr === prev) {
    return {
      hasChanges: false,
      summary: 'No changes from previous attempt.',
      modifiedSections: [],
    };
  }

  const prevLines = prev.split('\n').map((l) => l.trim()).filter(Boolean);
  const currLines = curr.split('\n').map((l) => l.trim()).filter(Boolean);

  const modifiedSections: string[] = [];

  // 1. Detect loop condition changes
  const prevLoop = prevLines.find((l) => /^while\s+|^for\s+/.test(l));
  const currLoop = currLines.find((l) => /^while\s+|^for\s+/.test(l));
  if (prevLoop && currLoop && prevLoop !== currLoop) {
    modifiedSections.push(`Loop condition adjusted from \`${prevLoop}\` to \`${currLoop}\``);
  }

  // 2. Detect return or print changes
  const prevRet = prevLines.find((l) => /^return\s+|^print\s*\(/.test(l));
  const currRet = currLines.find((l) => /^return\s+|^print\s*\(/.test(l));
  if (prevRet !== currRet) {
    if (prevRet && currRet) {
      modifiedSections.push(`Output logic changed from \`${prevRet}\` to \`${currRet}\``);
    } else if (currRet) {
      modifiedSections.push(`Added output statement: \`${currRet}\``);
    }
  }

  // 3. Detect data structure additions (dict, set, list)
  const prevHasDict = /\{|\bdict\b/.test(prev);
  const currHasDict = /\{|\bdict\b/.test(curr);
  if (!prevHasDict && currHasDict) {
    modifiedSections.push('Introduced a dictionary / hash map for tracking elements');
  }

  // Fallback line count delta
  if (modifiedSections.length === 0) {
    const delta = currLines.length - prevLines.length;
    if (delta !== 0) {
      modifiedSections.push(`${Math.abs(delta)} line${Math.abs(delta) > 1 ? 's' : ''} ${delta > 0 ? 'added' : 'removed'}`);
    } else {
      modifiedSections.push('Internal statements or variable names updated');
    }
  }

  return {
    hasChanges: true,
    summary: modifiedSections.join('; '),
    modifiedSections,
  };
}
