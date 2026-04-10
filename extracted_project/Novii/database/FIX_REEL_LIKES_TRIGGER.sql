-- ============================================================
-- FIX: Correct reel likes_count trigger logic
-- ============================================================
-- Problem: On DELETE, COUNT(*) gives wrong result 
-- because row is already deleted from likes table
-- Solution: Decrement likes_count directly instead of recounting
-- ============================================================

-- Step 1: Drop existing triggers
DROP TRIGGER IF EXISTS update_reel_likes_on_insert ON likes CASCADE;
DROP TRIGGER IF EXISTS update_reel_likes_on_delete ON likes CASCADE;
DROP FUNCTION IF EXISTS update_reel_likes_count();

-- Step 2: Create corrected function
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a like is ADDED
  IF TG_OP = 'INSERT' THEN
    IF NEW.reel_id IS NOT NULL THEN
      -- Increment likes_count by 1
      UPDATE reels 
      SET likes_count = likes_count + 1
      WHERE id = NEW.reel_id;
      RAISE NOTICE 'Reel like count incremented for: %', NEW.reel_id;
    END IF;
    
  -- When a like is REMOVED
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reel_id IS NOT NULL THEN
      -- Decrement likes_count by 1 (never go below 0)
      UPDATE reels 
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE id = OLD.reel_id;
      RAISE NOTICE 'Reel like count decremented for: %', OLD.reel_id;
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

-- Step 5: Verify triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'update_reel_likes%'
ORDER BY trigger_name;

-- ============================================================
-- ✅ FIXED! Now:
-- INSERT → likes_count + 1 ✅
-- DELETE → likes_count - 1 ✅
-- No more counting errors!
-- ============================================================
