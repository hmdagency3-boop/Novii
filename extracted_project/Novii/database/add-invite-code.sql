-- ============================================
-- ADD INVITE CODE TO COMMUNITIES
-- ============================================
-- This migration adds a secret invite code to each community
-- The code is used for joining the community

-- Add invite_code column
ALTER TABLE communities ADD COLUMN invite_code TEXT UNIQUE NOT NULL DEFAULT '';

-- Generate unique codes for existing communities (if any)
UPDATE communities 
SET invite_code = substring(md5(id::text || now()::text), 1, 8)
WHERE invite_code = '';

-- Add unique constraint (already set in schema but ensuring in DB)
ALTER TABLE communities ADD CONSTRAINT unique_invite_code UNIQUE (invite_code);

-- Create index for faster lookups
CREATE INDEX idx_communities_invite_code ON communities(invite_code);

-- ============================================
-- Done!
