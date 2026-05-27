# Feature: F3 — Import Sheet

## Overview

Import Sheet is the core data-entry feature for Trace. It lets users upload a DSA practice sheet (CSV or JSON) and have it parsed into a structured collection of problems. Because real-world DSA sheets come with wildly different column names (e.g. `Problem Name` vs `Title` vs `question`), the import flow includes a **column mapping step** where the user matches the file's columns to Trace's expected fields. Each imported sheet becomes a named entity the user can later open and track progress against (F5). This feature is the gateway to all downstream features (F4–F9).

## Depends on

- **F1: Project Scaffolding** — Next.js frontend, Express backend, MongoDB connection ✅
- **F2: Auth (Signup/Login)** — Users must be authenticated to import sheets ✅

## Routes

| Method | Path                      | Description                                             | Access    |
|--------|---------------------------|---------------------------------------------------------|-----------|
| POST   | `/api/v1/sheets/import`   | Create a new sheet from a mapped + parsed payload       | Protected |
| GET    | `/api/v1/sheets`          | List all sheets belonging to the authenticated user     | Protected |

## Database changes

### New collection: `sheets`

Each sheet represents a named DSA practice list imported by a user.

| Field         | Type       | Constraints                                    |
|---------------|------------|------------------------------------------------|
| `_id`         | ObjectId   | Auto-generated                                 |
| `userId`      | ObjectId   | Required, ref → `users`, indexed               |
| `name`        | String     | Required, trim, max 100 chars                  |
| `description` | String     | Optional, trim, max 500 chars, default: `''`   |
| `problemCount`| Number     | Required, default: 0 (denormalized count)      |
| `createdAt`   | Date       | Auto (timestamps: true)                        |
| `updatedAt`   | Date       | Auto (timestamps: true)                        |

**Indexes:** Compound index on `{ userId: 1, createdAt: -1 }` for efficient listing by user sorted by most recent.

### New collection: `problems`

Each problem belongs to a sheet. Stores the parsed data from the CSV/JSON rows.

| Field         | Type       | Constraints                                          |
|---------------|------------|------------------------------------------------------|
| `_id`         | ObjectId   | Auto-generated                                       |
| `sheetId`     | ObjectId   | Required, ref → `sheets`, indexed                    |
| `userId`      | ObjectId   | Required, ref → `users`, indexed                     |
| `name`        | String     | Required, trim, max 300 chars                        |
| `link`        | String     | Required, trim, validated as URL                     |
| `topics`      | [String]   | Array of strings, default: `[]`, each trimmed + lowercase, max 10 items, max 50 chars each |
| `difficulty`  | String     | Optional, enum: `['easy', 'medium', 'hard', '']`, default: `''` |
| `status`      | String     | Required, enum: `['unsolved', 'attempted', 'solved']`, default: `'unsolved'` |
| `notes`       | String     | Optional, default: `''`                              |
| `order`       | Number     | Required (preserves original row order from import)  |
| `createdAt`   | Date       | Auto (timestamps: true)                              |
| `updatedAt`   | Date       | Auto (timestamps: true)                              |

**Key design decisions:**
- `topics` is an **array of strings** — a problem can belong to multiple topics (e.g. "Two Sum" → `["arrays", "hash map"]`).
- `difficulty` and `topics` are **optional at import time** — users fill them in later while solving.
- `name` and `link` are the **only required fields** at import — they uniquely identify a problem.
- `link` is validated as a URL (must start with `http://` or `https://`).
- `topics` is capped at 10 items per problem, 50 chars per topic — prevents abuse and keeps UI clean.

**Indexes:** Compound index on `{ sheetId: 1, order: 1 }` for efficient retrieval in order. Index on `{ userId: 1 }`.

## Trace Expected Fields

These are the fields Trace understands. During import, the user maps their file's columns to these fields.

| Field        | Required at import | Description                                  |
|--------------|--------------------|----------------------------------------------|
| `name`       | ✅ Yes             | The problem title                            |
| `link`       | ✅ Yes             | URL to the problem (LeetCode, GFG, etc.)     |
| `topics`     | ❌ No              | Comma-separated in CSV, array in JSON        |
| `difficulty` | ❌ No              | One of: easy, medium, hard                   |

