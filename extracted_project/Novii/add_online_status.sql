-- Add online status tracking to profiles table
-- Run this in your Supabase SQL Editor

-- Add is_online and last_seen columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better query performance on online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen DESC);

-- Optional: Create a function to automatically mark users as offline after 5 minutes of inactivity
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET is_online = FALSE
  WHERE is_online = TRUE 
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Optional: Update RLS policy to allow users to see online status of public profiles
CREATE POLICY "Users can view online status of public profiles" ON profiles
  FOR SELECT
  USING (
    NOT is_private OR 
    auth.uid() = id OR 
    auth.uid() IN (SELECT follower_id FROM follows WHERE following_id = profiles.id)
  );

-- Verification query
SELECT id, username, is_online, last_seen 
FROM profiles 
LIMIT 5;
