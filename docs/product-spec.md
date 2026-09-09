# PyForge — Product Specification

> *"The interface should disappear. Users should think about solving problems—not about using the application. Every component exists to reduce cognitive load."*

---

## 1. Vision & Executive Summary

**PyForge** is a high-productivity developer workspace designed for engineers preparing for technical interviews and mastering core Python fundamentals.

PyForge is **not** an educational marketing website, a video course platform, or an arcade gamified app. It is a focused engineering productivity environment where developers spend 2 to 5 hours daily writing code, analyzing constraints, and building algorithmic intuition.

---

## 2. Core Principles

1. **Focus over decoration**: Zero marketing banners, neon glows, glassmorphism, or cartoon gamification.
2. **Information density without clutter**: High signal-to-noise ratio inspired by GitHub, Linear, and VS Code.
3. **Zero unnecessary clicks**: Switching problems, testing code, and navigating must happen with zero full-page reloads.
4. **Keyboard-first workflow**: Full keyboard shortcut coverage for running, submitting, navigating, and searching.
5. **Subtle, reliable interactions**: Fast perceived latency, deterministic behaviors, and zero intrusive modals interrupting code.

---

## 3. Non-Goals

PyForge explicitly avoids becoming:
- A coding bootcamp or video tutorial service
- A social network or community feed
- A gamified badge-collecting arcade
- A flashy SaaS marketing landing page
- A documentation mirror

---

## 4. Target Personas & Primary Use Cases

- **Junior / Transitioning Engineers**: Preparing for technical phone screens and online coding assessments (OA).
- **Computer Science Students**: Practicing foundational data structures and standard algorithmic patterns.
- **Experienced Developers**: Refreshing Python-specific idioms, time complexities, and built-in library patterns.

---

## 5. Visual References & Reference UI

To eliminate ambiguity across design and engineering, all major surfaces map directly to established developer tools:

| Surface | Reference Product | Design Inspiration & Mental Model |
| :--- | :--- | :--- |
| **Navigation & Shell** | GitHub | 48px fixed bar, subtle `#30363D` borders, clear breadcrumb hierarchy |
| **Workspace / IDE** | VS Code | 3-panel split, collapsible left explorer, docked bottom terminal/test dock |
| **Problem List & Catalog** | LeetCode / Exercism | Clean problem numbering, difficulty badges, concept tags, solve status |
| **Progress & Activity** | GitHub Contributions | 12-week green commit heatmap, activity velocity metrics |
| **Command Palette** | Raycast | Instant `⌘K` modal, fuzzy search, breadcrumb navigation, action shortcuts |
| **Data Tables & Rows** | Linear | Dense 36px rows, subtle hover states, zero visual clutter |

---

## 6. Information Hierarchy

Every view strictly enforces this hierarchy to prevent visual pollution:

| Tier | Role | Elements |
| :--- | :--- | :--- |
| **Primary** | Immediate action & core focus | Active Code Editor, Problem Statement, Run / Submit controls |
| **Secondary** | Clarifications & outputs | Input/Output Examples, Constraints, Test Case results, Hints |
| **Tertiary / Metadata** | Contextual awareness | Module name, Difficulty badge, Estimated time, Solved tally |

---

## 7. Content Style Guide

To maintain a calm, professional developer-tool feel, copy must remain concise, neutral, and precise. Never use exclamation marks, arcade jargon, or marketing superlatives.

| Domain | Recommended (Good) | Avoid (Bad) | Rationale |
| :--- | :--- | :--- | :--- |
| **Primary Action** | `Run Code` | `Execute`, `Run My Code!` | Standard IDE convention |
| **Submission** | `Submit Solution` | `Launch`, `Send to Judge` | Clear intent, professional tone |
| **Resuming** | `Resume Problem` | `Jump Back In!`, `Continue Journey` | Actionable, no gamified fluff |
| **Test Output** | `Expected Output` | `Correct Answer` | Accurate engineering term |
| **Execution Output** | `Your Output` | `Actual Result`, `Candidate Code` | Clear ownership |
| **Success Feedback** | `All 3 test cases passed` | `Awesome Success! 🎉`, `Fantastic!!!` | Factual, respectful of user focus |
| **Failure Feedback** | `Wrong Answer: Test Case 2` | `Oops! Try again next time` | Non-patronizing, descriptive |
| **AI Assist** | `Request Hint (1 of 3)` | `Magic AI Solve`, `Ask Bot Genius` | Sets accurate expectations |

---

## 8. Command Palette Specification (`⌘K` / `Ctrl+K`)

The command palette is a first-class citizen for keyboard-first navigation. Pressing `⌘K` or `/` opens the Raycast-inspired launcher.

