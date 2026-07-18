# Task ID: v3-admin | Agent: V3 Admin Agent

## Task
Fix ALL bugs in the admin app of Rapigo Mali (src/components/admin/admin-app.tsx and related files).

## Bugs Fixed

### C1. Admin Orders — Client Name Always Blank
- **Root cause**: Dashboard and Orders views referenced `o.user?.firstName` / `o.user?.lastName` but the orders API returns nested `o.client?.user?.firstName`.
- **Fix**: Replaced ALL `o.user?.firstName` / `o.user?.lastName` with `o.client?.user?.firstName` / `o.client?.user?.lastName` in Dashboard (line ~301) and Orders view (line ~920, ~944).

### C2. Admin Orders — Shows CUID Instead of Order Number
- **Root cause**: Order tables showed `o.id?.slice(0, 8)` (database CUID) instead of `o.orderNumber`.
- **Fix**: Replaced `o.id?.slice(0, 8)` with `o.orderNumber` in Dashboard (line ~300), Orders list (line ~919), and Order detail (line ~942).

### C3. Admin Users — Status Always Shows "Actif"
- **Root cause**: Template checked `u.isBlocked` and `u.isSuspended` but User model has NO such fields — only `isActive`.
- **Fix**: Replaced status logic to use only `u.isActive`. Show "Suspendu" when `u.isActive === false`, "Actif" when true. Replaced block/suspend dropdown with single suspend/reactivate button. Fixed action function to only use suspend/reactivate with `isActive` check. Fixed `lastLoginAt` → `lastLogin` field name.

### C4/L9. Merchant/Driver Suspend — Wrong ID
- **Root cause**: Already fixed by previous agent — `m.userId` and `d.userId` correctly used for suspend/reactivate calls.

### C5. Admin Drivers — Name Always Blank
- **Root cause**: `d.firstName + ' ' + d.lastName` but driver API nests user data: `d.user?.firstName`.
- **Fix**: Changed to `(d.user?.firstName ?? '') + ' ' + (d.user?.lastName ?? '')`.

### M1. Admin Order Detail — Missing Payment Proof
- **Root cause**: Order detail dialog didn't show `paymentProof` image or approve/reject buttons.
- **Fix**: Added payment proof image display when `detail.paymentProof` exists. Added "Approuver le paiement" and "Refuser" buttons when `detail.paymentStatus === 'UPLOADED'`, calling `PATCH /api/orders/${detail.id}/verify-payment` with `{ reject: false/true }`.

### M2. Admin Merchant Detail — Missing Info
- **Root cause**: Used `detail.firstName + ' ' + detail.lastName` (doesn't exist on Merchant model).
- **Fix**: Changed to `detail.user?.firstName + ' ' + detail.user?.lastName`. Email now uses `detail.user?.email ?? detail.email`. Phone uses `detail.user?.phone ?? detail.phone`. Added account status display using `detail.user?.isActive`. Added payment proof display.

### M5. ALL Dialogs max-h-[85vh] overflow-y-auto
- **Fix**: Verified ALL 7 DialogContent instances have `max-h-[85vh]` with proper flex layout.

### M7. Version Mismatch
- **Fix**: Changed page.tsx footer from "Version 3.0 Enterprise" to "Version 3.0.0 Enterprise".

### M8. Admin Profile Always Shows "Super Administrateur"
- **Fix**: Already fixed — uses `user?.isSuperAdmin ? 'Super Administrateur' : 'Administrateur'`.

### L4. Audit Logs — Wrong Field Name
- **Root cause**: Referenced `l.entityType` but schema uses `entity`.
- **Fix**: Changed to `l.entity`. Also fixed API response parsing to handle `{ logs: [...] }` format.

### L8. Payment Status Badge Missing Color
- **Fix**: Added `PAYMENT_STATUS_COLORS` constant with colors for PENDING, UPLOADED, PAID, ACCEPTED, REJECTED, FAILED, REFUNDED. Updated `Sb` component to fall back to PAYMENT_STATUS_COLORS. Added `PAID` to `PAYMENT_STATUS_LABELS` in store.ts.

### ADDITIONAL: Email/Phone in Lists
- **Users**: Already had email, phone, registration date, last login columns.
- **Merchants**: Added Email column. Updated displayName to use `m.user?.firstName + ' ' + m.user?.lastName` fallback.
- **Drivers**: Added Email column. Removed Note column. Fixed displayName.

### ADDITIONAL: Registration Payment Proofs
- Merchants: Payment proof button already existed. Added proof display in detail dialog.
- Drivers: Payment proof button already existed.
- Orders: Added payment proof display + approve/reject buttons in detail dialog.

### API Fix
- **Merchants API** (`/api/merchants/route.ts`): Added `email`, `phone`, `isActive` to user select in include.

## Files Modified
1. `src/components/admin/admin-app.tsx` — Main admin component with all bug fixes
2. `src/app/api/merchants/route.ts` — Extended user select to include email/phone/isActive
3. `src/lib/store.ts` — Added PAID to PAYMENT_STATUS_LABELS
4. `src/app/page.tsx` — Fixed version string

## Verification
- `bun run lint` — passes with 0 errors
- Dev server compiles successfully
- No remaining references to old field names (o.user, u.isBlocked, u.isSuspended, d.firstName, d.lastName, l.entityType)
- All DialogContent instances have max-h-[85vh]