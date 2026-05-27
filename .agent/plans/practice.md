# Implementation Plan: F4, F5, F6, F7 & "Flow State" Practice Feature

Based on the approved spec at `.agent/specs/practice.md` and an analysis of the project's established conventions, here is the technical plan using **zero new dependencies**. We will strictly use the existing patterns: custom vanilla JS validation, standard React hooks (`useState`/`useEffect`), template literals for Tailwind classes, and inline SVGs.

## Build Order

Implementation follows a dependency-free, bottom-up order: backend validation → backend controllers & routes → frontend custom hook → UI components → pages.

---

### Phase 1: Backend Routes, Validation & Controllers

#### [NEW] [problem-validator.js](file:///home/piyush/Documents/Trace/server/src/utils/problem-validator.js)
Follows the pattern from `import-validator.js`.
```js
const sanitizeString = (str) => String(str).replace(/<[^>]*>/g, '').trim();

function validateProblemUpdate(body) {
  const errors = [];
  const sanitized = {};

  if (body.status) {
    if (!['unsolved', 'attempted', 'solved'].includes(body.status)) {
      errors.push({ field: 'status', message: 'Invalid status' });
    } else {
      sanitized.status = body.status;
    }
  }

  if (body.difficulty !== undefined) {
    if (!['easy', 'medium', 'hard', ''].includes(body.difficulty)) {
      errors.push({ field: 'difficulty', message: 'Invalid difficulty' });
    } else {
      sanitized.difficulty = body.difficulty;
    }
  }

  if (body.topics !== undefined) {
    if (!Array.isArray(body.topics) || body.topics.length > 10) {
      errors.push({ field: 'topics', message: 'Topics must be an array of max 10 items' });
    } else {
      sanitized.topics = body.topics.map(t => sanitizeString(t).toLowerCase().slice(0, 50)).filter(t => t.length > 0);
    }
  }

  if (body.notes !== undefined) {
    sanitized.notes = sanitizeString(body.notes);
  }

  return { isValid: errors.length === 0, sanitized, errors };
}
module.exports = { validateProblemUpdate };
```

#### [NEW] [problem.controller.js](file:///home/piyush/Documents/Trace/server/src/controllers/problem.controller.js)
```js
const Problem = require('../models/problem.model');
const AppError = require('../utils/app-error');
const { validateProblemUpdate } = require('../utils/problem-validator');

// GET /api/v1/sheets/:sheetId/problems
const getProblemsBySheet = async (req, res, next) => {
  try {
    const problems = await Problem.find({ sheetId: req.params.sheetId, userId: req.user._id })
      .sort({ order: 1 })
      .lean(); // Faster reads
    
    const normalized = problems.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
    res.status(200).json({ success: true, data: { problems: normalized } });
  } catch (error) { next(error); }
};

// PATCH /api/v1/problems/:id
const updateProblem = async (req, res, next) => {
  try {
    const { isValid, sanitized, errors } = validateProblemUpdate(req.body);
    if (!isValid) return next(new AppError('Validation failed', 400, errors));

    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: sanitized },
      { new: true, runValidators: true }
    ).lean();
    
    if (!problem) return next(new AppError('Problem not found', 404));
    
    const { _id, ...rest } = problem;
    res.status(200).json({ success: true, data: { problem: { id: _id, ...rest } } });
  } catch (error) { next(error); }
};
module.exports = { getProblemsBySheet, updateProblem };
```

#### [NEW] [problem.routes.js](file:///home/piyush/Documents/Trace/server/src/routes/problem.routes.js)
Mounts the patch route with auth middleware.

#### [MODIFY] [sheet.controller.js](file:///home/piyush/Documents/Trace/server/src/controllers/sheet.controller.js) & `sheet.routes.js`
Add `getSheetById` handler and map it to `GET /api/v1/sheets/:sheetId`.

---

### Phase 2: Frontend Types & Data Fetching

#### [MODIFY] [api.ts](file:///home/piyush/Documents/Trace/client/src/types/api.ts)
Add types for sheet fetching.

