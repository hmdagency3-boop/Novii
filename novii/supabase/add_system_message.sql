-- Migration: Add is_system_message column to community_messages
-- Run this SQL in your Supabase Dashboard → SQL Editor

ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_community_msgs_system
  ON community_messages(community_id, is_system_message)
  WHERE is_system_message = TRUE;
