# Implementation Plan: F2 — Auth (Google Sign-In via Firebase)

## Overview

This plan covers both **F1 (Project Scaffolding)** and **F2 (Auth)** since the project has no code yet. The build is organized in 4 phases: backend scaffolding → backend auth → frontend scaffolding → frontend auth. Each phase lists exact files, their contents, and the build order.

---

## Phase 1 — Root + Backend Scaffolding

Set up the Express server, MongoDB connection, and project infrastructure.

---

### Root

#### [NEW] [.gitignore](file:///home/piyush/Documents/Trace/.gitignore)

Standard Node.js gitignore. Ignore `node_modules/`, `.env`, `.next/`, `dist/`, `*.log`.

#### [NEW] [README.md](file:///home/piyush/Documents/Trace/README.md)

Brief project description, tech stack, and how to run (`npm run dev` in each folder).

---

### Backend Config & Entry

#### [NEW] [package.json](file:///home/piyush/Documents/Trace/server/package.json)

```json
{
  "name": "trace-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

Dependencies: `express`, `mongoose`, `firebase-admin`, `jsonwebtoken`, `cookie-parser`, `cors`, `dotenv`, `morgan`, `helmet`, `express-rate-limit`, `express-mongo-sanitize`.
Dev: `nodemon`.

#### [NEW] [.env](file:///home/piyush/Documents/Trace/server/.env)

All required keys with empty values:

```
PORT=
NODE_ENV=
MONGODB_URI=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CLIENT_URL=
```

#### [NEW] [.env.example](file:///home/piyush/Documents/Trace/server/.env.example)

Same keys as `.env` with descriptive comments for each.

#### [NEW] [.gitignore](file:///home/piyush/Documents/Trace/server/.gitignore)

Ignore `node_modules/`, `.env`.

#### [NEW] [server.js](file:///home/piyush/Documents/Trace/server/server.js)

Entry point:
- Load `dotenv`
- Import `env.js` config (validates env vars — exits if missing)
- Import `db.js`, call `connectDB()`
- Import `app.js`, start listening on `PORT`
- Graceful shutdown handler: on `SIGTERM` / `SIGINT` → close server, disconnect Mongoose, `process.exit(0)`

#### [NEW] [src/app.js](file:///home/piyush/Documents/Trace/server/src/app.js)

Express app setup:
- `helmet()` — security headers
- `cors({ origin: CLIENT_URL, credentials: true })` — whitelist frontend
- `express.json({ limit: '10kb' })` — body parser with size limit
- `cookie-parser()` — parse cookies
- `mongoSanitize()` — prevent NoSQL injection
- `morgan('dev')` — request logging in development
- Mount routes: `/api/v1/health`, `/api/v1/auth`
- 404 handler for unknown routes
- Global error middleware (last)

#### [NEW] [src/config/db.js](file:///home/piyush/Documents/Trace/server/src/config/db.js)

`connectDB()` — connects to MongoDB using `MONGODB_URI`. Logs success. On error, logs and exits process.

#### [NEW] [src/config/env.js](file:///home/piyush/Documents/Trace/server/src/config/env.js)

Centralized config object:
- Reads all env vars
- Validates required vars are present at import time
- Exports a frozen config object: `{ port, nodeEnv, mongodbUri, accessTokenSecret, refreshTokenSecret, firebase: { projectId, clientEmail, privateKey }, clientUrl }`

#### [NEW] [src/config/firebase-admin.js](file:///home/piyush/Documents/Trace/server/src/config/firebase-admin.js)

Initialize Firebase Admin SDK with service account credentials from env vars. Export the `admin.auth()` instance for token verification.

#### [NEW] [src/utils/logger.js](file:///home/piyush/Documents/Trace/server/src/utils/logger.js)

Simple structured logger wrapping console:
- `logger.info(message, meta?)` — prefixed with timestamp + `[INFO]`
- `logger.error(message, meta?)` — prefixed with timestamp + `[ERROR]`
- `logger.warn(message, meta?)` — prefixed with timestamp + `[WARN]`

---

## Phase 2 — Backend Auth Logic

Build models, utilities, middleware, controllers, and routes for authentication.

---

### Models

#### [NEW] [src/models/user.model.js](file:///home/piyush/Documents/Trace/server/src/models/user.model.js)

Mongoose schema for `User`:

```js
{
  firebaseUid: { type: String, required: true, unique: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  avatar:      { type: String, default: '' },
  lastLoginAt: { type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true }
}
// timestamps: true
```

#### [NEW] [src/models/refresh-token.model.js](file:///home/piyush/Documents/Trace/server/src/models/refresh-token.model.js)

Mongoose schema for `RefreshToken`:

```js
{
  userId:    { type: ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}
// timestamps: true
// TTL index on expiresAt (expireAfterSeconds: 0)
```

---

### Utils

#### [NEW] [src/utils/app-error.js](file:///home/piyush/Documents/Trace/server/src/utils/app-error.js)

Custom `AppError` class extending `Error`:
- Properties: `statusCode`, `status` ('fail' | 'error'), `isOperational`
- Constructor: `new AppError(message, statusCode)`

#### [NEW] [src/utils/token.js](file:///home/piyush/Documents/Trace/server/src/utils/token.js)

Token utility functions:
- `generateAccessToken(userId)` → signs JWT with `ACCESS_TOKEN_SECRET`, expires 15m
- `generateRefreshToken(userId)` → signs JWT with `REFRESH_TOKEN_SECRET`, expires 7d
- `verifyAccessToken(token)` → verifies and returns decoded payload
- `verifyRefreshToken(token)` → verifies and returns decoded payload
- `hashToken(token)` → SHA-256 hash of the raw token string

---

### Middleware

#### [NEW] [src/middleware/error.middleware.js](file:///home/piyush/Documents/Trace/server/src/middleware/error.middleware.js)

Global error handler:
- If `AppError` (operational): return `{ success: false, message }` with correct status code
- If Mongoose `ValidationError`: parse field errors, return 400
- If Mongoose `CastError` (invalid ObjectId): return 400
- If duplicate key (code 11000): return 409
- If unknown error: return 500, hide stack in production, log full error

#### [NEW] [src/middleware/auth.middleware.js](file:///home/piyush/Documents/Trace/server/src/middleware/auth.middleware.js)

`protect` middleware:
- Read `Authorization: Bearer <token>` header
- Verify access token using `verifyAccessToken()`
- Find user by decoded `userId`, check `isActive`
- Attach `req.user` and call `next()`
- On any failure: 401 Unauthorized

#### [NEW] [src/middleware/rate-limit.middleware.js](file:///home/piyush/Documents/Trace/server/src/middleware/rate-limit.middleware.js)

Export `authLimiter`:
- `windowMs: 15 * 60 * 1000` (15 minutes)
- `max: 20`
- Standard JSON error response: `{ success: false, message: "Too many requests..." }`

#### [NEW] [src/middleware/validate.middleware.js](file:///home/piyush/Documents/Trace/server/src/middleware/validate.middleware.js)

Simple validation middleware factory:
- `validate(schema)` — takes an object describing required fields and their types
- Returns middleware that checks `req.body` and returns 400 on validation failure
- Used on the `/auth/google` route to ensure `idToken` is a non-empty string

---

### Controllers

#### [NEW] [src/controllers/health.controller.js](file:///home/piyush/Documents/Trace/server/src/controllers/health.controller.js)

`getHealth(req, res)`:
- Check `mongoose.connection.readyState`
- Return `{ success: true, data: { status: 'ok', db: 'connected' | 'disconnected', timestamp } }`

#### [NEW] [src/controllers/auth.controller.js](file:///home/piyush/Documents/Trace/server/src/controllers/auth.controller.js)

**`googleAuth(req, res, next)`**
1. Extract `idToken` from `req.body`
2. Verify with Firebase Admin: `admin.auth().verifyIdToken(idToken)`
3. Extract `uid`, `email`, `name`, `picture` from decoded token
4. `findOneAndUpdate` user by `firebaseUid` (upsert: true) — creates on first login, updates `lastLoginAt` on return
5. Generate access token + refresh token
6. Hash refresh token → store in `refreshTokens` collection
7. Set refresh token as HTTP-only cookie (`refreshToken`, httpOnly, secure in prod, sameSite: 'lax', maxAge: 7d, path: '/api/v1/auth')
8. Return `{ success: true, data: { user: { id, name, email, avatar }, accessToken } }`

**`refresh(req, res, next)`**
1. Read `refreshToken` cookie from `req.cookies`
2. Verify token with `verifyRefreshToken()`
3. Hash the token → find matching document in `refreshTokens` collection
4. If not found → 401 (token revoked or already rotated)
5. Delete the old token hash from DB
6. Generate new access token + new refresh token
7. Hash new refresh → store in DB
8. Set new refresh cookie
9. Return `{ success: true, data: { accessToken } }`

**`logout(req, res, next)`**
1. Read `refreshToken` cookie
2. If present: hash it → delete from `refreshTokens` collection
3. Clear the cookie
4. Return `{ success: true, data: { message: 'Logged out' } }`

**`logoutAll(req, res, next)`** (protected)
1. Delete all documents in `refreshTokens` where `userId === req.user._id`
2. Clear the cookie
3. Return `{ success: true, data: { message: 'Logged out from all devices' } }`

**`getMe(req, res)`** (protected)
1. Return `{ success: true, data: { user: req.user } }`

---

### Routes

#### [NEW] [src/routes/health.routes.js](file:///home/piyush/Documents/Trace/server/src/routes/health.routes.js)

```
GET / → healthController.getHealth
```

#### [NEW] [src/routes/auth.routes.js](file:///home/piyush/Documents/Trace/server/src/routes/auth.routes.js)

```
POST /google     → [authLimiter, validate(googleSchema)] → authController.googleAuth
POST /refresh    → authController.refresh
POST /logout     → authController.logout
POST /logout-all → [protect] → authController.logoutAll
GET  /me         → [protect] → authController.getMe
```

---

## Phase 3 — Frontend Scaffolding

Set up the Next.js project with TypeScript, Tailwind, and core infrastructure.

---

### Project Init

#### Create Next.js app

Run `npx -y create-next-app@latest ./` inside `client/` with flags:
- `--typescript`
- `--tailwind`
- `--eslint`
- `--app` (App Router)
- `--src-dir`
- `--import-alias "@/*"`

This auto-generates: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, and more.

#### [NEW] [.env](file:///home/piyush/Documents/Trace/client/.env)

All keys with empty values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=
```

#### [NEW] [.env.example](file:///home/piyush/Documents/Trace/client/.env.example)

Same keys with comments.

---

### Config Overrides

#### [MODIFY] [next.config.ts](file:///home/piyush/Documents/Trace/client/next.config.ts)

Add API proxy rewrite so `/api/v1/*` requests go to the Express backend in development:

```ts
async rewrites() {
  return [
    {
      source: '/api/v1/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
    },
  ];
}
```

#### [MODIFY] [tailwind.config.ts](file:///home/piyush/Documents/Trace/client/tailwind.config.ts)

Extend the default config:
- Custom color palette (dark theme: slate/zinc-based neutrals, an accent like indigo/violet)
- Custom font family: `Inter` via Google Fonts
- Add `animation` and `keyframes` for micro-animations (fade-in, slide-up, pulse-glow)

#### [MODIFY] [src/app/globals.css](file:///home/piyush/Documents/Trace/client/src/app/globals.css)

- Tailwind directives (`@tailwind base/components/utilities`)
- Import Inter font via `@import url()` from Google Fonts
- Set default dark background on `html`/`body`
- Custom scrollbar styles
- Utility classes for glassmorphism (backdrop-blur + semi-transparent bg)

---

## Phase 4 — Frontend Auth

Build the auth UI layer: types, lib, components, context, pages.

---

### Types

#### [NEW] [src/types/auth.ts](file:///home/piyush/Documents/Trace/client/src/types/auth.ts)

```ts
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

#### [NEW] [src/types/api.ts](file:///home/piyush/Documents/Trace/client/src/types/api.ts)

```ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}
```

---

### Lib

#### [NEW] [src/lib/firebase.ts](file:///home/piyush/Documents/Trace/client/src/lib/firebase.ts)

- Initialize Firebase app with env config (singleton pattern — check `getApps().length`)
- Create `GoogleAuthProvider`
- Export `signInWithPopup` helper that returns the Firebase ID token
- Export `firebaseSignOut` helper

#### [NEW] [src/lib/api.ts](file:///home/piyush/Documents/Trace/client/src/lib/api.ts)

Axios instance:
- `baseURL: '/api/v1'` (proxied by Next.js)
- `withCredentials: true` (send cookies)
- Request interceptor: attach `Authorization: Bearer <accessToken>` from in-memory variable
- Response interceptor (401 handling):
  - If 401 and not already retrying → call `/auth/refresh` → store new access token → retry original request
  - If refresh also fails → clear auth state, redirect to `/login`
  - Use a promise queue to prevent multiple concurrent refresh calls
- Export `setAccessToken(token)` and `getAccessToken()` for the auth context to use

---

### UI Components

#### [NEW] [src/components/ui/button.tsx](file:///home/piyush/Documents/Trace/client/src/components/ui/button.tsx)

Reusable button with:
- Variants: `primary`, `secondary`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- Loading state: shows spinner, disables button
- Full Tailwind styling: rounded, transitions, focus ring, disabled opacity

#### [NEW] [src/components/ui/loading-spinner.tsx](file:///home/piyush/Documents/Trace/client/src/components/ui/loading-spinner.tsx)

SVG spinner with:
- Sizes: `sm`, `md`, `lg`
- Tailwind `animate-spin`
- Accepts className for color customization

#### [NEW] [src/components/ui/toaster.tsx](file:///home/piyush/Documents/Trace/client/src/components/ui/toaster.tsx)

Thin wrapper around `react-hot-toast`'s `<Toaster>`:
- Dark theme preset
- Position: top-right
- Custom styling to match our dark theme

#### [NEW] [src/components/ui/splash-screen.tsx](file:///home/piyush/Documents/Trace/client/src/components/ui/splash-screen.tsx)

Full-screen centered loader:
- Dark background matching the app
- App logo/name "Trace" with subtle animation
- Loading spinner below
- Shown while `AuthContext.isLoading` is true

---

### Layout Components

#### [NEW] [src/components/layout/auth-layout.tsx](file:///home/piyush/Documents/Trace/client/src/components/layout/auth-layout.tsx)

Auth page wrapper:
- Full-screen dark gradient background
- Centered glassmorphism card (backdrop-blur, semi-transparent bg, subtle border)
- App branding at the top of the card
- Slot for children (the sign-in button)
- Responsive: full-width on mobile, constrained on desktop

#### [NEW] [src/components/layout/navbar.tsx](file:///home/piyush/Documents/Trace/client/src/components/layout/navbar.tsx)

Post-login top navigation:
- App name "Trace" on the left
- Right side: user avatar (rounded image), user name, sign-out button
- Sticky top, dark background with subtle border-bottom
- Mobile: avatar + hamburger or compact layout

#### [NEW] [src/components/layout/protected-route.tsx](file:///home/piyush/Documents/Trace/client/src/components/layout/protected-route.tsx)

Auth guard wrapper:
- Uses `useAuth()` hook
- If `isLoading` → render `<SplashScreen />`
- If `!isAuthenticated` → redirect to `/login`
- If authenticated → render children

---

### Feature Components

#### [NEW] [src/components/features/auth/google-sign-in-button.tsx](file:///home/piyush/Documents/Trace/client/src/components/features/auth/google-sign-in-button.tsx)

Google sign-in button:
- Google "G" logo SVG icon on the left
- Text: "Continue with Google"
- Uses the `Button` primitive with custom styling
- On click: calls `signInWithGoogle()` from auth context
- Loading state while auth is in progress
- Hover effect with subtle glow/lift animation

---

### Auth Context & Hook

#### [NEW] [src/contexts/auth-context.tsx](file:///home/piyush/Documents/Trace/client/src/contexts/auth-context.tsx)

`AuthProvider` component:
- State: `user`, `isLoading` (starts `true`), `accessToken` (ref)
- On mount: call `POST /auth/refresh` to restore session → if success, set user + access token → set `isLoading = false`
- `signInWithGoogle()`:
  1. Call Firebase `signInWithPopup` → get ID token
  2. `POST /auth/google` with `{ idToken }` → receive `{ user, accessToken }`
  3. Store access token via `setAccessToken()`, set user state
  4. Show success toast
- `signOut()`:
  1. `POST /auth/logout`
  2. Call Firebase `signOut()`
  3. Clear access token, clear user state
  4. Show toast, redirect to `/login`
- Wrap children with `AuthContext.Provider`

#### [NEW] [src/hooks/use-auth.ts](file:///home/piyush/Documents/Trace/client/src/hooks/use-auth.ts)

```ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

### Pages

#### [MODIFY] [src/app/layout.tsx](file:///home/piyush/Documents/Trace/client/src/app/layout.tsx)

Root layout:
- Set Inter font via `next/font/google`
- Set metadata (title: "Trace — DSA Progress Tracker", description)
- Wrap children with `<AuthProvider>`
- Include `<Toaster />`
- Dark class on `<html>`

#### [MODIFY] [src/app/page.tsx](file:///home/piyush/Documents/Trace/client/src/app/page.tsx)

Root page:
- If authenticated → redirect to `/dashboard`
- If not → redirect to `/login`
- Show splash screen during check

#### [NEW] [src/app/(auth)/layout.tsx](file:///home/piyush/Documents/Trace/client/src/app/(auth)/layout.tsx)

Auth group layout:
- If user is already authenticated → redirect to `/dashboard`
- Otherwise → render children inside `<AuthLayout>`

#### [NEW] [src/app/(auth)/login/page.tsx](file:///home/piyush/Documents/Trace/client/src/app/(auth)/login/page.tsx)

Login page:
- Heading: "Welcome to Trace" with subtitle
- `<GoogleSignInButton />`
- Brief description text below
- All content is inside the glassmorphism card from `AuthLayout`

#### [NEW] [src/app/dashboard/layout.tsx](file:///home/piyush/Documents/Trace/client/src/app/dashboard/layout.tsx)

Dashboard layout:
- Wrap with `<ProtectedRoute>`
- Include `<Navbar>`
- Render children below navbar

#### [NEW] [src/app/dashboard/page.tsx](file:///home/piyush/Documents/Trace/client/src/app/dashboard/page.tsx)

Placeholder dashboard:
- Welcome message with user's name
- "You're logged in!" confirmation
- Placeholder for future sheet management UI

---

## Build Order

Execute in this exact sequence:

```
1.  Root .gitignore + README.md
2.  server/package.json → npm install
3.  server/.env + .env.example + .gitignore
4.  server/src/utils/logger.js
5.  server/src/utils/app-error.js
6.  server/src/config/env.js
7.  server/src/config/db.js
8.  server/src/config/firebase-admin.js
9.  server/src/models/user.model.js
10. server/src/models/refresh-token.model.js
11. server/src/utils/token.js
12. server/src/middleware/error.middleware.js
13. server/src/middleware/auth.middleware.js
14. server/src/middleware/rate-limit.middleware.js
15. server/src/middleware/validate.middleware.js
16. server/src/controllers/health.controller.js
17. server/src/controllers/auth.controller.js
18. server/src/routes/health.routes.js
19. server/src/routes/auth.routes.js
20. server/src/app.js
21. server/server.js
22. ── Verify: npm run dev in server/ ──
23. client/ → npx create-next-app
24. client/.env + .env.example
25. Install: axios, firebase, react-hot-toast
26. Modify: tailwind.config.ts, globals.css, next.config.ts
27. client/src/types/auth.ts + api.ts
28. client/src/lib/firebase.ts
29. client/src/lib/api.ts
30. client/src/components/ui/* (button, spinner, toaster, splash)
31. client/src/components/layout/* (auth-layout, navbar, protected-route)
32. client/src/components/features/auth/google-sign-in-button.tsx
33. client/src/contexts/auth-context.tsx
34. client/src/hooks/use-auth.ts
35. client/src/app/layout.tsx (modify)
36. client/src/app/page.tsx (modify)
37. client/src/app/(auth)/layout.tsx + login/page.tsx
38. client/src/app/dashboard/layout.tsx + page.tsx
39. ── Verify: npm run dev in client/ ──
```

## Verification Plan

### Automated Tests

1. **Backend health:** `curl http://localhost:<PORT>/api/v1/health` → `{ success: true, data: { status: 'ok', db: 'connected' } }`
2. **Auth endpoints:** Test via curl or browser DevTools:
   - `POST /api/v1/auth/google` with a valid Firebase ID token
   - `GET /api/v1/auth/me` with the returned access token
   - `POST /api/v1/auth/refresh` (cookie should be set)
   - `POST /api/v1/auth/logout`
3. **Frontend build:** `npm run build` in `client/` completes without errors

### Manual Verification

1. Open `http://localhost:3000` → should redirect to `/login`
2. Click "Continue with Google" → Google popup opens
3. Sign in → redirect to `/dashboard`, toast shows success
4. Refresh page → still on `/dashboard` (session persists)
5. Click sign out → redirect to `/login`, toast shows
6. Navigate to `/dashboard` directly → redirect to `/login`
7. Check mobile responsiveness
8. Verify dark theme + glassmorphism card rendering