#### [NEW] [use-sheet.ts](file:///home/piyush/Documents/Trace/client/src/hooks/use-sheet.ts)
Custom hook built on `useState`/`useEffect` (matching `use-sheets.ts` pattern).
```ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export function useSheet(sheetId: string) {
  const [sheet, setSheet] = useState(null);
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSheetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sheetRes, problemsRes] = await Promise.all([
        api.get(`/sheets/${sheetId}`),
        api.get(`/sheets/${sheetId}/problems`)
      ]);
      setSheet(sheetRes.data.data.sheet);
      setProblems(problemsRes.data.data.problems);
    } catch (err) {
      setError('Failed to load sheet');
    } finally {
      setIsLoading(false);
    }
  }, [sheetId]);

  useEffect(() => { fetchSheetData(); }, [fetchSheetData]);

  // Manual Optimistic Update
  const updateProblemOptimistic = async (id, updates) => {
    const previous = [...problems];
    setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    try {
      await api.patch(`/problems/${id}`, updates);
    } catch (err) {
      setProblems(previous); // Rollback on error
      throw err;
    }
  };

  return { sheet, problems, isLoading, error, updateProblem: updateProblemOptimistic };
}
```

---

### Phase 3: Frontend UI Components

1. **`client/src/components/ui/progress.tsx`**: CSS-transition based width bar.
2. **`client/src/components/features/sheets/sheet-header.tsx`**: Computes `(solved/total)*100` from props.
3. **`client/src/components/features/sheets/problem-filters.tsx`**: Controlled inputs updating search/filter states in the parent page.
4. **`client/src/components/features/sheets/status-badge.tsx`**: Uses raw template literals for conditional coloring.
5. **`client/src/components/features/sheets/problem-table.tsx`**: Inline SVG icons for table actions. Filters handled in memory.
6. **`client/src/components/features/sheets/notes-editor.tsx`**: Standard `<textarea>` with a custom `useEffect` debounce implementation (no external debounce library).

---

### Phase 4: Interactive "Flow State" Mode

#### [NEW] [practice/page.tsx](file:///home/piyush/Documents/Trace/client/src/app/dashboard/sheets/[id]/practice/page.tsx)
- Fetches data via `useSheet`.
- Native `keydown` event listener attached to `window` for shortcuts (`ArrowLeft`, `ArrowRight`, `s`, `a`).
- Native `setInterval` in a `useEffect` for the stopwatch.
- Micro-animations handled via CSS keyframes rather than external libraries.

---

### Phase 5: Dashboard Integration

#### [MODIFY] [sheet-card.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/sheet-card.tsx)
Wrap the card in Next.js `<Link>`.

---

## File Summary

### New Files
- `server/src/utils/problem-validator.js`
- `server/src/controllers/problem.controller.js`
- `server/src/routes/problem.routes.js`
- `client/src/hooks/use-sheet.ts`
- `client/src/components/ui/progress.tsx`
- `client/src/components/features/sheets/sheet-header.tsx`
- `client/src/components/features/sheets/problem-filters.tsx`
- `client/src/components/features/sheets/problem-table.tsx`
- `client/src/components/features/sheets/status-badge.tsx`
- `client/src/components/features/sheets/notes-editor.tsx`
- `client/src/components/features/sheets/problem-timer.tsx`
- `client/src/app/dashboard/sheets/[id]/page.tsx`
- `client/src/app/dashboard/sheets/[id]/practice/page.tsx`

### Modified Files
- `server/src/app.js`
- `server/src/routes/sheet.routes.js`
- `server/src/controllers/sheet.controller.js`
- `client/src/types/api.ts`
- `client/src/components/features/sheets/sheet-card.tsx`

---

## Verification Plan

1. Verify backend `GET` and `PATCH` endpoints using Postman.
2. Click a sheet on the dashboard and ensure the table + progress bar load.
3. Test inline edits: change status, see progress bar animate instantly.
4. Type in Search bar and ensure table filters instantly.
5. Click "Enter Flow State", verify keyboard shortcuts.
6. Write notes, wait 1 second, refresh page, verify notes persisted.
