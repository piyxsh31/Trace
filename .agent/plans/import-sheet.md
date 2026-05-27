# Implementation Plan: F3 — Import Sheet

Based on the approved spec at `.agent/specs/import-sheet.md`.

## Build Order

Implementation follows a dependency-first order: dependencies → models → backend validation → backend routes → frontend types → utilities → hooks → components → page integration.

---

### Phase 1: Dependencies

```bash
cd client && npm install papaparse && npm install -D @types/papaparse
```

No backend dependencies needed.

---

### Phase 2: Backend Models

#### [NEW] [sheet.model.js](file:///home/piyush/Documents/Trace/server/src/models/sheet.model.js)

Mongoose schema for the `sheets` collection.

```js
const sheetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Sheet name is required'],
      trim: true,
      maxlength: [100, 'Sheet name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    problemCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Problem count cannot be negative'],
    },
  },
  { timestamps: true }
);

// Efficient listing by user, newest first
sheetSchema.index({ userId: 1, createdAt: -1 });
```

#### [NEW] [problem.model.js](file:///home/piyush/Documents/Trace/server/src/models/problem.model.js)

Mongoose schema for the `problems` collection.

```js
const URL_REGEX = /^https?:\/\//;

const problemSchema = new mongoose.Schema(
  {
    sheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sheet',
      required: [true, 'Sheet ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Problem name is required'],
      trim: true,
      maxlength: [300, 'Problem name cannot exceed 300 characters'],
    },
    link: {
      type: String,
      required: [true, 'Problem link is required'],
      trim: true,
      validate: {
        validator: (v) => URL_REGEX.test(v),
        message: 'Link must be a valid URL starting with http:// or https://',
      },
    },
    topics: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'A problem can have at most 10 topics',
      },
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard', ''],
        message: 'Difficulty must be easy, medium, or hard',
      },
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['unsolved', 'attempted', 'solved'],
        message: 'Status must be unsolved, attempted, or solved',
      },
      default: 'unsolved',
    },
    notes: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
    },
  },
  { timestamps: true }
);

// Retrieval in original file order within a sheet
problemSchema.index({ sheetId: 1, order: 1 });

// User-level queries (future features)
problemSchema.index({ userId: 1 });
```

Add a Mongoose `pre('validate')` hook on the `topics` path to normalize values:
- Trim + lowercase each element
- Truncate to 50 chars per item
- Filter out empty strings after trimming

---

### Phase 3: Backend Validation Utility

#### [NEW] [import-validator.js](file:///home/piyush/Documents/Trace/server/src/utils/import-validator.js)

**Why a separate utility?** The import payload has complex, row-level validation that doesn't fit the simple `validate` middleware pattern. Extracting it keeps the controller thin and the logic testable.

```js
/**
 * Validates the import sheet payload.
 *
 * @param {object} body - req.body
 * @returns {{ isValid: boolean, sanitized?: object, errors?: Array<{ row?: number, field: string, message: string }> }}
 */
function validateImportPayload(body) { ... }
```

Responsibilities:

1. **Sheet-level checks:**
   - `name`: required, string, 1–100 chars after trim
   - `description`: optional, string, max 500 chars after trim
   - `problems`: required, must be a non-empty array, max 500 items

2. **Row-level checks** (iterate problems, collect errors, cap at 20):
   - `name`: required, string, 1–300 chars after trim
   - `link`: required, string, must match `^https?://`
   - `topics`: if present, must be array, max 10 items, each string 1–50 chars
   - `difficulty`: if present, must be one of `easy`, `medium`, `hard`, or `''`

3. **Sanitization** (applied during validation, returned as `sanitized`):
   - Strip HTML tags from all string fields: `str.replace(/<[^>]*>/g, '')`
   - Trim all strings
   - Lowercase + trim + truncate topics
   - Lowercase difficulty
   - Filter out empty topics after sanitization

