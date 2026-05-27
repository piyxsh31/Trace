# Feature: Analytics Dashboard & Heatmap (F9 & F10)

## Overview
This feature introduces a dedicated Analytics page (`/dashboard/analytics`) to provide users with visual insights into their DSA practice progress. It incorporates industry best practices for gamification and data visualization to keep users motivated and focused on areas of improvement.

### Premium Features Included:
1. **GitHub-Style Heatmap:** A beautiful 5-tier color contribution graph showing daily activity.
2. **Streak Tracking (Gamification):** Calculates "Current Streak" and "Longest Streak" to encourage daily practice.
3. **Velocity & Trends:** Shows "Problems solved this week" with a percentage trend compared to the previous week.
4. **Topic Mastery & Weak Spots:** A radar chart for strongest topics, plus a "Needs Practice" section identifying topics with the highest ratio of unsolved/attempted problems.
5. **Recent Activity Feed:** A timeline of the user's most recently solved problems.
6. **Difficulty Distribution:** A glowing donut chart visualizing easy/medium/hard completion rates.

## Depends on
F1-F8.

## Routes
- `GET /api/v1/analytics` — Fetches all aggregated analytics data (heatmap, streaks, topic counts, recent activity) in a single optimized payload.
- `PUT /api/v1/problems/:id` — (Existing) Needs modification to record `solvedAt`.

## Database changes
- **Modify `Problem` Model**: Add `solvedAt: { type: Date, default: null }`. 
- **Migration/Logic**: When a problem's `status` is updated to `'solved'`, update `solvedAt` to `new Date()`. If changed to anything else, set `solvedAt` to `null`.

## UI Components
- **Create:**
  - `client/src/app/dashboard/analytics/page.tsx`
  - `client/src/components/features/analytics/heatmap.tsx`
  - `client/src/components/features/analytics/stat-card.tsx`
  - `client/src/components/features/analytics/difficulty-donut.tsx`
  - `client/src/components/features/analytics/topic-radar.tsx`
  - `client/src/components/features/analytics/recent-activity.tsx`
- **Modify:**
  - `client/src/components/layout/navbar.tsx` — Add Analytics link.

## Files to change
- `server/src/models/problem.model.js`
- `server/src/controllers/problem.controller.js`
- `server/src/routes/index.js` or `app.js`
- `client/src/components/layout/navbar.tsx`

## Files to create
- `server/src/routes/analytics.routes.js`
- `server/src/controllers/analytics.controller.js`
- (And all frontend components listed above)

## New dependencies
- `recharts` (Responsive SVG charts)
- `lucide-react` (Premium icons)
- `date-fns` (Date calculations for streaks and heatmap)
- `clsx` & `tailwind-merge` (if not already present, for dynamic glassmorphism utility classes)

## Rules for implementation
- **Performance:** Use MongoDB Aggregation (`$group`, `$match`, `$facet`) in the backend to calculate streaks and topic stats. Do not send thousands of raw problems to the frontend.
- **Aesthetic:** Use `.glass` and `.glass-card` classes. Charts should use neon accents (e.g., #10b981 for easy, #eab308 for medium, #ef4444 for hard).
- **Responsive:** The layout must degrade gracefully on mobile (stacking charts vertically).

## Definition of done
- [ ] Changing a problem to "solved" records the `solvedAt` timestamp.
- [ ] Heatmap renders correctly, showing local-time daily solve counts.
- [ ] Streak calculation correctly identifies consecutive days of activity.
- [ ] Difficulty donut and Topic radar render smoothly with animations.
- [ ] Recent activity feed shows the last 10 solves.
- [ ] MongoDB aggregations are used to ensure fast response times.
