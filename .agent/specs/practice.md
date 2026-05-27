# Feature: F4, F5, F6, F7 & "Flow State" Interactive Mode

## Overview

The Practice Feature is the core value proposition of Trace. After importing a sheet (F3), users open that sheet to actively work through it. This spec encompasses:
- **F4 (View Sheet):** Viewing a specific sheet's problems.
- **F5 (Progress Tracking):** Tracking problem status (`unsolved`, `attempted`, `solved`) and viewing overall completion %.
- **F6 (Filter & Search):** Instantly searching by name and filtering by topics/difficulty on the frontend.
- **F7 (Rich Notes):** Adding/editing markdown-supported notes for any problem.
- **"Flow State" Interactive Mode:** A premium, distraction-free, flashcard-style UI that presents unsolved questions one by one. Engineered with keyboard shortcuts, a built-in problem timer, and micro-animations to keep users deeply focused and motivated.

## Depends on

- **F3: Import Sheet** — Problems and sheets must exist in the database. ✅

## Routes

| Method | Path                                   | Description                                             | Access    |
|--------|----------------------------------------|---------------------------------------------------------|-----------|
| GET    | `/api/v1/sheets/:sheetId`              | Fetch a single sheet's metadata                         | Protected |
| GET    | `/api/v1/sheets/:sheetId/problems`     | Fetch all problems belonging to a specific sheet        | Protected |
| PATCH  | `/api/v1/problems/:id`                 | Update a problem's fields (status, difficulty, topics, notes) | Protected |

## Premium UX Features (Industry Best Practices)

1. **Keyboard-First Navigation:** Interactive mode is fully operable via keyboard. `Left/Right` arrows to navigate questions, `S` to mark Solved, `A` to mark Attempted. No mouse required.
2. **Built-in Session Timer:** A non-intrusive stopwatch in Interactive Mode. Users can timebox their attempts (e.g., spending max 30 mins on a Medium problem).
3. **Markdown Notes Editor:** A rich text/markdown editor allowing users to paste code snippets, write pseudocode, and format their logic gracefully. Auto-saves via debounce.
4. **Micro-animations & Gamification:** 
   - Smooth `View Transitions` when moving between problems.
   - Subtle confetti or success animation when marking a problem as "Solved" to trigger dopamine.
   - Session counter ("You've solved 3 problems this session!").
5. **Optimistic UI with Instant Feedback:** Every filter, search, and status update happens instantaneously on the client side with background synchronization. 

## UI Components

### Create

| Component                 | Path                                                                    | Purpose                                                                 |
|---------------------------|-------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `SheetPage`               | `client/src/app/dashboard/sheets/[id]/page.tsx`                         | The main table view for a sheet.                                        |
| `InteractiveModePage`     | `client/src/app/dashboard/sheets/[id]/practice/page.tsx`                | Full-screen "Flow State" focused mode.                                  |
| `SheetHeader`             | `client/src/components/features/sheets/sheet-header.tsx`                | Displays sheet name, animated progress bar, and "Start Practice" btn.   |
| `ProblemTable`            | `client/src/components/features/sheets/problem-table.tsx`               | Premium glassmorphism table. Supports inline editing.                   |
| `ProblemFilters`          | `client/src/components/features/sheets/problem-filters.tsx`             | Search bar, topic multiselect, difficulty dropdown.                     |
| `MarkdownEditor`          | `client/src/components/features/sheets/markdown-editor.tsx`             | Markdown-supported notes editor with debounced auto-save.               |
| `ProblemTimer`            | `client/src/components/features/sheets/problem-timer.tsx`               | A sleek stopwatch for tracking time spent on a single problem.          |
| `StatusToggle`            | `client/src/components/features/sheets/status-toggle.tsx`               | Interactive toggle to change a problem's status.                        |
| `useSheet`                | `client/src/hooks/use-sheet.ts`                                         | Hook to fetch sheet + problems and handle optimistic updates.           |

### Modify

| Component         | File                                                   | Changes                                                                 |
|-------------------|--------------------------------------------------------|-------------------------------------------------------------------------|
| `SheetCard`       | `client/src/components/features/sheets/sheet-card.tsx` | Wrap the card in a Next.js `<Link>` pointing to `/dashboard/sheets/[id]`|

