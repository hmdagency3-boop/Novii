-- ============================================================
-- ADD NESTED REPLIES/PARENT_COMMENT_ID SUPPORT
-- ============================================================
-- This migration adds support for nested replies on comments
-- Run this in your Supabase SQL Editor

-- Add parent_comment_id column to comments table
ALTER TABLE comments
ADD COLUMN parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Create index for parent_comment_id for efficient querying
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);

-- Create index for efficiently fetching replies for a comment
CREATE INDEX IF NOT EXISTS idx_comments_parent_created ON comments(parent_comment_id, created_at DESC);

-- ============================================================
-- END OF NESTED REPLIES SUPPORT MIGRATION
-- ============================================================
