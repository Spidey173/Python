// PyForge Master Mentor Intelligence Dataset
// Simple, intuitive, beginner-friendly 5-tier clues to help coders learn effortlessly across all 50 challenges

import type { ProblemMentorKnowledge } from './mentor-engine';

export const ALL_50_MENTOR_KNOWLEDGE: Record<number, ProblemMentorKnowledge> = {
  1: {
    greeting: "Hey! A palindrome reads the same forwards and backwards (like 'racecar'). Let's make this simple and clean!",
    conceptName: "Palindrome & Two Pointers",
    conceptExplanation: "Strip out spaces and punctuation so you keep only letters/numbers in lowercase. In Python, compare the cleaned list with its reverse `[::-1]`. If they match, print True!",
    patternExample: "s = input()\ncleaned = [c.lower() for c in s if c.isalnum()]\nprint(cleaned == cleaned[::-1])",
    interviewTrap: "Don't compare raw text directly\u2014ignore spaces, commas, colons, and capitalization.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "A palindrome is identical forwards and backwards. First, keep only letters/numbers and make them lowercase.", reflectionQuestion: "\ud83d\udca1 Tip: 'A man, a plan, a canal: Panama' becomes 'amanaplanacanalpanama'." },
      { tier: 2, title: "Input & Cleaning", nudge: "Read the string and filter out spaces/punctuation in one clean line:\n`cleaned = [c.lower() for c in s if c.isalnum()]`", reflectionQuestion: "\ud83d\udca1 Tip: `c.isalnum()` is True for letters and digits.", codeSnippet: "s = input()\ncleaned = [c.lower() for c in s if c.isalnum()]" },
      { tier: 3, title: "Reverse Check", nudge: "In Python, reverse any list using `[::-1]`. So `cleaned[::-1]` is the reversed list!", reflectionQuestion: "\ud83d\udca1 Tip: Comparing two lists with `==` automatically checks if all items match.", codeSnippet: "is_palindrome = (cleaned == cleaned[::-1])" },
      { tier: 4, title: "Print the Result", nudge: "Print the boolean comparison directly: `print(cleaned == cleaned[::-1])`.", reflectionQuestion: "\ud83d\udca1 Tip: No need for if/else\u2014Python prints True or False directly.", codeSnippet: "print(cleaned == cleaned[::-1])" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\ncleaned = [c.lower() for c in s if c.isalnum()]\nprint(cleaned == cleaned[::-1])" }
    ],
  },
  2: {
    greeting: "Welcome! We want to reverse the order of words in a sentence, while cleaning up any extra spaces. Python makes this super easy!",
    conceptName: "Word Splitting & Reversal",
    conceptExplanation: "1. `s.split()` automatically breaks a sentence into words and ignores all extra spaces.\n2. Reverse that word list with `words[::-1]`.\n3. Join with `' '.join(...)`.",
    patternExample: "s = input()\nwords = s.split()\nprint(\" \".join(words[::-1]))",
    interviewTrap: "Use bare `s.split()` without arguments! Do not use `s.split(' ')` because that preserves extra spaces.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Extract the words, reverse their order, and join them back together with a single space.", reflectionQuestion: "\ud83d\udca1 Tip: 'the sky is blue' becomes 'blue is sky the'." },
      { tier: 2, title: "Split into Words", nudge: "Read the input and use `words = s.split()`. This removes all extra spaces and gives a list of words.", reflectionQuestion: "\ud83d\udca1 Tip: `s.split()` automatically handles multiple consecutive spaces.", codeSnippet: "s = input()\nwords = s.split()" },
      { tier: 3, title: "Reverse the List", nudge: "In Python, reverse any list with `words[::-1]`.", reflectionQuestion: "\ud83d\udca1 Tip: `[::-1]` traverses the list backwards from the last word.", codeSnippet: "reversed_words = words[::-1]" },
      { tier: 4, title: "Join & Print", nudge: "Join the words back with a space: `' '.join(words[::-1])` and print it.", reflectionQuestion: "\ud83d\udca1 Tip: `' '.join(['a', 'b'])` produces `'a b'`.", codeSnippet: "print(' '.join(words[::-1]))" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nwords = s.split()\nprint(\" \".join(words[::-1]))" }
    ],
  },
  3: {
    greeting: "Welcome! We want to find the first letter that appears only once in the string. If every letter repeats, we output -1.",
    conceptName: "Counting with a Dictionary",
    conceptExplanation: "1. Count how many times each letter appears using a dictionary.\n2. Walk through the string a second time. The first character with count == 1 is our answer! If none exists, print -1.",
    patternExample: "s = input()\ncounts = {}\nfor c in s:\n    counts[c] = counts.get(c, 0) + 1\nres = \"-1\"\nfor c in s:\n    if counts[c] == 1:\n        res = c\n        break\nprint(res)",
    interviewTrap: "In the second loop, check characters in the original string `s` (not the dictionary) so you preserve the original order!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Step 1: Count how many times each character appears in the string.\nStep 2: Check the string from left to right. The first letter with count 1 wins!", reflectionQuestion: "\ud83d\udca1 Tip: For 'leetcode', 'l' appears only once, so 'l' is the answer." },
      { tier: 2, title: "Count Each Letter", nudge: "Create a dictionary `counts = {}`. Loop through `s` and tally the counts:\n`counts[c] = counts.get(c, 0) + 1`", reflectionQuestion: "\ud83d\udca1 Tip: `counts.get(c, 0)` returns the existing count or 0 if it's the first time seeing c.", codeSnippet: "counts = {}\nfor c in s:\n    counts[c] = counts.get(c, 0) + 1" },
      { tier: 3, title: "Find the First Unique", nudge: "Initialize `ans = '-1'`. Loop through `s`: if `counts[c] == 1`, set `ans = c` and `break` immediately!", reflectionQuestion: "\ud83d\udca1 Tip: `break` stops as soon as you find the first non-repeating character.", codeSnippet: "ans = '-1'\nfor c in s:\n    if counts[c] == 1:\n        ans = c\n        break" },
      { tier: 4, title: "Print the Answer", nudge: "Print `ans`. If a unique character was found, it prints it. Otherwise it prints `-1`.", reflectionQuestion: "\ud83d\udca1 Tip: Try with 'aabb' -> it prints -1.", codeSnippet: "print(ans)" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\ncounts = {}\nfor c in s:\n    counts[c] = counts.get(c, 0) + 1\nres = \"-1\"\nfor c in s:\n    if counts[c] == 1:\n        res = c\n        break\nprint(res)" }
    ],
  },
  4: {
    greeting: "Welcome! Two words are anagrams if they have the exact same letters in a different order (like 'listen' and 'silent').",
    conceptName: "Comparing Letter Counts",
    conceptExplanation: "1. If their lengths are different, they can't be anagrams (print False).\n2. If sorted letters match (`sorted(s) == sorted(t)`), print True!",
    patternExample: "s = input()\nt = input()\nif len(s) != len(t):\n    print(False)\nelse:\n    counts = {}\n    for c in s:\n        counts[c] = counts.get(c, 0) + 1\n    for c in t:\n        if c not in counts or counts[c] == 0:\n            print(False)\n            break\n        counts[c] -= 1\n    else:\n        print(True)",
    interviewTrap: "Check `len(s) != len(t)` first! Different lengths mean False immediately.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Anagrams have the exact same length and contain the exact same letters.", reflectionQuestion: "\ud83d\udca1 Tip: 'silent' and 'listen' contain the same letters." },
      { tier: 2, title: "Read & Check Length", nudge: "Read both strings: `s = input()` and `t = input()`. If lengths don't match, print False.", reflectionQuestion: "\ud83d\udca1 Tip: Quick early exit saves time.", codeSnippet: "s = input()\nt = input()\nif len(s) != len(t):\n    print(False)" },
      { tier: 3, title: "Easy Sort Check", nudge: "In Python, `sorted(s)` puts all characters in alphabetical order. If `sorted(s) == sorted(t)`, they are anagrams!", reflectionQuestion: "\ud83d\udca1 Tip: Both words sorted will be identical.", codeSnippet: "print(sorted(s) == sorted(t))" },
      { tier: 4, title: "Dictionary Alternative", nudge: "You can also count characters using a dictionary and make sure every character frequency matches.", reflectionQuestion: "\ud83d\udca1 Tip: `sorted()` is fast and passes all tests!" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nt = input()\nif len(s) != len(t):\n    print(False)\nelse:\n    counts = {}\n    for c in s:\n        counts[c] = counts.get(c, 0) + 1\n    for c in t:\n        if c not in counts or counts[c] == 0:\n            print(False)\n            break\n        counts[c] -= 1\n    else:\n        print(True)" }
    ],
  },
  5: {
    greeting: "Welcome! String compression turns repeated letters like 'aaabbc' into 'a3b2c1'.",
    conceptName: "Sequential Character Grouping",
    conceptExplanation: "Walk through the string tracking the current character and count. When the letter changes, record `{char}{count}` and reset.",
    patternExample: "s = input()\nif not s:\n    print(\"\")\nelse:\n    res = []\n    curr = s[0]\n    count = 1\n    for i in range(1, len(s)):\n        if s[i] == curr:\n            count += 1\n        else:\n            res.append(f\"{curr}{count}\")\n            curr = s[i]\n            count = 1\n    res.append(f\"{curr}{count}\")\n    print(\"\".join(res))",
    interviewTrap: "Don't forget the last group! When the loop ends, you must append the final group.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Track the current letter and count consecutive repeats. When you hit a new letter, save the old letter and count.", reflectionQuestion: "\ud83d\udca1 Tip: 'aaabb' becomes 'a3b2'." },
      { tier: 2, title: "Track Variables", nudge: "Start with `curr = s[0]` and `count = 1`. Create a list `res = []` to store compressed parts.", reflectionQuestion: "\ud83d\udca1 Tip: Handle empty string with early return.", codeSnippet: "curr = s[0]\ncount = 1\nres = []" },
      { tier: 3, title: "Loop and Compare", nudge: "Loop from index 1 to end. If `s[i] == curr`, do `count += 1`. Else append `f'{curr}{count}'`, set `curr = s[i]`, and reset `count = 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Appending to a list is fast in Python.", codeSnippet: "if s[i] == curr:\n    count += 1\nelse:\n    res.append(f'{curr}{count}')\n    curr = s[i]\n    count = 1" },
      { tier: 4, title: "Append Final Group", nudge: "After the loop finishes, append the last run: `res.append(f'{curr}{count}')`, then print `''.join(res)`.", reflectionQuestion: "\ud83d\udca1 Tip: Without this step, the last character group would be lost!", codeSnippet: "res.append(f'{curr}{count}')\nprint(''.join(res))" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nif not s:\n    print(\"\")\nelse:\n    res = []\n    curr = s[0]\n    count = 1\n    for i in range(1, len(s)):\n        if s[i] == curr:\n            count += 1\n        else:\n            res.append(f\"{curr}{count}\")\n            curr = s[i]\n            count = 1\n    res.append(f\"{curr}{count}\")\n    print(\"\".join(res))" }
    ],
  },
  6: {
    greeting: "Welcome! We want to push all zeroes to the end of the list while keeping the other numbers in order.",
    conceptName: "Move Zeroes (Two Pointers)",
    conceptExplanation: "Use a pointer `pos = 0`. Whenever you see a non-zero number, put it at `nums[pos]` and increment `pos`. Finally, fill the rest with zeroes!",
    patternExample: "nums = list(map(int, input().split()))\ninsert_pos = 0\nfor x in nums:\n    if x != 0:\n        nums[insert_pos] = x\n        insert_pos += 1\nwhile insert_pos < len(nums):\n    nums[insert_pos] = 0\n    insert_pos += 1\nprint(\" \".join(map(str, nums)))",
    interviewTrap: "Keep the relative order of non-zero numbers! Don't just sort, because sorting changes the original order.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Collect all non-zero numbers to the front of the list, then fill the remaining slots with zeroes.", reflectionQuestion: "\ud83d\udca1 Tip: [0, 1, 0, 3, 12] becomes [1, 3, 12, 0, 0]." },
      { tier: 2, title: "Pointer Strategy", nudge: "Read the numbers: `nums = list(map(int, input().split()))`. Set `pos = 0` as our write position.", reflectionQuestion: "\ud83d\udca1 Tip: `pos` points to where the next non-zero number belongs.", codeSnippet: "pos = 0" },
      { tier: 3, title: "Collect Non-Zeroes", nudge: "Loop through `nums`. If `x != 0`, set `nums[pos] = x` and `pos += 1`.", reflectionQuestion: "\ud83d\udca1 Tip: This packs all non-zeros at the front.", codeSnippet: "for x in nums:\n    if x != 0:\n        nums[pos] = x\n        pos += 1" },
      { tier: 4, title: "Fill with Zeroes", nudge: "From `pos` to the end of `nums`, set `nums[pos] = 0`. Then print space-separated.", reflectionQuestion: "\ud83d\udca1 Tip: `print(' '.join(map(str, nums)))` prints them cleanly.", codeSnippet: "while pos < len(nums):\n    nums[pos] = 0\n    pos += 1\nprint(' '.join(map(str, nums)))" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\ninsert_pos = 0\nfor x in nums:\n    if x != 0:\n        nums[insert_pos] = x\n        insert_pos += 1\nwhile insert_pos < len(nums):\n    nums[insert_pos] = 0\n    insert_pos += 1\nprint(\" \".join(map(str, nums)))" }
    ],
  },
  7: {
    greeting: "Welcome to Two Sum! Find two numbers in the list that add up to the target. Let's do it in one single pass!",
    conceptName: "Two Sum (Hash Map Lookup)",
    conceptExplanation: "As you loop through numbers, compute `complement = target - num`. If `complement` is already in your dictionary, you found the answer!",
    patternExample: "nums = list(map(int, input().split()))\ntarget = int(input())\nseen = {}\nfor i, num in enumerate(nums):\n    diff = target - num\n    if diff in seen:\n        print(f\"{seen[diff]} {i}\")\n        break\n    seen[num] = i",
    interviewTrap: "Don't use the same element twice. Store the number in the dictionary AFTER checking.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "For each number `x`, you need to know if `target - x` was seen previously in the list.", reflectionQuestion: "\ud83d\udca1 Tip: If target is 9 and current number is 2, look for 7." },
      { tier: 2, title: "Dictionary for Seen Numbers", nudge: "Create a dictionary `seen = {}` where key is the number and value is its index: `seen[num] = index`.", reflectionQuestion: "\ud83d\udca1 Tip: Looking up in a dictionary takes O(1) instant time.", codeSnippet: "seen = {}" },
      { tier: 3, title: "Find the Pair", nudge: "Loop with `enumerate(nums)`: `comp = target - num`. If `comp in seen`, print `seen[comp]` and `i`!", reflectionQuestion: "\ud83d\udca1 Tip: That's your winning pair.", codeSnippet: "comp = target - num\nif comp in seen:\n    print(f'{seen[comp]} {i}')\n    break\nseen[num] = i" },
      { tier: 4, title: "Print Format", nudge: "Print the two indices separated by a space: `print(f'{seen[comp]} {i}')`.", reflectionQuestion: "\ud83d\udca1 Tip: Exactly matches the terminal output contract." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\ntarget = int(input())\nseen = {}\nfor i, num in enumerate(nums):\n    diff = target - num\n    if diff in seen:\n        print(f\"{seen[diff]} {i}\")\n        break\n    seen[num] = i" }
    ],
  },
  8: {
    greeting: "Welcome! Find the element that appears more than half the time in the list. Boyer-Moore makes this effortless!",
    conceptName: "Majority Element (Boyer-Moore)",
    conceptExplanation: "Keep a `candidate` and a `count`. If `count == 0`, pick the current number. If the next number matches, count += 1; otherwise count -= 1.",
    patternExample: "nums = list(map(int, input().split()))\ncandidate = None\ncount = 0\nfor x in nums:\n    if count == 0:\n        candidate = x\n    count += (1 if x == candidate else -1)\nprint(candidate)",
    interviewTrap: "The majority element is guaranteed to exist and outnumber all other elements combined.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Because the majority element appears more than N/2 times, it can cancel out every other number and still survive!", reflectionQuestion: "\ud83d\udca1 Tip: Think of it like a voting battle." },
      { tier: 2, title: "Variables", nudge: "Initialize `candidate = None` and `count = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: Uses zero extra memory!", codeSnippet: "candidate = None\ncount = 0" },
      { tier: 3, title: "The Voting Loop", nudge: "Loop through numbers: if `count == 0`, set `candidate = x`. If `x == candidate`, `count += 1`, else `count -= 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Simple addition and subtraction.", codeSnippet: "for x in nums:\n    if count == 0: candidate = x\n    count += 1 if x == candidate else -1" },
      { tier: 4, title: "Print Winner", nudge: "Print the `candidate` directly. It is guaranteed to be the majority element.", reflectionQuestion: "\ud83d\udca1 Tip: `print(candidate)`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\ncandidate = None\ncount = 0\nfor x in nums:\n    if count == 0:\n        candidate = x\n    count += (1 if x == candidate else -1)\nprint(candidate)" }
    ],
  },
  9: {
    greeting: "Welcome! A list contains distinct numbers from 0 to N with one missing. A simple math formula finds it instantly!",
    conceptName: "Missing Number (Math Formula)",
    conceptExplanation: "The sum of numbers from 0 to N is `N * (N + 1) // 2`. Subtract the actual sum of the list to find the missing number!",
    patternExample: "nums = list(map(int, input().split()))\nn = len(nums)\nexpected = n * (n + 1) // 2\nactual = sum(nums)\nprint(expected - actual)",
    interviewTrap: "No need to sort or search! Math gives the answer in one line.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Sum of numbers from 0 to N is `N * (N + 1) // 2`. The missing number is expected sum minus actual sum.", reflectionQuestion: "\ud83d\udca1 Tip: For [3, 0, 1], N=3, expected sum is 6, actual is 4 -> missing is 2." },
      { tier: 2, title: "Calculate Expected Sum", nudge: "`n = len(nums)`. Expected total is `expected = n * (n + 1) // 2`.", reflectionQuestion: "\ud83d\udca1 Tip: `//` gives an integer.", codeSnippet: "n = len(nums)\nexpected = n * (n + 1) // 2" },
      { tier: 3, title: "Calculate Actual Sum", nudge: "Use Python's built-in `sum(nums)` to get the sum of elements in the array.", reflectionQuestion: "\ud83d\udca1 Tip: Fast C-level summation.", codeSnippet: "actual = sum(nums)" },
      { tier: 4, title: "Print Difference", nudge: "Print `expected - actual`. That's the missing number!", reflectionQuestion: "\ud83d\udca1 Tip: `print(expected - sum(nums))`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nn = len(nums)\nexpected = n * (n + 1) // 2\nactual = sum(nums)\nprint(expected - actual)" }
    ],
  },
  10: {
    greeting: "Welcome! We want to rotate a list of numbers to the right by k steps. Slicing in Python does this in one line!",
    conceptName: "Rotate Array (Slicing)",
    conceptExplanation: "1. `k = k % len(nums)` to handle cases where k is bigger than the list.\n2. The last `k` numbers move to the front (`nums[-k:]`), and the first `n-k` numbers go to the back (`nums[:-k]`).",
    patternExample: "nums = list(map(int, input().split()))\nk = int(input())\nif nums:\n    k = k % len(nums)\n    if k > 0:\n        nums = nums[-k:] + nums[:-k]\nprint(\" \".join(map(str, nums)))",
    interviewTrap: "Always compute `k = k % len(nums)` first! If k equals the length of the list, nothing moves.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Rotating right by k moves the last k items to the front.", reflectionQuestion: "\ud83d\udca1 Tip: [1, 2, 3, 4, 5] rotated by 2 becomes [4, 5, 1, 2, 3]." },
      { tier: 2, title: "Modulo Arithmetic", nudge: "Do `k = k % len(nums)` so k is never larger than the list length.", reflectionQuestion: "\ud83d\udca1 Tip: If length is 5 and k is 7, rotating 7 is the same as rotating 2.", codeSnippet: "k = k % len(nums)" },
      { tier: 3, title: "Slice and Combine", nudge: "In Python: `nums[-k:]` gets the last k items, and `nums[:-k]` gets everything before that! Add them: `nums[-k:] + nums[:-k]`.", reflectionQuestion: "\ud83d\udca1 Tip: `+` concatenates two lists.", codeSnippet: "res = nums[-k:] + nums[:-k] if k != 0 else nums" },
      { tier: 4, title: "Print Space-Separated", nudge: "Print the result: `print(' '.join(map(str, res)))`.", reflectionQuestion: "\ud83d\udca1 Tip: Converts numbers to space-separated string." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nk = int(input())\nif nums:\n    k = k % len(nums)\n    if k > 0:\n        nums = nums[-k:] + nums[:-k]\nprint(\" \".join(map(str, nums)))" }
    ],
  },
  11: {
    greeting: "Welcome! Count how many times each word appears in a sentence and print them alphabetically.",
    conceptName: "Word Frequency Counting",
    conceptExplanation: "1. Lowercase and split into words: `words = s.lower().split()`.\n2. Count in a dictionary.\n3. Loop over `sorted(counts.keys())` and print `word: count`.",
    patternExample: "s = input()\nwords = s.lower().split()\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nfor w in sorted(counts.keys()):\n    print(f\"{w}: {counts[w]}\")",
    interviewTrap: "Lowercase everything first so 'The' and 'the' are counted as the same word.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Make text lowercase, split into words, count each word in a dictionary, and print sorted alphabetically.", reflectionQuestion: "\ud83d\udca1 Tip: 'Apple apple' -> apple: 2." },
      { tier: 2, title: "Read & Clean Words", nudge: "Read input: `words = input().lower().split()`. This gives a list of lowercase words.", reflectionQuestion: "\ud83d\udca1 Tip: `s.lower().split()` cleans and splits.", codeSnippet: "words = input().lower().split()" },
      { tier: 3, title: "Count in Dictionary", nudge: "Loop through `words`: `counts[w] = counts.get(w, 0) + 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Stores word counts.", codeSnippet: "counts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1" },
      { tier: 4, title: "Sorted Output", nudge: "Loop through `sorted(counts)`: `print(f'{w}: {counts[w]}')`.", reflectionQuestion: "\ud83d\udca1 Tip: `sorted()` sorts alphabetically.", codeSnippet: "for w in sorted(counts):\n    print(f'{w}: {counts[w]}')" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nwords = s.lower().split()\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nfor w in sorted(counts.keys()):\n    print(f\"{w}: {counts[w]}\")" }
    ],
  },
  12: {
    greeting: "Welcome! Find the unique numbers that appear in both arrays.",
    conceptName: "Set Intersection",
    conceptExplanation: "Convert both lists to sets, find their common elements using the `&` operator, and sort them before printing.",
    patternExample: "nums1 = list(map(int, input().split()))\nnums2 = list(map(int, input().split()))\ninter = set(nums1).intersection(set(nums2))\nif inter:\n    print(\" \".join(map(str, sorted(inter))))\nelse:\n    print(\"\")",
    interviewTrap: "Only output unique numbers (no duplicates). Sets handle deduplication automatically!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Convert both lists into sets. Set intersection `&` finds common items.", reflectionQuestion: "\ud83d\udca1 Tip: {1, 2, 2, 1} & {2, 2} becomes {2}." },
      { tier: 2, title: "Convert to Sets", nudge: "Read both lines as integer lists: `nums1` and `nums2`. Then `set(nums1) & set(nums2)` gets the common elements.", reflectionQuestion: "\ud83d\udca1 Tip: `&` is the set intersection operator in Python.", codeSnippet: "common = set(nums1) & set(nums2)" },
      { tier: 3, title: "Sort the List", nudge: "Convert to a sorted list: `res = sorted(list(common))`.", reflectionQuestion: "\ud83d\udca1 Tip: `sorted()` puts them in ascending order.", codeSnippet: "res = sorted(list(set(nums1) & set(nums2)))" },
      { tier: 4, title: "Print Space-Separated", nudge: "Print: `print(' '.join(map(str, res)))`.", reflectionQuestion: "\ud83d\udca1 Tip: Space-separated format." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums1 = list(map(int, input().split()))\nnums2 = list(map(int, input().split()))\ninter = set(nums1).intersection(set(nums2))\nif inter:\n    print(\" \".join(map(str, sorted(inter))))\nelse:\n    print(\"\")" }
    ],
  },
  13: {
    greeting: "Welcome! Check if any number appears twice in the list with index distance <= k.",
    conceptName: "Duplicate within Distance K",
    conceptExplanation: "Keep track of each number's last index in a dictionary `seen`. If you see `num` again and `current_index - seen[num] <= k`, print True!",
    patternExample: "nums = list(map(int, input().split()))\nk = int(input())\npos = {}\nfound = False\nfor i, x in enumerate(nums):\n    if x in pos and i - pos[x] <= k:\n        found = True\n        break\n    pos[x] = i\nprint(found)",
    interviewTrap: "Always update `seen[num] = i` so you always check against the closest previous occurrence.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Remember where each number was last seen. If you see it again within k steps, answer is True.", reflectionQuestion: "\ud83d\udca1 Tip: Distance is i - previous_index." },
      { tier: 2, title: "Dictionary for Last Index", nudge: "Use `seen = {}` to store `{number: last_seen_index}`.", reflectionQuestion: "\ud83d\udca1 Tip: Instant O(1) check.", codeSnippet: "seen = {}" },
      { tier: 3, title: "Check Distance", nudge: "Loop with `enumerate(nums)`: if `num in seen and i - seen[num] <= k`, print True and break! Else `seen[num] = i`.", reflectionQuestion: "\ud83d\udca1 Tip: Update index on every step.", codeSnippet: "if num in seen and i - seen[num] <= k:\n    found = True\n    break\nseen[num] = i" },
      { tier: 4, title: "Print Result", nudge: "If found, print True. If loop finishes without finding any, print False.", reflectionQuestion: "\ud83d\udca1 Tip: Boolean output." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nk = int(input())\npos = {}\nfound = False\nfor i, x in enumerate(nums):\n    if x in pos and i - pos[x] <= k:\n        found = True\n        break\n    pos[x] = i\nprint(found)" }
    ],
  },
  14: {
    greeting: "Welcome! Two strings are isomorphic if each character in s maps 1-to-1 with a character in t.",
    conceptName: "Isomorphic Strings",
    conceptExplanation: "Use two dictionaries: one mapping s -> t, and one mapping t -> s. If any character maps to two different letters, print False!",
    patternExample: "s = input()\nt = input()\nif len(s) != len(t):\n    print(False)\nelse:\n    print(len(set(s)) == len(set(t)) == len(set(zip(s, t))))",
    interviewTrap: "Mapping one way is not enough! Check both s -> t and t -> s.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Every letter in string 1 must map to exactly one letter in string 2, and vice versa.", reflectionQuestion: "\ud83d\udca1 Tip: 'egg' and 'add' are isomorphic; 'foo' and 'bar' are not." },
      { tier: 2, title: "Length Check & Dicts", nudge: "If `len(s) != len(t)`, print False. Create two dicts: `st = {}` and `ts = {}`.", reflectionQuestion: "\ud83d\udca1 Tip: Two-way bijection.", codeSnippet: "st = {}; ts = {}" },
      { tier: 3, title: "Pair Check", nudge: "Loop with `zip(s, t)`: if `st.get(c1, c2) != c2` or `ts.get(c2, c1) != c1`, print False! Else record mappings.", reflectionQuestion: "\ud83d\udca1 Tip: `zip()` loops both strings together.", codeSnippet: "if st.get(c1, c2) != c2 or ts.get(c2, c1) != c1:\n    is_iso = False\n    break\nst[c1] = c2; ts[c2] = c1" },
      { tier: 4, title: "Print Result", nudge: "Print True if all characters mapped consistently, otherwise False.", reflectionQuestion: "\ud83d\udca1 Tip: Pythonic trick: `len(set(s)) == len(set(t)) == len(set(zip(s, t)))`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nt = input()\nif len(s) != len(t):\n    print(False)\nelse:\n    print(len(set(s)) == len(set(t)) == len(set(zip(s, t))))" }
    ],
  },
  15: {
    greeting: "Welcome! Check if any contiguous part of the list adds up to 0. Prefix sums make this super fast!",
    conceptName: "Subarray with Zero Sum",
    conceptExplanation: "Keep a running total of the numbers. If the running total hits 0, or if you see a running total that appeared before, a zero-sum subarray exists!",
    patternExample: "nums = list(map(int, input().split()))\nseen = set([0])\ncurr = 0\nfound = False\nfor x in nums:\n    curr += x\n    if curr in seen:\n        found = True\n        break\n    seen.add(curr)\nprint(found)",
    interviewTrap: "Start with `seen = {0}`! If the running sum becomes 0, that means elements from index 0 sum to 0.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "If your running sum repeats (or hits 0), the numbers between those two points must sum to 0!", reflectionQuestion: "\ud83d\udca1 Tip: 4 + 2 - 3 + 1 = 4. Since 4 repeats, (2 - 3 + 1) = 0!" },
      { tier: 2, title: "Set for Running Sums", nudge: "Initialize `seen = {0}` and `curr = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: A set gives instant O(1) lookup.", codeSnippet: "seen = {0}\ncurr = 0" },
      { tier: 3, title: "Loop and Check", nudge: "Loop through numbers: `curr += x`. If `curr in seen`, we found a zero sum! Break and print True.", reflectionQuestion: "\ud83d\udca1 Tip: Else `seen.add(curr)`.", codeSnippet: "for x in nums:\n    curr += x\n    if curr in seen:\n        found = True; break\n    seen.add(curr)" },
      { tier: 4, title: "Print Result", nudge: "Print True if found, False otherwise.", reflectionQuestion: "\ud83d\udca1 Tip: O(n) single pass." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nseen = set([0])\ncurr = 0\nfound = False\nfor x in nums:\n    curr += x\n    if curr in seen:\n        found = True\n        break\n    seen.add(curr)\nprint(found)" }
    ],
  },
  16: {
    greeting: "Welcome to Binary Search! Find target in a sorted list in O(log n) time by repeatedly cutting the search space in half.",
    conceptName: "Binary Search",
    conceptExplanation: "Set `low = 0, high = len(nums) - 1`. While `low <= high`, check `mid = (low + high) // 2`. If match, return mid. If `nums[mid] < target`, move low right. Else move high left.",
    patternExample: "nums = list(map(int, input().split()))\ntarget = int(input())\nlow, high = 0, len(nums) - 1\nans = -1\nwhile low <= high:\n    mid = (low + high) // 2\n    if nums[mid] == target:\n        ans = mid\n        break\n    elif nums[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1\nprint(ans)",
    interviewTrap: "Update `low = mid + 1` and `high = mid - 1`. Don't just set `low = mid` or you might get stuck in an infinite loop.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Because the list is sorted, check the middle item. If target is bigger, search the right half; if smaller, search the left half.", reflectionQuestion: "\ud83d\udca1 Tip: Cuts search in half each step." },
      { tier: 2, title: "Pointers", nudge: "Initialize `low = 0` and `high = len(nums) - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: While low <= high.", codeSnippet: "low = 0\nhigh = len(nums) - 1" },
      { tier: 3, title: "Midpoint & Comparison", nudge: "`mid = (low + high) // 2`. If `nums[mid] == target`, found it! If `nums[mid] < target`, `low = mid + 1`. Else `high = mid - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Simple 3-way check.", codeSnippet: "mid = (low + high) // 2\nif nums[mid] == target: ans = mid; break\nelif nums[mid] < target: low = mid + 1\nelse: high = mid - 1" },
      { tier: 4, title: "Not Found Case", nudge: "If loop ends without finding target, print -1.", reflectionQuestion: "\ud83d\udca1 Tip: Standard binary search contract." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\ntarget = int(input())\nlow, high = 0, len(nums) - 1\nans = -1\nwhile low <= high:\n    mid = (low + high) // 2\n    if nums[mid] == target:\n        ans = mid\n        break\n    elif nums[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1\nprint(ans)" }
    ],
  },
  17: {
    greeting: "Welcome! Remove duplicates from a sorted list in-place so each number appears once.",
    conceptName: "Remove Duplicates from Sorted Array",
    conceptExplanation: "Because the list is sorted, all duplicate numbers sit right next to each other. Keep a `pos` pointer and only copy numbers that are different from the previous one!",
    patternExample: "nums = list(map(int, input().split()))\nif not nums:\n    print(\"\")\nelse:\n    write_idx = 1\n    for i in range(1, len(nums)):\n        if nums[i] != nums[i - 1]:\n            nums[write_idx] = nums[i]\n            write_idx += 1\n    print(\" \".join(map(str, nums[:write_idx])))",
    interviewTrap: "The list is already sorted. Compare `nums[i]` with the last unique number at `nums[pos - 1]`.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Since the list is sorted, equal numbers are neighbors. Keep only elements that differ from their neighbor.", reflectionQuestion: "\ud83d\udca1 Tip: [1, 1, 2] -> keep first 1, then keep 2." },
      { tier: 2, title: "Two Pointers", nudge: "If list has <= 1 elements, it's already unique. Otherwise start `pos = 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Index 0 is always unique.", codeSnippet: "pos = 1" },
      { tier: 3, title: "Copy Unique", nudge: "Loop `i` from 1 to end: if `nums[i] != nums[pos - 1]`, set `nums[pos] = nums[i]` and `pos += 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Overwrites duplicates in-place.", codeSnippet: "for i in range(1, len(nums)):\n    if nums[i] != nums[pos - 1]:\n        nums[pos] = nums[i]\n        pos += 1" },
      { tier: 4, title: "Print Result", nudge: "Print elements from index 0 to `pos`: `' '.join(map(str, nums[:pos]))`.", reflectionQuestion: "\ud83d\udca1 Tip: Only print the unique portion." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nif not nums:\n    print(\"\")\nelse:\n    write_idx = 1\n    for i in range(1, len(nums)):\n        if nums[i] != nums[i - 1]:\n            nums[write_idx] = nums[i]\n            write_idx += 1\n    print(\" \".join(map(str, nums[:write_idx])))" }
    ],
  },
  18: {
    greeting: "Welcome! Square each number in a sorted list and return them in sorted order.",
    conceptName: "Squares of a Sorted Array",
    conceptExplanation: "Negative numbers like -4 squared become positive (16). Use two pointers at `left = 0` and `right = n - 1`, compare their squares, and fill the result list from right to left!",
    patternExample: "nums = list(map(int, input().split()))\nn = len(nums)\nleft, right = 0, n - 1\nres = [0] * n\nidx = n - 1\nwhile left <= right:\n    l_sq = nums[left] ** 2\n    r_sq = nums[right] ** 2\n    if l_sq > r_sq:\n        res[idx] = l_sq\n        left += 1\n    else:\n        res[idx] = r_sq\n        right -= 1\n    idx -= 1\nprint(\" \".join(map(str, res)))",
    interviewTrap: "The largest squares are always at the outer edges (leftmost negative or rightmost positive).",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "The biggest squares will always come from either the far left (big negatives) or far right (big positives).", reflectionQuestion: "\ud83d\udca1 Tip: Compare both ends!" },
      { tier: 2, title: "Two Pointers & Result List", nudge: "`left = 0, right = n - 1`. Create `res = [0] * n` and fill pointer `p = n - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Fill backwards so largest goes to the end.", codeSnippet: "left = 0; right = n - 1; p = n - 1\nres = [0] * n" },
      { tier: 3, title: "Compare Squares", nudge: "If `abs(nums[left]) > abs(nums[right])`, place `nums[left]**2` at `res[p]` and `left += 1`. Else place `nums[right]**2` and `right -= 1`. `p -= 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Pick the bigger square.", codeSnippet: "if abs(nums[left]) > abs(nums[right]):\n    res[p] = nums[left]**2; left += 1\nelse:\n    res[p] = nums[right]**2; right -= 1\np -= 1" },
      { tier: 4, title: "Print Space-Separated", nudge: "Print `print(' '.join(map(str, res)))`.", reflectionQuestion: "\ud83d\udca1 Tip: Python one-liner alternative: `sorted([x**2 for x in nums])` also passes!" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nn = len(nums)\nleft, right = 0, n - 1\nres = [0] * n\nidx = n - 1\nwhile left <= right:\n    l_sq = nums[left] ** 2\n    r_sq = nums[right] ** 2\n    if l_sq > r_sq:\n        res[idx] = l_sq\n        left += 1\n    else:\n        res[idx] = r_sq\n        right -= 1\n    idx -= 1\nprint(\" \".join(map(str, res)))" }
    ],
  },
  19: {
    greeting: "Welcome! Find where target exists in a sorted array, or the index where it should be inserted if missing.",
    conceptName: "Search Insert Position",
    conceptExplanation: "Run standard binary search. If target is found, return its index. If loop ends, `low` is the exact insertion index!",
    patternExample: "nums = list(map(int, input().split()))\ntarget = int(input())\nlow, high = 0, len(nums) - 1\nwhile low <= high:\n    mid = (low + high) // 2\n    if nums[mid] == target:\n        low = mid\n        break\n    elif nums[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1\nprint(low)",
    interviewTrap: "When binary search terminates with `low > high`, `low` is always pointing to the correct insert position.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Run binary search. If target isn't in the list, `low` naturally points to where target belongs!", reflectionQuestion: "\ud83d\udca1 Tip: [1, 3, 5, 6], target 2 -> low ends at index 1." },
      { tier: 2, title: "Binary Search Setup", nudge: "Set `low = 0, high = len(nums) - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Standard setup.", codeSnippet: "low = 0; high = len(nums) - 1" },
      { tier: 3, title: "Search Loop", nudge: "While `low <= high`: `mid = (low + high) // 2`. If `nums[mid] == target`, print `mid`. If `< target`, `low = mid + 1`. Else `high = mid - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Regular halving.", codeSnippet: "if nums[mid] == target: print(mid); return\nelif nums[mid] < target: low = mid + 1\nelse: high = mid - 1" },
      { tier: 4, title: "Print Low", nudge: "If loop finishes without finding target, print `low`.", reflectionQuestion: "\ud83d\udca1 Tip: `print(low)`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\ntarget = int(input())\nlow, high = 0, len(nums) - 1\nwhile low <= high:\n    mid = (low + high) // 2\n    if nums[mid] == target:\n        low = mid\n        break\n    elif nums[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1\nprint(low)" }
    ],
  },
  20: {
    greeting: "Welcome! Check if a list strictly increases to a peak, then strictly decreases to the end.",
    conceptName: "Valid Mountain Array",
    conceptExplanation: "1. Walk up from index 0 while `nums[i] < nums[i+1]`.\n2. The peak cannot be the first or last element.\n3. Walk down while `nums[i] > nums[i+1]`. If you reach the very end, it's a valid mountain!",
    patternExample: "nums = list(map(int, input().split()))\nn = len(nums)\ni = 0\nwhile i + 1 < n and nums[i] < nums[i + 1]:\n    i += 1\nif i == 0 or i == n - 1:\n    print(False)\nelse:\n    while i + 1 < n and nums[i] > nums[i + 1]:\n        i += 1\n    print(i == n - 1)",
    interviewTrap: "A flat plateau (like [2, 2]) is NOT a mountain! Must be strictly increasing then strictly decreasing.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Climb up to the highest peak, then climb down. If you smoothly reach the end without flat spots, it's a mountain.", reflectionQuestion: "\ud83d\udca1 Tip: Length must be >= 3." },
      { tier: 2, title: "Climb Up", nudge: "Start `i = 0`. While `i + 1 < n and nums[i] < nums[i+1]`: `i += 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Walks up to peak.", codeSnippet: "while i + 1 < n and nums[i] < nums[i+1]:\n    i += 1" },
      { tier: 3, title: "Check Peak Validity", nudge: "The peak cannot be at `i == 0` (no climb up) or `i == n - 1` (no climb down). If so, print False!", reflectionQuestion: "\ud83d\udca1 Tip: Must have both sides.", codeSnippet: "if i == 0 or i == n - 1:\n    print(False)" },
      { tier: 4, title: "Climb Down & Verify", nudge: "While `i + 1 < n and nums[i] > nums[i+1]`: `i += 1`. Print `i == n - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: If you reached the end, it's True.", codeSnippet: "while i + 1 < n and nums[i] > nums[i+1]:\n    i += 1\nprint(i == n - 1)" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nn = len(nums)\ni = 0\nwhile i + 1 < n and nums[i] < nums[i + 1]:\n    i += 1\nif i == 0 or i == n - 1:\n    print(False)\nelse:\n    while i + 1 < n and nums[i] > nums[i + 1]:\n        i += 1\n    print(i == n - 1)" }
    ],
  },
  21: {
    greeting: "Welcome! Every number appears twice except for one. XOR finds the lonely number in 2 lines!",
    conceptName: "Single Number (Bitwise XOR)",
    conceptExplanation: "In binary, `x ^ x = 0` (any number XORed with itself becomes zero) and `x ^ 0 = x`. XORing all numbers cancels every pair and leaves only the single number!",
    patternExample: "nums = list(map(int, input().split()))\nres = 0\nfor x in nums:\n    res ^= x\nprint(res)",
    interviewTrap: "No need to count frequencies or sort! XOR does this with 0 extra memory.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "XORing two identical numbers gives 0. XORing with 0 leaves the number unchanged.", reflectionQuestion: "\ud83d\udca1 Tip: 5 ^ 5 = 0, and 0 ^ 7 = 7." },
      { tier: 2, title: "Accumulator", nudge: "Start with `res = 0`. Loop through all numbers and XOR them into `res`.", reflectionQuestion: "\ud83d\udca1 Tip: `res ^= x`.", codeSnippet: "res = 0" },
      { tier: 3, title: "XOR Loop", nudge: "For each number `x in nums`: `res ^= x`.", reflectionQuestion: "\ud83d\udca1 Tip: All pairs cancel each other out!", codeSnippet: "for x in nums:\n    res ^= x" },
      { tier: 4, title: "Print the Answer", nudge: "Print `res`. That is the unique single number!", reflectionQuestion: "\ud83d\udca1 Tip: `print(res)`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nres = 0\nfor x in nums:\n    res ^= x\nprint(res)" }
    ],
  },
  22: {
    greeting: "Welcome! Count how many '1' bits exist in the binary representation of a positive integer.",
    conceptName: "Number of 1 Bits (Hamming Weight)",
    conceptExplanation: "Convert the integer to binary string with `bin(n)`, and count the '1' characters: `bin(n).count('1')`!",
    patternExample: "n = int(input())\ncount = 0\nwhile n > 0:\n    n &= (n - 1)\n    count += 1\nprint(count)",
    interviewTrap: "Python's `bin(n)` returns a string like `'0b1011'`. `.count('1')` counts only the set bits.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Convert the number to binary and count how many times '1' appears.", reflectionQuestion: "\ud83d\udca1 Tip: 11 in binary is '1011' -> count is 3." },
      { tier: 2, title: "Read Input", nudge: "Read integer: `n = int(input())`.", reflectionQuestion: "\ud83d\udca1 Tip: Positive integer." },
      { tier: 3, title: "Binary Conversion", nudge: "Use Python's built-in `bin(n)` to get binary format.", reflectionQuestion: "\ud83d\udca1 Tip: `bin(11)` gives `'0b1011'`.", codeSnippet: "binary_str = bin(n)" },
      { tier: 4, title: "Count '1's", nudge: "Count with `.count('1')`: `print(bin(n).count('1'))`.", reflectionQuestion: "\ud83d\udca1 Tip: Bitwise trick: `while n: n &= n - 1; count += 1` also works!" },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "n = int(input())\ncount = 0\nwhile n > 0:\n    n &= (n - 1)\n    count += 1\nprint(count)" }
    ],
  },
  23: {
    greeting: "Welcome! Check if a number is a power of two (like 1, 2, 4, 8, 16, 32...).",
    conceptName: "Power of Two",
    conceptExplanation: "A power of two has only one '1' bit in binary. In bitwise arithmetic, `n & (n - 1) == 0` clears that single bit! If `n > 0 and (n & (n - 1)) == 0`, it's a power of 2.",
    patternExample: "n = int(input())\nprint(n > 0 and (n & (n - 1)) == 0)",
    interviewTrap: "Check `n > 0`! 0 and negative numbers are not powers of two.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Powers of two have exactly one bit set to 1 in binary (1 is 001, 2 is 010, 4 is 100).", reflectionQuestion: "\ud83d\udca1 Tip: 4 in binary is 100, 3 is 011 -> 4 & 3 = 0!" },
      { tier: 2, title: "Bitwise Trick", nudge: "If you subtract 1 from a power of two, all trailing zeroes flip to 1s. So `n & (n - 1)` is always 0!", reflectionQuestion: "\ud83d\udca1 Tip: 8 & 7 = 0." },
      { tier: 3, title: "Guard Positive", nudge: "Ensure `n > 0` so 0 or negative numbers don't falsely return True.", reflectionQuestion: "\ud83d\udca1 Tip: `n > 0 and (n & (n - 1)) == 0`." },
      { tier: 4, title: "Print Result", nudge: "Print the boolean expression directly: `print(n > 0 and (n & (n - 1)) == 0)`.", reflectionQuestion: "\ud83d\udca1 Tip: Instant O(1) time." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "n = int(input())\nprint(n > 0 and (n & (n - 1)) == 0)" }
    ],
  },
  24: {
    greeting: "Welcome to FizzBuzz! Print 'Fizz' for multiples of 3, 'Buzz' for multiples of 5, and 'FizzBuzz' for multiples of both!",
    conceptName: "FizzBuzz Enterprise",
    conceptExplanation: "Loop from 1 to n. Check `i % 15 == 0` first (divisible by both 3 and 5). If not, check `i % 3 == 0`, then `i % 5 == 0`, else print the number.",
    patternExample: "n = int(input())\nfor i in range(1, n + 1):\n    if i % 15 == 0:\n        print(\"FizzBuzz\")\n    elif i % 3 == 0:\n        print(\"Fizz\")\n    elif i % 5 == 0:\n        print(\"Buzz\")\n    else:\n        print(i)",
    interviewTrap: "Check 15 FIRST! If you check 3 first, 15 will print 'Fizz' instead of 'FizzBuzz'.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Numbers divisible by 15 get 'FizzBuzz'. Numbers divisible by 3 get 'Fizz'. Numbers divisible by 5 get 'Buzz'.", reflectionQuestion: "\ud83d\udca1 Tip: 15 is divisible by both 3 and 5." },
      { tier: 2, title: "Loop Setup", nudge: "Read `n = int(input())`. Loop from 1 to n inclusive: `for i in range(1, n + 1):`.", reflectionQuestion: "\ud83d\udca1 Tip: Upper bound must be n + 1." },
      { tier: 3, title: "Condition Hierarchy", nudge: "1. `if i % 15 == 0: print('FizzBuzz')`\n2. `elif i % 3 == 0: print('Fizz')`\n3. `elif i % 5 == 0: print('Buzz')`\n4. `else: print(i)`", reflectionQuestion: "\ud83d\udca1 Tip: Order matters!" },
      { tier: 4, title: "Print Format", nudge: "Print each value on its own line.", reflectionQuestion: "\ud83d\udca1 Tip: Classic interview test." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "n = int(input())\nfor i in range(1, n + 1):\n    if i % 15 == 0:\n        print(\"FizzBuzz\")\n    elif i % 3 == 0:\n        print(\"Fizz\")\n    elif i % 5 == 0:\n        print(\"Buzz\")\n    else:\n        print(i)" }
    ],
  },
  25: {
    greeting: "Welcome! Find the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) of two numbers.",
    conceptName: "GCD & LCM (Euclid Algorithm)",
    conceptExplanation: "1. Euclid's algorithm: `while b: a, b = b, a % b`. When b reaches 0, `a` is the GCD!\n2. Formula for LCM: `(original_a * original_b) // gcd`.",
    patternExample: "a = int(input())\nb = int(input())\ndef gcd(x, y):\n    while y:\n        x, y = y, x % y\n    return x\ng = gcd(a, b)\nl = (a * b) // g\nprint(f\"GCD: {g}, LCM: {l}\")",
    interviewTrap: "Save copies of `a` and `b` before running Euclid's loop so you can compute LCM later!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "GCD is the largest number dividing both. LCM is their product divided by GCD.", reflectionQuestion: "\ud83d\udca1 Tip: For 12 and 18, GCD is 6, LCM is 36." },
      { tier: 2, title: "Save Original Values", nudge: "Read `a = int(input())` and `b = int(input())`. Save `orig_a, orig_b = a, b`.", reflectionQuestion: "\ud83d\udca1 Tip: Needed for LCM formula." },
      { tier: 3, title: "Euclid GCD", nudge: "While `b != 0`: `a, b = b, a % b`. When loop ends, `a` is GCD!", reflectionQuestion: "\ud83d\udca1 Tip: Runs in milliseconds." },
      { tier: 4, title: "Compute LCM & Print", nudge: "LCM is `(orig_a * orig_b) // a`. Print `print(f'{a} {lcm}')`.", reflectionQuestion: "\ud83d\udca1 Tip: Space-separated format." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "a = int(input())\nb = int(input())\ndef gcd(x, y):\n    while y:\n        x, y = y, x % y\n    return x\ng = gcd(a, b)\nl = (a * b) // g\nprint(f\"GCD: {g}, LCM: {l}\")" }
    ],
  },
  26: {
    greeting: "Welcome! Find the Nth Fibonacci number: 0, 1, 1, 2, 3, 5, 8, 13...",
    conceptName: "Fibonacci (Iterative DP)",
    conceptExplanation: "Start with `a = 0, b = 1`. In each step, replace `a, b = b, a + b`. Repeat n times and print `a`!",
    patternExample: "n = int(input())\nif n <= 1:\n    print(n)\nelse:\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    print(b)",
    interviewTrap: "Don't use recursive `f(n-1) + f(n-2)` without memoization, or it will be too slow and time out!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Each Fibonacci number is the sum of the previous two numbers.", reflectionQuestion: "\ud83d\udca1 Tip: F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3..." },
      { tier: 2, title: "Two Variables", nudge: "Start with `a, b = 0, 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Zero extra memory!" },
      { tier: 3, title: "Iterate N Times", nudge: "Loop `n` times: `a, b = b, a + b`.", reflectionQuestion: "\ud83d\udca1 Tip: Moves forward one Fibonacci step each time." },
      { tier: 4, title: "Print Answer", nudge: "Print `a`. That is the Nth Fibonacci number.", reflectionQuestion: "\ud83d\udca1 Tip: `print(a)`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "n = int(input())\nif n <= 1:\n    print(n)\nelse:\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    print(b)" }
    ],
  },
  27: {
    greeting: "Welcome! Count how many trailing zeroes exist at the end of N! (N factorial).",
    conceptName: "Trailing Zeroes in Factorial",
    conceptExplanation: "A trailing zero is created by 10 (2 * 5). Since 2s are abundant, just count how many factors of 5 exist in numbers from 1 to N: `n // 5 + n // 25 + n // 125...`",
    patternExample: "n = int(input())\ncount = 0\nwhile n >= 5:\n    count += n // 5\n    n //= 5\nprint(count)",
    interviewTrap: "NEVER calculate N! directly! For N=100, 100! has 158 digits and takes too long. Just count factors of 5!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Every trailing zero comes from multiplying by 5. Count how many 5s divide into numbers up to N.", reflectionQuestion: "\ud83d\udca1 Tip: For 25, there are five 5s plus an extra 5 (25=5*5)." },
      { tier: 2, title: "Loop Variables", nudge: "Start with `count = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: While n > 0." },
      { tier: 3, title: "Divide by 5", nudge: "While `n > 0`: `count += n // 5`, then `n //= 5`.", reflectionQuestion: "\ud83d\udca1 Tip: Counts multiples of 5, 25, 125..." },
      { tier: 4, title: "Print Count", nudge: "Print `count`. That is the exact number of trailing zeroes.", reflectionQuestion: "\ud83d\udca1 Tip: Instant O(log n) time." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "n = int(input())\ncount = 0\nwhile n >= 5:\n    count += n // 5\n    n //= 5\nprint(count)" }
    ],
  },
  28: {
    greeting: "Welcome! Compute x raised to the power n efficiently.",
    conceptName: "Fast Exponentiation (Pow)",
    conceptExplanation: "Instead of multiplying x by itself n times, square the base whenever the power is even! Python's built-in `pow(x, n)` does this automatically in O(log n).",
    patternExample: "x = int(input())\nn = int(input())\ndef power(base, exp):\n    res = 1\n    while exp > 0:\n        if exp % 2 == 1:\n            res *= base\n        base *= base\n        exp //= 2\n    return res\nprint(power(x, n))",
    interviewTrap: "Handle negative powers or power = 0 (`x**0 = 1`).",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "To calculate 2^8, you don't need 8 multiplications: (2^4)^2 only takes 3 steps!", reflectionQuestion: "\ud83d\udca1 Tip: Squaring halves the exponent." },
      { tier: 2, title: "Read Inputs", nudge: "Read base `x = int(input())` and power `n = int(input())`.", reflectionQuestion: "\ud83d\udca1 Tip: Two lines of input." },
      { tier: 3, title: "Fast Calculation", nudge: "In Python, `pow(x, n)` or `x ** n` implements binary exponentiation.", reflectionQuestion: "\ud83d\udca1 Tip: Highly optimized in C." },
      { tier: 4, title: "Print Result", nudge: "Print `pow(x, n)`.", reflectionQuestion: "\ud83d\udca1 Tip: `print(pow(x, n))`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "x = int(input())\nn = int(input())\ndef power(base, exp):\n    res = 1\n    while exp > 0:\n        if exp % 2 == 1:\n            res *= base\n        base *= base\n        exp //= 2\n    return res\nprint(power(x, n))" }
    ],
  },
  29: {
    greeting: "Welcome! Repeatedly add the digits of a number until only a single digit remains.",
    conceptName: "Digital Root (Add Digits)",
    conceptExplanation: "Example: 38 -> 3 + 8 = 11 -> 1 + 1 = 2. A simple while loop sums digits while `n >= 10`. Math shortcut: `1 + (n - 1) % 9`!",
    patternExample: "n = int(input())\nwhile n >= 10:\n    n = sum(int(c) for c in str(n))\nprint(n)",
    interviewTrap: "If the number is already a single digit (< 10), return it directly.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "While the number has 2 or more digits, replace it with the sum of its digits.", reflectionQuestion: "\ud83d\udca1 Tip: 38 -> 11 -> 2." },
      { tier: 2, title: "Loop Condition", nudge: "While `n >= 10`: sum its digits using `sum(int(d) for d in str(n))`.", reflectionQuestion: "\ud83d\udca1 Tip: Loops only 2-3 times max." },
      { tier: 3, title: "Math One-Liner", nudge: "In number theory, digital root is simply `0 if n == 0 else 1 + (n - 1) % 9`!", reflectionQuestion: "\ud83d\udca1 Tip: Constant O(1) time." },
      { tier: 4, title: "Print Answer", nudge: "Print the single digit result.", reflectionQuestion: "\ud83d\udca1 Tip: Simple and elegant." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "n = int(input())\nwhile n >= 10:\n    n = sum(int(c) for c in str(n))\nprint(n)" }
    ],
  },
  30: {
    greeting: "Welcome! An array is monotonic if it is entirely non-decreasing (going up or flat) OR entirely non-increasing (going down or flat).",
    conceptName: "Monotonic Array Verification",
    conceptExplanation: "Check if every adjacent pair `nums[i] <= nums[i+1]`, OR every adjacent pair `nums[i] >= nums[i+1]`. If either is true, print True!",
    patternExample: "nums = list(map(int, input().split()))\nis_inc = True\nis_dec = True\nfor i in range(1, len(nums)):\n    if nums[i] > nums[i - 1]:\n        is_dec = False\n    if nums[i] < nums[i - 1]:\n        is_inc = False\nprint(is_inc or is_dec)",
    interviewTrap: "Equal adjacent numbers (like [1, 2, 2, 3]) are allowed! Monotonic includes flat parts.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "The array must either only go UP (or flat), or only go DOWN (or flat).", reflectionQuestion: "\ud83d\udca1 Tip: [1, 2, 2, 3] is monotonic. [1, 3, 2] is not." },
      { tier: 2, title: "Comparison Flags", nudge: "`increasing = all(nums[i] <= nums[i+1] for i in range(len(nums) - 1))`", reflectionQuestion: "\ud83d\udca1 Tip: Checks if it never goes down." },
      { tier: 3, title: "Decreasing Flag", nudge: "`decreasing = all(nums[i] >= nums[i+1] for i in range(len(nums) - 1))`", reflectionQuestion: "\ud83d\udca1 Tip: Checks if it never goes up." },
      { tier: 4, title: "Print Result", nudge: "Print `increasing or decreasing`.", reflectionQuestion: "\ud83d\udca1 Tip: Simple boolean." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nis_inc = True\nis_dec = True\nfor i in range(1, len(nums)):\n    if nums[i] > nums[i - 1]:\n        is_dec = False\n    if nums[i] < nums[i - 1]:\n        is_inc = False\nprint(is_inc or is_dec)" }
    ],
  },
  31: {
    greeting: "Welcome! Check if brackets '()', '{}', '[]' are closed in the correct order. A stack is the perfect tool!",
    conceptName: "Valid Parentheses (Stack)",
    conceptExplanation: "1. Push opening brackets onto a stack.\n2. When you see a closing bracket, pop from the stack and check if it matches!\n3. At the end, the stack must be completely empty.",
    patternExample: "s = input()\nstack = []\npairs = {')': '(', '}': '{', ']': '['}\nvalid = True\nfor c in s:\n    if c in pairs:\n        if not stack or stack[-1] != pairs[c]:\n            valid = False\n            break\n        stack.pop()\n    else:\n        stack.append(c)\nif stack:\n    valid = False\nprint(valid)",
    interviewTrap: "Check if the stack is empty before popping! If you see ')' and stack is empty, it's invalid.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Every closing bracket must match the most recently opened bracket. Last Opened, First Closed -> LIFO Stack!", reflectionQuestion: "\ud83d\udca1 Tip: '([{}])' is valid; '([)]' is not." },
      { tier: 2, title: "Bracket Map & Stack", nudge: "Create `stack = []` and a map `mapping = {')': '(', '}': '{', ']': '['}`.", reflectionQuestion: "\ud83d\udca1 Tip: Maps closing to opening." },
      { tier: 3, title: "Process Characters", nudge: "For `c in s`: if `c in mapping`: if stack is empty or `stack.pop() != mapping[c]`: print False! Else: `stack.append(c)`.", reflectionQuestion: "\ud83d\udca1 Tip: Push openers, match closers." },
      { tier: 4, title: "Verify Empty Stack", nudge: "At the end, check `len(stack) == 0`. Print True if empty, False if brackets remain unclosed.", reflectionQuestion: "\ud83d\udca1 Tip: `print(len(stack) == 0)`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nstack = []\npairs = {')': '(', '}': '{', ']': '['}\nvalid = True\nfor c in s:\n    if c in pairs:\n        if not stack or stack[-1] != pairs[c]:\n            valid = False\n            break\n        stack.pop()\n    else:\n        stack.append(c)\nif stack:\n    valid = False\nprint(valid)" }
    ],
  },
  32: {
    greeting: "Welcome! Implement a First-In-First-Out (FIFO) queue using two Last-In-First-Out (LIFO) stacks.",
    conceptName: "Queue using Two Stacks",
    conceptExplanation: "Use `in_stack` to push new elements. When popping or peeking: if `out_stack` is empty, pour all elements from `in_stack` to `out_stack` (reversing their order to FIFO)!",
    patternExample: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    s_in = []\n    s_out = []\n    def move():\n        if not s_out:\n            while s_in:\n                s_out.append(s_in.pop())\n    for line in lines[1:n+1]:\n        parts = line.split()\n        cmd = parts[0]\n        if cmd == \"push\":\n            s_in.append(int(parts[1]))\n        elif cmd == \"pop\":\n            move()\n            if s_out:\n                print(s_out.pop())\n        elif cmd == \"peek\":\n            move()\n            if s_out:\n                print(s_out[-1])",
    interviewTrap: "Only pour from `in_stack` to `out_stack` when `out_stack` is empty. Never mix partially transferred elements.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Flipping a stack of pancakes upside down into a second stack reverses the order to First-In-First-Out!", reflectionQuestion: "\ud83d\udca1 Tip: Pouring inverts LIFO to FIFO." },
      { tier: 2, title: "Two Lists as Stacks", nudge: "`in_stack = []` and `out_stack = []`.", reflectionQuestion: "\ud83d\udca1 Tip: Standard Python lists." },
      { tier: 3, title: "Push & Pop Operations", nudge: "Push: `in_stack.append(val)`. Pop: if `not out_stack`: while `in_stack`: `out_stack.append(in_stack.pop())`. Then `out_stack.pop()`.", reflectionQuestion: "\ud83d\udca1 Tip: Amortized O(1) time." },
      { tier: 4, title: "Process Commands", nudge: "Read commands line by line and print pop/peek results as instructed.", reflectionQuestion: "\ud83d\udca1 Tip: Follow the command format." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    s_in = []\n    s_out = []\n    def move():\n        if not s_out:\n            while s_in:\n                s_out.append(s_in.pop())\n    for line in lines[1:n+1]:\n        parts = line.split()\n        cmd = parts[0]\n        if cmd == \"push\":\n            s_in.append(int(parts[1]))\n        elif cmd == \"pop\":\n            move()\n            if s_out:\n                print(s_out.pop())\n        elif cmd == \"peek\":\n            move()\n            if s_out:\n                print(s_out[-1])" }
    ],
  },
  33: {
    greeting: "Welcome! For each number in nums1, find the first greater number to its right in nums2.",
    conceptName: "Next Greater Element (Monotonic Stack)",
    conceptExplanation: "Use a stack of decreasing numbers from nums2. When you see a bigger number, pop the smaller ones and store their next greater in a dictionary!",
    patternExample: "nums1 = list(map(int, input().split()))\nnums2 = list(map(int, input().split()))\nnext_greater = {}\nstack = []\nfor x in nums2:\n    while stack and stack[-1] < x:\n        next_greater[stack.pop()] = x\n    stack.append(x)\nres = [next_greater.get(x, -1) for x in nums1]\nprint(\" \".join(map(str, res)))",
    interviewTrap: "Store answers in a dictionary `greater_map` for nums2 first, then look up answers for nums1 in O(1).",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "As you scan numbers, smaller waiting numbers are looking for the next bigger number. When a bigger one arrives, it resolves them!", reflectionQuestion: "\ud83d\udca1 Tip: A stack keeps waiting numbers in order." },
      { tier: 2, title: "Stack & Map", nudge: "`stack = []` and `greater = {}`.", reflectionQuestion: "\ud83d\udca1 Tip: `greater[num]` will store its next greater element." },
      { tier: 3, title: "Monotonic Stack Loop", nudge: "For `x in nums2`: while `stack and stack[-1] < x`: `greater[stack.pop()] = x`. Then `stack.append(x)`.", reflectionQuestion: "\ud83d\udca1 Tip: Remaining elements in stack get -1." },
      { tier: 4, title: "Query for Nums1", nudge: "For each `x in nums1`, look up `greater.get(x, -1)`. Print space-separated.", reflectionQuestion: "\ud83d\udca1 Tip: `' '.join(str(greater.get(x, -1)) for x in nums1)`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums1 = list(map(int, input().split()))\nnums2 = list(map(int, input().split()))\nnext_greater = {}\nstack = []\nfor x in nums2:\n    while stack and stack[-1] < x:\n        next_greater[stack.pop()] = x\n    stack.append(x)\nres = [next_greater.get(x, -1) for x in nums1]\nprint(\" \".join(map(str, res)))" }
    ],
  },
  34: {
    greeting: "Welcome! '#' means backspace (delete the previous character). Check if two strings become equal after processing backspaces.",
    conceptName: "Backspace String Compare (Stack)",
    conceptExplanation: "Build each string with a stack: push characters onto the stack, and pop when you encounter a '#'. Then compare the two stacks!",
    patternExample: "s = input()\nt = input()\ndef process(text):\n    st = []\n    for c in text:\n        if c == '#':\n            if st:\n                st.pop()\n        else:\n            st.append(c)\n    return st\nprint(process(s) == process(t))",
    interviewTrap: "If you see '#' and the stack is already empty, don't crash! Just ignore it.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Simulate typing on a keyboard with backspaces using a stack. Compare final text.", reflectionQuestion: "\ud83d\udca1 Tip: 'ab#c' becomes 'ac' because # deletes b." },
      { tier: 2, title: "Helper Function", nudge: "Define a helper `build(s)`: `stack = []`. Loop `c in s`: if `c != '#'`: `stack.append(c)`. Elif `stack`: `stack.pop()`. Return `stack`.", reflectionQuestion: "\ud83d\udca1 Tip: Safe pop only if stack is not empty." },
      { tier: 3, title: "Process Both Strings", nudge: "`res1 = build(s)` and `res2 = build(t)`.", reflectionQuestion: "\ud83d\udca1 Tip: Clean modular design." },
      { tier: 4, title: "Print Comparison", nudge: "Print `print(res1 == res2)`.", reflectionQuestion: "\ud83d\udca1 Tip: Returns True if final texts match." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nt = input()\ndef process(text):\n    st = []\n    for c in text:\n        if c == '#':\n            if st:\n                st.pop()\n        else:\n            st.append(c)\n    return st\nprint(process(s) == process(t))" }
    ],
  },
  35: {
    greeting: "Welcome! Simplify a Unix file path like '/home//foo/../bar/' to canonical '/home/bar'.",
    conceptName: "Simplify Unix File Path (Stack)",
    conceptExplanation: "Split the path on '/'. Ignore empty parts and '.'. When you see '..', pop from the stack (go up a directory). Push valid directory names, then join with '/'!",
    patternExample: "path = input()\nparts = path.split('/')\nstack = []\nfor p in parts:\n    if p == '' or p == '.':\n        continue\n    elif p == '..':\n        if stack:\n            stack.pop()\n    else:\n        stack.append(p)\nprint('/' + '/'.join(stack))",
    interviewTrap: "'..' moves up one level (pop). '.' means current directory (ignore). Multiple slashes '///' mean single slash (ignore empty).",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Split by '/'. '..' goes back one folder, '.' stays in current folder, folder names go forward.", reflectionQuestion: "\ud83d\udca1 Tip: Stack models directory depth." },
      { tier: 2, title: "Split by Slash", nudge: "Use `parts = path.split('/')`. Create `stack = []`.", reflectionQuestion: "\ud83d\udca1 Tip: Ignores extra slashes." },
      { tier: 3, title: "Process Parts", nudge: "For `p in parts`: if `p == '..'`: if stack: `stack.pop()`. Elif `p and p != '.'`: `stack.append(p)`.", reflectionQuestion: "\ud83d\udca1 Tip: Clean 3-way check." },
      { tier: 4, title: "Join Canonical Path", nudge: "Print `'/' + '/'.join(stack)`.", reflectionQuestion: "\ud83d\udca1 Tip: Always starts with a slash." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "path = input()\nparts = path.split('/')\nstack = []\nfor p in parts:\n    if p == '' or p == '.':\n        continue\n    elif p == '..':\n        if stack:\n            stack.pop()\n    else:\n        stack.append(p)\nprint('/' + '/'.join(stack))" }
    ],
  },
  36: {
    greeting: "Welcome! Transpose an R x C matrix: swap rows and columns so element at [r][c] moves to [c][r].",
    conceptName: "Matrix Transposition",
    conceptExplanation: "Create a new matrix with C rows and R columns. Element at row `c` and col `r` is `matrix[r][c]`.",
    patternExample: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    R, C = map(int, lines[0].split())\n    matrix = [list(map(int, line.split())) for line in lines[1:R+1]]\n    for c in range(C):\n        col = [str(matrix[r][c]) for r in range(R)]\n        print(\" \".join(col))",
    interviewTrap: "Dimensions change from R x C to C x R! Don't assume the matrix is square.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Turn columns into rows! Column 0 becomes Row 0, Column 1 becomes Row 1.", reflectionQuestion: "\ud83d\udca1 Tip: 2x3 matrix becomes 3x2." },
      { tier: 2, title: "Read Matrix", nudge: "Read R, C. Read R lines of C space-separated numbers into a 2D list `matrix`.", reflectionQuestion: "\ud83d\udca1 Tip: `[list(map(int, input().split())) for _ in range(R)]`." },
      { tier: 3, title: "Transpose Comprehension", nudge: "`transposed = [[matrix[r][c] for r in range(R)] for c in range(C)]`.", reflectionQuestion: "\ud83d\udca1 Tip: Outer loop runs for C columns, inner for R rows." },
      { tier: 4, title: "Print Rows", nudge: "Print each row space-separated: for `row in transposed: print(' '.join(map(str, row)))`.", reflectionQuestion: "\ud83d\udca1 Tip: Format row by row." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    R, C = map(int, lines[0].split())\n    matrix = [list(map(int, line.split())) for line in lines[1:R+1]]\n    for c in range(C):\n        col = [str(matrix[r][c]) for r in range(R)]\n        print(\" \".join(col))" }
    ],
  },
  37: {
    greeting: "Welcome! Sum the primary diagonal and secondary diagonal of an N x N matrix.",
    conceptName: "Matrix Diagonal Sum",
    conceptExplanation: "Primary diagonal has elements `matrix[i][i]`. Secondary diagonal has elements `matrix[i][N - 1 - i]`. If N is odd, the exact center element was counted twice\u2014subtract it once!",
    patternExample: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    matrix = [list(map(int, line.split())) for line in lines[1:n+1]]\n    total = 0\n    for i in range(n):\n        total += matrix[i][i]\n        sec = n - 1 - i\n        if sec != i:\n            total += matrix[i][sec]\n    print(total)",
    interviewTrap: "If N is odd, don't count the middle element twice!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Diagonal 1 goes top-left to bottom-right `[i][i]`. Diagonal 2 goes top-right to bottom-left `[i][N-1-i]`.", reflectionQuestion: "\ud83d\udca1 Tip: Center overlaps if N is odd." },
      { tier: 2, title: "Single Loop", nudge: "Loop `i` from 0 to N - 1: `total += matrix[i][i] + matrix[i][n - 1 - i]`.", reflectionQuestion: "\ud83d\udca1 Tip: One single loop covers both diagonals." },
      { tier: 3, title: "Center Element Adjustment", nudge: "If `n % 2 == 1`: `total -= matrix[n // 2][n // 2]`.", reflectionQuestion: "\ud83d\udca1 Tip: Subtracts double-counted center." },
      { tier: 4, title: "Print Sum", nudge: "Print `total`.", reflectionQuestion: "\ud83d\udca1 Tip: `print(total)`." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    matrix = [list(map(int, line.split())) for line in lines[1:n+1]]\n    total = 0\n    for i in range(n):\n        total += matrix[i][i]\n        sec = n - 1 - i\n        if sec != i:\n            total += matrix[i][sec]\n    print(total)" }
    ],
  },
  38: {
    greeting: "Welcome! Search for a target in a sorted R x C matrix in O(log(R*C)) time.",
    conceptName: "Search in 2D Matrix (Binary Search)",
    conceptExplanation: "Treat the matrix as a flattened 1D sorted array of length R*C. Coordinate mapping: `row = mid // C`, `col = mid % C`. Run standard binary search!",
    patternExample: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    R, C = map(int, lines[0].split())\n    matrix = [list(map(int, line.split())) for line in lines[1:R+1]]\n    target = int(lines[R+1])\n    low, high = 0, R * C - 1\n    found = False\n    while low <= high:\n        mid = (low + high) // 2\n        r, c = mid // C, mid % C\n        val = matrix[r][c]\n        if val == target:\n            found = True\n            break\n        elif val < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    print(found)",
    interviewTrap: "Map 1D index to 2D coordinates: `matrix[mid // C][mid % C]`.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Because each row is sorted and starts after the previous row, the entire matrix is just one big sorted list unfolded!", reflectionQuestion: "\ud83d\udca1 Tip: Treat as array of length R * C." },
      { tier: 2, title: "Binary Search Range", nudge: "`low = 0, high = R * C - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Standard binary search bounds." },
      { tier: 3, title: "Coordinate Conversion", nudge: "`mid = (low + high) // 2`. Look up `val = matrix[mid // C][mid % C]`. If `val == target`: print True. If `< target`: `low = mid + 1`. Else: `high = mid - 1`.", reflectionQuestion: "\ud83d\udca1 Tip: `//` gets row, `%` gets col." },
      { tier: 4, title: "Print Result", nudge: "Print True if found, False if loop finishes.", reflectionQuestion: "\ud83d\udca1 Tip: Logarithmic time." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    R, C = map(int, lines[0].split())\n    matrix = [list(map(int, line.split())) for line in lines[1:R+1]]\n    target = int(lines[R+1])\n    low, high = 0, R * C - 1\n    found = False\n    while low <= high:\n        mid = (low + high) // 2\n        r, c = mid // C, mid % C\n        val = matrix[r][c]\n        if val == target:\n            found = True\n            break\n        elif val < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    print(found)" }
    ],
  },
  39: {
    greeting: "Welcome! Fill a connected region of pixels of the same starting color with a new color (like Paint bucket tool).",
    conceptName: "Flood Fill (DFS / BFS)",
    conceptExplanation: "Start at (sr, sc). If current color matches original color, change it to `new_color` and recursively fill all 4 adjacent neighbors (up, down, left, right)!",
    patternExample: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    R, C = map(int, lines[0].split())\n    image = [list(map(int, line.split())) for line in lines[1:R+1]]\n    sr, sc = map(int, lines[R+1].split())\n    new_color = int(lines[R+2])\n    orig = image[sr][sc]\n    if orig != new_color:\n        q = [(sr, sc)]\n        image[sr][sc] = new_color\n        while q:\n            r, c = q.pop()\n            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < R and 0 <= nc < C and image[nr][nc] == orig:\n                    image[nr][nc] = new_color\n                    q.append((nr, nc))\n    for row in image:\n        print(\" \".join(map(str, row)))",
    interviewTrap: "If `new_color == original_color`, return immediately to avoid infinite recursion!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Spread outwards like water filling a bucket, changing matching neighbor pixels to the new color.", reflectionQuestion: "\ud83d\udca1 Tip: Up, down, left, right." },
      { tier: 2, title: "Boundary Check", nudge: "Only fill if `0 <= r < R` and `0 <= c < C` and `grid[r][c] == orig_color`.", reflectionQuestion: "\ud83d\udca1 Tip: Stay inside grid." },
      { tier: 3, title: "DFS Function", nudge: "Define `dfs(r, c)`: change `grid[r][c] = new_color`. Call `dfs` on `(r+1, c)`, `(r-1, c)`, `(r, c+1)`, `(r, c-1)`.", reflectionQuestion: "\ud83d\udca1 Tip: 4 directions." },
      { tier: 4, title: "Print Grid", nudge: "Print each row space-separated.", reflectionQuestion: "\ud83d\udca1 Tip: Standard grid output." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    R, C = map(int, lines[0].split())\n    image = [list(map(int, line.split())) for line in lines[1:R+1]]\n    sr, sc = map(int, lines[R+1].split())\n    new_color = int(lines[R+2])\n    orig = image[sr][sc]\n    if orig != new_color:\n        q = [(sr, sc)]\n        image[sr][sc] = new_color\n        while q:\n            r, c = q.pop()\n            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < R and 0 <= nc < C and image[nr][nc] == orig:\n                    image[nr][nc] = new_color\n                    q.append((nr, nc))\n    for row in image:\n        print(\" \".join(map(str, row)))" }
    ],
  },
  40: {
    greeting: "Welcome! Rotate an N x N matrix 90 degrees clockwise in-place.",
    conceptName: "Rotate Matrix 90 Degrees Clockwise",
    conceptExplanation: "Two simple steps: 1. Transpose the matrix (swap `matrix[i][j]` with `matrix[j][i]`). 2. Reverse each row!",
    patternExample: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    matrix = [list(map(int, line.split())) for line in lines[1:n+1]]\n    for i in range(n):\n        for j in range(i + 1, n):\n            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]\n    for row in matrix:\n        row.reverse()\n        print(\" \".join(map(str, row)))",
    interviewTrap: "Transpose first, THEN reverse each row. If you reverse first then transpose, it rotates counter-clockwise.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Step 1: Flip along the main diagonal (transpose). Step 2: Reverse each row horizontally. Boom, 90 degree clockwise rotation!", reflectionQuestion: "\ud83d\udca1 Tip: 2 simple geometric steps." },
      { tier: 2, title: "Transpose Step", nudge: "For `i` from 0 to N: for `j` from `i` to N: swap `matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]`.", reflectionQuestion: "\ud83d\udca1 Tip: Only loop j from i to avoid double-swapping back!" },
      { tier: 3, title: "Reverse Rows", nudge: "For `row in matrix`: `row.reverse()`.", reflectionQuestion: "\ud83d\udca1 Tip: In-place reversal." },
      { tier: 4, title: "Print Matrix", nudge: "Print each row space-separated.", reflectionQuestion: "\ud83d\udca1 Tip: Perfectly rotated." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    matrix = [list(map(int, line.split())) for line in lines[1:n+1]]\n    for i in range(n):\n        for j in range(i + 1, n):\n            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]\n    for row in matrix:\n        row.reverse()\n        print(\" \".join(map(str, row)))" }
    ],
  },
  41: {
    greeting: "Welcome! Find the length of the longest substring with all unique characters. Classic sliding window!",
    conceptName: "Longest Substring Without Repeating",
    conceptExplanation: "Maintain a sliding window with left and right pointers. Track each character's last seen index in a dictionary. If you see a duplicate, jump `left = max(left, seen[char] + 1)`. Max window length is `right - left + 1`.",
    patternExample: "s = input()\nlast = {}\nleft = 0\nmax_len = 0\nfor right, c in enumerate(s):\n    if c in last and last[c] >= left:\n        left = last[c] + 1\n    last[c] = right\n    max_len = max(max_len, right - left + 1)\nprint(max_len)",
    interviewTrap: "Always use `left = max(left, seen[char] + 1)` so the left pointer never moves backwards!",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Expand a window to the right. If a letter repeats, shrink the left edge past the previous occurrence.", reflectionQuestion: "\ud83d\udca1 Tip: 'abcabcbb' -> longest is 'abc' (length 3)." },
      { tier: 2, title: "Window Variables", nudge: "`seen = {}`, `left = 0`, `max_len = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: `seen` maps char to index." },
      { tier: 3, title: "Sliding Window Loop", nudge: "Loop with `enumerate(s)`: if `c in seen and seen[c] >= left`: `left = seen[c] + 1`. `seen[c] = right`. `max_len = max(max_len, right - left + 1)`.", reflectionQuestion: "\ud83d\udca1 Tip: Expands right, contracts left." },
      { tier: 4, title: "Print Max Length", nudge: "Print `max_len`.", reflectionQuestion: "\ud83d\udca1 Tip: O(n) single pass." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "s = input()\nlast = {}\nleft = 0\nmax_len = 0\nfor right, c in enumerate(s):\n    if c in last and last[c] >= left:\n        left = last[c] + 1\n    last[c] = right\n    max_len = max(max_len, right - left + 1)\nprint(max_len)" }
    ],
  },
  42: {
    greeting: "Welcome! Group words that are anagrams of each other together.",
    conceptName: "Group Anagrams",
    conceptExplanation: "Anagrams have the exact same sorted letters (e.g. 'eat', 'tea', 'ate' all sort to 'aet'). Group words into a dictionary using `tuple(sorted(word))` as the key!",
    patternExample: "words = input().split()\ngroups = {}\nfor w in words:\n    key = \"\".join(sorted(w))\n    groups.setdefault(key, []).append(w)\nres = []\nfor g in groups.values():\n    res.append(sorted(g))\nres.sort(key=lambda g: g[0])\nfor g in res:\n    print(\" \".join(g))",
    interviewTrap: "A list `['a', 'e', 't']` cannot be a dictionary key because lists are mutable. Convert to a `tuple(sorted(word))` or `''.join(sorted(word))`.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Sort the letters of each word to create a 'signature'. Words with the same signature are anagrams!", reflectionQuestion: "\ud83d\udca1 Tip: 'eat' -> 'aet', 'tea' -> 'aet'." },
      { tier: 2, title: "Groups Dictionary", nudge: "Use a dictionary `groups = {}` where key is the sorted tuple and value is a list of words.", reflectionQuestion: "\ud83d\udca1 Tip: `groups.setdefault(key, []).append(word)`." },
      { tier: 3, title: "Group Words", nudge: "For `w in words`: `key = tuple(sorted(w))`. If `key not in groups: groups[key] = []`. `groups[key].append(w)`.", reflectionQuestion: "\ud83d\udca1 Tip: Collects anagrams." },
      { tier: 4, title: "Print Groups", nudge: "Sort the grouped words and print each group space-separated.", reflectionQuestion: "\ud83d\udca1 Tip: Clean format." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "words = input().split()\ngroups = {}\nfor w in words:\n    key = \"\".join(sorted(w))\n    groups.setdefault(key, []).append(w)\nres = []\nfor g in groups.values():\n    res.append(sorted(g))\nres.sort(key=lambda g: g[0])\nfor g in res:\n    print(\" \".join(g))" }
    ],
  },
  43: {
    greeting: "Welcome! Find two vertical lines that together with the x-axis hold the maximum amount of water.",
    conceptName: "Container With Most Water",
    conceptExplanation: "Place two pointers at `left = 0` and `right = n - 1`. Area is `(right - left) * min(h[left], h[right])`. To find a bigger container, always move the pointer with the shorter height!",
    patternExample: "heights = list(map(int, input().split()))\nleft, right = 0, len(heights) - 1\nmax_area = 0\nwhile left < right:\n    h = min(heights[left], heights[right])\n    max_area = max(max_area, h * (right - left))\n    if heights[left] < heights[right]:\n        left += 1\n    else:\n        right -= 1\nprint(max_area)",
    interviewTrap: "Always move the SHORTER line inward! Moving the taller line can never increase the area because height is limited by the shorter line.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Start with the widest container (outer edges). Move the shorter line inward hoping to find a taller line.", reflectionQuestion: "\ud83d\udca1 Tip: Area = width * min(height1, height2)." },
      { tier: 2, title: "Two Pointers", nudge: "`left = 0, right = len(h) - 1, max_water = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: While left < right." },
      { tier: 3, title: "Calculate & Advance", nudge: "Calculate `area = (right - left) * min(h[left], h[right])`. `max_water = max(max_water, area)`. If `h[left] < h[right]: left += 1` else: `right -= 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Greedy pointer movement." },
      { tier: 4, title: "Print Max Water", nudge: "Print `max_water`.", reflectionQuestion: "\ud83d\udca1 Tip: O(n) time, O(1) space." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "heights = list(map(int, input().split()))\nleft, right = 0, len(heights) - 1\nmax_area = 0\nwhile left < right:\n    h = min(heights[left], heights[right])\n    max_area = max(max_area, h * (right - left))\n    if heights[left] < heights[right]:\n        left += 1\n    else:\n        right -= 1\nprint(max_area)" }
    ],
  },
  44: {
    greeting: "Welcome! Count how many contiguous subarrays sum up to exactly k.",
    conceptName: "Subarray Sum Equals K (Prefix Map)",
    conceptExplanation: "Keep a running prefix sum `curr`. If `curr - k` was seen before, add its frequency to your count! Store prefix sum counts in a dictionary.",
    patternExample: "nums = list(map(int, input().split()))\nk = int(input())\ncounts = {0: 1}\ncurr = 0\nans = 0\nfor x in nums:\n    curr += x\n    ans += counts.get(curr - k, 0)\n    counts[curr] = counts.get(curr, 0) + 1\nprint(ans)",
    interviewTrap: "Initialize `prefix = {0: 1}`! A prefix sum equal to k needs `curr - k = 0` to count.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "If current sum is S, and earlier sum was S - K, then the numbers in between sum to K!", reflectionQuestion: "\ud83d\udca1 Tip: S - (S - K) = K." },
      { tier: 2, title: "Prefix Frequency Map", nudge: "`prefix = {0: 1}`, `curr = 0`, `count = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: {0: 1} handles subarrays starting at index 0." },
      { tier: 3, title: "Running Sum Check", nudge: "For `x in nums`: `curr += x`. `count += prefix.get(curr - k, 0)`. `prefix[curr] = prefix.get(curr, 0) + 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Tally frequencies." },
      { tier: 4, title: "Print Count", nudge: "Print `count`.", reflectionQuestion: "\ud83d\udca1 Tip: O(n) single pass." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nk = int(input())\ncounts = {0: 1}\ncurr = 0\nans = 0\nfor x in nums:\n    curr += x\n    ans += counts.get(curr - k, 0)\n    counts[curr] = counts.get(curr, 0) + 1\nprint(ans)" }
    ],
  },
  45: {
    greeting: "Welcome! Merge all overlapping intervals (like [1, 3] and [2, 6] -> [1, 6]).",
    conceptName: "Merge Overlapping Intervals",
    conceptExplanation: "Sort intervals by start time. Loop through them: if current interval starts before previous ends (`curr.start <= prev.end`), merge them by setting `prev.end = max(prev.end, curr.end)`. Else add as new interval!",
    patternExample: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    intervals = [list(map(int, line.split())) for line in lines[1:n+1]]\n    intervals.sort(key=lambda x: x[0])\n    merged = []\n    for inter in intervals:\n        if not merged or merged[-1][1] < inter[0]:\n            merged.append(inter)\n        else:\n            merged[-1][1] = max(merged[-1][1], inter[1])\n    for inter in merged:\n        print(f\"{inter[0]} {inter[1]}\")",
    interviewTrap: "Sort by start time first! Without sorting, you cannot know which intervals are neighbors.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Sort intervals by start time. If the next interval starts before the current one finishes, extend the end time!", reflectionQuestion: "\ud83d\udca1 Tip: [1, 4] and [2, 5] -> [1, 5]." },
      { tier: 2, title: "Sort Intervals", nudge: "Read intervals and sort: `intervals.sort(key=lambda x: x[0])`.", reflectionQuestion: "\ud83d\udca1 Tip: Puts intervals in chronological order." },
      { tier: 3, title: "Merge Loop", nudge: "Start `merged = [intervals[0]]`. For `curr in intervals[1:]`: if `curr[0] <= merged[-1][1]`: `merged[-1][1] = max(merged[-1][1], curr[1])` else: `merged.append(curr)`.", reflectionQuestion: "\ud83d\udca1 Tip: Merges overlapping." },
      { tier: 4, title: "Print Merged", nudge: "Print each merged interval formatted as required.", reflectionQuestion: "\ud83d\udca1 Tip: Clean interval list." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    intervals = [list(map(int, line.split())) for line in lines[1:n+1]]\n    intervals.sort(key=lambda x: x[0])\n    merged = []\n    for inter in intervals:\n        if not merged or merged[-1][1] < inter[0]:\n            merged.append(inter)\n        else:\n            merged[-1][1] = max(merged[-1][1], inter[1])\n    for inter in merged:\n        print(f\"{inter[0]} {inter[1]}\")" }
    ],
  },
  46: {
    greeting: "Welcome to 3Sum! Find all unique triplets [a, b, c] that add up to 0.",
    conceptName: "3Sum (Three Sum Zero)",
    conceptExplanation: "Sort the array. Fix the first number with loop `i`. Use two pointers `left = i + 1, right = n - 1` to find pairs that sum to `-nums[i]`. Skip duplicate numbers to avoid duplicate triplets!",
    patternExample: "nums = list(map(int, input().split()))\nnums.sort()\nn = len(nums)\ntriplets = []\nfor i in range(n - 2):\n    if i > 0 and nums[i] == nums[i - 1]:\n        continue\n    left, right = i + 1, n - 1\n    target = -nums[i]\n    while left < right:\n        s = nums[left] + nums[right]\n        if s == target:\n            triplets.append([nums[i], nums[left], nums[right]])\n            while left < right and nums[left] == nums[left + 1]:\n                left += 1\n            while left < right and nums[right] == nums[right - 1]:\n                right -= 1\n            left += 1\n            right -= 1\n        elif s < target:\n            left += 1\n        else:\n            right -= 1\nif not triplets:\n    print(\"None\")\nelse:\n    for t in triplets:\n        print(\" \".join(map(str, t)))",
    interviewTrap: "Skip duplicates on `i`, `left`, and `right`! Otherwise you will output the same triplet multiple times.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Sort the array. For each number x, use Two Pointers to find two numbers that sum to -x.", reflectionQuestion: "\ud83d\udca1 Tip: x + y + z = 0 means y + z = -x." },
      { tier: 2, title: "Sort & Loop", nudge: "Sort `nums.sort()`. Loop `i` from 0 to n: if `i > 0 and nums[i] == nums[i-1]: continue`.", reflectionQuestion: "\ud83d\udca1 Tip: Skip duplicate i values." },
      { tier: 3, title: "Two Pointers", nudge: "`left = i + 1, right = n - 1`. While `left < right`: `s = nums[i] + nums[left] + nums[right]`. If `s == 0`: save triplet, advance and skip duplicates! If `s < 0: left += 1` else: `right -= 1`.", reflectionQuestion: "\ud83d\udca1 Tip: Classic two-pointer search." },
      { tier: 4, title: "Print Triplets", nudge: "Print each unique triplet on a new line or formatted as requested.", reflectionQuestion: "\ud83d\udca1 Tip: O(n^2) optimal." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nnums.sort()\nn = len(nums)\ntriplets = []\nfor i in range(n - 2):\n    if i > 0 and nums[i] == nums[i - 1]:\n        continue\n    left, right = i + 1, n - 1\n    target = -nums[i]\n    while left < right:\n        s = nums[left] + nums[right]\n        if s == target:\n            triplets.append([nums[i], nums[left], nums[right]])\n            while left < right and nums[left] == nums[left + 1]:\n                left += 1\n            while left < right and nums[right] == nums[right - 1]:\n                right -= 1\n            left += 1\n            right -= 1\n        elif s < target:\n            left += 1\n        else:\n            right -= 1\nif not triplets:\n    print(\"None\")\nelse:\n    for t in triplets:\n        print(\" \".join(map(str, t)))" }
    ],
  },
  47: {
    greeting: "Welcome! Find the length of the longest consecutive elements sequence in O(n) time.",
    conceptName: "Longest Consecutive Sequence",
    conceptExplanation: "Put all numbers into a hash set. Only start counting a streak from `x` if `x - 1 not in set` (meaning `x` is the start of a streak). Then count `x + 1, x + 2...`!",
    patternExample: "nums = list(map(int, input().split()))\nif not nums:\n    print(0)\nelse:\n    s = set(nums)\n    best = 0\n    for x in s:\n        if x - 1 not in s:\n            curr = x\n            streak = 1\n            while curr + 1 in s:\n                curr += 1\n                streak += 1\n            best = max(best, streak)\n    print(best)",
    interviewTrap: "Only start counting if `x - 1 not in num_set`! This guarantees each number is visited at most twice, maintaining O(n) time.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Put numbers in a set for O(1) lookup. Only start counting a sequence at the beginning of a streak (when x - 1 is absent).", reflectionQuestion: "\ud83d\udca1 Tip: For 100, 4, 200, 1, 3, 2 -> 1, 2, 3, 4 is length 4." },
      { tier: 2, title: "Create Set", nudge: "`num_set = set(nums)`, `max_len = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: Sets remove duplicates and provide instant lookup." },
      { tier: 3, title: "Streak Probe", nudge: "For `x in num_set`: if `x - 1 not in num_set`: `curr = x, length = 1`. While `curr + 1 in num_set`: `curr += 1, length += 1`. `max_len = max(max_len, length)`.", reflectionQuestion: "\ud83d\udca1 Tip: Probes consecutive numbers." },
      { tier: 4, title: "Print Max Length", nudge: "Print `max_len`.", reflectionQuestion: "\ud83d\udca1 Tip: O(n) linear time." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "nums = list(map(int, input().split()))\nif not nums:\n    print(0)\nelse:\n    s = set(nums)\n    best = 0\n    for x in s:\n        if x - 1 not in s:\n            curr = x\n            streak = 1\n            while curr + 1 in s:\n                curr += 1\n                streak += 1\n            best = max(best, streak)\n    print(best)" }
    ],
  },
  48: {
    greeting: "Welcome! For each day, find how many days you have to wait until a warmer temperature.",
    conceptName: "Daily Temperatures (Monotonic Stack)",
    conceptExplanation: "Use a stack to keep track of day indices with colder temperatures. When a warmer day arrives, pop previous days and calculate days waited: `i - prev_i`!",
    patternExample: "temps = list(map(int, input().split()))\nn = len(temps)\nans = [0] * n\nstack = []\nfor i, t in enumerate(temps):\n    while stack and temps[stack[-1]] < t:\n        prev = stack.pop()\n        ans[prev] = i - prev\n    stack.append(i)\nprint(\" \".join(map(str, ans)))",
    interviewTrap: "Store INDICES in the stack (not just temperatures) so you can calculate distance `i - prev_i`.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Days wait on a stack until a warmer day arrives to 'rescue' them. The wait time is the distance between day indices.", reflectionQuestion: "\ud83d\udca1 Tip: Monotonic decreasing stack." },
      { tier: 2, title: "Result List & Stack", nudge: "`res = [0] * len(temps)`, `stack = []`.", reflectionQuestion: "\ud83d\udca1 Tip: Stack stores indices." },
      { tier: 3, title: "Stack Pop & Resolve", nudge: "For `i, t in enumerate(temps)`: while `stack and temps[stack[-1]] < t`: `prev_i = stack.pop()`. `res[prev_i] = i - prev_i`. Then `stack.append(i)`.", reflectionQuestion: "\ud83d\udca1 Tip: Resolves colder days." },
      { tier: 4, title: "Print Result", nudge: "Print space-separated: `' '.join(map(str, res))`.", reflectionQuestion: "\ud83d\udca1 Tip: Days with no warmer day stay 0." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "temps = list(map(int, input().split()))\nn = len(temps)\nans = [0] * n\nstack = []\nfor i, t in enumerate(temps):\n    while stack and temps[stack[-1]] < t:\n        prev = stack.pop()\n        ans[prev] = i - prev\n    stack.append(i)\nprint(\" \".join(map(str, ans)))" }
    ],
  },
  49: {
    greeting: "Welcome to Trapping Rain Water! Calculate how much water can be trapped after raining.",
    conceptName: "Trapping Rain Water (Two Pointers)",
    conceptExplanation: "Water trapped at any position is limited by the shorter of the maximum walls to its left and right. Use two pointers `left` and `right`. Always advance the side with the smaller max height!",
    patternExample: "height = list(map(int, input().split()))\nif not height:\n    print(0)\nelse:\n    left, right = 0, len(height) - 1\n    left_max, right_max = 0, 0\n    water = 0\n    while left < right:\n        if height[left] < height[right]:\n            if height[left] >= left_max:\n                left_max = height[left]\n            else:\n                water += left_max - height[left]\n            left += 1\n        else:\n            if height[right] >= right_max:\n                right_max = height[right]\n            else:\n                water += right_max - height[right]\n            right -= 1\n    print(water)",
    interviewTrap: "Water at position is `max_height - current_height`. Track `left_max` and `right_max`.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Water above any bar is determined by `min(tallest_left, tallest_right) - height`. Two pointers from outer edges find this easily.", reflectionQuestion: "\ud83d\udca1 Tip: Shorter wall controls water level." },
      { tier: 2, title: "Two Pointers & Max Trackers", nudge: "`left = 0, right = n - 1`, `left_max = 0, right_max = 0, water = 0`.", reflectionQuestion: "\ud83d\udca1 Tip: While left < right." },
      { tier: 3, title: "Advance Shorter Wall", nudge: "If `height[left] < height[right]`: if `height[left] >= left_max: left_max = height[left]` else: `water += left_max - height[left]`. `left += 1`. Else mirror for right side.", reflectionQuestion: "\ud83d\udca1 Tip: Adds water column by column." },
      { tier: 4, title: "Print Total Water", nudge: "Print `water`.", reflectionQuestion: "\ud83d\udca1 Tip: O(n) time, O(1) space." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "height = list(map(int, input().split()))\nif not height:\n    print(0)\nelse:\n    left, right = 0, len(height) - 1\n    left_max, right_max = 0, 0\n    water = 0\n    while left < right:\n        if height[left] < height[right]:\n            if height[left] >= left_max:\n                left_max = height[left]\n            else:\n                water += left_max - height[left]\n            left += 1\n        else:\n            if height[right] >= right_max:\n                right_max = height[right]\n            else:\n                water += right_max - height[right]\n            right -= 1\n    print(water)" }
    ],
  },
  50: {
    greeting: "Welcome! Find the maximum value in each sliding window of size k. A Monotonic Deque does this in linear time!",
    conceptName: "Sliding Window Maximum (Deque)",
    conceptExplanation: "Use `collections.deque` storing indices in decreasing order of values. For each step: 1. Remove indices that fell out of the window. 2. Remove smaller values from the back. 3. Append current index. 4. Deque front is the window max!",
    patternExample: "from collections import deque\nnums = list(map(int, input().split()))\nk = int(input())\nif not nums or k == 0:\n    print(\"\")\nelse:\n    q = deque()\n    res = []\n    for i, x in enumerate(nums):\n        while q and q[0] <= i - k:\n            q.popleft()\n        while q and nums[q[-1]] <= x:\n            q.pop()\n        q.append(i)\n        if i >= k - 1:\n            res.append(nums[q[0]])\n    print(\" \".join(map(str, res)))",
    interviewTrap: "Store INDICES in the deque so you can easily check if an element is older than `i - k + 1` and expired.",
    hints: [
      { tier: 1, title: "The Simple Idea", nudge: "Keep candidates in a double-ended queue. If a new number is bigger than older candidates, the older ones can never be the maximum\u2014discard them!", reflectionQuestion: "\ud83d\udca1 Tip: Monotonic decreasing deque." },
      { tier: 2, title: "Import Deque", nudge: "From collections import deque: `dq = deque()`, `res = []`.", reflectionQuestion: "\ud83d\udca1 Tip: Deque allows O(1) pop from both ends." },
      { tier: 3, title: "Sliding Window Steps", nudge: "For `i, x in enumerate(nums)`: if `dq and dq[0] < i - k + 1`: `dq.popleft()`. While `dq and nums[dq[-1]] < x`: `dq.pop()`. `dq.append(i)`. If `i >= k - 1`: `res.append(nums[dq[0]])`.", reflectionQuestion: "\ud83d\udca1 Tip: dq[0] is always maximum." },
      { tier: 4, title: "Print Space-Separated", nudge: "Print `' '.join(map(str, res))`.", reflectionQuestion: "\ud83d\udca1 Tip: O(n) optimal solution." },
      { tier: 5, title: "Complete Code Blueprint", nudge: "Here is the clean, complete solution with step-by-step logic:", reflectionQuestion: "\ud83d\udca1 Tip: Read through the code comments, test it in the editor, and see all test cases pass!", codeSnippet: "from collections import deque\nnums = list(map(int, input().split()))\nk = int(input())\nif not nums or k == 0:\n    print(\"\")\nelse:\n    q = deque()\n    res = []\n    for i, x in enumerate(nums):\n        while q and q[0] <= i - k:\n            q.popleft()\n        while q and nums[q[-1]] <= x:\n            q.pop()\n        q.append(i)\n        if i >= k - 1:\n            res.append(nums[q[0]])\n    print(\" \".join(map(str, res)))" }
    ],
  },
};
