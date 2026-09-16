// Conversation Analyzer
// RESPONSIBILITY: Distill chat history into factual ConversationFacts.
// Detects whether a working solution was previously provided,
// whether the student is asking for "corrected code",
// and whether the local editor code appears to be out of sync.

import { ConversationFacts } from '../types';

export function analyzeConversation(
  message: string = '',
  code: string = '',
  chatHistory: Array<{ role: string; content: string }> = []
): ConversationFacts {
  const lowerMsg = message.trim().toLowerCase();

  // 1. Check if the assistant previously provided a working solution
  const assistantMessages = chatHistory.filter((m) => m.role === 'assistant');
  const recentAssistantMessages = assistantMessages.slice(-3);

  const previousSolutionProvided = recentAssistantMessages.some((m) =>
    /```python[\s\S]*?(def\s+[a-zA-Z_]\w*|return\s+)[\s\S]*?```/.test(m.content)
  );

  // 2. Check if student is explicitly asking for "corrected code" or reporting it still fails
  const userAskedForCorrection = /\b(corrected code|provide corrected|give corrected|fix the code|fix my code|write corrected)\b/i.test(
    lowerMsg
  );

  const sameFailureRepeated =
    previousSolutionProvided &&
    /\b(still failing|same error|still getting|same output|doesn't work|not working|failed on my code|why does it still)\b/i.test(
      lowerMsg
    );

  // 3. Editor code missing
  const editorCodeMissing = !code || code.trim().length === 0;

  // 4. Student rejected hint / still confused
  const studentRejectedHint = /\b(still confused|don't understand|did not help|didn't get it|no clue)\b/i.test(
    lowerMsg
  );

  return {
    previousSolutionProvided,
    userAskedForCorrection,
    sameFailureRepeated,
    editorCodeMissing,
    studentRejectedHint,
    turnsCount: chatHistory.length,
  };
}
