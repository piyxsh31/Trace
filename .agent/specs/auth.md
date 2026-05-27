# Feature: F2 — Auth (Google Sign-In via Firebase)

## Overview

Auth is the foundational user-identity layer for Trace. It uses **Firebase Authentication** with **Google Sign-In** as the sole auth method. Users click "Sign in with Google," Firebase handles the OAuth flow, and the backend verifies the Firebase ID token to create or find the user in MongoDB.

The backend issues its own JWT access + refresh tokens. Refresh tokens are **stored as hashes in the database** to support secure revocation (logout from all devices, token rotation). Every refresh request rotates the token — the old one is invalidated and a new one is issued — preventing replay attacks.

## Depends on

- **F1: Project Scaffolding** — Next.js frontend, Express backend, and MongoDB connection must exist. Since scaffolding is not yet done, this implementation will create the scaffolding as part of the build.

## Routes

| Method | Path                       | Description                                                        | Access    |
|--------|----------------------------|--------------------------------------------------------------------|-----------|
| GET    | `/api/v1/health`           | Health check — returns server + DB status                          | Public    |
| POST   | `/api/v1/auth/google`      | Receive Firebase ID token, verify, create/find user, return JWTs   | Public    |
| POST   | `/api/v1/auth/logout`      | Revoke current refresh token, clear cookie                         | Public    |
| POST   | `/api/v1/auth/logout-all`  | Revoke ALL refresh tokens for the user (sign out everywhere)       | Protected |
| POST   | `/api/v1/auth/refresh`     | Rotate refresh token, issue new access token                       | Public    |
| GET    | `/api/v1/auth/me`          | Get current authenticated user                                     | Protected |

## Database changes

### New collection: `users`

| Field         | Type     | Constraints                                |
|---------------|----------|--------------------------------------------|
| `_id`         | ObjectId | Auto-generated                             |
| `firebaseUid` | String  | Required, unique (from Firebase)           |
| `name`        | String   | Required, trim                             |
| `email`       | String   | Required, unique, lowercase                |
| `avatar`      | String   | Google profile photo URL (default: empty)  |
| `lastLoginAt` | Date     | Updated on every successful auth           |
| `isActive`    | Boolean  | Default: true, for future account deactivation |
| `createdAt`   | Date     | Auto (timestamps: true)                    |
| `updatedAt`   | Date     | Auto (timestamps: true)                    |

**Indexes:** Unique index on `firebaseUid`, unique index on `email`.

### New collection: `refreshTokens`

Storing refresh tokens separately (instead of on the user document) allows efficient revocation and avoids unbounded array growth.

| Field         | Type     | Constraints                                |
|---------------|----------|--------------------------------------------|
| `_id`         | ObjectId | Auto-generated                             |
| `userId`      | ObjectId | Required, ref → `users`                    |
| `tokenHash`   | String   | Required (SHA-256 hash of the token)       |
| `expiresAt`   | Date     | Required, TTL index for auto-cleanup       |
| `createdAt`   | Date     | Auto (timestamps: true)                    |

**Indexes:** Index on `userId`. TTL index on `expiresAt` (MongoDB auto-deletes expired docs).

## UI Components

### Create

| Component            | Path                                                             | Purpose                                              |
|----------------------|------------------------------------------------------------------|------------------------------------------------------|
| `AuthLayout`         | `client/src/components/layout/auth-layout.tsx`                   | Shared layout wrapper for the auth page              |
| `GoogleSignInButton` | `client/src/components/features/auth/google-sign-in-button.tsx`  | "Sign in with Google" button with loading state      |
| `Button`             | `client/src/components/ui/button.tsx`                            | Reusable button primitive (variants, sizes, loading) |
| `Toaster`            | `client/src/components/ui/toaster.tsx`                           | Toast notification container                         |
| `LoadingSpinner`     | `client/src/components/ui/loading-spinner.tsx`                   | Spinner component for async states                   |
| `SplashScreen`       | `client/src/components/ui/splash-screen.tsx`                     | Full-screen loader while auth state is resolving     |
| `Navbar`             | `client/src/components/layout/navbar.tsx`                        | Top nav with user avatar + sign out (post-login)     |
| `ProtectedRoute`     | `client/src/components/layout/protected-route.tsx`               | Wrapper that redirects unauthenticated users to /login |

### Modify

None — this is the first feature with UI.

## Files to create

### Backend (`server/`)

