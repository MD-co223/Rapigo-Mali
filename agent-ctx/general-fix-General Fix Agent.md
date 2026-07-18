# Task ID: general-fix — Agent: General Fix Agent

## Completed Tasks

### TASK 1: Logo Usage Audit & Fix
- **File**: `src/components/pwa-install-prompt.tsx` line 147
- **Issue**: `<img>` tag for app-icon.png missing `object-contain`
- **Fix**: Added `object-contain` to className
- **Other findings**: RapigoLogo component already correct, merchant avatar uses intentional `object-cover`

### TASK 2: isApproved Initialization Fix
- **File**: `src/app/page.tsx`
- **Issue**: `isApproved` defaulted to `true`, causing unapproved merchant/driver dashboards to flash on refresh
- **Fix**: 
  - Replaced `isApproved` state with `merchantDriverApproved` state (null initially)
  - `isApproved` is now a computed value: CLIENT/ADMIN always `true`, MERCHANT/DRIVER require API check
  - Session restore calls `/api/auth/me` to verify approval status
  - Passes lint (no synchronous setState in effect)

### TASK 3: Improved Error Messages
- **`api/auth/login/route.ts`**: Added Prisma P2021 handling → "Service temporairement indisponible" (503)
- **`api/auth/register/route.ts`**: Added P2002 unique constraint handling → distinguishes email vs phone (409)
- **`api/orders/route.ts` POST**: Proper status codes for stock errors (400), not found (404), business errors (400), server errors (500)

### TASK 4: Payment Verification API
- **New file**: `src/app/api/orders/[id]/verify-payment/route.ts`
- **Method**: PATCH
- **Auth**: MERCHANT (order owner) or ADMIN
- **Logic**: Sets paymentStatus to PAID/REJECTED, transitions PAYMENT_PENDING → PENDING on approval, notifies client

### TASK 5: Coupon Discount Server-Side Validation
- **File**: `src/app/api/orders/route.ts` POST handler
- **Issue**: Client-trusted `couponDiscount` value, minimal server validation
- **Fix**: Full server-side validation (active, dates, max uses, min order, merchant-specific, already used), server-side discount calculation from coupon type, removed `couponDiscount` from client body, CouponUsage records calculated discount