# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Novii Platform

Arabic social media platform (React + Vite frontend, Express backend) using Supabase for data/auth and Cloudinary for media.

### Settings System
- **Settings storage**: `novii/client/src/lib/settings-storage.ts` — localStorage-based per-user settings with typed UserSettings interface
- All toggle/preference settings auto-save to localStorage
- List-based features (blocked, muted, close friends, restricted, favorites) use localStorage with StoredUser entries
- Password change uses `supabase.auth.updateUser()`
- Privacy toggle (is_private) saves to Supabase profiles table

### Follow System
- Follow requests stored in `follow_requests` table (requester_id, recipient_id, status)
- `useToggleFollow` hook handles 4 states: unfollow, cancel pending, request private, follow public
- Profile pages use Supabase Realtime subscriptions for live follow state updates (no polling)
- Incoming request detection via `hasIncomingFollowRequest` query
- Profile button shows: Accept / Following / Requested / Follow Back / Request / Follow

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