| File                                          | Purpose                                         |
|-----------------------------------------------|--------------------------------------------------|
| `server/package.json`                         | Dependencies + `"dev": "nodemon server.js"` script |
| `server/.env`                                 | Environment variables (keys with empty values)   |
| `server/.env.example`                         | Template for env variables                       |
| `server/.gitignore`                           | Ignore node_modules, .env, etc.                  |
| `server/server.js`                            | Entry point — starts Express, graceful shutdown  |
| `server/src/app.js`                           | Express app setup (middleware, routes)            |
| `server/src/config/db.js`                     | MongoDB connection via Mongoose                  |
| `server/src/config/env.js`                    | Centralized env variable access with validation  |
| `server/src/config/firebase-admin.js`         | Firebase Admin SDK initialization                |
| `server/src/models/user.model.js`             | User Mongoose schema & model                     |
| `server/src/models/refresh-token.model.js`    | RefreshToken Mongoose schema & model             |
| `server/src/controllers/auth.controller.js`   | google, logout, logoutAll, refresh, me handlers  |
| `server/src/controllers/health.controller.js` | Health check handler                             |
| `server/src/routes/auth.routes.js`            | Auth route definitions                           |
| `server/src/routes/health.routes.js`          | Health check route                               |
| `server/src/middleware/auth.middleware.js`     | JWT verification middleware (`protect`)          |
| `server/src/middleware/error.middleware.js`    | Global error handler                             |
| `server/src/middleware/rate-limit.middleware.js`| Rate limiting for auth endpoints                |
| `server/src/middleware/validate.middleware.js` | Request body validation middleware               |
| `server/src/utils/app-error.js`               | Custom AppError class with status codes          |
| `server/src/utils/token.js`                   | JWT sign/verify + token hashing helpers          |
| `server/src/utils/logger.js`                  | Structured logger (wraps console with levels)    |

### Frontend (`client/`)

| File                                                                  | Purpose                                       |
|-----------------------------------------------------------------------|-----------------------------------------------|
| `client/package.json`                                                 | Dependencies + `"dev": "next dev"` script     |
| `client/.env`                                                         | Environment variables (keys with empty values)|
| `client/.env.example`                                                 | Template for env variables                    |
| `client/.gitignore`                                                   | Ignore node_modules, .next, .env, etc.        |
| `client/tsconfig.json`                                                | TypeScript strict mode + path aliases         |
| `client/next.config.ts`                                               | Next.js config (API proxy to backend)         |
| `client/tailwind.config.ts`                                           | Tailwind CSS config with custom dark theme    |
| `client/postcss.config.mjs`                                           | PostCSS config for Tailwind                   |
| `client/src/app/layout.tsx`                                           | Root layout (providers, font, metadata)       |
| `client/src/app/page.tsx`                                             | Landing / redirect page                       |
| `client/src/app/(auth)/login/page.tsx`                                | Login page (Google sign-in button)            |
| `client/src/app/(auth)/layout.tsx`                                    | Auth group layout (redirects if logged in)    |
| `client/src/app/dashboard/page.tsx`                                   | Placeholder dashboard (protected)             |
| `client/src/app/dashboard/layout.tsx`                                 | Dashboard layout with Navbar (protected)      |
| `client/src/app/globals.css`                                          | Global styles + Tailwind directives           |
| `client/src/lib/api.ts`                                               | Axios instance with silent-refresh interceptor|
| `client/src/lib/firebase.ts`                                          | Firebase client SDK init + Google auth helpers|
| `client/src/hooks/use-auth.ts`                                        | Auth hook (exposes context)                   |
| `client/src/contexts/auth-context.tsx`                                | Auth provider (state, signIn, signOut, refresh)|
| `client/src/types/auth.ts`                                            | Auth-related TypeScript types                 |
| `client/src/types/api.ts`                                             | API response TypeScript types                 |
| `client/src/components/layout/auth-layout.tsx`                        | Auth page layout wrapper                      |
| `client/src/components/layout/navbar.tsx`                              | Post-login navbar with avatar + sign out      |
| `client/src/components/layout/protected-route.tsx`                    | Auth guard wrapper component                  |
| `client/src/components/features/auth/google-sign-in-button.tsx`       | Google sign-in button component               |
| `client/src/components/ui/button.tsx`                                  | Button primitive (variants, sizes, loading)   |
| `client/src/components/ui/toaster.tsx`                                 | Toast notification setup                      |
| `client/src/components/ui/loading-spinner.tsx`                         | Loading spinner component                     |
| `client/src/components/ui/splash-screen.tsx`                           | Full-screen auth loading state                |

