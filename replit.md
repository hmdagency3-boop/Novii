# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Novii Platform

Arabic social media platform (React + Vite frontend, Express backend) using Supabase for data/auth and Cloudinary for media.

### Authentication System
- **Email signup/login**: Standard email + password via Supabase Auth (`signUp`, `signInWithPassword`)
- **Phone signup/login**: Phone number + OTP via Supabase Auth (`signInWithOtp`, `verifyOtp` type='sms')
- **Auth method toggle**: UI toggle between "Email" and "Phone Number" on both login and signup forms
- **Country codes**: 25 pre-configured country codes (Arab + international) with flags
- **OTP flow**: Send code → 60s countdown → 6-digit input → verify → create profile + track device
- **Phone auth requirement**: Supabase Phone Auth must be enabled in dashboard (Authentication → Providers → Phone) with SMS provider (Twilio/MessageBird/Vonage)
- **Auth context**: `novii/client/src/lib/auth-context.tsx` — `signInWithPhone(phone)`, `verifyPhoneOtp(phone, token)`
- **Auth page**: `novii/client/src/pages/auth.tsx` — full email/phone dual-mode with OTP verification

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

### Suggestion Algorithm (Instagram-like)
- **Endpoint**: `GET /api/suggestions/recommended` — multi-signal recommendation engine
- **Scoring factors**: Contacts match (30%), Mutual followers (25%), Author affinity from likes/comments/saves (15%), Follower count (10%), Verified/official status (10%), Recent activity (10%)
- **Suggestion reasons**: Each suggestion includes `suggestion_reason` (Arabic text), `suggestion_reason_detail`, and `suggestion_reason_type` (contact/mutual/interest/verified/popular/suggested)
- **Contacts sync**: `POST /api/contacts/sync` — receives hashed phone numbers, matches against registered users. Phone numbers are SHA-256 hashed (never stored in plaintext). `POST /api/contacts/set-phone` — saves user's own phone hash + retroactively matches existing contacts.
- **Dismiss suggestions**: `POST /api/suggestions/dismiss` — hides a user from suggestions permanently
- **Tables**: `user_contacts` (phone_hash, matched_user_id, contact_name), `suggestion_dismissals` (user_id, dismissed_user_id), `profiles.phone_hash`, `profiles.contacts_synced_at`
- **SQL migration**: `novii/supabase/add_contacts_and_suggestions.sql`
- **Band shuffle**: Top results are shuffled within bands of 4 to add variety while maintaining relevance
- **Sidebar UI**: Shows reason icon + text per suggestion, dismiss (X) button on hover, contacts sync banner for new users
- **Interest profile reuse**: Uses `buildUserInterestProfile()` from `algorithm.ts` (same data powering Feed/Explore/Reels)

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
- **Server endpoints**: `/api/admin/check`, `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/:id/ban`, `/api/admin/users/:id/warn`, `/api/admin/users/:id/force-logout`, `/api/admin/users/:id/reset-password` (POST), `/api/admin/users/:id/avatar` (POST — multipart upload), `/api/admin/users/:id` (DELETE/PATCH — supports username, display_name, avatar_url, bio, badges), `/api/admin/admins` (GET/POST), `/api/admin/admins/:id` (PATCH/DELETE), `/api/admin/content` (GET), `/api/admin/content/:id` (DELETE), `/api/admin/content/deleted` (GET — archived posts), `/api/admin/content/:id/restore` (POST — restore deleted post), `/api/admin/reports`, `/api/admin/logs`, `/api/admin/settings` (GET/PATCH), `/api/admin/verification-requests` (GET/PATCH)
- **Full Account Management**: Admin can edit username (validated: min 3 chars, uniqueness check), display name (max 50 chars), bio (max 300 chars), avatar (upload via Cloudinary with MIME/size validation), and password (min 6 chars, auto-revokes all device sessions). Edit modal has 3 tabs: Profile, Badges, Password.
- **Ban System**: Instagram-style 3-step ban modal (reason → duration → confirmation). `requireAuth` middleware checks ban status on every request (`/ban-status` and `/admin/` paths exempt). Client polls `/api/auth/ban-status` every 30s and on window focus. `BanScreen` component blocks banned users. Ban supports `terminateSessions` flag (default true). Force-logout endpoint revokes all active `user_devices` sessions. `strikes_count` incremented on each ban. Migration: `novii/supabase/add_strikes_count.sql`
- **Verification System**: Full identity verification with document upload. Users go through 4-step flow in Settings → "التحقق من الهوية": (1) Upload ID card photo, (2) Upload selfie for face matching, (3) Personal details + reason, (4) Review & submit. Admins review documents side-by-side in admin panel "طلبات التوثيق" page. Server endpoints: `POST /api/verification/request` (submit with `id_card_url` + `selfie_url` required), `GET /api/verification/status` (check own), `GET /api/admin/verification-requests` (list all with profile data), `PATCH /api/admin/verification-requests/:id` (approve/reject — pending only). Approval sets `is_verified: true` on profile and sends `verified_granted` notification. Backend validates reason, category enum, sanitizes social_links (https only), validates document URLs. Table: `verification_requests` with `id_card_url` and `selfie_url` columns (auto-created on startup). Uploads go to Cloudinary `novii/verification` folder.
- **Archive System**: Soft-deleted posts are accessible via "الأرشيف (المحذوفة)" tab in content management. Admins can view deleted posts and restore them (sets `is_deleted: false`). Restoring sends a `security` notification to the post author. Both archive endpoints are protected with `can_manage_content` permission.
- **Admin page removed from main platform** — all admin UI is now exclusively in the standalone admin panel (`artifacts/novii-admin`)
- **Moderation Notifications**: Admin actions (post removal, warnings, bans, unbans, badge grants/removals) send visible notifications to affected users. Reporter gets a "thank you" notification when their report is resolved. Notification types: `warning`, `post_removed`, `post_restored`, `ban`, `unban`, `security`, `report_resolved`, `badge_awarded`, `badge_removed`. Rendered in notifications page with distinct icons, amber highlight styling, and "Novii Admin" label. Clicking moderation notifications opens `/moderation/:id` detail page (Instagram-style) with content unique to each type.
- **Badge Notifications**: When admin grants or revokes any badge/verification, the backend compares old vs new badge state and sends `badge_awarded` or `badge_removed` notification listing the specific badges changed. Badge fields tracked: `is_verified`, `is_official`, `is_creator`, `is_premium`, `is_popular`, `is_gold_early_member`, `is_silver_early_member`, `is_bronze_early_member`, `is_beta_tester`, `is_bug_hunter`.
- **Moderation Detail Page**: `novii/client/src/pages/moderation-notice.tsx` — Instagram-style detail view for moderation notifications showing action type header, details, community guidelines, "what happens next" warning, and links to terms/help.
- **Migration SQL**: `novii/supabase/upgrade_admin_system.sql`

