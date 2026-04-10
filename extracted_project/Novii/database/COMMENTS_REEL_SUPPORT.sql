-- ============================================================
-- ADD REEL SUPPORT TO COMMENTS TABLE
-- ============================================================
-- This migration adds support for comments on reels
-- Run this in your Supabase SQL Editor

-- Add reel_id column to comments table
ALTER TABLE comments
ADD COLUMN reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
ALTER COLUMN post_id DROP NOT NULL;

-- Update the UNIQUE constraint to allow null post_id or reel_id
-- Drop old unique constraint if it exists
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS comments_post_id_user_id_unique;

-- Create new indexes for reel comments
CREATE INDEX IF NOT EXISTS idx_comments_reel_id ON comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_comments_reel_created ON comments(reel_id, created_at DESC);

-- ============================================================
-- END OF COMMENTS REEL SUPPORT MIGRATION
-- ============================================================