4. **Return format:**
   ```js
   // Success
   { isValid: true, sanitized: { name, description, problems: [...] } }

   // Failure
   {
     isValid: false,
     errors: [
       { field: 'name', message: 'Sheet name is required' },
       { row: 3, field: 'link', message: 'Must be a valid URL starting with http:// or https://' },
       { row: 5, field: 'name', message: 'Problem name is required' },
     ]
   }
   ```

---

### Phase 4: Backend Routes & Controller

#### [NEW] [sheet.controller.js](file:///home/piyush/Documents/Trace/server/src/controllers/sheet.controller.js)

Two handlers. The controller is thin — validation is delegated to `import-validator.js`, DB operations use Mongoose.

**`importSheet`** — `POST /api/v1/sheets/import`

```js
const importSheet = async (req, res, next) => {
  try {
    // 1. Validate & sanitize
    const { isValid, sanitized, errors } = validateImportPayload(req.body);
    if (!isValid) {
      return next(new AppError('Validation failed', 400, errors));
    }

    const { name, description, problems } = sanitized;

    // 2. Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 3. Create sheet
      const [sheet] = await Sheet.create(
        [{ userId: req.user._id, name, description, problemCount: problems.length }],
        { session }
      );

      // 4. Prepare problem docs with sheet + user refs and order
      const problemDocs = problems.map((p, i) => ({
        ...p,
        sheetId: sheet._id,
        userId: req.user._id,
        order: i,
      }));

      // 5. Bulk insert
      await Problem.insertMany(problemDocs, { ordered: false, session });

      // 6. Commit
      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        data: {
          sheet: {
            id: sheet._id,
            name: sheet.name,
            description: sheet.description,
            problemCount: sheet.problemCount,
            createdAt: sheet.createdAt,
          },
        },
      });
    } catch (dbError) {
      await session.abortTransaction();
      throw dbError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};
```

**`getSheets`** — `GET /api/v1/sheets`

```js
const getSheets = async (req, res, next) => {
  try {
    const sheets = await Sheet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('_id name description problemCount createdAt')
      .lean();

    // Normalize _id → id for frontend consistency
    const normalized = sheets.map(({ _id, ...rest }) => ({ id: _id, ...rest }));

    return res.status(200).json({
      success: true,
      data: { sheets: normalized },
    });
  } catch (error) {
    next(error);
  }
};
```

Key decisions:
- `.lean()` on read queries — returns plain JS objects instead of Mongoose documents, **2–5× faster** for read-only data
- `_id` → `id` normalization done at the controller level for clean API responses
- `status: 201` for import (resource created), `200` for list
- Transaction uses `session` param on all operations, with proper `finally` cleanup

#### [MODIFY] [app-error.js](file:///home/piyush/Documents/Trace/server/src/utils/app-error.js)

Extend `AppError` to optionally carry an `errors` array (for aggregated validation errors):

```js
constructor(message, statusCode, errors = null) {
  super(message);
  this.statusCode = statusCode;
  this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
  this.isOperational = true;
  this.errors = errors; // Array of { row?, field, message } or null
  Error.captureStackTrace(this, this.constructor);
}
```

#### [MODIFY] [error.middleware.js](file:///home/piyush/Documents/Trace/server/src/middleware/error.middleware.js)

Include `errors` array in the response when present:

```js
// In the error response object:
...(err.errors && { errors: err.errors }),
```

#### [NEW] [sheet.routes.js](file:///home/piyush/Documents/Trace/server/src/routes/sheet.routes.js)

```js
const express = require('express');
const { importSheet, getSheets } = require('../controllers/sheet.controller');
const { protect } = require('../middleware/auth.middleware');
const { importLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

// All sheet routes require authentication
router.use(protect);

// POST /api/v1/sheets/import — create sheet from mapped data
router.post('/import', importLimiter, importSheet);

// GET /api/v1/sheets — list user's sheets
router.get('/', getSheets);

module.exports = router;
```

#### [MODIFY] [app.js](file:///home/piyush/Documents/Trace/server/src/app.js)

Two changes:
1. **Increase global body limit** from `10kb` to `2mb`. The old limit is too restrictive for the import payload (500 problems × fields). We rely on per-route rate limiting + field-level validation for abuse prevention, not body size.
2. Mount sheet routes:

