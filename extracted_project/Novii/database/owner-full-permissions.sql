-- ============================================
-- OWNER FULL PERMISSIONS (FOR COMMUNITIES)
-- ============================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- Gives community owners the same permissions as admins:
-- - Mute/Unmute members
-- - Kick members
-- - Promote/Demote admins
-- - Full moderation capabilities

-- Update RLS Policy for moderation logs: Allow owners to read
DROP POLICY IF EXISTS "Admins can read moderation logs" ON moderation_logs;

CREATE POLICY "Admins and owners can read moderation logs"
  ON moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = moderation_logs.community_id
      AND communities.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = moderation_logs.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- Update RLS Policy for moderation logs: Allow owners to create
DROP POLICY IF EXISTS "Admins can create moderation logs" ON moderation_logs;

CREATE POLICY "Admins and owners can create moderation logs"
  ON moderation_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = moderation_logs.community_id
      AND communities.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = moderation_logs.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- RLS Policy: Members and owners can be updated by owners
-- This allows owners to modify member records (mute, kick, change role)
DROP POLICY IF EXISTS "Community members can be updated" ON community_members;

CREATE POLICY "Owners and admins can update community members"
  ON community_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND communities.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND communities.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- ============================================
-- Done! Owner full permissions configured
-- ============================================
-- The backend now checks:
-- - Is user the owner? (created_by = user.id) → Full permissions
-- - Is user an admin? (role = 'admin') → Full permissions
-- - Otherwise → No permissions
-- ============================================
