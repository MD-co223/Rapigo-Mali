# Task ID: uiux — UI/UX Agent

## Summary
Comprehensive UI/UX modernization of the Rapigo Mali project to achieve a premium feel similar to Uber Eats / Glovo / Bolt Food.

## Files Modified
1. `src/lib/store.ts` — Updated ORDER_STATUS_COLORS
2. `src/components/shared/ui-helpers.tsx` — NEW shared component
3. `src/components/client/client-app.tsx` — Skeletons, empty states, rating stars
4. `src/components/merchant/merchant-app.tsx` — Skeletons, empty states, status colors
5. `src/components/driver/driver-app.tsx` — Empty states, status colors, button feedback
6. `src/components/admin/admin-app.tsx` — Empty states with icons, status badge colors
7. `src/app/page.tsx` — Page transitions, button feedback
8. `src/components/pwa-install-prompt.tsx` — Relative positioning
9. `src/app/layout.tsx` — Moved PwaInstallPrompt before children

## Key Changes
- **Skeletons**: All 4 apps now use animated skeleton loaders (list, card, detail variants)
- **Empty States**: All empty states show relevant Lucide icons with friendly French messages
- **Order Status Colors**: Consistent 11-color scheme across all apps
- **Page Transitions**: Fade in/out when switching spaces
- **PWA Banner**: No longer overlaps header; pushes content down
- **Rating Stars**: Professional appearance with drop shadows
- **Button Feedback**: active:scale-95 on CTAs
