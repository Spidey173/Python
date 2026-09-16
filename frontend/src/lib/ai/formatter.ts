// Tiny Markdown Formatter
// ONLY closes unclosed fences, trims whitespace, and removes duplicate consecutive headings.
// NEVER rewrites sentences, explanations, code, or tone.

export function formatResponse(text: string): string {
  if (!text) return '';

  let cleaned = text.trim();

  // 1. Remove duplicate consecutive Markdown headings (e.g. ## Heading\n## Heading)
  cleaned = cleaned.replace(/^(#{1,6}\s+[^\n]+)\n+\1$/gm, '$1');

  // 2. Ensure all unclosed markdown code fences are properly closed
  const fenceMatches = cleaned.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    cleaned += '\n```';
  }

  // 3. Trim whitespace
  return cleaned.trim();
}
