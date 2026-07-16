---
Task ID: 1
Agent: Main Agent
Task: French localization, Mali localization, and support contact info across entire Rapigo Mali platform

Work Log:
- Read all existing source files (prisma/schema.prisma, seed.ts, store.ts, page.tsx, 4 app components, API routes)
- Audited all 4 app components (client, admin, merchant, driver) + landing page for English strings
- Confirmed 95%+ of UI already in French from previous sessions
- Fixed TypeScript error in client-app.tsx (EmptyState onRetry → onAction)
- Created shared `src/components/support-contact.tsx` component with:
  - Mr. Diarra Moussa info (name, phone, email)
  - 3 action buttons: 📞 Appeler, 💬 WhatsApp, ✉️ E-mail
  - WhatsApp link with pre-filled French message
  - Email link with subject line
- Updated all 4 space support sections to use shared SupportContactCard
- Added support info to merchant pending-approval screen
- Added support info to merchant SupportView
- Added support info to driver SupportView  
- Added support info to client SupportView
- Rebuilt landing page footer with:
  - Brand section (Rapigo Mali description)
  - Support & Contact section with all 3 buttons
  - Confiance section (Éco-responsable, Paiements sécurisés, Livraison rapide)
  - Copyright line with developer info
- Updated seed.ts: support_email → diarramoussaka7@gmail.com, support_phone → +223 77 16 38 62, added support_developer setting
- Updated version badges from V2.1 to V2.2 in all locations
- Fixed duplicate import (Phone, Mail) in page.tsx
- Rebuilt production bundle and verified E2E with Agent Browser

Stage Summary:
- All 5 pages (landing, client, merchant, driver, admin) verified rendering in French
- Support info (Mr. Diarra Moussa) present in all spaces with Appeler/WhatsApp/E-mail buttons
- Landing page footer shows full support section + developer credit
- Zero English strings in rendered UI (confirmed via JavaScript regex scan)
- All Mali localization in place: FCFA, +223, French dates, 24h format
- Admin login flow verified: email/phone → dashboard with French labels
- Login API verified: returns user data + JWT token
