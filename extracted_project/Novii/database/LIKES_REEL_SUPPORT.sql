-- ============================================================
-- LIKES TABLE MIGRATION - Add Reel Support (SAFE VERSION)
-- ============================================================
-- This migration adds reel_id support to the likes table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Add reel_id column to likes table
ALTER TABLE likes
ADD COLUMN IF NOT EXISTS reel_id UUID REFERENCES reels(id) ON DELETE CASCADE;

-- Step 2: Make post_id nullable (if not already)
ALTER TABLE likes
ALTER COLUMN post_id DROP NOT NULL;

-- Step 3: Drop old unique constraint (safely)
ALTER TABLE likes
DROP CONSTRAINT IF EXISTS likes_user_id_post_id_key;

-- Step 4: Drop old indexes (if they exist)
DROP INDEX IF EXISTS idx_unique_post_like;
DROP INDEX IF EXISTS idx_unique_reel_like;

-- Step 5: Create partial unique indexes
CREATE UNIQUE INDEX idx_unique_post_like ON likes(user_id, post_id) 
WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_reel_like ON likes(user_id, reel_id) 
WHERE reel_id IS NOT NULL;

-- Step 6: Create regular indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_reel_id ON likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel_user ON likes(reel_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel_created ON likes(reel_id, created_at DESC);

-- Step 7: Create trigger function to update reel likes_count on INSERT
CREATE OR REPLACE FUNCTION handle_reel_like_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reel_id IS NOT NULL THEN
    UPDATE reels
    SET likes_count = likes_count + 1
    WHERE id = NEW.reel_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger function to update reel likes_count on DELETE
CREATE OR REPLACE FUNCTION handle_reel_like_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.reel_id IS NOT NULL THEN
    UPDATE reels
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.reel_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Drop old triggers (if exist)
DROP TRIGGER IF EXISTS handle_reel_like_insert_trigger ON likes;
DROP TRIGGER IF EXISTS handle_reel_like_delete_trigger ON likes;

-- Step 10: Create triggers for reel likes
CREATE TRIGGER handle_reel_like_insert_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_reel_like_insert();

CREATE TRIGGER handle_reel_like_delete_trigger
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_reel_like_delete();

-- Step 11: Update RLS policies
DROP POLICY IF EXISTS "Authenticated users can like posts" ON likes;
CREATE POLICY "Authenticated users can like posts and reels"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- END OF LIKES REEL SUPPORT MIGRATION
-- ============================================================
-- Summary:
-- ✅ Added reel_id column safely
-- ✅ Made post_id nullable
-- ✅ Used partial unique indexes
-- ✅ Created triggers for auto-increment likes_count
-- ✅ All old constraints/indexes dropped safely
-- ============================================================
