# Implementation Plan: Premium Practice UI Upgrades (F4-F7 V2)

This plan upgrades the existing Practice and Flow State features to an "extreme" premium standard, incorporating modern web APIs for a native, zero-dependency, butter-smooth experience.

## Build Order

Implementation focuses on replacing static UI components with highly interactive, animated modern web components using Native HTML/CSS features.

---

### Phase 1: Expanding Table Rows (Notes)

#### [MODIFY] [client/src/components/features/sheets/problem-table.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/problem-table.tsx)
- **Feature**: Click a row to expand it smoothly and reveal the markdown editor inline.
- **Modern Web Standard**: Use CSS `interpolate-size: allow-keywords;` and `height: calc-size(auto, size);` for buttery-smooth height animations from `0px` to `auto`.
- **Implementation**:
  - Add state `expandedRowId` to track the currently open row.
  - Render an extra `<tr>` directly beneath the problem row that toggles its height.
  - Embed `<NotesEditor>` inside the expanded row.

#### [MODIFY] [client/src/components/features/sheets/notes-editor.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/notes-editor.tsx)
- Strip out borders and adapt padding so it seamlessly sits inside the expanded table row.

---

### Phase 2: Inline Editing for Topics & Difficulty (Top Layer Popovers)

#### [NEW] [client/src/components/features/sheets/difficulty-popover.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/difficulty-popover.tsx)
- **Feature**: Click the difficulty badge in the table to open a popover and change it instantly.
- **Modern Web Standard**: Use the native HTML `popover` attribute combined with CSS `@starting-style` and `transition-behavior: allow-discrete` for premium open/close scaling animations.

#### [NEW] [client/src/components/features/sheets/topics-popover.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/topics-popover.tsx)
- **Feature**: Click the topics in the table to open a popover to add/remove topics.
- **Implementation**: Same native `popover` API with premium entry/exit animations.

#### [MODIFY] [client/src/components/features/sheets/problem-table.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/problem-table.tsx)
- Integrate the new popovers into the respective table cells.
- Hook them up to the existing `updateProblem` function.

---

### Phase 3: Premium Flow State Redesign

#### [MODIFY] [client/src/app/dashboard/sheets/[id]/practice/page.tsx](file:///home/piyush/Documents/Trace/client/src/app/dashboard/sheets/[id]/practice/page.tsx)
- **Feature**: Total redesign of the Flow State UI for maximum focus.
- **Modern Web Standard**: Use the **View Transitions API** (`document.startViewTransition()`). When users click "Next" or press the arrow keys, the old question morphs/slides out and the new question slides in seamlessly.
- **Design Improvements**:
  - Full-screen immersive layout (hide navbar, use `100vh`).
  - Giant, gorgeous typography for the problem name using `font-inter` and subtle text-gradients.
  - Floating action bar at the bottom with glassmorphism for controls (`S` Solved, `A` Attempted).
  - Floating timer pill in the top right.
  - Side-panel or clean overlay for notes instead of a split pane to maximize focus on the question itself.

#### [NEW] [client/src/app/globals.css](file:///home/piyush/Documents/Trace/client/src/app/globals.css) (Update)
- Add the necessary CSS `@starting-style` blocks, `view-transition` definitions, and `interpolate-size` rules.

---

## File Summary

### New Files
- `client/src/components/features/sheets/difficulty-popover.tsx`
- `client/src/components/features/sheets/topics-popover.tsx`

### Modified Files
- `client/src/components/features/sheets/problem-table.tsx`
- `client/src/components/features/sheets/notes-editor.tsx`
- `client/src/app/dashboard/sheets/[id]/practice/page.tsx`
- `client/src/app/globals.css`

---

## Verification Plan

1. **Expanding Rows**: Click a table row. Verify it slides open smoothly to reveal the notes editor.
2. **Inline Editing**: Click a difficulty badge. Verify the popover animates in. Change it and verify optimistic update.
3. **Flow State**: Enter Flow State. Press right arrow. Verify the page transitions smoothly using the View Transitions API. Verify the aesthetic feels premium, immersive, and zero-distraction.
