-- ================================================================
-- Migration: Add reel comments support + fix reel likes constraint
-- Run this in Supabase SQL editor
-- ================================================================

-- 1. Make post_id nullable in comments (to allow reel comments)
ALTER TABLE comments ALTER COLUMN post_id DROP NOT NULL;

-- 2. Add reel_id column to comments if not exists
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reel_id UUID REFERENCES reels(id) ON DELETE CASCADE;

-- 3. Add index on reel_id for performance
CREATE INDEX IF NOT EXISTS idx_comments_reel_id ON comments(reel_id);

-- 4. Add UNIQUE constraint for reel likes (prevent duplicate likes)
-- First remove any accidental duplicates
DELETE FROM likes a USING likes b
WHERE a.id > b.id
  AND a.reel_id = b.reel_id
  AND a.user_id = b.user_id
  AND a.reel_id IS NOT NULL;

-- Then add the unique constraint
ALTER TABLE likes DROP CONSTRAINT IF EXISTS unique_reel_user_like;
ALTER TABLE likes ADD CONSTRAINT unique_reel_user_like
  UNIQUE (reel_id, user_id);

-- 5. Update trigger to handle reel comments count
CREATE OR REPLACE FUNCTION update_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reel_id IS NOT NULL AND NEW.parent_comment_id IS NULL THEN
    UPDATE reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reel_id IS NOT NULL AND OLD.parent_comment_id IS NULL THEN
    UPDATE reels SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.reel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reel_comments_count ON comments;
CREATE TRIGGER trigger_update_reel_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_reel_comments_count();