## Files to create

### Backend (`server/`)
- `server/src/controllers/problem.controller.js`
- `server/src/routes/problem.routes.js`

### Frontend (`client/`)
- `client/src/app/dashboard/sheets/[id]/page.tsx`
- `client/src/app/dashboard/sheets/[id]/practice/page.tsx`
- `client/src/components/features/sheets/sheet-header.tsx`
- `client/src/components/features/sheets/problem-filters.tsx`
- `client/src/components/features/sheets/problem-table.tsx`
- `client/src/components/features/sheets/markdown-editor.tsx`
- `client/src/components/features/sheets/problem-timer.tsx`
- `client/src/components/features/sheets/status-toggle.tsx`
- `client/src/components/features/sheets/editable-difficulty.tsx`
- `client/src/components/features/sheets/editable-topics.tsx`
- `client/src/components/ui/progress.tsx`
- `client/src/hooks/use-sheet.ts`

## Files to change
- `server/src/app.js` (Mount `/api/v1/problems`)
- `server/src/routes/sheet.routes.js` (Add `GET /:sheetId` and `GET /:sheetId/problems`)
- `server/src/controllers/sheet.controller.js` (Add `getSheet` handler)

## New dependencies

- **Frontend:** 
  - `lucide-react` (if not installed) for premium iconography.
  - `canvas-confetti` (for the lightweight celebration micro-animation).
  - `react-markdown` (or similar lightweight markdown renderer) for the Notes editor.
  - `date-fns` (optional, for timer formatting).

## Rules for implementation

1. **Zero-Latency Interactions:** 
   - Because max problems = 500, fetch all once. Search, filter, and pagination run entirely in JS memory.
2. **Dynamic Progress Tracker:**
   - The progress bar computes `(solved / total) * 100` dynamically.
3. **Interactive "Flow State" Mode:**
   - Route: `/dashboard/sheets/[id]/practice`
   - Filter out `solved` questions (only show `unsolved` and `attempted`).
   - UI Layout: Left side = Question Details (Name, Topics, Link, Difficulty, Timer). Right side = Markdown Notes Editor.
   - Global Keyboard Listeners: `Left Arrow` (Previous), `Right Arrow` (Next), `S` (Mark Solved), `A` (Mark Attempted).
   - "Mark as Solved" should optionally trigger a confetti burst and smoothly auto-advance to the next problem after 800ms.
4. **Markdown Notes (F7):**
   - Editable inline from Interactive Mode. In Table view, clicking a "Notes" icon opens a sleek popover or side drawer.
   - Must auto-save with a 500ms debounce via `PATCH /api/v1/problems/:id`.
5. **Backend Authorization:** 
   - Ensure the sheet belongs to `req.user._id`.
   - Ensure `PATCH` requests verify the problem belongs to `req.user._id`.

## Definition of done

### Backend
- [ ] `GET /api/v1/sheets/:sheetId` returns the sheet metadata or 404.
- [ ] `GET /api/v1/sheets/:sheetId/problems` returns the array of problems sorted by `order`.
- [ ] `PATCH /api/v1/problems/:id` accepts and updates any combination of status, difficulty, topics, and notes.

### Frontend - Overview & Table
- [ ] Sheet page displays an animated Progress Bar indicating completion %.
- [ ] Instant-search bar by problem name, plus Topic and Difficulty dropdown filters.
- [ ] Problem table supports inline editing of difficulty, topics, status, and notes.
- [ ] A prominent "Enter Flow State" button to transition to Interactive Mode.

### Frontend - Interactive "Flow State" Mode
- [ ] UI is distraction-free, showing one unsolved/attempted problem at a time.
- [ ] Keyboard shortcuts are active (`Left`, `Right`, `S`, `A`).
- [ ] Stopwatch timer is visible to help users timebox their problem-solving.
- [ ] Markdown editor is fully functional and auto-saves notes flawlessly.
- [ ] Marking a problem as "Solved" triggers a subtle confetti animation and updates the database optimistically.
