-- ============================================================
-- Follow Requests Migration for Private Accounts
-- ============================================================
-- Add columns to existing tables for follow requests support
-- Execute this file after the main schema.sql
-- ============================================================

-- ============================================================
-- 1. ADD COLUMNS TO PROFILES TABLE (if not exists)
-- ============================================================

-- Check if is_private column exists, if not add it
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pending_follow_requests_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on private accounts
CREATE INDEX IF NOT EXISTS idx_profiles_is_private ON profiles(is_private) WHERE is_private = TRUE;

-- ============================================================
-- 2. CREATE FOLLOW REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);

-- Indexes for follow requests
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_recipient ON follow_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);
CREATE INDEX IF NOT EXISTS idx_follow_requests_recipient_status ON follow_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_requests_created_at ON follow_requests(created_at DESC);

-- Enable RLS on follow requests
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- Policies for follow requests
CREATE POLICY "Anyone can view their own follow requests"
  ON follow_requests FOR SELECT
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Users can create follow requests"
  ON follow_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can update follow request status"
  ON follow_requests FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Requesters can delete their own requests"
  ON follow_requests FOR DELETE
  USING (auth.uid() = requester_id);

-- ============================================================
-- 3. ADD COLUMN TO NOTIFICATIONS TABLE (if exists)
-- ============================================================

-- Add follow_request type support to notifications
-- The notifications table should already have a 'type' column
-- Make sure it accepts 'follow_request' as a valid type

-- ============================================================
-- 4. TRIGGER TO AUTO-APPROVE FOLLOW REQUESTS FOR PUBLIC ACCOUNTS
-- ============================================================

CREATE OR REPLACE FUNCTION auto_approve_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if recipient has private account
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.recipient_id AND is_private = FALSE
  ) THEN
    -- Auto-convert to follow for public accounts
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.recipient_id)
    ON CONFLICT DO NOTHING;
    
    -- Update status to approved
    NEW.status := 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_approve_follow_request ON follow_requests;
CREATE TRIGGER trigger_auto_approve_follow_request
  BEFORE INSERT ON follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_follow_request();

-- ============================================================
-- 5. TRIGGER TO CREATE FOLLOW WHEN REQUEST IS APPROVED
-- ============================================================

CREATE OR REPLACE FUNCTION approve_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to approved, create a follow relationship
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.recipient_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_approve_follow_request ON follow_requests;
CREATE TRIGGER trigger_approve_follow_request
  AFTER UPDATE ON follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION approve_follow_request();

-- ============================================================
-- 6. VIEWS FOR EASIER QUERYING
-- ============================================================

-- View for pending follow requests with requester details
CREATE OR REPLACE VIEW pending_follow_requests_with_profile AS
SELECT 
  fr.id,
  fr.requester_id,
  fr.recipient_id,
  fr.created_at,
  p.username,
  p.full_name,
  p.avatar_url,
  p.is_verified
FROM follow_requests fr
JOIN profiles p ON fr.requester_id = p.id
WHERE fr.status = 'pending';

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Function to get pending follow requests count
CREATE OR REPLACE FUNCTION get_pending_follow_requests_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follow_requests 
  WHERE recipient_id = user_id AND status = 'pending'
$$ LANGUAGE sql;

-- Function to check if a follow request exists
CREATE OR REPLACE FUNCTION has_pending_follow_request(requester_id UUID, recipient_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM follow_requests 
    WHERE follow_requests.requester_id = $1 
    AND follow_requests.recipient_id = $2
    AND status = 'pending'
  )
$$ LANGUAGE sql;

-- ============================================================
-- SUMMARY OF CHANGES
-- ============================================================
-- 1. Added is_private to profiles table (already exists)
-- 2. Created follow_requests table to track pending follow requests
-- 3. Added RLS policies for follow_requests
-- 4. Created triggers to auto-approve requests for public accounts
-- 5. Created triggers to convert approved requests to follows
-- 6. Added helper functions for querying
-- ============================================================
