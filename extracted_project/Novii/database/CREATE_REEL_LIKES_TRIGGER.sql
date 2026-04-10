-- ============================================================
-- CREATE REEL LIKES TRIGGER - Update likes_count automatically
-- ============================================================
-- This trigger updates the reels.likes_count whenever a like is added/removed
-- ============================================================

-- Step 1: Drop old triggers if they exist
DROP TRIGGER IF EXISTS handle_reel_like_insert_trigger ON likes;
DROP TRIGGER IF EXISTS handle_reel_like_delete_trigger ON likes;
DROP FUNCTION IF EXISTS handle_reel_like_insert();
DROP FUNCTION IF EXISTS handle_reel_like_delete();

-- Step 2: Create function for INSERT
CREATE OR REPLACE FUNCTION handle_reel_like_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reel_id IS NOT NULL THEN
    UPDATE reels
    SET likes_count = likes_count + 1
    WHERE id = NEW.reel_id;
    
    RAISE NOTICE 'Reel like count incremented for reel: %', NEW.reel_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function for DELETE
CREATE OR REPLACE FUNCTION handle_reel_like_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.reel_id IS NOT NULL THEN
    UPDATE reels
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.reel_id;
    
    RAISE NOTICE 'Reel like count decremented for reel: %', OLD.reel_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for INSERT
CREATE TRIGGER handle_reel_like_insert_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_reel_like_insert();

-- Step 5: Create trigger for DELETE
CREATE TRIGGER handle_reel_like_delete_trigger
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_reel_like_delete();

-- ============================================================
-- Verify triggers are created
-- ============================================================
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'handle_reel_like%';

-- ============================================================
-- Test: Manually sync likes_count for all reels (in case there were old likes)
-- ============================================================
UPDATE reels
SET likes_count = COALESCE((
  SELECT COUNT(*)
  FROM likes
  WHERE likes.reel_id = reels.id
), 0);

-- ============================================================
-- DONE! Now reel likes_count will auto-update!
-- ============================================================
