-- ============================================================
-- REELS TABLE MIGRATION
-- ============================================================
-- This migration adds the reels table to support video content
-- Run this in your Supabase SQL Editor immediately
-- ============================================================

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Reels Table
CREATE TABLE IF NOT EXISTS reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  caption TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_user_created ON reels(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reels are viewable by everyone"
  ON reels FOR SELECT
  USING (
    -- User's own reels are always visible
    reels.user_id = auth.uid()
    OR
    -- Public reels from public profiles
    (
      reels.is_private = FALSE
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = reels.user_id
        AND profiles.is_private = FALSE
      )
    )
  );

CREATE POLICY "Users can insert own reels"
  ON reels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reels"
  ON reels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reels"
  ON reels FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_reels_updated_at
  BEFORE UPDATE ON reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- END OF REELS TABLE MIGRATION
-- ============================================================