### Core Indexed Commands:
- `> Open Problem [Number]` (e.g. `> Open Problem 12: Two Sum`)
- `> Jump to [Module]` (e.g. `> Jump to Hash Maps & Sets`)
- `> Resume Current Problem`
- `> Toggle Sidebar Navigator` (`Ctrl+B`)
- `> Toggle Console Dock` (`Ctrl+J`)
- `> Open Dashboard`
- `> Open Curriculum Explorer`
- `> Open Progress & Heatmap`
- `> Search Problems...`
- `> Copy Problem Link`
- `> Reset Code to Starter Template`

---

## 9. Responsiveness & Breakpoints

PyForge is designed primarily for desktop engineering sessions, but gracefully handles varying display sizes with clear degradation boundaries:

```
≥1440px (Wide Desktop)
  Full Three-Panel IDE (Navigator 220px + Problem Spec 440px + Editor flex-1 + Console Dock)

1024px – 1439px (Standard Laptop)
  Collapsible Left Navigator (Default closed, toggle with Ctrl+B or hover pill)
  Two-panel view: Specs (45%) | Editor (55%)

768px – 1023px (Tablet / Narrow Window)
  Tabbed Workspace View: Tab 1 (Problem Specs) | Tab 2 (Monaco Editor & Console)

<768px (Mobile)
  Read-only curriculum review and problem description mode.
  Coding is intentionally discouraged with a clean message: "PyForge is optimized for desktop keyboard coding."
```

---

## 10. Core Pages & User Flows

### 10.1 Dashboard (`/`) — Developer Home Workspace
Replaces the traditional marketing landing page.
- **Continue Learning**: Prominent anchor displaying current problem in progress and 1-click resume.
- **Today's Goal**: Clean numeric progress (e.g. `2 of 3 problems solved today`).
- **Learning Velocity & Streak**: Solved count (`14/50 solved`), active streak (`🔥 5d streak`).
- **Curriculum Snapshot**: Module-by-module completion bars.
- **Recent Submissions Log**: Dense record of recent runs with timestamp and execution time.

### 10.2 Curriculum Explorer (`/quest`)
Two-column split view inspired by Exercism and GitHub:
- **Left Sidebar (260px)**: 10 structured modules with solved counters (`M1: Variables (5/5)`, `M2: Operators (3/5)`).
- **Main Table Area**: Dense problem list showing status (`✓` or `○`), problem number, title, concept tag, difficulty pill, and direct solve action.
- **Instant Search & Filters**: Live keyboard filtering by title, tag, or status.

### 10.3 Coding Workspace (`/quest/[id]`)
The core screen where users spend 95% of their session time:
- **Header Toolbar (40px)**: Back link, problem title, difficulty pill, sticky Run Code (`Ctrl+Enter`) and Submit (`Ctrl+Shift+Enter`) buttons.
- **Left Panel (Problem Navigator - 220px, Collapsible)**: Quick switcher across all 50 problems in the syllabus without page reload.
- **Center Panel (Problem Specifications)**: Problem description, terminal-formatted examples, constraints block, interview context notes, and collapsible hints.
- **Right Panel (Monaco Editor)**: Configured with GitHub Dark theme, JetBrains Mono font, 13px size, and debounced auto-saving.
- **Bottom Dock (Test Runner & Console)**: Test case tabs (Case 1, Case 2, Case 3), execution runtime, input/expected/actual diff viewer.
- **Developer Stats HUD**: Displays elapsed solve timer, test pass count, and hints used.

### 10.4 Progress & Analytics (`/profile`)
- **12-Week Activity Heatmap**: GitHub-style contribution squares tracking daily problem-solving cadence.
- **Learning Velocity**: Problems solved per week, average runtime, and acceptance rate.
- **Skill Tree**: Progress breakdown across all 10 Python modules.
- **Submission History**: Complete historical log of code evaluations.

---

## 11. Error State & Failure Philosophy

- **Zero Data Loss**: User code is never erased or overwritten on execution failure.
- **Constructive Diagnostics**: Explain exactly why an assertion failed (diff of Expected vs Actual).
- **Non-Blocking**: Errors never lock the editor or block further typing.
- **Instant Retry**: One keystroke re-runs the code immediately.

---

## 12. Product Success Metrics

- **Time-to-first-code**: User writes code within 10 seconds of opening the site.
- **Workspace Retention**: Users remain inside the IDE workspace for extended 60+ minute sessions without navigating away.
- **Daily Streak Consistency**: Increased return rate for consecutive daily practice.
- **Familiarity**: Experienced developers feel instantly at home within 2 minutes of use.
