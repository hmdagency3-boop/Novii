-- ============================================
-- ADD TYPING INDICATORS TABLE FOR COMMUNITIES
-- ============================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- Shows who is typing in real-time in community chats

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id TEXT PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_typing_indicators_community_id ON typing_indicators(community_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON typing_indicators(updated_at);

-- Enable Row Level Security
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read typing indicators
CREATE POLICY "Anyone can read typing indicators"
  ON typing_indicators FOR SELECT
  USING (true);

-- RLS Policy: Users can only insert/update/delete their own typing status
CREATE POLICY "Users can manage their own typing status"
  ON typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
  ON typing_indicators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
  ON typing_indicators FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Done! Real-time typing indicators are ready
-- ============================================