Users can edit `topics`, `difficulty`, `notes`, and `status` later while working through the sheet (F5).

## Accepted File Formats

### CSV Format

The user's CSV can have **any column names**. Example:

```csv
S.No,Problem Title,Problem Link,Topic,Level
1,Two Sum,https://leetcode.com/problems/two-sum,"arrays, hash map",Easy
2,Valid Parentheses,https://leetcode.com/problems/valid-parentheses,stacks,Easy
3,LRU Cache,https://leetcode.com/problems/lru-cache,"linked list, design",Medium
```

**Rules:**
- First row MUST be a header row
- Column names can be anything — user maps them in the UI
- Topics can be comma-separated within a single cell (e.g. `"arrays, hash map"`)
- Proper CSV quoting is handled (commas inside quoted fields are preserved)
- UTF-8 BOM (`\uFEFF`) at the start of the file is stripped automatically
- Extra columns that aren't mapped are silently ignored

### JSON Format

```json
{
  "name": "Striver SDE Sheet",
  "description": "Optional description",
  "problems": [
    {
      "title": "Two Sum",
      "url": "https://leetcode.com/problems/two-sum",
      "tags": ["arrays", "hash map"],
      "level": "easy"
    }
  ]
}
```

**Rules:**
- The parser auto-detects the first top-level key whose value is an array of objects — the user doesn't need to name it `problems`
- Optional top-level `name` and `description` string fields
- The keys within each problem object can be anything — user maps them in the UI
- If a `topics`/`tags` field is a string, it's split by commas into an array
- If a `topics`/`tags` field is already an array, it's used directly

## Column Mapping Flow

This is the core UX of the import feature. Instead of forcing users to rename their columns, we adapt to their data.

```
Step 1: UPLOAD
  User drops/selects a file (.csv or .json)
       │
       ▼
Step 2: COLUMN MAPPING
  We extract column names from the file and show them
  User maps each file column → Trace field via dropdowns:

  ┌─────────────────────────────────────────────┐
  │  Your Column        →   Map to Trace Field  │
  │─────────────────────────────────────────────│
  │  "Problem Title"    →   [Name ▼]            │
  │  "Problem Link"     →   [Link ▼]            │
  │  "Topic"            →   [Topics ▼]          │
  │  "Level"            →   [Difficulty ▼]       │
  │  "S.No"             →   [Skip ▼]            │
  └─────────────────────────────────────────────┘

  Dropdown options: Name, Link, Topics, Difficulty, Skip
  - "Name" and "Link" must each be mapped exactly once (required)
  - "Topics" and "Difficulty" can be mapped or skipped (optional)
  - "Skip" means ignore this column
  - Each Trace field can be mapped at most once (no duplicates)
  - Auto-detection: pre-fill mappings by fuzzy-matching column names
       │
       ▼
Step 3: PREVIEW & CONFIRM
  Apply the mapping and show a preview table
  Display total problem count, first 10 rows visible, scroll for more
  User sets sheet name (required) + optional description
       │
       ▼
Step 4: IMPORT
  User clicks "Import" → POST /api/v1/sheets/import
```

### Auto-detection heuristics

Pre-map columns by matching common names (case-insensitive, trimmed):

| Trace Field  | Auto-detect keywords                                         |
|--------------|--------------------------------------------------------------|
| `name`       | `name`, `title`, `problem`, `question`, `problem name`, `problem title` |
| `link`       | `link`, `url`, `problem link`, `problem url`, `leetcode`, `href` |
| `topics`     | `topic`, `topics`, `tag`, `tags`, `category`, `categories`, `type` |
| `difficulty` | `difficulty`, `level`, `diff`                                |

Matching strategy: check if the column name (lowercased, trimmed) **equals** or **contains** any keyword. If a confident match is found, pre-select it. The user can always override.

## UI Components

### Create

