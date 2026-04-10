-- ============================================
-- COMMUNITIES FEATURE - COMPLETE SQL SCHEMA
-- ============================================
-- This schema implements a complete community/group messaging system
-- with proper relationships, policies, and security

-- ============================================
-- 1. COMMUNITIES TABLE
-- ============================================
-- Main table for storing community metadata
-- CRITICAL: Each community has a creator (created_by field)
-- The creator is automatically added as an admin in community_members

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Community metadata
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT CHECK (length(description) <= 500),
  avatar_url TEXT,
  
  -- Relationship to creator (user who created this community)
  -- CRITICAL: This field links the community to its creator
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Community settings
  members_count INTEGER DEFAULT 1 CHECK (members_count >= 1),
  is_private BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_communities_created_by ON communities(created_by);
CREATE INDEX idx_communities_is_private ON communities(is_private);
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);


-- ============================================
-- 2. COMMUNITY MEMBERS TABLE
-- ============================================
-- Junction table linking users to communities
-- Tracks membership, roles (admin/member), and join dates
-- IMPORTANT: The creator is ALWAYS an admin with role='admin'

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Member role
  -- 'admin' = community creator or appointed admin, can manage members/settings
  -- 'moderator' = can moderate content
  -- 'member' = regular member
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: A user can only join a community once
  UNIQUE(community_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_role ON community_members(role);
CREATE INDEX idx_community_members_joined ON community_members(joined_at DESC);


-- ============================================
-- 3. COMMUNITY MESSAGES TABLE
-- ============================================
-- Stores all messages sent in communities
-- Messages are timestamped and can be edited
-- Only members of the community can send messages

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL CHECK (length(content) >= 1),
  image_url TEXT,
  
  -- Edit tracking
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_community_messages_community ON community_messages(community_id);
CREATE INDEX idx_community_messages_sender ON community_messages(sender_id);
CREATE INDEX idx_community_messages_created ON community_messages(created_at DESC);
CREATE INDEX idx_community_messages_community_created ON community_messages(community_id, created_at DESC);


-- ============================================
-- 4. POLICIES (Row Level Security)
-- ============================================
-- Ensure users can only interact with communities they're members of

-- COMMUNITIES TABLE POLICIES
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view communities they created or are members of
CREATE POLICY "Users can view their communities"
  ON communities
  FOR SELECT
  USING (
    created_by = auth.uid() OR 
    id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Only creator can update community settings
CREATE POLICY "Only creator can update community"
  ON communities
  FOR UPDATE
  USING (created_by = auth.uid());

-- Policy: Only creator can delete community
CREATE POLICY "Only creator can delete community"
  ON communities
  FOR DELETE
  USING (created_by = auth.uid());

-- Policy: Any authenticated user can create community
CREATE POLICY "Authenticated users can create communities"
  ON communities
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- COMMUNITY MEMBERS TABLE POLICIES
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of communities they're in
CREATE POLICY "Users can view community members"
  ON community_members
  FOR SELECT
  USING (
    community_id IN (
      SELECT id FROM communities WHERE created_by = auth.uid()
    ) OR
    user_id = auth.uid() OR
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Community admin can add members
CREATE POLICY "Admins can add members"
  ON community_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Community admin can remove members
CREATE POLICY "Admins can remove members"
  ON community_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM community_members AS cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );


-- COMMUNITY MESSAGES TABLE POLICIES
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from communities they're members of
CREATE POLICY "Users can view community messages"
  ON community_messages
  FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    ) OR
    community_id IN (
      SELECT id FROM communities WHERE created_by = auth.uid()
    )
  );

-- Policy: Only community members can send messages
CREATE POLICY "Members can send messages"
  ON community_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only edit/delete their own messages
CREATE POLICY "Users can edit their messages"
  ON community_messages
  FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their messages"
  ON community_messages
  FOR DELETE
  USING (sender_id = auth.uid());


-- ============================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Auto-add creator as admin member when community is created
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (community_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Call function after community creation
DROP TRIGGER IF EXISTS trigger_add_creator_as_admin ON communities;
CREATE TRIGGER trigger_add_creator_as_admin
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_admin();


-- Function: Update community updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on community changes
DROP TRIGGER IF EXISTS trigger_update_community_timestamp ON communities;
CREATE TRIGGER trigger_update_community_timestamp
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_community_updated_at();


-- Function: Update community messages updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on message changes
DROP TRIGGER IF EXISTS trigger_update_message_timestamp ON community_messages;
CREATE TRIGGER trigger_update_message_timestamp
  BEFORE UPDATE ON community_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_community_message_updated_at();


-- ============================================
-- 6. GRANTS (Permissions)
-- ============================================

-- Grant all permissions to authenticated users on these tables
GRANT ALL ON communities TO authenticated;
GRANT ALL ON community_members TO authenticated;
GRANT ALL ON community_messages TO authenticated;

-- Grant default permissions to public (anonymous) users
GRANT USAGE ON SCHEMA public TO anon, authenticated;


-- ============================================
-- RELATIONSHIPS SUMMARY
-- ============================================
-- communities (1) ---- (Many) community_members
-- communities (1) ---- (Many) community_messages
-- profiles (1) ---- (Many) communities (via created_by)
-- profiles (1) ---- (Many) community_members (via user_id)
-- profiles (1) ---- (Many) community_messages (via sender_id)
--
-- DATA FLOW:
-- 1. User creates community → communities row with created_by = user_id
-- 2. Creator auto-added as admin → community_members row with role='admin'
-- 3. Creator can add other members → more community_members rows
-- 4. Members send messages → community_messages rows with sender_id = user_id
-- 5. All messages grouped by community_id
-- 6. Delete community → cascades to members and messages
-- 7. Delete user → cascades all their communities, memberships, and messages

-- ============================================
-- IMPORTANT SECURITY NOTES
-- ============================================
-- 1. Communities are always tied to their creator via created_by field
-- 2. Only members (in community_members table) can view/send messages
-- 3. Creator is automatically added as admin member
-- 4. Messages can only be sent by community members
-- 5. Each user can only join a community once (UNIQUE constraint)
-- 6. Cascade deletes ensure data consistency
-- 7. RLS policies enforce all access control at database level