```js
const sheetRoutes = require('./routes/sheet.routes');
// ...
app.use(express.json({ limit: '2mb' }));   // was '10kb'
// ...
app.use('/api/v1/sheets', sheetRoutes);
```

> **Why increase the global limit instead of route-level override?** In Express, `app.use(express.json())` runs before any route handler. A route-level `express.json({ limit: '2mb' })` middleware would never fire because the global parser rejects bodies > 10kb first. The alternatives (conditional middleware, skipping global parser for specific paths) add complexity without meaningful benefit. A 2mb limit is standard for JSON APIs, and our real protection comes from auth, rate limiting, and field validation.

#### [MODIFY] [rate-limit.middleware.js](file:///home/piyush/Documents/Trace/server/src/middleware/rate-limit.middleware.js)

Add `importLimiter`:

```js
/**
 * Rate limiter for sheet import endpoint.
 * 5 imports per 15-minute window, keyed by user ID.
 * Heavier limit because imports are write-intensive DB operations.
 */
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message: 'Too many imports. Please try again after 15 minutes.',
  },
});
```

Key: `keyGenerator` uses `req.user._id` (available because `protect` runs before `importLimiter`), falling back to IP as a safety net.

---

### Phase 5: Frontend Types

#### [NEW] [sheet.ts](file:///home/piyush/Documents/Trace/client/src/types/sheet.ts)

```ts
// ── Domain types ──────────────────────────────────────────────────────────────

export interface Sheet {
  id: string;
  name: string;
  description: string;
  problemCount: number;
  createdAt: string;
}

export interface Problem {
  name: string;
  link: string;
  topics: string[];
  difficulty: '' | 'easy' | 'medium' | 'hard';
}

// ── Import flow types ─────────────────────────────────────────────────────────

/** The four Trace fields a file column can map to, plus 'skip' */
export type TraceField = 'name' | 'link' | 'topics' | 'difficulty';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: TraceField | 'skip';
}

/** Raw data extracted from the uploaded file, before column mapping */
export interface ParsedFileData {
  columns: string[];
  rows: Record<string, string | string[]>[];
  suggestedName?: string;
  suggestedDescription?: string;
}

/** Payload sent to POST /api/v1/sheets/import */
export interface ImportPayload {
  name: string;
  description?: string;
  problems: Problem[];
}

/** Wizard steps for the import modal */
export type ImportStep = 'upload' | 'map' | 'preview';
```

#### [MODIFY] [api.ts](file:///home/piyush/Documents/Trace/client/src/types/api.ts)

Add:

```ts
import type { Sheet } from './sheet';

export interface ImportSheetResponse {
  sheet: Sheet;
}

export interface ListSheetsResponse {
  sheets: Sheet[];
}
```

---

### Phase 6: Frontend File Parser

#### [NEW] [file-parser.ts](file:///home/piyush/Documents/Trace/client/src/lib/file-parser.ts)

Client-side parsing utilities. Exports four pure functions:

**`readFileAsText(file: File): Promise<string>`**
- Wraps `FileReader` in a Promise
- Strips UTF-8 BOM (`\uFEFF`) from the start

**`parseCSVFile(file: File): Promise<ParsedFileData>`**
1. `readFileAsText(file)`
2. `Papa.parse(text, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() })`
3. Check `result.errors` — if fatal errors, throw with first error message
4. Extract `columns` from `result.meta.fields`, filter out empty column names
5. Return `{ columns, rows: result.data }`

**`parseJSONFile(file: File): Promise<ParsedFileData>`**
1. `readFileAsText(file)`
2. `JSON.parse(text)` — catch and rethrow as a user-friendly error
3. Auto-detect: iterate top-level keys, find the first one whose value is `Array.isArray(v) && v.length > 0 && typeof v[0] === 'object'`
4. If none found → throw `"Could not find an array of problems in this JSON file"`
5. Extract `columns`: union of all keys across all objects in the array (preserving order of first appearance)
6. Extract `suggestedName` and `suggestedDescription` from top-level string fields named `name`/`title` and `description`/`desc`
7. Return `{ columns, rows, suggestedName?, suggestedDescription? }`