### Root

| File             | Purpose                              |
|------------------|--------------------------------------|
| `.gitignore`     | Git ignore rules                     |
| `README.md`      | Project README                       |

## Environment Variables

### `server/.env`

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

### `client/.env`

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=
```

## New dependencies

### Backend

| Package                   | Purpose                                |
|---------------------------|----------------------------------------|
| `express`                 | Web framework                          |
| `mongoose`                | MongoDB ODM                            |
| `firebase-admin`          | Verify Firebase ID tokens server-side  |
| `jsonwebtoken`            | JWT sign & verify                      |
| `cookie-parser`           | Parse HTTP cookies                     |
| `cors`                    | Cross-origin requests                  |
| `dotenv`                  | Environment variables                  |
| `morgan`                  | HTTP request logger (dev)              |
| `helmet`                  | Security headers (XSS, sniffing, etc.) |
| `express-rate-limit`      | Rate limiting for auth endpoints       |
| `express-mongo-sanitize`  | Prevent NoSQL injection attacks        |
| `nodemon` (dev)           | Auto-restart on file changes           |

### Frontend

| Package          | Purpose                       |
|------------------|-------------------------------|
| `next`           | React framework               |
| `react`          | UI library                    |
| `react-dom`      | React DOM renderer            |
| `typescript`     | Type checking                 |
| `tailwindcss`    | Utility-first CSS             |
| `axios`          | HTTP client                   |
| `firebase`       | Firebase client SDK (Auth)    |
| `react-hot-toast`| Toast notifications           |

## Auth Flow

```
 ┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
 │  User    │       │ Firebase │       │ Frontend │       │ Backend  │
 └────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
      │  Click             │                  │                  │
      │  "Sign in"         │                  │                  │
      │───────────────────>│                  │                  │
      │                    │  OAuth Popup     │                  │
      │<──────────────────>│                  │                  │
      │  Consent           │                  │                  │
      │───────────────────>│                  │                  │
      │                    │  ID Token        │                  │
      │                    │─────────────────>│                  │
      │                    │                  │  POST /auth/google
      │                    │                  │  { idToken }     │
      │                    │                  │─────────────────>│
      │                    │                  │                  │── Verify token
      │                    │                  │                  │── Find/create user
      │                    │                  │                  │── Generate JWT pair
      │                    │                  │                  │── Hash & store refresh
      │                    │                  │  { user, access }│
      │                    │                  │  + refresh cookie│
      │                    │                  │<─────────────────│
      │                    │                  │── Store access   │
      │                    │                  │   in memory      │
      │  Redirect to       │                  │                  │
      │  /dashboard        │                  │                  │
      │<──────────────────────────────────────│                  │
      │                    │                  │                  │
