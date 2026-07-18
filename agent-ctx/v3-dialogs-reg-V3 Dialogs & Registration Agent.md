---
Task ID: v3-dialogs-reg
Agent: V3 Dialogs & Registration Agent
Task: Fix dialog scrolling, registration payment proof flow, RatingStars icon, iOS PWA alert

Work Log:
- Searched all .tsx files for DialogContent instances and added max-h-[85vh] overflow-y-auto to 10 dialogs:
  - src/app/page.tsx (auth dialog)
  - src/components/client/client-app.tsx (rating dialog)
  - src/components/driver/driver-app.tsx (document upload dialog)
  - src/components/merchant/merchant-app.tsx (delivery zone dialog, coupon dialog)
  - src/components/admin/admin-app.tsx (confirm dialog, merchant detail, order detail, category dialog, coupon dialog)
- Implemented registration payment proof upload flow:
  - Added regPaymentProof state and handleRegProofChange callback in page.tsx
  - Added file upload UI (camera/gallery) inside registration dialog for MERCHANT/DRIVER roles
  - Modified handleRegister to require proof for MERCHANT/DRIVER and send base64 in body
  - Updated /api/auth/register/route.ts to save proof to public/uploads/registration/{userId}.png
  - Register route now creates Notification for SUPER_ADMIN users with proof details
  - Created /api/auth/upload-proof/route.ts for re-upload from WaitingApproval page
- Enhanced WaitingApproval component:
  - Shows uploaded proof image when available
  - Shows warning when no proof sent
  - "Envoyer une autre preuve" button with camera/file picker
  - Clear French instructions with Orange Money payment info
  - Re-upload calls /api/auth/upload-proof PATCH endpoint
- Fixed RatingStars icon in ui-helpers.tsx:
  - Changed from StarOff (X mark) to Star (same icon, filled/unfilled via className)
  - Removed unused StarOff import
- Fixed iOS PWA alert() in pwa-install-prompt.tsx:
  - Replaced alert() with proper Dialog component from shadcn/ui
  - Step-by-step iOS install instructions in French
  - Numbered steps with clear descriptions
  - "J'ai compris" dismiss button

Stage Summary:
- All 10 DialogContent instances now have scroll support (max-h-[85vh] overflow-y-auto)
- Registration requires payment proof for MERCHANT/DRIVER roles before submission
- Proof is saved server-side and admin notified automatically
- WaitingApproval shows proof, warns if missing, allows re-upload
- RatingStars uses Star icon consistently (no more X marks)
- iOS PWA uses Dialog instead of alert()
- Zero lint errors