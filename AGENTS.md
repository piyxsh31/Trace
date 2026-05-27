# Trace — DSA Progress Tracker

## Project Overview
Trace is a web app that eliminates the friction of tracking DSA (Data Structures & Algorithms) practice. Instead of juggling spreadsheets and browser tabs, users import their DSA sheets, track progress, and get visual analytics — all in one place.

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Language   | TypeScript (frontend), JavaScript (backend) |
| Frontend   | Next.js (React)         |
| Styling    | Tailwind CSS            |
| Backend    | Node.js + Express       |
| Database   | MongoDB Atlas           |
| ODM        | Mongoose                |
| Auth       | Firebase (Google Sign-In) + JWT |

## Project Structure

```
Trace/
├── client/                    # Next.js frontend (TypeScript)
│   ├── src/
│   │   ├── app/               # Next.js App Router (pages & layouts)
│   │   │   ├── (auth)/        # Auth route group
│   │   │   │   ├── layout.tsx # Redirects authenticated users to dashboard
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx # Protected; includes Navbar
│   │   │   │   └── page.tsx   # Sheet grid + Import Sheet modal
│   │   │   ├── layout.tsx     # Root layout (AuthProvider, Toaster, Inter font)
│   │   │   ├── page.tsx       # Redirects to /login or /dashboard
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── loading-spinner.tsx
│   │   │   │   ├── splash-screen.tsx
│   │   │   │   └── toaster.tsx
│   │   │   ├── layout/
│   │   │   │   ├── auth-layout.tsx
│   │   │   │   ├── navbar.tsx
│   │   │   │   └── protected-route.tsx
│   │   │   └── features/
│   │   │       ├── auth/
│   │   │       │   └── google-sign-in-button.tsx
│   │   │       └── sheets/
│   │   │           ├── file-dropzone.tsx        # Drag-and-drop upload zone
│   │   │           ├── column-mapper.tsx        # Column → Trace field mapping UI
│   │   │           ├── import-preview-table.tsx # Problems preview before import
│   │   │           ├── import-sheet-modal.tsx   # 3-step import wizard (portal)
│   │   │           └── sheet-card.tsx           # Sheet summary card
│   │   ├── contexts/
│   │   │   └── auth-context.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   └── use-sheets.ts  # Sheet list state + optimistic addSheet
│   │   ├── lib/
│   │   │   ├── api.ts         # Axios instance with auto-refresh
│   │   │   ├── file-parser.ts # PapaParse CSV/JSON parsing + column mapping
│   │   │   └── firebase.ts    # Firebase client SDK (lazy, client-only)
│   │   └── types/
│   │       ├── auth.ts
│   │       ├── api.ts
│   │       └── sheet.ts       # Sheet, Problem, ColumnMapping, ImportStep types
│   └── public/
│
├── server/                    # Express backend (JavaScript, MVC)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── env.js
│   │   │   └── firebase-admin.js
│   │   ├── controllers/
│   │   │   ├── analytics.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── problem.controller.js
│   │   │   └── sheet.controller.js  # importSheet + getSheets
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── rate-limit.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── models/
│   │   │   ├── refresh-token.model.js
│   │   │   ├── user.model.js
│   │   │   ├── sheet.model.js   # sheets collection
│   │   │   └── problem.model.js # problems collection
│   │   ├── routes/
│   │   │   ├── analytics.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── health.routes.js
│   │   │   ├── problem.routes.js
│   │   │   └── sheet.routes.js  # POST /import, GET /
│   │   ├── utils/
│   │   │   ├── app-error.js       # Extended: optional errors[] array
│   │   │   ├── import-validator.js # Import payload validation + sanitization
│   │   │   ├── logger.js
│   │   │   └── token.js
│   │   └── app.js
│   ├── server.js
│   ├── .env                   # Never committed
│   └── .env.example
│
├── .agent/
│   ├── specs/
│   │   ├── auth.md
│   │   └── import-sheet.md
│   └── plans/
│       ├── auth.md
│       └── import-sheet.md
│
├── .gitignore
├── AGENTS.md
└── README.md
```

## Features (Build Order)

Features will be built incrementally, one at a time:

- [x] **F1: Project Scaffolding** — Initialize Next.js frontend + Express backend + MongoDB connection
- [x] **F2: Auth (Signup/Login)** — Google Sign-In via Firebase + JWT session management
- [x] **F3: Import Sheet** — Upload CSV/JSON DSA sheets and parse into problems
- [x] **F4: Multiple Sheets** — Create, switch between, and manage multiple DSA sheets
- [x] **F5: Progress Tracking** — Mark problems as solved/attempted/unsolved per sheet
- [x] **F6: Filter & Search** — Filter problems by topic and difficulty
- [x] **F7: Notes** — Add/edit notes on individual problems
- [x] **F8: Delete Sheet** — Permanently delete a sheet and its problems from the dashboard
- [x] **F9: Heatmap** — GitHub-style activity heatmap showing daily solve count
- [x] **F10: Analytics Dashboard** — Charts for topic distribution, difficulty breakdown, progress over time
- [x] **F11: Search Sheet** — Search bar on dashboard to filter sheets by name