**`applyMapping(rows: Record[], mappings: ColumnMapping[]): Problem[]`**
1. Build a lookup: `{ name: sourceCol, link: sourceCol, topics: sourceCol | null, difficulty: sourceCol | null }`
2. Iterate rows, for each:
   - `name`: trim the value from mapped source column
   - `link`: trim the value from mapped source column
   - `topics`: get value → if string, split by `,`, trim, lowercase, filter empty, cap at 10 → if array, same processing
   - `difficulty`: lowercase, if not `easy|medium|hard` → `''`
3. **Skip rows** where `name` is empty after trimming (silently, these are empty/header rows)
4. Return `Problem[]`

**`detectMappings(columns: string[]): ColumnMapping[]`**

Auto-detection with keyword matching:

```ts
const FIELD_KEYWORDS: Record<TraceField, string[]> = {
  name: ['name', 'title', 'problem', 'question'],
  link: ['link', 'url', 'href'],
  topics: ['topic', 'topics', 'tag', 'tags', 'category', 'categories', 'type'],
  difficulty: ['difficulty', 'level', 'diff'],
};
```

Algorithm:
1. For each column, lowercase + trim the name
2. Try exact match against keywords first (highest confidence)
3. Then try `includes` match (e.g. "problem title" contains "title")
4. If a Trace field is already claimed by a previous column, skip (first match wins)
5. Default unmatched columns to `skip`

---

### Phase 7: Frontend Custom Hook

#### [NEW] [use-sheets.ts](file:///home/piyush/Documents/Trace/client/src/hooks/use-sheets.ts)

**Why a custom hook?** Extracting the sheet state + API calls into a reusable hook keeps the dashboard page clean and makes the logic reusable for future features (F4, F5).

```ts
interface UseSheetsReturn {
  sheets: Sheet[];
  isLoading: boolean;
  error: string | null;
  addSheet: (sheet: Sheet) => void;       // Optimistic add after import
  fetchSheets: () => Promise<void>;       // Manual refetch
}

export function useSheets(): UseSheetsReturn {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => { fetchSheets(); }, []);

  const fetchSheets = async () => { ... };

  // Optimistic: prepend to local state without refetching
  const addSheet = (sheet: Sheet) => {
    setSheets(prev => [sheet, ...prev]);
  };

  return { sheets, isLoading, error, addSheet, fetchSheets };
}
```

Key decisions:
- **Optimistic update via `addSheet`** — after a successful import, the new sheet is prepended to the local array immediately, no refetch needed. This is faster and avoids a loading flash.
- **Reusable** — can be used in dashboard, future sidebar, or any component that needs the sheet list.

---

### Phase 8: Frontend Components

Build order: leaf components first → composite modal last.

#### [NEW] [file-dropzone.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/file-dropzone.tsx)

```ts
interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  error?: string | null;
  isLoading?: boolean;
}
```

Implementation details:
- Drag state tracked via `useState<boolean>(isDragOver)`
- Hidden `<input type="file" accept=".csv,.json" ref={inputRef} />`, triggered by clicking the zone
- `onDrop` handler: extract `e.dataTransfer.files[0]`, validate extension + size, call `onFileSelect`
- **Client-side validation before propagating:**
  - File extension must be `.csv` or `.json` (check `file.name.endsWith()`)
  - File size must be ≤ 1 MB (`file.size <= 1_048_576`)
  - Reject with inline error if either fails
- Visual states:
  - **Default**: dashed `zinc-700` border, `zinc-900/50` bg, upload icon + instructional text
  - **Drag hover**: `indigo-500/30` border, `indigo-500/5` bg, slight scale pulse
  - **Loading**: spinner overlay, disabled interaction
  - **Error**: `red-500/30` border, error message in `text-red-400`
- Keyboard accessible: `tabIndex={0}`, Enter/Space triggers file picker
- Styling matches existing glassmorphism design system

#### [NEW] [column-mapper.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/column-mapper.tsx)

