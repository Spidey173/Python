# PyForge — Engineering & Technical Architecture

## 1. Directory Structure

```
/frontend
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx         # Root layout with 48px Header and AppProviders
  │   │   ├── page.tsx           # Dashboard (Home)
  │   │   ├── quest/
  │   │   │   ├── page.tsx       # Curriculum Explorer (2-column layout)
  │   │   │   └── [id]/page.tsx  # Three-Panel Coding Workspace
  │   │   ├── profile/page.tsx   # Progress & Activity Heatmap
  │   │   └── globals.css        # GitHub Dark theme tokens and resets
  │   ├── components/
  │   │   ├── workspace/         # 3-Panel IDE components (Navigator, Specs, Editor, Console)
  │   │   ├── ui/                # Standardized Button, Input, Table, Badge, Modal, CommandPalette
  │   │   └── layout/            # 48px Header, Navigation, StatsHUD
  │   └── lib/
  │       ├── api.ts             # API Client for backend endpoints
  │       ├── persistence.ts     # Pluggable persistence service (Local/Remote abstraction)
  │       ├── shortcuts.ts       # Global keyboard shortcuts dispatcher
  │       └── types.ts           # Shared TypeScript interfaces
```

---

## 2. State Management Architecture

State is divided into three distinct layers to avoid coupled rerenders:

### 2.1 Server State (Remote / Cached)
- Challenges list & metadata
- Test case suites
- Submission verification records
- Managed via lightweight API client / React state with optimistic updates.

### 2.2 Global Client State (Application Context)
- User session & authentication token
- Active problem identifier
- Curriculum completion set
- Layout preferences (Problem Navigator collapsed/expanded, console height)
- Command Palette open/close state

### 2.3 Local View State
- Monaco Editor buffer content
- Active tab in documentation panel (Problem vs Context vs Hints)
- Active console dock tab (Tests vs Output vs Submissions)
- Search filter queries

---

## 3. Component Ownership & State Boundaries

To avoid accidental prop drilling and uncontrolled re-renders as the codebase scales, component ownership is strictly demarcated:

| Component | Owns State | Receives Props | Rationale |
| :--- | :--- | :--- | :--- |
| **`MonacoEditor`** | Current draft code, cursor position, undo/redo stack | `problemId`, `initialCode`, `onChange` callback | Keeps 60 FPS typing isolated from React re-renders |
| **`ProblemNavigator`** | Local search query, collapsed/expanded drawer state | `problems`, `currentId`, `solvedIds`, `onSelectProblem` | Instant problem switching without parent roundtrip |
| **`ConsoleDock`** | Active tab (`Test Cases` vs `Output`), selected case index (1/2/3) | `testCases`, `testResults`, `isExecuting`, `executionTime` | Output inspection doesn't trigger code editor re-render |
| **`CommandPalette`** | Open/close modal state, search query, focused item index | `problems`, `onNavigate`, `onTriggerAction` | Self-contained global overlay modal |
| **`ProblemSpecPanel`** | Active documentation tab (`Description` vs `Interview Context`), expanded hint indices | `problem`, `sampleCases` | Reading hints or tabs does not re-run tests or dirty editor |
| **`StatsHUD`** | Elapsed solve timer (1s interval tick) | `isSolved`, `totalPassed`, `hintsUsed` | Timer ticks do not force Monaco editor re-renders |
| **`CurriculumExplorer`** | Active module filter, difficulty filter, title search | `problems`, `solvedIds`, `onSelectModule` | High-performance client-side table sorting and filtering |

---

## 4. Pluggable Persistence Layer & Autosave

To prevent vendor lock-in to browser `localStorage`, persistence is abstracted behind an interface:

```typescript
export interface PersistenceProvider {
  saveDraft(problemId: number, code: string): Promise<void>;
  loadDraft(problemId: number): Promise<string | null>;
  saveLayoutSettings(settings: Record<string, any>): Promise<void>;
  loadLayoutSettings(): Promise<Record<string, any>>;
}
```

- **Autosave Triggers**:
  - Debounced 2,000ms after last keystroke.
  - Immediate on editor `onBlur`.
  - Immediate on `Run Code` and `Submit Solution`.
- **Auto-Restore**: Automatically restores candidate code draft upon problem mount.

---

## 5. Keyboard Shortcuts Specification

| Keybinding | Scope | Function |
| :--- | :--- | :--- |
| `Ctrl+Enter` / `Cmd+Enter` | Workspace | Execute code against sample test cases |
| `Ctrl+Shift+Enter` / `Cmd+Shift+Enter` | Workspace | Submit solution against verification test cases |
| `Ctrl+B` / `Cmd+B` | Workspace | Toggle left problem navigator panel |
| `Ctrl+J` / `Cmd+J` | Workspace | Toggle bottom execution dock |
| `Cmd+K` / `Ctrl+K` | Global | Open Raycast-style Command Palette |
| `Alt+→` | Workspace | Advance to next problem in sequence |
| `Alt+←` | Workspace | Return to previous problem |
| `Escape` | Global | Dismiss modal, palette, or dropdown |

---

## 6. Performance Goals

- **Perceived Latency**: Problem switching feels instantaneous (<100ms).
- **Editor Responsiveness**: Monitored typing latency remains 60 FPS.
- **Search Filtering**: Client-side filtering updates synchronously as characters are typed.
- **Independent Scrolling**: Description, editor, and console panels scroll on separate threads.

---

## 7. Definition of Done

- [x] Zero TypeScript compilation errors (`npm run build`).
- [x] Zero ESLint warnings or errors.
- [x] Accessible keyboard navigation (full tab sequence, focus rings).
- [x] No inline styles; 100% compliant with GitHub Dark palette.
- [x] Reusable component library for buttons, inputs, badges, and panels.
- [x] Workspace functions seamlessly across desktop and laptop breakpoints.