```

### Silent refresh (on page reload or token expiry)

```
1. Page loads → AuthContext mounts → calls POST /api/v1/auth/refresh
2. Backend reads refresh cookie → validates → checks hash exists in DB
3. Token rotation: old refresh token hash deleted, new one stored
4. New access token + new refresh cookie returned
5. If refresh fails (expired/revoked) → redirect to /login
```

### Axios interceptor (automatic retry on 401)

```
1. API call returns 401 (access token expired)
2. Interceptor queues the failed request
3. Calls POST /api/v1/auth/refresh to get new access token
4. Retries original request with new token
5. If refresh also fails → sign out and redirect to /login
```

## Security Measures

| Measure                    | Implementation                                          |
|----------------------------|---------------------------------------------------------|
| **Helmet**                 | Sets security headers (X-Content-Type, HSTS, etc.)     |
| **Rate limiting**          | Auth endpoints: 20 requests / 15 min per IP            |
| **NoSQL injection**        | `express-mongo-sanitize` strips `$` and `.` from input |
| **CORS**                   | Whitelist only `CLIENT_URL`, credentials: true          |
| **HTTP-only cookies**      | Refresh token never accessible to JavaScript            |
| **Token rotation**         | Each refresh invalidates the old token                  |
| **Token hashing**          | Refresh tokens stored as SHA-256 hashes, not plaintext  |
| **Graceful shutdown**      | Server closes connections cleanly on SIGTERM/SIGINT     |
| **Env validation**         | Server refuses to start if required env vars are missing|
| **No sensitive data leak** | Error stack traces hidden in production                 |

## Rules for implementation

1. **No manual email/password.** The ONLY auth method is Google Sign-In via Firebase.
2. **No tokens in localStorage.** Access token in memory (React context). Refresh token in HTTP-only, SameSite=Lax cookie.
3. **Refresh token rotation** — Every call to `/auth/refresh` invalidates the old token hash in DB and issues a new one. This prevents replay attacks.
4. **Access token** — expires in 15 minutes. Signed with `ACCESS_TOKEN_SECRET`.
5. **Refresh token** — expires in 7 days. Signed with `REFRESH_TOKEN_SECRET`. Stored as SHA-256 hash in `refreshTokens` collection.
6. **API proxy** — In development, Next.js rewrites `/api/v1/*` to the Express backend so cookies flow on the same origin.
7. **Separate dev commands** — `npm run dev` in `client/` starts Next.js. `npm run dev` in `server/` starts Express with nodemon. No root-level script.
8. **`.env` files created with empty values** — both `client/.env` and `server/.env` with all required keys but no values. Corresponding `.env.example` files also created.
9. **Error responses** — Always `{ success: false, message: "..." }`. Stack traces only in development.
10. **Env validation** — Server validates all required env vars on startup and exits with a clear error if any are missing.
11. **Graceful shutdown** — Server handles SIGTERM/SIGINT, closes MongoDB connection, and stops accepting new requests.
12. **UI must feel premium** — Dark theme, smooth transitions, glassmorphism on auth card, micro-animations on buttons. Inter font from Google Fonts.
13. **Mobile-first responsive** — Auth page must look great on all screen sizes.
14. **Splash screen** — Show a branded loading screen while auth state is being determined on page load (prevents flash of login page for authenticated users).
15. **Protected routes** — Dashboard and future pages wrapped in `ProtectedRoute` that redirects to `/login` if not authenticated.
16. **Auth group redirect** — `/login` redirects to `/dashboard` if the user is already authenticated.
17. **Single login page** — Since Google handles both new and returning users, there is no separate signup page. First-time users are auto-registered.

## Definition of done

- [ ] Running `npm run dev` in `server/` starts Express on the configured port and connects to MongoDB.
- [ ] Running `npm run dev` in `client/` starts the Next.js dev server.
- [ ] `server/.env` and `client/.env` exist with all required keys (values empty).
- [ ] `server/.env.example` and `client/.env.example` exist as templates.
- [ ] `GET /api/v1/health` returns `{ success: true, data: { status: "ok", db: "connected" } }`.
- [ ] `POST /api/v1/auth/google` with a valid Firebase ID token creates a user in MongoDB and returns `{ success: true, data: { user, accessToken } }` + sets refresh cookie.
- [ ] `POST /api/v1/auth/google` for a returning user finds the existing user (no duplicate created).
- [ ] `POST /api/v1/auth/google` returns 401 for an invalid/expired Firebase ID token.
- [ ] A hashed refresh token is stored in the `refreshTokens` collection after successful auth.
- [ ] `GET /api/v1/auth/me` returns the authenticated user when a valid access token is present.
- [ ] `GET /api/v1/auth/me` returns 401 when no token or an expired token is sent.
- [ ] `POST /api/v1/auth/refresh` issues a new access token + rotates the refresh token.
- [ ] `POST /api/v1/auth/refresh` returns 401 if the refresh token is expired or not found in DB.
- [ ] `POST /api/v1/auth/logout` revokes the current refresh token and clears the cookie.
- [ ] `POST /api/v1/auth/logout-all` revokes all refresh tokens for the user.
- [ ] Rate limiting is active on auth endpoints (returns 429 on excess requests).
- [ ] The `/login` page renders a "Sign in with Google" button.
- [ ] Clicking the button opens the Google OAuth popup via Firebase.
- [ ] Successful sign-in redirects to `/dashboard`.
- [ ] `/dashboard` is protected — unauthenticated users are redirected to `/login`.
- [ ] `/login` redirects authenticated users to `/dashboard`.
- [ ] Auth state persists across page refreshes via silent refresh.
- [ ] Axios interceptor retries 401'd requests after refreshing the access token.
- [ ] A splash screen is shown while auth state is being resolved on page load.
- [ ] Navbar shows user avatar and name with a sign-out option.
- [ ] Toast notifications appear for success and error events.
- [ ] The UI is dark-themed, responsive, and visually premium.
- [ ] Server refuses to start if required env vars are missing.
