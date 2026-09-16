// Capability Router
// Resolves common static language questions, built-in docs, and DSA foundational concepts locally (<1ms, 0 LLM cost)

interface LocalCapability {
  title: string;
  response: string;
}

const STATIC_CAPABILITIES: Array<{ match: RegExp; capability: LocalCapability }> = [
  {
    match: /\b(what is|explain)\s+(big\s*o|time\s*complexity|space\s*complexity)\b/i,
    capability: {
      title: 'Big-O Notation Fundamentals',
      response: `### Big-O Complexity Quick Guide
Big-O describes how the execution time or memory of an algorithm scales as the input size $n$ grows toward infinity:

| Complexity | Name | Example in Python |
| :--- | :--- | :--- |
| **$O(1)$** | Constant | Hash map lookup \`seen[k]\`, list index \`arr[0]\` |
| **$O(\\log n)$** | Logarithmic | Binary search, halving the search space |
| **$O(n)$** | Linear | Single \`for\` loop iterating over a list |
| **$O(n \\log n)$** | Linearithmic | Python's Timsort \`arr.sort()\` |
| **$O(n^2)$** | Quadratic | Nested loops comparing all pairs |
| **$O(2^n)$** | Exponential | Naive recursive Fibonacci without memoization |

> **Interview Rule of Thumb**: For $n \\le 10^5$, aim for an $O(n)$ or $O(n \\log n)$ solution to avoid timeouts.`,
    },
  },
  {
    match: /\b(what does|how does|what is)\s+(append|list\.append)\b/i,
    capability: {
      title: 'Python list.append()',
      response: `### \`list.append(x)\`
Adds an element $x$ to the very end of a list in amortized **$O(1)$ constant time**.

\`\`\`python
fruits = ["apple", "banana"]
fruits.append("cherry")
print(fruits) # Output: ['apple', 'banana', 'cherry']
\`\`\`

• **Time Complexity**: Amortized $O(1)$.
• **In-Place**: Modifies the original list directly and returns \`None\`.`,
    },
  },
  {
    match: /\b(what does|how does|what is)\s+(pop|list\.pop)\b/i,
    capability: {
      title: 'Python list.pop()',
      response: `### \`list.pop([i])\`
Removes and returns the item at index $i$ (defaulting to the last item).

\`\`\`python
stack = [10, 20, 30]
last = stack.pop() # Removes and returns 30 (O(1))
first = stack.pop(0) # Removes 10, shifts remaining elements (O(n))
\`\`\`

• **\`pop()\` (from end)**: $O(1)$ — perfect for Stack (LIFO) operations.
• **\`pop(0)\` (from start)**: $O(n)$ — for fast queue operations, use \`collections.deque\` instead.`,
    },
  },
  {
    match: /\b(what does|how does|what is)\s+(split|str\.split)\b/i,
    capability: {
      title: 'Python str.split()',
      response: `### \`str.split()\`
Splits a string into a list of words.

\`\`\`python
# Bare s.split() strips leading/trailing spaces and collapses multiple spaces:
s = "  the   sky   is blue  "
words = s.split()
print(words) # Output: ['the', 'sky', 'is', 'blue']
\`\`\`

> **Interview Trap**: Always prefer bare \`s.split()\` over \`s.split(' ')\`. \`s.split(' ')\` preserves empty strings between multiple consecutive spaces!`,
    },
  },
  {
    match: /\b(what is|difference between)\s+(list and tuple|tuple and list)\b/i,
    capability: {
      title: 'Python List vs Tuple',
      response: `### List vs Tuple Comparison

| Feature | List \`[1, 2]\` | Tuple \`(1, 2)\` |
| :--- | :--- | :--- |
| **Mutability** | Mutable (can modify/append) | Immutable (read-only after creation) |
| **Dictionary Key** | Cannot be used as key | Can be used as dict key or set item |
| **Memory & Speed** | Slightly more memory | Lightweight and slightly faster |
| **Use Case** | Dynamic sequences | Fixed records, coordinates \`(x, y)\` |`,
    },
  },
];

export function tryResolveLocalCapability(message: string): LocalCapability | null {
  const q = message.trim();
  for (const item of STATIC_CAPABILITIES) {
    if (item.match.test(q)) {
      return item.capability;
    }
  }
  return null;
}