| Component              | Path                                                        | Purpose                                                    |
|------------------------|-------------------------------------------------------------|------------------------------------------------------------|
| `ImportSheetModal`     | `client/src/components/features/sheets/import-sheet-modal.tsx` | Multi-step modal: upload → map → preview → import        |
| `FileDropzone`         | `client/src/components/features/sheets/file-dropzone.tsx`   | Drag-and-drop file upload area with click fallback         |
| `ColumnMapper`         | `client/src/components/features/sheets/column-mapper.tsx`   | Column mapping UI with dropdowns                           |
| `ImportPreviewTable`   | `client/src/components/features/sheets/import-preview-table.tsx` | Preview mapped problems before confirming import      |
| `SheetCard`            | `client/src/components/features/sheets/sheet-card.tsx`      | Card showing sheet name, problem count, and date           |

### Modify

| Component        | File                                              | Changes                                                 |
|------------------|---------------------------------------------------|---------------------------------------------------------|
| `DashboardPage`  | `client/src/app/dashboard/page.tsx`               | Replace placeholder with sheet list + import button     |

## Files to create

### Backend (`server/`)

| File                                             | Purpose                                         |
|--------------------------------------------------|--------------------------------------------------|
| `server/src/models/sheet.model.js`               | Sheet Mongoose schema & model                    |
| `server/src/models/problem.model.js`             | Problem Mongoose schema & model                  |
| `server/src/controllers/sheet.controller.js`     | Import and list sheet handlers                   |
| `server/src/routes/sheet.routes.js`              | Sheet route definitions                          |

### Frontend (`client/`)

| File                                                                    | Purpose                                    |
|-------------------------------------------------------------------------|-------------------------------------------|
| `client/src/components/features/sheets/import-sheet-modal.tsx`          | Multi-step import modal                    |
| `client/src/components/features/sheets/file-dropzone.tsx`               | Drag-and-drop file upload component        |
| `client/src/components/features/sheets/column-mapper.tsx`               | Column → field mapping UI                  |
| `client/src/components/features/sheets/import-preview-table.tsx`        | Preview table for mapped problems          |
| `client/src/components/features/sheets/sheet-card.tsx`                  | Sheet summary card                         |
| `client/src/types/sheet.ts`                                             | Sheet & Problem TypeScript types           |
| `client/src/lib/file-parser.ts`                                         | Client-side CSV/JSON parsing utilities     |

## Files to change

| File                                              | Changes                                               |
|---------------------------------------------------|-------------------------------------------------------|
| `server/src/app.js`                               | Mount `/api/v1/sheets` routes                         |
| `client/src/app/dashboard/page.tsx`               | Add import button, fetch & display sheets             |
| `client/src/types/api.ts`                         | Add sheet-related API response types                  |

## New dependencies

### Backend

None — the server receives pre-parsed JSON from the client. No CSV parsing needed server-side.

### Frontend

| Package     | Purpose                                              |
|-------------|------------------------------------------------------|
| `papaparse` | Industry-standard CSV parser (~7 KB gzipped). Handles quoted fields, escaped commas, newlines in cells, BOM stripping, and all CSV edge cases correctly. Manual parsing is error-prone and a known source of bugs. |
| `@types/papaparse` (dev) | TypeScript definitions for PapaParse |

**Why PapaParse over manual parsing:** CSV looks deceptively simple but has many edge cases — quoted fields containing commas (`"arrays, hash map"`), escaped quotes (`"say ""hello"""`), newlines within cells, BOM markers, different line endings (`\r\n` vs `\n`). PapaParse handles all of these and is the de-facto standard in the JS ecosystem (~7 KB gzipped). Rolling our own parser invites subtle bugs.

## Parsing & Validation Rules

### Client-side (file-parser.ts)

1. **File size limit**: Max 1 MB — enforced before reading the file. Show error immediately for oversized files.
2. **File type**: Accept only `.csv` and `.json` extensions. Reject all others with a clear message.
3. **Encoding**: Read files as UTF-8. PapaParse handles BOM stripping for CSV. For JSON, strip BOM manually.
4. **CSV parsing**: Use PapaParse with `{ header: true, skipEmptyLines: 'greedy', transformHeader: (h) => h.trim() }`.
5. **JSON parsing**: `JSON.parse()` the file content. Auto-detect the first top-level key whose value is an array of objects.
6. **Column extraction**: After parsing, extract unique column/key names and pass them to the ColumnMapper.
7. **No validation at this stage** — column values are raw strings. Validation happens after mapping + on the server.

