-- ============================================================
-- Communities Feature Upgrade v3 (consolidated, idempotent)
--
-- Run this in Supabase SQL Editor. Safe to re-run.
-- Includes everything from v2 plus a small clarification index
-- on community_members for fast per-user lookups.
-- ============================================================

-- 1) Communities: discovery + slow-mode + permission columns
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS slow_mode_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS who_can_send text DEFAULT 'all',     -- 'all' | 'admins'
  ADD COLUMN IF NOT EXISTS who_can_invite text DEFAULT 'admins'; -- 'all' | 'admins'

-- 2) community_members: per-user notification mute + slow-mode tracking
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS notifications_muted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notifications_muted_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- 3) community_messages: reply + soft-delete + edit tracking
ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS replied_to_message_id uuid REFERENCES community_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_community_messages_community_created
  ON community_messages (community_id, created_at DESC);

-- 4) Reactions on community messages
CREATE TABLE IF NOT EXISTS community_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_community_message_reactions_message
  ON community_message_reactions (message_id);

-- 5) Indexes for discovery & invite-code lookups
CREATE INDEX IF NOT EXISTS idx_communities_is_private
  ON communities (is_private);

CREATE INDEX IF NOT EXISTS idx_communities_category
  ON communities (category);

CREATE INDEX IF NOT EXISTS idx_communities_invite_code
  ON communities (invite_code);

-- 6) Prevent duplicate active membership rows
CREATE UNIQUE INDEX IF NOT EXISTS uniq_community_members_active
  ON community_members (community_id, user_id);

-- 7) Fast per-user membership lookup (used by /api/communities and notifications)
CREATE INDEX IF NOT EXISTS idx_community_members_user
  ON community_members (user_id) WHERE kicked_at IS NULL;
