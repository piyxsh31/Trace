# Analytics & Heatmap Implementation Plan

This plan details the implementation of the Analytics Dashboard (F9 & F10) for Trace, incorporating industry best practices like streak tracking, performance aggregations, and premium visualizations.

## User Review Required
> [!IMPORTANT]
> Please review the proposed MongoDB aggregation approach. To keep the app extremely fast as users accumulate thousands of problems, we will compute all stats (streaks, heatmap data, topic counts) on the backend using an aggregation pipeline, sending only the final chart data to the frontend.
>
> We will also add `lucide-react` for icons, `recharts` for charting, and `date-fns` for date formatting. Let me know if you approve these dependencies!

## Proposed Changes

---
### 1. Database & Schema Updates

We need to track *when* problems are solved.

#### [MODIFY] [problem.model.js](file:///home/piyush/Documents/Trace/server/src/models/problem.model.js)
- Add `solvedAt: { type: Date, default: null }` to the schema.
- Add an index on `{ userId: 1, solvedAt: -1 }` to make fetching recent activity and heatmap data extremely fast.

#### [MODIFY] [problem.controller.js](file:///home/piyush/Documents/Trace/server/src/controllers/problem.controller.js)
- Update the `updateProblemStatus` (or equivalent) function.
- If `status` changes to `'solved'`, set `solvedAt = new Date()`.
- If `status` changes from `'solved'` to something else, set `solvedAt = null`.

---
### 2. Backend Analytics API

We will create a single endpoint that returns all data needed for the dashboard to minimize network requests.

#### [NEW] [analytics.routes.js](file:///home/piyush/Documents/Trace/server/src/routes/analytics.routes.js)
- `GET /api/v1/analytics` — Protected by auth middleware.

#### [NEW] [analytics.controller.js](file:///home/piyush/Documents/Trace/server/src/controllers/analytics.controller.js)
- Implement `getAnalyticsDashboard` using a MongoDB `$facet` aggregation to perform multiple queries in one pass:
  - **Heatmap Data:** Group `solvedAt` by `$dateToString: { format: "%Y-%m-%d" }` and count.
  - **Difficulty Breakdown:** Group by `difficulty` where `status === 'solved'`.
  - **Topic Mastery:** Unwind `topics` and group by topic to find the most solved topics.
  - **Recent Activity:** Match `status === 'solved'`, sort by `solvedAt` desc, limit 10.
- Compute **Streaks** (Current & Longest) in JS using the grouped daily heatmap dates.

#### [MODIFY] [app.js](file:///home/piyush/Documents/Trace/server/src/app.js)
- Mount `/api/v1/analytics` route.

---
### 3. Frontend Architecture & Packages

#### [MODIFY] [package.json](file:///home/piyush/Documents/Trace/client/package.json)
- Install `recharts`, `lucide-react`, and `date-fns`.

#### [NEW] [api-analytics.ts](file:///home/piyush/Documents/Trace/client/src/lib/api-analytics.ts) (or add to api.ts)
- Add the `fetchAnalytics()` Axios call.

#### [NEW] UI Components
- `client/src/app/dashboard/analytics/page.tsx`: The main page layout, handling loading states (skeleton loaders).
- `client/src/components/features/analytics/heatmap.tsx`: A grid of small `div` squares colored based on count, mapping the last 365 days.
- `client/src/components/features/analytics/stat-card.tsx`: A reusable `.glass-card` for Total Solved, Current Streak, etc.
- `client/src/components/features/analytics/difficulty-donut.tsx`: Recharts `<PieChart>` with custom glowing tooltips.
- `client/src/components/features/analytics/topic-radar.tsx`: Recharts `<RadarChart>`.
- `client/src/components/features/analytics/recent-activity.tsx`: A vertical timeline of the 10 most recent solves.

#### [MODIFY] [navbar.tsx](file:///home/piyush/Documents/Trace/client/src/components/layout/navbar.tsx)
- Add a navigational link to `/dashboard/analytics`.

---
## Verification Plan

### Automated/Backend Tests
- Use Postman or curl to hit `GET /api/v1/analytics` and ensure the aggregation returns the correct facet structure.
- Toggle a problem's status to 'solved' and verify `solvedAt` is populated in the database.

### Manual Verification
- Navigate to `/dashboard/analytics`.
- Check if the heatmap correctly renders the current day's solve.
- Ensure the Streak correctly displays "1 Day" after solving a problem.
- Verify that the layout is responsive and looks premium (glassmorphism intact) on both desktop and mobile views.
