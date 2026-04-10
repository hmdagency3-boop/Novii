-- ============================================================
-- FIX: Add reel_id column to likes table
-- ============================================================
-- Purpose: Enable likes to be associated with reels
-- This allows the reel_likes_count trigger to work properly
-- ============================================================

-- Step 1: Add reel_id column to likes table
ALTER TABLE likes 
ADD COLUMN reel_id UUID REFERENCES reels(id) ON DELETE CASCADE;

-- Step 2: Make post_id nullable (so likes can be for posts OR reels)
ALTER TABLE likes
ALTER COLUMN post_id DROP NOT NULL;

-- Step 3: Update unique constraint to handle both post and reel likes
-- Drop old unique constraint
ALTER TABLE likes
DROP CONSTRAINT IF EXISTS likes_user_id_post_id_key;

-- Step 4: Create new unique constraint that allows either post_id or reel_id
-- A like can have either post_id OR reel_id, but not both
-- We'll use a composite unique constraint
ALTER TABLE likes
ADD CONSTRAINT likes_user_post_reel_unique UNIQUE (user_id, post_id, reel_id);

-- Step 5: Create index for reel_id lookups
CREATE INDEX IF NOT EXISTS idx_likes_reel_id ON likes(reel_id);

-- Step 6: Add constraint to ensure either post_id or reel_id is not null
ALTER TABLE likes
ADD CONSTRAINT likes_post_or_reel_not_null 
CHECK ((post_id IS NOT NULL AND reel_id IS NULL) OR (post_id IS NULL AND reel_id IS NOT NULL));

-- Step 7: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'likes'
ORDER BY ordinal_position;

-- ============================================================
-- DONE! Now likes table supports reel_id
-- The trigger will now work properly to update reels.likes_count
-- ============================================================
