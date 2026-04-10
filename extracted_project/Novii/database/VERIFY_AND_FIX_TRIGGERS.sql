-- ============================================================
-- VERIFY & FIX: Check and remove conflicting triggers
-- ============================================================
-- This script:
-- 1. Removes ALL old/conflicting triggers
-- 2. Sets up the correct permanent trigger
-- 3. Verifies everything is working
-- ============================================================

-- Step 1: List ALL existing triggers on likes table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'likes'
ORDER BY trigger_name;

-- Step 2: Drop ALL old triggers and functions
DROP TRIGGER IF EXISTS handle_reel_like_insert_trigger ON likes CASCADE;
DROP TRIGGER IF EXISTS handle_reel_like_delete_trigger ON likes CASCADE;
DROP TRIGGER IF EXISTS update_reel_likes_on_insert ON likes CASCADE;
DROP TRIGGER IF EXISTS update_reel_likes_on_delete ON likes CASCADE;
DROP TRIGGER IF EXISTS increment_reel_likes_count ON likes CASCADE;
DROP TRIGGER IF EXISTS decrement_reel_likes_count ON likes CASCADE;

DROP FUNCTION IF EXISTS handle_reel_like_insert();
DROP FUNCTION IF EXISTS handle_reel_like_delete();
DROP FUNCTION IF EXISTS update_reel_likes_count();

-- Step 3: Create the correct permanent trigger function
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: increment likes_count
  IF TG_OP = 'INSERT' AND NEW.reel_id IS NOT NULL THEN
    UPDATE reels 
    SET likes_count = likes_count + 1,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.reel_id;
    RAISE NOTICE 'Reel % like count incremented to %', NEW.reel_id, 
      (SELECT likes_count FROM reels WHERE id = NEW.reel_id);
    
  -- On DELETE: decrement likes_count
  ELSIF TG_OP = 'DELETE' AND OLD.reel_id IS NOT NULL THEN
    UPDATE reels 
    SET likes_count = GREATEST(likes_count - 1, 0),
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.reel_id;
    RAISE NOTICE 'Reel % like count decremented to %', OLD.reel_id, 
      (SELECT likes_count FROM reels WHERE id = OLD.reel_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for INSERT
CREATE TRIGGER update_reel_likes_on_insert
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION update_reel_likes_count();

-- Step 5: Create trigger for DELETE
CREATE TRIGGER update_reel_likes_on_delete
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_reel_likes_count();

-- Step 6: Verify triggers are created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE 'update_reel_likes%'
ORDER BY trigger_name;

-- Step 7: Initial sync - ensure all reels have correct counts
UPDATE reels
SET likes_count = (
  SELECT COUNT(*) 
  FROM likes 
  WHERE likes.reel_id = reels.id 
    AND likes.reel_id IS NOT NULL
);

-- Step 8: Show all reels with their correct counts
SELECT 
  id,
  caption,
  likes_count,
  (SELECT COUNT(*) FROM likes WHERE likes.reel_id = reels.id) as actual_count,
  created_at
FROM reels
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- ✅ ALL DONE!
-- Triggers are now set to auto-update likes_count
-- INSERT → likes_count + 1
-- DELETE → likes_count - 1
-- Updates happen IMMEDIATELY and PERMANENTLY
-- ============================================================
