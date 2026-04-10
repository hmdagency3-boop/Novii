-- ============================================
-- FIX KICK STATUS VISIBILITY (RLS POLICY)
-- ============================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- Allows users to read their own community_members record
-- even if they've been kicked, to check their kick status

-- Add SELECT policy for community_members
-- Allow users to see their own membership record
DROP POLICY IF EXISTS "Users can read their own membership" ON community_members;

CREATE POLICY "Users can read their own membership"
  ON community_members FOR SELECT
  USING (user_id = auth.uid());

-- Allow owners to read all members in their communities
DROP POLICY IF EXISTS "Owners can read community members" ON community_members;

CREATE POLICY "Owners can read community members"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND communities.created_by = auth.uid()
    )
  );

-- Allow admins to read all members in their communities
DROP POLICY IF EXISTS "Admins can read community members" ON community_members;

CREATE POLICY "Admins can read community members"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- ============================================
-- Done! Kick status will now be visible to users
-- ============================================
