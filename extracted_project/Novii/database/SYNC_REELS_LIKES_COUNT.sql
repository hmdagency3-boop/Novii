-- ============================================================
-- SYNC & AUTO-UPDATE: Reels likes_count trigger
-- ============================================================
-- This ensures reels.likes_count updates automatically
-- whenever a like is added or removed
-- ============================================================

-- Step 1: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_reel_likes_on_insert ON likes CASCADE;
DROP TRIGGER IF EXISTS update_reel_likes_on_delete ON likes CASCADE;
DROP FUNCTION IF EXISTS update_reel_likes_count();

-- Step 2: Create function to update reel likes_count
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a like is added or removed
  IF TG_OP = 'INSERT' THEN
    -- If it's a reel like, increment count
    IF NEW.reel_id IS NOT NULL THEN
      UPDATE reels 
      SET likes_count = (
        SELECT COUNT(*) FROM likes WHERE reel_id = NEW.reel_id
      )
      WHERE id = NEW.reel_id;
      RAISE NOTICE 'Reel likes updated on INSERT: %', NEW.reel_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- If it's a reel like, recalculate count
    IF OLD.reel_id IS NOT NULL THEN
      UPDATE reels 
      SET likes_count = (
        SELECT COUNT(*) FROM likes WHERE reel_id = OLD.reel_id
      )
      WHERE id = OLD.reel_id;
      RAISE NOTICE 'Reel likes updated on DELETE: %', OLD.reel_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for INSERT
CREATE TRIGGER update_reel_likes_on_insert
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION update_reel_likes_count();

-- Step 4: Create trigger for DELETE
CREATE TRIGGER update_reel_likes_on_delete
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_reel_likes_count();

-- Step 5: Initial sync - update all reels with correct likes_count
UPDATE reels
SET likes_count = COALESCE((
  SELECT COUNT(*)
  FROM likes
  WHERE likes.reel_id = reels.id
    AND likes.reel_id IS NOT NULL
), 0);

-- Step 6: Verify triggers are working
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'update_reel_likes%';

-- Step 7: Show all reels and their like counts
SELECT 
  id,
  caption,
  likes_count,
  created_at
FROM reels
ORDER BY created_at DESC;

-- ============================================================
-- ✅ DONE! Automatic sync enabled!
-- From now on, reels.likes_count updates automatically
-- whenever a like is added or removed
-- ============================================================
