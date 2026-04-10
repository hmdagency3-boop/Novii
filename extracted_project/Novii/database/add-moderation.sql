-- ============================================
-- ADD MODERATION FEATURES (MUTE, KICK, TEMP MUTE)
-- ============================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- Adds admin moderation capabilities for community members

-- Add moderation columns to community_members table
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mute_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kicked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS muted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for moderation queries
CREATE INDEX IF NOT EXISTS idx_community_members_is_muted ON community_members(is_muted);
CREATE INDEX IF NOT EXISTS idx_community_members_muted_until ON community_members(muted_until);
CREATE INDEX IF NOT EXISTS idx_community_members_kicked_at ON community_members(kicked_at);

-- Create moderation logs table for audit trail
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'mute', 'unmute', 'kick', 'temporary_mute'
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  duration_minutes INTEGER, -- For temporary mutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for moderation logs
CREATE INDEX IF NOT EXISTS idx_moderation_logs_community_id ON moderation_logs(community_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user_id ON moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin_user_id ON moderation_logs(admin_user_id);

-- Enable RLS for moderation logs
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins of the community can read moderation logs
CREATE POLICY "Admins can read moderation logs"
  ON moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = moderation_logs.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- RLS Policy: Only admins can insert moderation logs
CREATE POLICY "Admins can create moderation logs"
  ON moderation_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = moderation_logs.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- ============================================
-- Done! Moderation system is ready
-- ============================================