### Standalone Admin Panel (`artifacts/novii-admin`)
- **Separate frontend app** at `/novii-admin/` — completely independent from Novii platform codebase
- **Tech**: React + Vite + Tailwind CSS + Supabase Auth, proxies API calls to Novii backend (port 5000)
- **Design**: Ditto Pro-inspired dark sidebar, browser-style tab navigation, professional data tables with modals
- **Pages (18 total)**: Login (dark gradient), Dashboard (stats cards), Users (CRUD + ban/edit/delete with full badge management + user detail page), Content/Posts moderation, Stories management, Reels management, Communities, Admins management (add/edit/remove), Reports viewer, Verification Requests (review/approve/reject), Ban Appeals, Analytics (growth/top-posts/devices), Announcements (broadcast notifications), Security (IP bans/suspicious accounts/login activity), Hashtags management (ban/unban/pin), Content Filter (banned words), **Trends Dashboard** (trending words/posts/reels/accounts/hashtags with growth %, predictions, featured content management), Algorithm control, Platform Settings (key-value editor), Activity Logs
- **User Detail Page** (`artifacts/novii-admin/src/pages/user-detail.tsx`): Comprehensive user profile view with 7 tabs (Overview, Devices, Posts, Stories, Reports, Moderation, Connections). Shows all user data: profile header with badges/stats, usage statistics, device history with fingerprints/IPs/geo, posts/reels grid, stories grid, reports against/by, warnings/strikes/appeals/verification requests/admin logs, communities/followers/following/blocked. Accessed by clicking avatar or "View Details" in action menu. Endpoint: `GET /api/admin/users/:userId/details` fetches 16 data sources in parallel with graceful per-section error handling.
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

### Personalized Recommendation Algorithm
- **Backend**: `novii/server/algorithm.ts` — comprehensive server-side recommendation engine
- **Scoring factors**: Author affinity (interaction history), interest matching (hashtag/topic overlap), engagement quality (likes/comments/saves weighted), recency decay, content diversity, discovery boost (new posts < 30min), negative signals (not_interested + skip penalties)
- **API endpoints**: `GET /api/feed/personalized` (paginated), `GET /api/explore/personalized`, `GET /api/explore/personalized/reels` — all require auth
- **Client integration**: `api.ts` methods (`getPersonalizedFeed`, `getPersonalizedExplore`, `getPersonalizedExploreReels`) call server endpoints with auth headers, fallback to legacy Supabase-direct queries if unauthenticated or server error
- **Hooks**: `useInfiniteFeed`, `useExplorePosts`, `useExploreReels` in `use-data.ts` now use personalized endpoints
- **Security**: Uses user's authenticated DB connection (RLS enforced) for content, adminDb for reading config from `platform_settings`
- **Legacy fallback**: `getFeedAlgorithmic()` (client-side scoring) preserved as fallback
- **Disabled mode**: When algorithm is disabled, returns chronological content instead of empty results
- **Admin control panel**: Full admin page in `artifacts/novii-admin/src/pages/algorithm.tsx` — "الخوارزمية" tab in sidebar under "أدوات"
- **Admin endpoints**: `GET /api/admin/algorithm` (get config + defaults), `PATCH /api/admin/algorithm` (update with validation), `POST /api/admin/algorithm/reset` (reset to defaults)
- **Config system**: Settings stored as `algo_*` keys in `platform_settings` table, 60s in-memory cache, validated on save (weight 0-1, integers 1-500)
- **22 configurable parameters**: Feed/Explore/Reels weights, batch sizes, max per author, verified/official/creator boosts, profile lookback days, enable/disable toggle
- **Admin UI features**: Slider controls with percentage display, real-time weight sum indicator, modified-field badges, reset to defaults, enable/disable toggle
- **Discovery Boost**: Posts < 30 min old get up to +0.35 bonus (linear decay), solving cold-start problem for new content
- **Negative Signals**: `content_signals` table tracks `not_interested` and `skip` events per user. Penalties: author not-interested (1-2x: -0.15, 3+: -0.40), author skip (2-4x: -0.10, 5+: -0.25), hashtag (1x: -0.05, 2+: -0.15). Max penalty capped at -0.60. Signals expire after 7 days. API: `POST /api/content-signals/not-interested`, `POST /api/content-signals/skip`, `DELETE /api/content-signals/:target_id?type=`
- **Algorithm report**: `novii/docs/algorithm-report.md` — full 8-stage algorithm documentation in Arabic
- **SQL migration**: `novii/supabase/add_content_signals.sql` — run in Supabase Dashboard to create content_signals table