## Coding Conventions

### Language
- **Frontend: TypeScript** — strict mode, `.ts` / `.tsx` extensions, no `any` unless absolutely necessary
- **Backend: JavaScript** — `.js` extensions, use JSDoc comments for type hints where helpful

### Frontend
- React functional components with hooks only (no class components)
- **Tailwind CSS** for all styling — utility-first, use `@apply` sparingly
- **Component-based architecture** — every UI element is a reusable, self-contained component
  - `ui/` — generic primitives (Button, Input, Modal, Card, Badge, etc.)
  - `layout/` — structural components (Navbar, Sidebar, PageWrapper, etc.)
  - `features/` — domain-specific components (SheetCard, ProblemRow, HeatmapGrid, etc.)
- Props are typed with explicit TypeScript interfaces
- Keep components small and focused — if it's doing too much, split it

### Backend (MVC)
- **Models** — Mongoose schemas & models
- **Controllers** — Business logic, receives req/res, calls models, returns responses
- **Routes** — Thin route definitions that map HTTP methods to controllers
- **Middleware** — Auth guards, input validation, error handling
- Clear separation: routes → controllers → models (no business logic in routes)

### API Design
- **Pattern**: `/api/v1/<resource>` — versioned REST endpoints
- **Success response**: `{ success: true, data: { ... } }`
- **Error response**: `{ success: false, message: "..." }`

### Error Handling
- **Backend**: Global error-handling middleware, custom `AppError` class with status codes, try-catch in all async controllers
- **Frontend**: API errors caught and displayed via toast/notification UI, loading & error states for every async operation
- No silent failures — every error is logged and surfaced to the user gracefully

### UI/UX Standards
- **Premium look & feel** — dark mode, smooth transitions, micro-animations
- **Responsive design** — mobile-first, works on all screen sizes
- **Loading states** — skeleton loaders or spinners for all async operations
- **Empty states** — meaningful illustrations/messages when no data exists
- **Consistent spacing & typography** — use Tailwind's design system tokens
- **Accessible** — proper semantic HTML, focus states, contrast ratios

### General
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for filenames
- **Environment**: `.env` files for secrets (never committed), `.env.example` for templates

## Development Workflow

Every feature follows this strict process — no code is written until the spec and plan are both approved. **`AGENTS.md` must be updated at every step** to always reflect the true state of the project.

### Step 1 — User Describes the Feature
The user provides the exact requirements for the feature to build.

### Step 2 — Research & Write Spec
Antigravity researches the codebase, reads `AGENTS.md` and all existing specs/plans, then writes a spec document following the template below.

**Save to:** `.agent/specs/<feature-name>.md`
**Update `AGENTS.md`:** Set `Active Feature` in Current Status.

### Step 3 — User Reviews Spec
The user reviews the spec and requests changes if needed. Iterate until approved.

### Step 4 — Write Implementation Plan
Based on the approved spec, create a detailed implementation plan with exact file changes, code structure, and build order.

**Save to:** `.agent/plans/<feature-name>.md`

### Step 5 — User Reviews Plan
The user reviews the plan and requests changes if needed. Iterate until approved.

### Step 6 — Implement
Build the feature according to the approved plan.

**Update `AGENTS.md` during implementation:**
- Mark the feature checkbox `[x]` when complete
- Update `Active Feature` in Current Status
- Add any new conventions or patterns that emerged
- Update Project Structure if new directories/files were added

### Step 7 — Post-Completion
After the feature is fully implemented and verified:
- Set `Active Feature` to the next planned feature or "None"
- Ensure all new files/directories are reflected in Project Structure
- Update Tech Stack if any new technology was introduced

---

### Spec Document Template

Every spec document must follow this structure:

```markdown
# Feature: <Feature Name>

## Overview
One paragraph describing what this feature does and why
it exists at this stage of the Trace roadmap.

## Depends on
Which previous features/steps this feature requires to be complete.

## Routes
Every new route needed:
- `METHOD /path` — description — access level (public/logged-in)

If no new routes: state "No new routes".

## Database changes
Any new collections, fields, indexes, or constraints needed.
Always verify against existing database schemas before writing this.
If none: state "No database changes".

## UI Components
- **Create:** list new components with their path and purpose
- **Modify:** list existing components and what changes

## Files to change
Every file that will be modified.

## Files to create
Every new file that will be created.

## New dependencies
Any new packages. If none: state "No new dependencies".

## Rules for implementation
Specific constraints Antigravity must follow.

## Definition of done
A specific testable checklist. Each item must be
something that can be verified by running the app.
```

