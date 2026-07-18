# Task v3-4: Admin Fix Agent

## Summary
Fixed all 12 bugs and high-priority fixes in the Admin space of Rapigo Mali V3.

## Changes Made

### Bug Fixes
1. **Status badges** (UsersView): Now correctly checks `isSuspended` → orange, `isBlocked` → red, `!isActive` → gray, else green
2. **Dashboard client names**: Uses `o.client?.user?.firstName || o.user?.firstName || '—'` and shows `orderNumber`
3. **DELETE endpoints**: Verified correct calls to `/api/merchants/[id]` and `/api/drivers/[id]`
4. **Coupon usedCount**: Changed `c.usageCount` → `c.usedCount`
5. **Profile role**: Conditional "Super Administrateur" vs "Administrateur" based on `user.isSuperAdmin`
6. **Payment proof display**: Already in detail dialog (parallel task). Added "Voir la preuve" button in list
7. **Approve/Reject format**: Verified `{ action: 'approve' }` / `{ action: 'reject' }` format

### High Priority Fixes
8. **"Voir la preuve" button**: Added to MerchantsView and DriversView for items with `paymentProof`
9. **Refresh after actions**: Verified all actions call `refresh()` after completion
10. **Dialog scrolling**: All DialogContent use `max-h-[85vh] flex flex-col`, scrollable areas use `overflow-y-auto -mx-6 px-6`, all DialogFooter use `mt-auto`
11. **User list info**: Added registration date, last login, color-coded role badges, dropdown actions
12. **Dark mode**: All hardcoded colors have dark: variants

## File Modified
- `src/components/admin/admin-app.tsx`

## Lint
- `bun run lint` passes clean