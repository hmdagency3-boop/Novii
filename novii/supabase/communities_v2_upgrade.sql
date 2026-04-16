-- ============================================================
-- Communities Feature Upgrade v2
-- Adds: reactions, replies, notification mute, slow mode,
-- discovery (category), and improved indexes.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1) Communities: add discovery + slow-mode columns
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS slow_mode_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS who_can_send text DEFAULT 'all', -- 'all' | 'admins'
  ADD COLUMN IF NOT EXISTS who_can_invite text DEFAULT 'admins'; -- 'all' | 'admins'

-- 2) community_members: add per-user notification mute + slow-mode tracking
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS notifications_muted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notifications_muted_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- 3) community_messages: add reply support
ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS replied_to_message_id uuid REFERENCES community_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_messages_community_created
  ON community_messages (community_id, created_at DESC);

-- 4) New table: reactions on community messages
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

-- 6) Helpful: prevent duplicate active membership rows
CREATE UNIQUE INDEX IF NOT EXISTS uniq_community_members_active
  ON community_members (community_id, user_id);
