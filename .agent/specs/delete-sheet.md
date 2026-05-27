# Feature: Delete Sheet

## Overview
Allow users to permanently delete a sheet and all its associated problems from the dashboard.
This removes the friction of managing stale or mistakenly imported sheets. Because deletion is
irreversible and destroys all problem data for that sheet, the UX must include a confirmation
step before committing the action.

## Depends on
- F3: Import Sheet (sheets exist and are displayed)
- F4: Multiple Sheets (the dashboard grid of SheetCards is in place)

## Routes
- `DELETE /api/v1/sheets/:sheetId` — permanently deletes a sheet and all its problems — logged-in users only (own sheets only)

## Database changes
No new collections, fields, or indexes required. The existing `{ sheetId: 1, order: 1 }` index
on the `problems` collection makes `Problem.deleteMany({ sheetId })` efficient.
The delete of Sheet + Problems will be wrapped in a MongoDB session transaction (consistent with
`importSheet`).

## UI Components
- **Create:** `client/src/components/features/sheets/delete-sheet-modal.tsx`  
  A small confirmation modal (rendered via `createPortal` into `document.body`, consistent with
  `import-sheet-modal.tsx`) that asks the user to confirm deletion. Shows the sheet name,
  warns about permanent data loss, and has "Cancel" / "Delete" buttons. "Delete" enters a
  loading state while the API call is in-flight.

- **Modify:** `client/src/components/features/sheets/sheet-card.tsx`  
  Add a hover-revealed three-dot (⋯) menu button in the top-right corner of the card. Clicking
  it opens a small dropdown with a single "Delete sheet" option. The menu must call
  `e.preventDefault(); e.stopPropagation()` to prevent the wrapping `<Link>` from navigating.
  The card accepts a new `onDelete` prop.

- **Modify:** `client/src/hooks/use-sheets.ts`  
  Add `removeSheet(sheetId: string) => void` — optimistically removes the sheet from state.

- **Modify:** `client/src/app/dashboard/page.tsx`  
  Wire `removeSheet` into the delete flow, manage modal open/close state for the confirmation
  dialog, and pass `onDelete` down to each `SheetCard`.

## Files to change
- `server/src/controllers/sheet.controller.js` — add `deleteSheet` handler
- `server/src/routes/sheet.routes.js` — register `DELETE /:sheetId` route
- `client/src/hooks/use-sheets.ts` — add `removeSheet`
- `client/src/components/features/sheets/sheet-card.tsx` — add three-dot menu + `onDelete` prop
- `client/src/app/dashboard/page.tsx` — wire delete flow + confirmation modal state
- `client/src/types/sheet.ts` — no changes needed

## Files to create
- `client/src/components/features/sheets/delete-sheet-modal.tsx` — confirmation modal

## New dependencies
No new dependencies.

## Rules for implementation
1. **Ownership check first** — `deleteSheet` must query `{ _id: sheetId, userId: req.user._id }`;
   never delete by `_id` alone.
2. **MongoDB transaction** — Sheet deletion + `Problem.deleteMany` must be atomic (consistent
   with `importSheet`).
3. **HTTP 200 + `{ success: true, data: null }`** — consistent with the project's API pattern
   (avoid 204 since the Axios interceptors expect a JSON body shape).
4. **Optimistic UI** — call `removeSheet` immediately after the API resolves successfully;
   do not refetch the full list.
5. **No silent failures** — show an error toast if the API call fails; do not remove the card
   from state on failure.
6. **Stop propagation** — the delete button/menu must prevent the `<Link>` navigation.
7. **Modal via `createPortal`** — consistent with `import-sheet-modal.tsx`.
8. **Body scroll lock** — lock scroll when confirmation modal is open, restore on close.
9. **No new rate limiter** — delete is not a heavy operation; the `protect` middleware is
   sufficient.
10. **`_id` → `id` normalization** — not needed for delete (no data returned in `data`).

## Definition of done
- [ ] `DELETE /api/v1/sheets/:sheetId` returns `200 { success: true, data: null }` when the
      authenticated user deletes their own sheet.
- [ ] All problems belonging to the deleted sheet are removed from the `problems` collection.
- [ ] `DELETE /api/v1/sheets/:sheetId` returns `404` when the sheet does not exist or belongs
      to another user.
- [ ] `DELETE /api/v1/sheets/:sheetId` returns `401` when called without a valid access token.
- [ ] The dashboard shows a three-dot menu on each sheet card on hover.
- [ ] Clicking "Delete sheet" in the menu opens a confirmation modal with the sheet name.
- [ ] Clicking "Cancel" closes the modal without any side effects.
- [ ] Clicking "Delete" in the modal shows a loading spinner, calls the API, removes the card
      from the grid optimistically, and shows a success toast.
- [ ] If the API call fails, the card remains in the grid and an error toast is shown.
- [ ] Deleting the last sheet shows the empty state UI.
- [ ] The Sheets count stat and Total Problems stat on the dashboard update automatically after
      deletion (they derive from the `sheets` array).
- [ ] Clicking the delete menu button does not navigate to the sheet detail page.
