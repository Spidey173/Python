# PyForge — Design System Specification

## 1. Color Palette (GitHub Dark Theme)

All UI elements strictly use these hex values:

```
Canvas (App Background):      #0D1117
Sidebar / Panel Headers:      #161B22
Surface / Active Panels:      #1C2128
Elevated / Hover / Rows:      #21262D
Structural Borders:           #30363D
Muted Borders:                #21262D

Text Primary:                 #E6EDF3
Text Secondary / Muted:       #8B949E
Text Accent / Links:          #58A6FF

Action / Success (Green):     #238636
Action Hover:                 #2EA043
Primary Focus (Blue):         #1F6FEB
Warning / Pending (Amber):    #D29922
Danger / Failure (Red):       #DA3633
```

### Contrast & Surface Rules
- **No Gradients**: Strictly flat, solid backgrounds with 1px border separation.
- **No Glows or Blurs**: Zero `backdrop-filter: blur` or neon text-shadows.
- **Elevation**: Flat surfaces with subtle 1px border contrast (`#30363D`).

---

## 2. Typography

### Font Families
- **UI Font**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Code & Monospace Font**: `'JetBrains Mono', 'Fira Code', ui-monospace, monospace`

### Scale & Hierarchy
- **Page Titles**: 20px – 22px, font-weight 600, line-height 1.3
- **Section Headers**: 14px – 16px, font-weight 600
- **Body & Captions**: 13px – 14px, font-weight 400, line-height 1.5
- **Dense Table Cells**: 12px – 13px
- **Code Editor & Terminals**: 13px, line-height 1.5, font-family JetBrains Mono
- **Badges & Metadata**: 10px – 11px, font-weight 600, uppercase or title case

---

## 3. Spacing & Layout System

Strict 8px grid system:
```
Spacing-1:  4px   (Tight inline padding)
Spacing-2:  8px   (Default internal padding)
Spacing-3: 12px   (Component inner gap)
Spacing-4: 16px   (Standard card padding, gap between elements)
Spacing-6: 24px   (Section separation)
Spacing-8: 32px   (Major layout margin)
```

- **Header Height**: Fixed `48px`.
- **Workspace Navigation Sub-bar**: Fixed `40px`.
- **Max Content Width**: `1600px` on desktop.

---

## 4. Component Rules

### Buttons
- **Height**: 36px standard (28px for compact toolbar/table buttons).
- **Radius**: 6px (`rounded-md`).
- **Elevation**: Strictly no box-shadows.
- **Variants**:
  - `Primary Action`: Background `#238636`, hover `#2EA043`, text `#FFFFFF`, font-weight 600.
  - `Secondary Action`: Background `#21262D`, border `1px solid #30363D`, hover `#30363D`, text `#E6EDF3`.
  - `Ghost`: Transparent, hover `#21262D`, text `#8B949E`, active text `#E6EDF3`.
  - `Danger`: Background `#DA3633`, hover `#B62324`, text `#FFFFFF`.

### Inputs & Form Fields
- **Height**: 32px or 36px.
- **Background**: `#0D1117` with `1px solid #30363D`.
- **Focus**: Border `#1F6FEB` with 1px outline `#1F6FEB`.
- **Placeholder Text**: `#8B949E`.

### Difficulty Badges
- Small, muted pills (height: 20px, font-size: 11px, padding: 1px 8px, radius: 4px).
  - `Easy`: Border `#238636`, background `rgba(35, 134, 54, 0.15)`, text `#3FB950`.
  - `Medium`: Border `#D29922`, background `rgba(210, 153, 34, 0.15)`, text `#D29922`.
  - `Hard`: Border `#DA3633`, background `rgba(218, 54, 51, 0.15)`, text `#F85149`.

### Data Tables
- Header: Background `#161B22`, border-bottom `1px solid #30363D`, text `#8B949E` (11px uppercase).
- Rows: Background `#0D1117`, border-bottom `1px solid #21262D`, hover `#161B22` (13px text).

### Code Blocks & Terminals
- Container: Background `#161B22`, border `1px solid #30363D`, radius 6px.
- Text: `#E6EDF3`, JetBrains Mono.

---

---

## 5. Reusable Page Templates & Layout Primitives

Rather than creating ad-hoc page structures, all interfaces inherit from three unified layout primitives:

### 5.1 Workspace Layout (`WorkspaceLayout`)
Optimized for the active coding session:
```
+-------------------------------------------------------------------------+
| Header (48px) - PyForge Brand, Problem Title, Timer, Run/Submit Toolbar  |
+--------------+--------------------------+-------------------------------+
| Sidebar      | Main Spec Panel          | Right Panel (Monaco Editor)   |
| (220px)      | (420px)                  | (Flex-1)                      |
| Navigator    | Description, Examples,   | Code buffer with line numbers |
| Collapsible  | Constraints, Hints       | JetBrains Mono                |
|              |                          +-------------------------------+
|              |                          | Bottom Dock (Console & Tests) |
|              |                          | Case 1 / Case 2 / Output Diff |
+--------------+--------------------------+-------------------------------+
```

### 5.2 Dashboard Layout (`DashboardLayout`)
Calm productivity cockpit centered at `max-w-6xl`:
```
+-------------------------------------------------------------------------+
| Metrics Row: Total Solved (X/50) | Streak (🔥 N) | Daily Goal (X/3)     |
+-------------------------------------------------------------------------+
| Continue Learning: Active Problem Hero Card (1-Click Resume)            |
+-------------------------------------------------------------------------+
| Recommendations: Up Next in Curriculum Sequence                         |
+-------------------------------------------------------------------------+
| Activity & History: 12-Week Commit Heatmap & Recent Submissions Table   |
+-------------------------------------------------------------------------+
```

### 5.3 Explorer Layout (`ExplorerLayout`)
Two-column structured catalog inspired by Linear & Exercism:
```
+-------------------------------------------------------------------------+
| Top Filter & Search Bar: Search input (⌘K) | Difficulty & Status Filter |
+-----------------------+-------------------------------------------------+
| Module Sidebar (260px)| Problem Data Table                              |
| 10 Module Cards with  | Dense 36px rows: Solved Icon | ID | Title |     |
| Solved Progress Pills | Concept Tag | Difficulty Pill | Action Button   |
+-----------------------+-------------------------------------------------+
```

---

## 6. Accessibility Requirements (a11y)

A professional developer tool must be fully accessible and keyboard navigable:

- **Visible Focus Ring**: `outline: 2px solid #1F6FEB; outline-offset: 2px;` on all focused interactive elements (`:focus-visible`).
- **Keyboard Reachable**: Every control, tab, drawer toggle, and test runner can be operated without a pointer.
- **ARIA Labels**: All icon-only buttons (collapse panels, copy links, close modals) provide explicit `aria-label` attributes.
- **Screen-Reader Friendly Tables**: Data tables include `<caption>`, `<th scope="col">`, and role descriptions.
- **Color Contrast**: 4.5:1 minimum contrast ratio for text (`#E6EDF3` on `#0D1117` yields 15.6:1 contrast ratio; `#8B949E` yields 5.8:1).
- **Never Rely on Color Alone**: All state badges combine color with distinct icons or text (e.g., `✓ Passed` in green, `✗ Failed` in red, `○ Unattempted` in muted grey).

---

## 7. Motion & Transitions

- **Duration**: Strict 150ms – 200ms ease-out.
- **Hover Transitions**: `150ms ease-in-out` on background and border colors.
- **Drawer / Panel Toggle**: `200ms ease-in-out`.
- **Strictly Disallowed**: Bouncy spring curves, floating elements, continuous spinning background animations.
