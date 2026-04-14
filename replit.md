# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Novii Platform

Arabic social media platform (React + Vite frontend, Express backend) using Supabase for data/auth and Cloudinary for media.

### Settings System
- **SettingsProvider context**: `novii/client/src/lib/settings-context.tsx` — single source of truth for all settings and user lists app-wide
- **Settings storage**: `novii/client/src/lib/settings-storage.ts` — Supabase-backed per-user settings (DB read/write layer)
- Settings page (`novii/client/src/pages/settings.tsx`) uses `useSettings()` context (no local state duplication)
- All toggle/preference settings persist to `user_settings` table
- Notification sub-fields: `notifications_enabled`, `push_notifications`, `message_notifications`, `like_notifications`, `comment_notifications`, `follow_notifications`
- List-based features (blocked, muted, close friends, restricted, favorites) stored in dedicated Supabase tables with RLS
- Tables: `user_settings`, `blocked_users`, `close_friends`, `muted_users`, `restricted_users`, `favorite_users`
- Password change uses `supabase.auth.updateUser()`
- Privacy toggle (is_private) saves to Supabase profiles table
- Migration SQL in `novii/supabase-migration.sql` (also includes conversations, highlights tables)

### Device Tracking System
- **Schema**: `user_devices` table with fingerprinting (`device_fingerprint`), trust system (`is_trusted`), session tokens, login count, status (`active`/`revoked`)
- **Backend**: `novii/server/utils/device-detector.ts` — UA parsing, SHA-256 fingerprint generation, geo-location with caching, session token generation
- **Upsert Logic**: Same device (by fingerprint + userId) is updated on re-login instead of creating duplicates; max 10 active devices per user
- **Auth-protected endpoints**: track, get, delete, trust, revoke-all, heartbeat — all require auth via `requireAuth` middleware with IDOR ownership checks
- **Client fingerprint**: Collects screen resolution, timezone, language, hardware concurrency, touch points, pixel ratio (`collectClientFingerprint()` in `api.ts`)
- **Heartbeat**: `DeviceHeartbeat` component sends activity ping every 5 minutes to keep `last_active_at` current
- **Trust System**: Users can mark devices as trusted (protected from auto-removal when device limit is reached)
- **Security Alerts**: New device login creates a `security` notification
- **Visitor Detection**: Uses fingerprint hash to detect returning devices without login
- **Settings UI**: `ConnectedDevicesSection` shows current device badge, device details (OS, browser, location, login count, timezone), trust toggle, remove button, "Log out all" action
- **Migration SQL**: `novii/supabase/upgrade_device_tracking.sql`

### Admin System
- **Database tables**: `admins` (with role + granular permissions), `admin_logs` (activity audit trail), `platform_settings` (key-value config)
- **Server middleware**: `requireAdmin` (checks admins table), `checkPermission(perm)` (granular permission gating), `logAdminAction()` (auto-logs all admin actions)
- **Roles**: `super_admin` (full access), `admin`, `moderator` — super_admin bypasses all permission checks
- **Permissions**: `can_manage_users`, `can_manage_content`, `can_manage_admins`, `can_manage_reports`, `can_view_analytics`, `can_manage_settings`
- **Server endpoints**: `/api/admin/check`, `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/:id/ban`, `/api/admin/users/:id` (DELETE/PATCH), `/api/admin/admins` (GET/POST), `/api/admin/admins/:id` (PATCH/DELETE), `/api/admin/content` (GET), `/api/admin/content/:id` (DELETE), `/api/admin/reports`, `/api/admin/logs`, `/api/admin/settings` (GET/PATCH)
- **Admin page removed from main platform** — all admin UI is now exclusively in the standalone admin panel (`artifacts/novii-admin`)
- **Migration SQL**: `novii/supabase/upgrade_admin_system.sql`

### Standalone Admin Panel (`artifacts/novii-admin`)
- **Separate frontend app** at `/novii-admin/` — completely independent from Novii platform codebase
- **Tech**: React + Vite + Tailwind CSS + Supabase Auth, proxies API calls to Novii backend (port 5000)
- **Design**: Ditto Pro-inspired dark sidebar, browser-style tab navigation, professional data tables with modals
- **Pages**: Login (dark gradient), Dashboard (stats cards), Users (CRUD + ban/edit/delete with full badge management), Content moderation, Admins management (add/edit/remove), Reports viewer, Platform Settings (key-value editor), Activity Logs
- **All 10 badges**: verified, official, creator, premium, popular, active, gold early member, silver early member, bronze early member, beta tester — all viewable/editable from admin panel
- **Auth flow**: Supabase email/password login → verifies admin status via `/api/admin/check` → shows panel if admin
- **API contract**: Frontend matches backend exactly — ban uses `{ ban: boolean, duration: "7d" }`, admins use flat `can_manage_*` fields, settings returns object map transformed to array
- **Key files**: `artifacts/novii-admin/src/lib/admin-api.ts` (API client), `artifacts/novii-admin/src/lib/auth-context.tsx` (auth state), `artifacts/novii-admin/src/components/sidebar.tsx` (navigation)

### Security
- **Auth Middleware**: JWT verification via `requireAuth` middleware in `novii/server/routes.ts`
- **Admin Middleware**: `requireAdmin` + `checkPermission()` for all admin routes — server-side enforcement
- Upload endpoint protected with: auth check, MIME validation (images/video/audio only), rate limiting (10/min per user)
- `x-user-token` header used for JWT verification, `x-user-id` as fallback
- Device management endpoints enforce ownership checks (IDOR protection)

### Toast Notifications
- **Dual system**: Sonner (primary, most pages) + Shadcn/Radix (auth, create flows)
- **Sonner**: Glassmorphic style with backdrop-blur, colored tint per type (success=emerald, error=red, warning=amber, info=blue), positioned top-center, 3s duration
- **Shadcn**: Matching glassmorphic style with auto-icons per variant, RTL-safe positioning (logical `end-2`), centered viewport, slide-from-top animation
- **Styling**: Sonner classNames in `sonner.tsx`, icon colors via CSS in `index.css`, Shadcn variants in `toast.tsx`

### Error Handling
- **ErrorBoundary**: `novii/client/src/components/error-boundary.tsx` wraps entire app in `App.tsx`
- Prevents white screen on crashes, shows error UI with retry button

### Follow System
- Follow requests stored in `follow_requests` table (requester_id, recipient_id, status)
- `useToggleFollow` hook handles 4 states: unfollow, cancel pending, request private, follow public
- Profile pages use Supabase Realtime subscriptions for live follow state updates (no polling)
- Incoming request detection via `hasIncomingFollowRequest` query
- Profile button shows: Accept / Following / Requested / Follow Back / Request / Follow

### Routing
- `/reel/:id` maps to Reels page (for shared reel links)
- `/post/:id` for individual posts
- All protected routes wrapped in `ProtectedLayout`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
