-- ============================================
-- ADD INVITE CODE COLUMN TO COMMUNITIES
-- ============================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- This adds secret invite codes to each community

-- Step 1: Add the invite_code column
ALTER TABLE communities ADD COLUMN invite_code TEXT UNIQUE;

-- Step 2: Generate codes for existing communities
UPDATE communities 
SET invite_code = UPPER(SUBSTRING(MD5(CAST(RANDOM() AS TEXT) || NOW()::TEXT), 1, 8))
WHERE invite_code IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE communities ALTER COLUMN invite_code SET NOT NULL;

-- Step 4: Create index for faster lookups
CREATE INDEX idx_communities_invite_code ON communities(invite_code);

-- ============================================
-- Done! The invite code system is ready
-- ============================================