```ts
interface ColumnMapperProps {
  columns: string[];
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  sampleData: Record<string, string | string[]>[];
}
```

Implementation details:
- **Layout**: vertical list of mapping rows, each is a card-like row:
  ```
  [ Column Name ]  "sample value..."  →  [ Dropdown ▼ ]
  ```
- **Sample preview**: show the value of each column from `sampleData[0]` (first row), truncated to 40 chars. This helps users identify what each column contains.
- **Dropdown options**: `Skip` (default), `Name *`, `Link *`, `Topics`, `Difficulty`
  - Asterisks indicate required fields
  - Required fields not yet mapped → show a subtle warning below the mapper: "Name and Link must be mapped"
- **Exclusivity logic**: each Trace field (except `skip`) can only be selected once across all dropdowns. When the user maps a column to `Name` and another column is already mapped to `Name`, the old one auto-resets to `Skip`. This prevents conflicts without blocking the user.
- **Validation state**: expose whether the mapping is valid via computing `isMappingValid` (name + link both mapped). Parent uses this to enable/disable the "Next" button.
- **Styling**: `zinc-900/60` row cards, `zinc-800` select elements with `indigo-500` focus ring, `→` arrow between source and target

#### [NEW] [import-preview-table.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/import-preview-table.tsx)

```ts
interface ImportPreviewTableProps {
  problems: Problem[];
  maxVisible?: number; // Default: show all in scrollable container
}
```

Implementation details:
- **Header**: `"{count} problems ready to import"` — clear count
- **Table columns**: `#` | `Name` | `Link` | `Topics` | `Difficulty`
- **Link column**: truncated display text (hostname only), opens in new tab
- **Topics column**: rendered as small `indigo-500/10` rounded badge pills
- **Difficulty column**: colored badge — `emerald` (easy), `amber` (medium), `rose` (hard), `zinc` (unmapped/empty)
- **Scrollable**: `max-h-[400px] overflow-y-auto` container with sticky header
- **Row styling**: alternating `zinc-900/30` and `zinc-900/60` backgrounds
- **Empty state**: if `problems.length === 0` after mapping, show "No problems found. Check your column mapping."

#### [NEW] [import-sheet-modal.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/import-sheet-modal.tsx)

The orchestrator component. Manages a 3-step wizard.

```ts
interface ImportSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sheet: Sheet) => void;
}
```

**State management** — uses a `useReducer` for predictable state transitions:

```ts
interface ImportState {
  step: ImportStep;            // 'upload' | 'map' | 'preview'
  file: File | null;
  parsedData: ParsedFileData | null;
  mappings: ColumnMapping[];
  mappedProblems: Problem[];
  sheetName: string;
  sheetDescription: string;
  isImporting: boolean;
  parseError: string | null;
}

type ImportAction =
  | { type: 'FILE_PARSED'; payload: { file: File; data: ParsedFileData; mappings: ColumnMapping[] } }
  | { type: 'UPDATE_MAPPINGS'; payload: ColumnMapping[] }
  | { type: 'APPLY_MAPPING'; payload: Problem[] }
  | { type: 'SET_SHEET_NAME'; payload: string }
  | { type: 'SET_SHEET_DESCRIPTION'; payload: string }
  | { type: 'IMPORT_START' }
  | { type: 'IMPORT_SUCCESS' }
  | { type: 'IMPORT_ERROR'; payload: string }
  | { type: 'GO_BACK' }
  | { type: 'SET_PARSE_ERROR'; payload: string }
  | { type: 'RESET' };
```

**Why `useReducer`?** The import wizard has 8+ interrelated state fields with complex transitions (e.g. going back should preserve mappings, resetting on close, etc.). A reducer makes transitions explicit and prevents invalid states — standard practice for multi-step forms.

