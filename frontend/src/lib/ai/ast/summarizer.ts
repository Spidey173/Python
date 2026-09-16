// Factual Python Code Static Analyzer & AST Summarizer
// Extracts concrete algorithmic observations without fragile Big-O guessing

import { FactualASTSummary } from '../types';

export function summarizeCode(codeStr: string): FactualASTSummary {
  if (!codeStr || !codeStr.trim()) {
    return {
      functions: [],
      loopCount: 0,
      hasNestedLoops: false,
      hasRecursion: false,
      usesHashMap: false,
      usesStackOrQueue: false,
      hasPrint: false,
      hasReturn: false,
      linesOfCode: 0,
      potentialTraps: ['Editor is empty.'],
      variables: [],
    };
  }

  const lines = codeStr.split('\n');
  const cleanLines = lines
    .map((l) => l.replace(/#.*$/, '')) // strip comments
    .filter((l) => l.trim().length > 0);

  const functions: string[] = [];
  const variables = new Set<string>();
  const potentialTraps: string[] = [];

  let loopCount = 0;
  let hasNestedLoops = false;
  let hasRecursion = false;
  let usesHashMap = false;
  let usesStackOrQueue = false;
  let hasPrint = false;
  let hasReturn = false;

  // Track loop indentations to detect nesting
  const loopIndents: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const stripped = rawLine.trim();
    if (!stripped || stripped.startsWith('#')) continue;

    // Detect indentation level (spaces)
    const indent = rawLine.search(/\S/);

    // Function definition
    const defMatch = stripped.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (defMatch) {
      functions.push(defMatch[1]);
    }

    // Loops
    const isLoop = /^(for\s+|while\s+)/.test(stripped);
    if (isLoop) {
      loopCount++;
      // Check if this loop is nested inside a previously active loop
      const parentLoops = loopIndents.filter((parentIndent) => parentIndent < indent);
      if (parentLoops.length > 0) {
        hasNestedLoops = true;
      }
      loopIndents.push(indent);
    }

    // Terminal IO & returns
    if (/\bprint\s*\(/.test(stripped)) hasPrint = true;
    if (/\breturn\b/.test(stripped)) hasReturn = true;

    // Data structures
    if (
      /(\{[^}]*\}|dict\s*\(|defaultdict|Counter|\b\w+\[.*\]\s*=\s*|\.get\(|\.keys\(|\.values\(|\.items\()/
        .test(stripped)
    ) {
      usesHashMap = true;
    }

    if (/(\.append\(|\.pop\(|deque\b|LifoQueue)/.test(stripped)) {
      usesStackOrQueue = true;
    }

    // Variable assignment
    const assignMatch = stripped.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
    if (assignMatch) {
      variables.add(assignMatch[1]);
    }

    // Potential trap: while loop without modification
    if (/^while\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(<|<=|>|>=)\s*([a-zA-Z_][a-zA-Z0-9_]*)/.test(stripped)) {
      const restOfCode = lines.slice(i + 1).join('\n');
      if (!/\b(\+=|-=|\+\s*1|-\s*1)\b/.test(restOfCode)) {
        potentialTraps.push('While loop detected without obvious pointer advancement (risk of infinite loop).');
      }
    }
  }

  // Detect recursion
  for (const fn of functions) {
    const fnRegex = new RegExp(`\\b${fn}\\s*\\(`, 'g');
    const matches = codeStr.match(fnRegex);
    if (matches && matches.length > 1) {
      hasRecursion = true;
      break;
    }
  }

  // Sanity traps
  if (!hasPrint && !hasReturn && functions.length === 0) {
    potentialTraps.push('Script performs calculations but does not output results via print(...) or return.');
  }

  return {
    functions,
    loopCount,
    hasNestedLoops,
    hasRecursion,
    usesHashMap,
    usesStackOrQueue,
    hasPrint,
    hasReturn,
    linesOfCode: cleanLines.length,
    potentialTraps: Array.from(new Set(potentialTraps)),
    variables: Array.from(variables).slice(0, 8),
  };
}

/**
 * Formats a factual AST summary into a compact 4-line string for the prompt
 * (~80 tokens instead of 500 lines of raw code).
 */
export function formatASTForPrompt(ast: FactualASTSummary): string {
  if (ast.linesOfCode === 0) {
    return 'Code Editor: Blank / No student code written yet.';
  }

  const parts: string[] = [];
  parts.push(`Lines: ${ast.linesOfCode}, Functions: [${ast.functions.join(', ') || 'none'}]`);
  parts.push(
    `Loops: ${ast.loopCount} (Nested: ${ast.hasNestedLoops ? 'Yes' : 'No'}), Recursion: ${ast.hasRecursion ? 'Yes' : 'No'}`
  );
  parts.push(
    `Structures: ${ast.usesHashMap ? 'HashMap/Dict' : ''}${ast.usesHashMap && ast.usesStackOrQueue ? ', ' : ''}${ast.usesStackOrQueue ? 'Stack/Queue' : ''}${!ast.usesHashMap && !ast.usesStackOrQueue ? 'Basic Arrays/Variables' : ''}`
  );
  if (ast.potentialTraps.length > 0) {
    parts.push(`Flags: ${ast.potentialTraps.join('; ')}`);
  }

  return parts.join('\n');
}
