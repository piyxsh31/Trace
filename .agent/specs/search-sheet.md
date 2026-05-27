# Feature: Search Sheet

## Overview
This feature adds a search bar to the dashboard to filter the list of user's DSA sheets by their name. It allows users with multiple sheets to easily find and access specific sheets without manually scrolling.

## Depends on
F4: Multiple Sheets

## Routes
No new routes. Search is implemented purely on the client side by filtering the cached list of sheets.

## Database changes
No database changes.

## UI Components
- **Modify:** `client/src/app/dashboard/page.tsx`
  - Update `SheetsHeader` to include a search input field next to the "Import Sheet" button.
  - Add state `searchQuery` to filter the sheets passed to the `SheetCard` mapping loop.

## Files to change
- `client/src/app/dashboard/page.tsx`

## Files to create
No new files.

## New dependencies
No new dependencies.

## Rules for implementation
- Follow the premium design aesthetics with Tailwind CSS tokens and utility classes.
- Since `input.tsx` does not exist in `ui/`, use a styled native `<input>` matching the app's aesthetic (e.g. `bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm`).
- The filtering should be case-insensitive.
- If the filter returns no results, display a clear "No sheets found matching '...'" empty state below the header.
- Add an SVG search icon inside the input for better UX.

## Definition of done
- [ ] A search input is visible in the dashboard when the user has 1 or more sheets.
- [ ] Typing in the search input filters the sheets by name immediately (case-insensitive).
- [ ] An empty state is shown if the search matches zero sheets.
