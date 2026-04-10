-- ============================================================
-- FIX LIKES CHECK CONSTRAINT - Remove and clean data
-- ============================================================

-- Step 1: Drop the old check constraint first
ALTER TABLE likes
DROP CONSTRAINT IF EXISTS likes_check;

-- Step 2: Delete any invalid rows (both post_id and reel_id are NULL)
DELETE FROM likes
WHERE post_id IS NULL AND reel_id IS NULL;

-- Step 3: Create a new check constraint that allows both posts and reels
-- (but at least ONE must have a value)
ALTER TABLE likes
ADD CONSTRAINT likes_check CHECK (
  (post_id IS NOT NULL AND reel_id IS NULL) OR
  (post_id IS NULL AND reel_id IS NOT NULL)
);

-- ============================================================
-- DONE - Now reel likes should work!
-- ============================================================