---

## Current Status

**Active Feature:** None (Roadmap Complete)

### Patterns Established in F9 & F10 (Analytics)

#### Frontend
- **Recharts Integration** — Data visualizations use `recharts` for responsive, animated SVG charts.
- **Dedicated Hooks** — `useAnalytics` wraps Axios fetching for isolated data domains, keeping components thin.

#### Backend
- **MongoDB `$facet` Aggregations** — Complex multi-dimensional dashboard queries are processed in a single aggregation pipeline using `$facet` to maximize performance and avoid heavy memory usage in Node.js.

#### Frontend
- **Confirmation Modals** — Destructive actions use `createPortal` modals with red-tinted confirm buttons and body scroll locking.
- **Event Propagation** — Actions on items wrapped in `<Link>` use `e.preventDefault(); e.stopPropagation()` to handle the action without triggering navigation.

#### Backend
- **Transaction Deletions** — Multi-collection deletes (Sheet + Problems) are wrapped in a MongoDB transaction, similar to creation.

### Patterns Established in F1/F2

#### Frontend
- **Firebase is lazy/client-only** — `firebase.ts` uses dynamic `require()` behind a `typeof window` guard to prevent SSR errors
- **In-memory access token** — stored via `setAccessToken()` in `api.ts`, never in localStorage
- **Session restore on mount** — `AuthProvider` calls `POST /auth/refresh` on mount to silently restore sessions from the HTTP-only cookie
- **Tailwind v4** — uses `@theme inline {}` and `@import "tailwindcss"` (not `@tailwind` directives)
- **CSS `@import` order** — `@import url()` must come before `@import "tailwindcss"` in globals.css
- **Glassmorphism** — use `.glass` and `.glass-card` utility classes defined in globals.css

#### Backend
- **Refresh token rotation** — each `/auth/refresh` deletes the old token hash and stores a new one
- **Token hashing** — raw refresh tokens are never stored; only SHA-256 hashes are stored in MongoDB
- **TTL index** — `RefreshToken` collection auto-expires via MongoDB TTL index on `expiresAt`
- **Cookie path** — refresh token cookie is scoped to `/api/v1/auth` (not global)

### Patterns Established in F4-F7 (Practice Feature)

#### Frontend
- **Zero Dependencies** — preferred native CSS transitions, native `setInterval` timers, and native `Math.random` confetti over external libraries.
- **`useSheet` Hook** — mirrors `useSheets` pattern with native optimistic UI updates for problem status.
- **Keyboard Navigation** — native `keydown` listeners attached in a `useEffect` for interactive modes.
- **Debounced Inputs** — notes autosave uses a simple `useRef` and `setTimeout` (1s debounce) inside the component, instead of lodash.

#### Backend
- **Custom Validators** — `problem-validator.js` mirrors `import-validator.js`, returning `{ isValid, sanitized, errors }` using vanilla JS (no Zod/Joi).

### Patterns Established in F3

#### Frontend
- **`useReducer` for wizard state** — multi-step forms with 5+ interrelated fields use `useReducer` + typed action unions for predictable transitions
- **`createPortal` for modals** — modal components render into `document.body` via `react-dom`'s `createPortal` to avoid z-index stacking context issues
- **Body scroll lock** — modals set `document.body.style.overflow = 'hidden'` on open and restore it on close
- **Optimistic updates** — after a successful write, new items are prepended to local state immediately; no refetch
- **Custom hooks for data** — `useSheets` encapsulates fetch + state + optimistic update; pages stay thin
- **`.lean()` on read queries** — all read-only Mongoose queries use `.lean()` for plain objects (2-5× faster)
- **`_id` → `id` normalization** — done at the controller level so the frontend always receives `id` (not `_id`)
- **PapaParse for CSV** — all CSV parsing uses PapaParse; never manual `split()` logic
- **Skeleton loaders** — async list data shows skeleton card placeholders while loading, not a spinner

#### Backend
- **Extracted validation utilities** — complex payload validation lives in `utils/import-validator.js`, not in controllers
- **Aggregated errors** — validation collects all row-level errors (up to 20) before returning, so users can fix in one pass
- **`AppError.errors[]`** — `AppError` accepts an optional `errors` array for row-level validation; the error middleware surfaces it in the response
- **MongoDB transactions** — multi-collection writes (Sheet + Problems) are wrapped in a session transaction for atomicity
- **`importLimiter` keyed by user ID** — rate limiters behind `protect` use `req.user._id` as the key, not IP
- **`ordered: false` bulk insert** — `insertMany` with `ordered: false` continues on individual failures and improves throughput
