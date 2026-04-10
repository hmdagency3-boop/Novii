-- ============================================================
-- LIKES TABLE FIX - Remove check constraint that blocks reels
-- ============================================================
-- This fixes the check constraint that prevents reel likes
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Drop the check constraint that's blocking reels
ALTER TABLE likes
DROP CONSTRAINT IF EXISTS likes_check;

-- Step 2: Add reel_id column if it doesn't exist
ALTER TABLE likes
ADD COLUMN IF NOT EXISTS reel_id UUID REFERENCES reels(id) ON DELETE CASCADE;

-- Step 3: Make post_id nullable (drop NOT NULL)
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE likes ALTER COLUMN post_id DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if already nullable
  END;
END $$;

-- Step 4: Drop old unique indexes/constraints if they exist
DROP INDEX IF EXISTS idx_unique_post_like;
DROP INDEX IF EXISTS idx_unique_reel_like;

-- Step 5: Create new partial unique indexes
CREATE UNIQUE INDEX idx_unique_post_like ON likes(user_id, post_id) 
WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_reel_like ON likes(user_id, reel_id) 
WHERE reel_id IS NOT NULL;

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_likes_reel_id ON likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel_user ON likes(reel_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel_created ON likes(reel_id, created_at DESC);

-- Step 7: Create/update trigger functions
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

-- Step 8: Drop and recreate triggers
DROP TRIGGER IF EXISTS handle_reel_like_insert_trigger ON likes;
DROP TRIGGER IF EXISTS handle_reel_like_delete_trigger ON likes;

CREATE TRIGGER handle_reel_like_insert_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_reel_like_insert();

CREATE TRIGGER handle_reel_like_delete_trigger
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_reel_like_delete();

-- ============================================================
-- DONE!
-- ============================================================
-- Now you should be able to like reels without errors!
-- ============================================================
