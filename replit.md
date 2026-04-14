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

### Security
- **Auth Middleware**: JWT verification via `requireAuth` middleware in `novii/server/routes.ts`
- Upload endpoint protected with: auth check, MIME validation (images/video/audio only), rate limiting (10/min per user)
- `x-user-token` header used for JWT verification, `x-user-id` as fallback
- Device management endpoints enforce ownership checks (IDOR protection)

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