### Client-side (after mapping, before sending)

8. **Apply mapping**: Transform raw rows using the user's column mapping.
9. **Topics splitting**: If the mapped `topics` value is a string, split by commas. If already an array, use directly. Trim and lowercase each item.
10. **Difficulty normalization**: Lowercase the mapped difficulty value. If it's not one of `easy`, `medium`, `hard`, set to `''`.
11. **Empty row skipping**: Skip rows where the mapped `name` field is empty after trimming.
12. **Problem limit**: Max 500 problems per import — enforced after empty-row skipping.

### Server-side (sheet.controller.js)

13. **Re-validate everything** — never trust client data:
    - `name` (sheet): required, string, 1–100 chars
    - `description`: optional, string, 0–500 chars
    - `problems`: required, non-empty array, max 500 items
    - Each problem `name`: required, string, 1–300 chars
    - Each problem `link`: required, string, must be a valid URL (starts with `http://` or `https://`)
    - Each problem `topics`: optional, array of strings, max 10 items, each 1–50 chars
    - Each problem `difficulty`: optional, must be one of `easy`, `medium`, `hard`, or `''`
14. **Sanitization**: Strip HTML tags from all string fields to prevent stored XSS. Use a simple regex: `/<[^>]*>/g` → `''`.
15. **Error aggregation**: Collect all validation errors across all rows and return them together (capped at the first 20 errors to avoid massive responses). Format: `{ errors: [{ row: 5, field: "link", message: "must be a valid URL" }] }`.
16. **Rate limiting**: Import endpoint gets its own rate limiter — **5 imports per 15 minutes per user** (it's a heavy write operation).

## Import Flow (Updated)

```
User clicks "Import Sheet"
       │
       ▼
Modal opens → Step 1: UPLOAD
  FileDropzone — user drops/selects .csv or .json
  Client checks: file size ≤ 1 MB, valid extension
       │
       ├─ Too large / wrong type → inline error, retry
       │
       ▼
Client reads file via FileReader
  CSV → PapaParse → array of row objects + column names
  JSON → JSON.parse → auto-find array + extract keys
       │
       ├─ Parse error → inline error with details, retry
       │
       ▼
Step 2: COLUMN MAPPING
  Show extracted columns with dropdown mappers
  Auto-detect mappings where possible
  User maps: column → Name / Link / Topics / Difficulty / Skip
  Validation: "Name" and "Link" must each be mapped exactly once
       │
       ├─ Mappings incomplete → "Next" button disabled
       │
       ▼
Step 3: PREVIEW & CONFIRM
  Apply mapping to raw data → transform into problem objects
  Display: total problem count + scrollable preview table
  User enters sheet name (required) + description (optional)
       │
       ▼
User clicks "Import"
       │
       ▼
POST /api/v1/sheets/import
  Payload: { name, description?, problems: [{ name, link, topics?, difficulty? }] }
       │
       ├─ Validation error → 400 with aggregated row-level errors
       │
       ▼
Server validates, sanitizes, creates Sheet + Problems in a transaction
  Uses insertMany with ordered: false for performance
       │
       ▼
Response: { sheet: { id, name, description, problemCount, createdAt } }
       │
       ▼
Modal closes, dashboard refreshes, success toast
```

## Rules for implementation

1. **No file uploads** — Files are read entirely in the browser via `FileReader`. The API receives a JSON payload, not multipart form data. This keeps the Express body parser simple (`express.json()`).
2. **Increase body limit for import** — The sheet import route needs a higher body limit than the default `10kb`. Apply a route-specific `express.json({ limit: '2mb' })` middleware on the import endpoint only.
3. **Transaction for atomicity** — Sheet + Problems must be created in a single MongoDB transaction. If problem insertion fails, the sheet should not be created either. Use `session.startTransaction()` / `commitTransaction()` / `abortTransaction()`.
4. **Bulk insert** — Use `Problem.insertMany(problems, { ordered: false, session })` for performance. `ordered: false` lets MongoDB continue inserting even if one fails (we catch and report all errors).
5. **Preserve row order** — Each problem gets an `order` field (0-indexed) matching its position in the original file.
6. **Error aggregation** — Validation errors include row number and field, capped at 20 errors. Return all at once so the user can fix them in one pass.
7. **Multi-step modal** — 3 steps: upload → map → preview. Step indicator at the top. Back buttons to revisit previous steps. Each step transition has a smooth animation.
8. **Premium UI** — Smooth step transitions, drag-and-drop with visual feedback (border color change, icon animation on drag hover), clean dropdowns with column name previews, professional preview table with alternating row colors.
9. **Empty state update** — After importing, the "No sheets yet" empty state on the dashboard should be replaced with the sheet card grid.
10. **Accessible** — Modal traps focus, Escape closes it, dropzone is keyboard-accessible (Enter/Space to trigger file picker), all interactive elements have proper ARIA labels.
11. **PapaParse for CSV** — Use PapaParse (`Papa.parse(file, { header: true, ... })`) for robust CSV parsing. Never parse CSV manually.
12. **topics is always an array** — Comma-separated strings are split. Each topic is trimmed and lowercased. Capped at 10 topics per problem, 50 chars per topic.
13. **Only name and link are required** — Server rejects problems missing `name` or `link`, but accepts missing/empty `topics` and `difficulty`.
14. **Sanitize imported content** — Strip HTML tags from all imported string fields to prevent stored XSS.
15. **Import rate limiting** — 5 imports per 15 minutes per user to prevent abuse of the heavy write operation.

## Definition of done

### Backend
- [ ] `POST /api/v1/sheets/import` with a valid JSON payload creates a sheet and its problems in MongoDB (atomically via transaction)
- [ ] The endpoint returns `{ success: true, data: { sheet: { id, name, description, problemCount, createdAt } } }`
- [ ] The endpoint returns 400 with aggregated row-level errors for invalid payloads (missing name/link, invalid URL, etc.)
- [ ] The endpoint accepts problems with empty/missing `topics` and `difficulty`
- [ ] The endpoint rejects payloads with more than 500 problems
- [ ] The endpoint requires authentication (returns 401 without valid access token)
- [ ] The endpoint rate-limits to 5 imports per 15 minutes per user
- [ ] HTML tags are stripped from all imported string fields (XSS prevention)
- [ ] The `topics` field is stored as an array of lowercased, trimmed strings
- [ ] `GET /api/v1/sheets` returns all sheets for the authenticated user sorted by most recent
- [ ] Each sheet in the list includes `id`, `name`, `description`, `problemCount`, `createdAt`

### Frontend — Import Modal
- [ ] Dashboard shows an "Import Sheet" button that opens the import modal
- [ ] **Step 1 (Upload):** Drag-and-drop zone accepts `.csv` and `.json` files
- [ ] Files over 1 MB are rejected with a clear error before reading
- [ ] CSV files are parsed with PapaParse (handles quoted fields, commas in cells, BOM)
- [ ] JSON files are parsed and the array of objects is auto-detected
- [ ] **Step 2 (Map):** File's column names shown with dropdown mappers
- [ ] Auto-detection pre-fills likely column mappings
- [ ] "Name" and "Link" must each be mapped exactly once — "Next" disabled until both are mapped
- [ ] Each Trace field can only be mapped to one column (no duplicates)
- [ ] "Topics" and "Difficulty" can be set to "Skip"
- [ ] **Step 3 (Preview):** Preview table shows mapped problems with total count
- [ ] User can set a sheet name (required) and description (optional)
- [ ] CSV cells with comma-separated topics are correctly split into arrays
- [ ] Clicking "Import" shows a loading state and sends data to the backend
- [ ] On success: modal closes, toast appears, sheet list refreshes
- [ ] On error: toast shows error, modal stays open for correction

### Frontend — Dashboard
- [ ] Dashboard displays sheet cards when sheets exist (replaces "No sheets yet" empty state)
- [ ] Each sheet card shows: name, problem count, creation date
- [ ] UI is responsive, dark-themed, and visually consistent with existing design
- [ ] Import modal has smooth step transitions and open/close animations
- [ ] File dropzone shows visual feedback on drag hover
