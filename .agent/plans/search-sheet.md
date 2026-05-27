# Implementation Plan: Search Sheet

## Overview
Add a search bar to the Trace dashboard (`page.tsx`) to filter the user's sheets by name client-side.

## Step 1: Update Dashboard Component
- **File:** `client/src/app/dashboard/page.tsx`
- **Action:**
  1. Add a `searchQuery` state using `useState('')`.
  2. Filter the `sheets` array derived from `useSheets()` based on `searchQuery` (case-insensitive match on `sheet.name`).
  3. Modify `SheetsHeader` component to accept `searchQuery` and `setSearchQuery` as props.
  4. In `SheetsHeader`, render an `<input type="text">` styled with Tailwind (`bg-zinc-900/50 border-zinc-800`, etc.) and a search icon.
  5. In the grid rendering logic, map over `filteredSheets` instead of `sheets`.
  6. Add a fallback state when `filteredSheets.length === 0` but `sheets.length > 0` to display a message like: `No sheets found matching "your search"`.

## Expected Output
A seamless, real-time client-side filtering of the sheet list on the dashboard, with no backend changes or additional dependencies.
