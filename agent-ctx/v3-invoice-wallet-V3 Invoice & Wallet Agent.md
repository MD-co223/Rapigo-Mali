# Task v3-invoice-wallet — Work Record

## Agent: V3 Invoice & Wallet Agent

## Work Log

### 1. Invoice PDF Generation (TASK 1)
- Installed `jspdf@4.2.1` via `bun add jspdf`
- Created `src/app/api/orders/[id]/invoice/route.ts` — GET endpoint
- PDF includes: Rapigo Mali logo (base64 from public/app-icon.png), invoice number (FAC-{orderNumber}), issue date, client info, merchant info, driver info, items table (name, qty, unit price, total), subtotal/delivery fee/discount/TVA 0%/total in FCFA, payment method, PAYÉ status, reference block (QR replacement), footer
- Auth: CLIENT (own orders), MERCHANT (own orders), ADMIN (all)
- Only available for DELIVERED orders
- Returns binary PDF with proper Content-Type and Content-Disposition headers
- Added "Télécharger la facture" button in client OrderDetailView (when status=DELIVERED)
- Added "Télécharger la facture" button in admin order detail dialog (when status=DELIVERED)

### 2. Wallet Enhancement (TASK 2)
- Updated Prisma schema: Added `status` (PENDING/COMPLETED/FAILED) and `method` fields to Transaction model
- Fixed Prisma schema: Changed provider from postgresql to sqlite, removed `map` attribute
- Ran `db:push` and re-seeded database
- Created `POST /api/wallet/topup` — validates amount (100-500000 FCFA), method (ORANGE_MONEY/WAVE/CARD/QR_CODE), creates PENDING CREDIT transaction, creates notification, includes OM/Wave API integration comments
- Created `POST /api/wallet/withdraw` — validates amount (500-300000 FCFA), method, phone for mobile money, checks balance, creates PENDING DEBIT transaction, creates notification
- Created `GET /api/wallet/transactions` — paginated (?limit=20&offset=0), returns transactions with status, method, hasMore

### 3. Security Improvements (TASK 3)
- **Upload validation**: Rewrote `src/app/api/upload/route.ts` — strict MIME type whitelist (jpeg/png/webp/gif), 5MB max size, UUID-based filenames (no user-controlled paths), path traversal prevention, directory validation
- **Rate limiting**: Updated `src/middleware.ts` — added method-aware rate limiting (POST:/api/orders max 10/min, POST:/api/upload max 10/min), kept login 5/min and register 3/min
- **Input sanitization**: Updated `src/app/api/auth/register/route.ts` — email regex validation, Malian phone format validation (+223/0 prefix), HTML tag stripping for names and business name, 100 char max length

## Files Modified
- `prisma/schema.prisma` — Transaction model (status, method fields), SQLite provider fix
- `src/app/api/orders/[id]/invoice/route.ts` — NEW
- `src/app/api/wallet/topup/route.ts` — NEW
- `src/app/api/wallet/withdraw/route.ts` — NEW
- `src/app/api/wallet/transactions/route.ts` — NEW
- `src/app/api/upload/route.ts` — REWRITTEN (security)
- `src/middleware.ts` — Updated rate limits
- `src/app/api/auth/register/route.ts` — Added validation
- `src/components/client/client-app.tsx` — Invoice button
- `src/components/admin/admin-app.tsx` — Invoice button

## Status: Complete
- Lint: PASS (0 errors)
- Dev server: RUNNING (no compilation errors)