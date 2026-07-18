# Task 2a — Admin Fix Agent

## Summary
Fixed all 7 critical bugs in the admin panel's merchant/driver management. The admin now has full control over merchants and drivers: approve, reject, suspend, reactivate, and delete.

## Files Modified
1. **`src/components/admin/admin-app.tsx`** — Complete rewrite of MerchantsView and DriversView with all bug fixes
2. **`src/app/api/drivers/[id]/route.ts`** — NEW: DELETE endpoint for driver deletion

## Bugs Fixed
1. ✅ Merchant approve() now sends `{ action: 'approve' }` body
2. ✅ Driver approve() now sends `{ action: 'approve' }` body  
3. ✅ Added "Refuser" button for unapproved merchants and drivers
4. ✅ Added DropdownMenu with Suspendre/Réactiver/Supprimer for all merchants/drivers
5. ✅ Added DialogDescription to merchant detail dialog
6. ✅ All actions now re-fetch data via refresh()
7. ✅ Added DialogDescription to ALL dialogs (orders, categories, coupons, confirm)

## Bonus Fix
- UsersView action() was also missing `{ action: ... }` body — fixed