**Modal behavior:**
- **Backdrop**: `fixed inset-0 bg-black/60 backdrop-blur-sm`, click to close
- **Container**: centered, `max-w-3xl w-full max-h-[90vh]`, glass-card styling
- **Animation**: mount → scale from 0.95 + fade in (CSS transition on mount via a state flag)
- **Step indicator**: 3 connected pills at top: `Upload → Map → Preview`. Current step highlighted in indigo, completed in green, upcoming in zinc.
- **Focus trap**: on mount, focus the first interactive element. On `Tab`, cycle within modal. On `Escape`, close.
- **Portal**: render via `createPortal(modal, document.body)` to avoid z-index stacking context issues.
- **Body scroll lock**: set `document.body.style.overflow = 'hidden'` on open, restore on close.
- **Reset on close**: dispatch `RESET` action to clear all state.

**Step transitions:**
1. **Upload → Map**: file selected → parse with PapaParse/JSON.parse → auto-detect mappings → `FILE_PARSED` action → advance to `map`
2. **Map → Preview**: user clicks "Next" → `applyMapping()` → `APPLY_MAPPING` action → advance to `preview`
3. **Preview → Import**: user clicks "Import" → `IMPORT_START` → `api.post('/sheets/import', payload)` → on success: `onSuccess(sheet)`, toast, close → on error: toast error, stay on step

**Footer buttons per step:**
- Upload: none (file selection triggers advance)
- Map: `Back` | `Next` (disabled until name + link mapped)
- Preview: `Back` | `Import` (disabled until sheet name is filled)

#### [NEW] [sheet-card.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/sheets/sheet-card.tsx)

```ts
interface SheetCardProps {
  sheet: Sheet;
}
```

Implementation details:
- **Card**: `rounded-xl`, `zinc-900/50` bg, `zinc-800/60` border, padding
- **Content**:
  - Sheet name: `text-lg font-semibold text-zinc-50`, truncated to 1 line
  - Description: `text-sm text-zinc-400`, truncated to 1 line, hidden if empty
  - Bottom row: problem count icon + count on left, relative date on right
- **Relative date**: compute from `createdAt` — "just now", "2 hours ago", "3 days ago", etc. Use a small utility function, no library needed.
- **Hover effect**: `transition-all duration-200`, border → `zinc-700`, `translateY(-2px)`, subtle shadow
- **Future-proofing**: the card doesn't navigate anywhere yet (that's F4/F5). Just a visual display for now. The component accepts an optional `onClick` prop for future use.

---

### Phase 9: Dashboard Integration

#### [MODIFY] [page.tsx](file:///home/piyush/Documents/Trace/client/src/app/dashboard/page.tsx)

Rewrite using `useSheets` hook and new components.

```tsx
export default function DashboardPage() {
  const { user } = useAuth();
  const { sheets, isLoading, addSheet } = useSheets();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derived stats
  const totalProblems = sheets.reduce((sum, s) => sum + s.problemCount, 0);

  return (
    <div>
      {/* Welcome banner (existing, keep as-is) */}
      
      {/* Stats cards — update with real data */}
      {/* Total Problems: totalProblems, Sheets: sheets.length, Streak: 0 (future) */}

      {/* Conditional rendering */}
      {isLoading ? (
        <SheetListSkeleton />  // Skeleton cards while loading
      ) : sheets.length === 0 ? (
        <EmptyState onImport={() => setIsModalOpen(true)} />
      ) : (
        <>
          <SheetsHeader onImport={() => setIsModalOpen(true)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheets.map(sheet => <SheetCard key={sheet.id} sheet={sheet} />)}
          </div>
        </>
      )}

      {/* Import modal */}
      <ImportSheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(sheet) => {
          addSheet(sheet);       // Optimistic prepend, no refetch
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
```

Key decisions:
- **Skeleton loading**: while `isLoading` is true, show placeholder cards matching the layout shape. Avoids layout shift and feels premium.
- **Optimistic update**: `addSheet` from `useSheets` prepends the new sheet locally. No `fetchSheets()` needed after import.
- **Stats use real data**: `totalProblems` is the sum of all `problemCount` values. `Sheets` stat shows `sheets.length`.
- **Sheets header**: a flex row with "Your Sheets" title + "Import Sheet" button (for non-empty state).
- The skeleton, empty state, and sheets header are small inline components within the page file (not worth separate files).