### Hashtag System
- **Database tables**: `hashtags` (name, posts_count, is_banned, is_pinned), `post_hashtags` (post_id, hashtag_id), `reel_hashtags` (reel_id, hashtag_id)
- **Auto-extraction**: `saveHashtags()` in `api.ts` parses `#tags` from caption on post/reel creation, upserts hashtag rows, links via junction tables
- **Public endpoints**: `/api/hashtags/trending`, `/api/hashtags/:name`, `/api/hashtags/:name/posts`, `/api/hashtags/search/:query`
- **Admin endpoints**: `GET/PATCH /api/admin/hashtags/:id` (ban/unban/pin)
- **Client page**: `novii/client/src/pages/hashtag.tsx` at route `/hashtag/:tag` — shows hashtag info + posts grid
- **Clickable hashtags**: `post-card.tsx` renders `#tags` in captions as links to `/hashtag/:tag`
- **Migration SQL**: `novii/supabase/add_hashtags_and_admin_features.sql`

### Follow System
- Follow requests stored in `follow_requests` table (requester_id, recipient_id, status)
- `useToggleFollow` hook handles 4 states: unfollow, cancel pending, request private, follow public
- Profile pages use Supabase Realtime subscriptions for live follow state updates (no polling)
- Incoming request detection via `hasIncomingFollowRequest` query
- Profile button shows: Accept / Following / Requested / Follow Back / Request / Follow

### Image Cropping & Sizing
- **Library**: `react-easy-crop` for interactive crop UI
- **Crop utility**: `novii/client/src/lib/crop-utils.ts` — `getCroppedImg()` converts crop area to final File using Canvas API
- **ImageCropper component**: `novii/client/src/components/image-cropper.tsx` — reusable cropper with aspect ratio selector and zoom slider
- **Post images**: Cropped to standard ratios before upload — Square 1:1 (1080×1080), Portrait 4:5 (1080×1350), Landscape 16:9 (1080×608)
- **Profile photos**: Circular crop at 1:1 ratio, output 500×500px (`avatar-uploader.tsx`)
- **All uploads**: Cropped image (as JPEG, quality 0.92) is what gets uploaded to Cloudinary — not the original file

### Routing
- `/reel/:id` maps to Reels page (for shared reel links)
- `/post/:id` for individual posts
- All protected routes wrapped in `ProtectedLayout`

## Database Migration Rules

> **قاعدة إلزامية**: أي تعديل أو إضافة على مخطط قاعدة البيانات (جدول جديد، عمود جديد، index، constraint، RLS policy) **يجب** أن يُرفق بملف SQL مستقل في مجلد `novii/supabase/`.

- **المجلد**: `novii/supabase/*.sql`
- **التسمية**: وصفية وواضحة (مثال: `add_system_message.sql`، `upgrade_communities.sql`)
- **المحتوى**: SQL جاهز للتنفيذ في Supabase Dashboard → SQL Editor
- **دائماً استخدم**: `IF NOT EXISTS` / `IF EXISTS` لضمان إمكانية إعادة التنفيذ بأمان
- **قائمة الملفات الحالية**:
  - `NOVII_COMPLETE_DATABASE.sql` — المخطط الكامل الأصلي
  - `upgrade_admin_system.sql` — جداول الأدمن والصلاحيات
  - `upgrade_device_tracking.sql` — نظام تتبع الأجهزة
  - `upgrade_verification_requests.sql` — طلبات التوثيق
  - `add_system_message.sql` — عمود `is_system_message` في `community_messages`
  - `messages_enhancements.sql` — تحسينات الرسائل
  - `fix_community_rls_recursion.sql` — إصلاح RLS للمجتمعات
  - `fix_server_rls_writes.sql` — إصلاح RLS للكتابة
  - وملفات إضافات أخرى في المجلد

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
