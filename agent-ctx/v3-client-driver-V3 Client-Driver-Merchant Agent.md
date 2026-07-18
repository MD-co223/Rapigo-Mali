# Task v3-client-driver — Work Record

## Agent: V3 Client/Driver/Merchant Agent

## Completed Tasks (8/8)

### TASK 1: Fix Logout — Complete Session Cleanup
**File**: `src/lib/store.ts`
- Replaced simple `set({ user: null, token: null, isAuthenticated: false })` with comprehensive cleanup
- Now clears: localStorage (rapigo-auth, rapigo-cart, rapigo-space, rapigo-pwa-dismissed-v2, rapigo-pwa-dismissed), sessionStorage, ALL cookies
- Also resets `useSpaceStore` to 'landing' and clears cart via `useCartStore.clearCart()`

### TASK 2: Fix Wallet Transaction Display
**File**: `src/components/client/client-app.tsx` (lines ~865-867)
- Changed `t.amount >= 0` to `t.type === 'CREDIT'` for determining green/red styling
- Credit shows `+` prefix with `text-emerald-600`, Debit shows `-` prefix with `text-red-500`

### TASK 3: Fix Merchant API Query
**File**: `src/components/client/client-app.tsx`
- Line 207: `/api/merchants?isApproved=true` → `/api/merchants?approved=true`
- Line 272: Search query same fix

### TASK 4: Fix Merchant Logo Cropping
**File**: `src/components/merchant/merchant-app.tsx` (line 710)
- Changed `object-cover` to `object-contain` with `bg-gray-100` background

### TASK 5: Fix Notification Type Shadow
**File**: `src/components/client/client-app.tsx`
- Renamed `interface Notification` → `interface AppNotification`
- Updated `useState<AppNotification[]>` and `apiFetch<{ notifications: AppNotification[] }>`

### TASK 6: Fix Service Worker Interval Leak
**File**: `src/components/service-worker-reg.tsx`
- Added `useRef` for interval ID
- Clear interval in useEffect cleanup return

### TASK 7: Create Image Upload Component
**New File**: `src/components/shared/image-upload.tsx`
- Drag & drop on desktop, camera/gallery buttons on mobile
- Canvas compression (max 1200px width, quality 0.8)
- Preview thumbnails with X delete button
- Uploads via `POST /api/upload`

### TASK 8: Integrate Image Upload into Merchant Product Form
**Files**: 
- `src/app/api/upload/route.ts` (new — auth-protected, saves to public/uploads/products/)
- `src/components/merchant/merchant-app.tsx` — replaced URL text input with `<ImageUpload>` component

## Lint Result: 0 errors, 2 pre-existing warnings