---

## File Summary

### New files (12)

| File | Purpose |
|------|---------|
| `server/src/models/sheet.model.js` | Sheet Mongoose schema |
| `server/src/models/problem.model.js` | Problem Mongoose schema |
| `server/src/utils/import-validator.js` | Import payload validation + sanitization |
| `server/src/controllers/sheet.controller.js` | Import + list handlers |
| `server/src/routes/sheet.routes.js` | Sheet route definitions |
| `client/src/types/sheet.ts` | TypeScript types |
| `client/src/lib/file-parser.ts` | CSV/JSON parsing utilities |
| `client/src/hooks/use-sheets.ts` | Sheets state management hook |
| `client/src/components/features/sheets/file-dropzone.tsx` | Drag-and-drop upload |
| `client/src/components/features/sheets/column-mapper.tsx` | Column → field mapping |
| `client/src/components/features/sheets/import-preview-table.tsx` | Preview table |
| `client/src/components/features/sheets/import-sheet-modal.tsx` | Multi-step import modal |
| `client/src/components/features/sheets/sheet-card.tsx` | Sheet summary card |

### Modified files (5)

| File | Changes |
|------|---------|
| `server/src/app.js` | Mount sheet routes, increase body limit to 2mb |
| `server/src/utils/app-error.js` | Add optional `errors` array to constructor |
| `server/src/middleware/error.middleware.js` | Include `errors` in response |
| `server/src/middleware/rate-limit.middleware.js` | Add `importLimiter` |
| `client/src/types/api.ts` | Add sheet response types |

---

## Verification Plan

### Backend API (curl)

```bash
# 1. Import — happy path
curl -s -X POST http://localhost:5000/api/v1/sheets/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sheet",
    "problems": [
      { "name": "Two Sum", "link": "https://leetcode.com/problems/two-sum", "topics": ["arrays", "hash map"], "difficulty": "easy" },
      { "name": "Valid Parentheses", "link": "https://leetcode.com/problems/valid-parentheses", "topics": ["stacks"], "difficulty": "easy" }
    ]
  }' | jq .

# 2. Import — missing required fields (should return 400 with errors array)
curl -s -X POST http://localhost:5000/api/v1/sheets/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Bad Sheet", "problems": [{ "name": "", "link": "not-a-url" }] }' | jq .

# 3. Import — optional fields omitted (should succeed)
curl -s -X POST http://localhost:5000/api/v1/sheets/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Minimal", "problems": [{ "name": "Two Sum", "link": "https://leetcode.com/two-sum" }] }' | jq .

# 4. Import — 401 without token
curl -s -X POST http://localhost:5000/api/v1/sheets/import \
  -H "Content-Type: application/json" \
  -d '{ "name": "X", "problems": [] }' | jq .

# 5. List sheets
curl -s http://localhost:5000/api/v1/sheets \
  -H "Authorization: Bearer <token>" | jq .
```

### Frontend (browser testing)

1. Upload a CSV with non-standard columns → verify auto-detection works
2. Upload a JSON with nested array → verify auto-detection finds the array
3. Map columns → verify exclusivity (mapping Name twice resets the old one)
4. Verify "Next" is disabled until Name + Link are mapped
5. Preview table → verify topics are split from comma-separated CSV cells
6. Verify difficulty badges show correct colors
7. Import with sheet name → verify success toast + card appears on dashboard
8. Import without sheet name → verify "Import" button is disabled
9. Test oversized file (> 1MB) → verify instant rejection
10. Test wrong file type (.txt) → verify rejection
11. Test malformed JSON → verify clear error message
12. Verify modal Escape key, backdrop click, focus trap
13. Verify mobile responsive (modal adapts to small screens)

### Edge cases

- CSV with quoted commas: `"arrays, hash map"` → should be a single cell, not split
- CSV with BOM marker → should parse without `\uFEFF` in first column name
- JSON where the array is not named "problems" → auto-detect should find it
- 500 problems → should import successfully
- 501 problems → should be rejected with clear error
- Problems with only name + link (no topics, no difficulty) → should import fine
