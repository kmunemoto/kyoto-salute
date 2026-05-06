# Project Memory

## Core
- **Brand**: Name strictly "パーソナルジムSalute御所南". All UI text and Auth errors must be Japanese.
- **Design**: Apple Music–style glassmorphism. Fixed Tiffany-blue soft gradient bg (#E0F7F6→#C8EBF0→#F0F4FF). Cards/nav/inputs frosted white with backdrop-blur. Accent #0ABAB5. Headings #1A1A1A, body #333, sub #999.
- **Layout**: Strict mobile-first. Root `max-w-md mx-auto`, `overflow-x: hidden`, `user-scalable=no`, text `break-all`.
- **UI Stability**: Use native elements/Dialogs over Radix to prevent DOM translation conflicts. Disable Recharts animations.
- **Auth**: Roles 'customer' (auto) and 'trainer' (manual). No email confirmation; auto sign-in after signup.
- **Bookings**: Normal booking is 75m (60m + 15m buffer). Trainer blocks are exact duration (no buffer).
- **AI/Processing**: Prioritize AI accuracy over speed (high-res images, heavy models like BlazePose).
- **Logic**: Memberships use 1-month cycles based on `cycle_start_date` for usage counts and reports.

## Memories
- [Visual Identity](mem://style/visual-identity) — Glassmorphism tokens, gradient bg, frosted cards/buttons/inputs
- [View Modes](mem://architecture/view-modes) — Customer (mobile) vs Trainer (PC) role-based routing
- [App Identity](mem://branding/app-identity) — Salute御所南 naming, logo storage, no Lovable badges
- [Booking Rules](mem://logic/booking-rules) — 75m booking slots vs exact-time trainer blocked slots
- [UI Stability](mem://architecture/ui-stability) — React keying, disabled animations, translation safety
- [Session Management](mem://auth/session-management) — Session restoration, skipped email verification, PKCE fallback
- [Calendar Integration](mem://features/calendar-integration) — Trainer Google Calendar sync via Edge Function
- [Exercise Master](mem://features/exercise-master) — Trainer-managed exercises, dropdown sync, split arm categories
- [Test Credentials](mem://auth/test-credentials) — Email/passwords for trainer and customer test accounts
- [Database Schema](mem://architecture/database-schema) — Supabase tables, storage, RLS policies, RPCs
- [Mobile First](mem://architecture/mobile-first) — max-w-md, overflow prevention, tap targets, safe areas
- [Messaging](mem://features/messaging) — Supabase Realtime chat, LINE notifications, read receipts
- [PWA Support](mem://features/pwa-support) — manifest, champagne gold theme, install banner, offline support
- [Localization](mem://auth/localization) — Supabase Auth error translation to Japanese
- [Password Policy](mem://auth/password-policy) — Min 6 chars, HIBP check, double input validation
- [Email Communication](mem://branding/email-communication) — Resend + Edge Functions, k.kyoto-salute.com, templates
- [Customer Visibility](mem://logic/customer-visibility) — Self-healing profiles on booking, realtime trainer list sync
- [Mobile Signup](mem://architecture/mobile-signup-layout) — Top-aligned scrollable layout for keyboard safety
- [Training Records](mem://features/training-records) — JSONB sets, inline editing, 2-axis growth graphs
- [Measurement Tracking](mem://features/measurement-tracking) — Weight/body fat UPSERT, date picker, Recharts graph
- [Time Slot Blocking](mem://features/time-slot-blocking) — 15m increment trainer blocks, booking exclusion UI
- [Trainer Mode](mem://features/trainer-mode) — Sales dashboard, proxy bookings, cycle management, notifications
- [Meal Analysis](mem://features/meal-analysis) — 2-stage dietitian AI, 2048px images, PFC calculation
- [Trial Booking](mem://features/public-trial-booking) — /trial rate limits, Google Cal button, email/LINE alerts
- [LINE Integration](mem://integrations/line-integration) — OAuth, fire-and-forget push notifications for events
- [Membership Plans](mem://logic/membership-plans) — cycle_start_date logic for usage counts and period displays
- [Posture Analysis](mem://features/posture-analysis) — BlazePose heavy, EXIF rotation fix, 100-point score
- [Customer Portal](mem://features/customer-portal) — Booking limits, cycle display, history, webcal support
- [External Counseling](mem://integrations/external-counseling) — hello-gym-guide integration via anon INSERT
- [Apple Calendar](mem://features/apple-calendar-integration) — webcal:// feed via calendar-feed Edge Function
- [AI Constraint](mem://constraints/ai-accuracy-priority) — Accuracy > speed for all AI features
- [Streak Feature](mem://features/streak-feature) — Weekly streaks, LINE notifications at milestones
- [Monthly Reports](mem://features/monthly-reports) — Cycle Report, 6 sections, progress %, cron notifications
