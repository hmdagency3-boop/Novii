-- Profiles Table - Documentation
-- Updated: November 25, 2025
-- 
-- This file documents the current state of the profiles table after
-- the username validation fix (Nov 25, 2025).
--
-- NOTE: No database changes were required for this fix.
-- The fix was purely in the application code (server/routes.ts)
-- to use Drizzle ORM instead of raw neon client.

-- ============================================
-- Current Profiles Table Structure
-- ============================================

CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  full_name text,
  bio text,
  avatar_url text,
  cover_url text,
  website text,
  location text,
  is_verified boolean DEFAULT false,
  is_private boolean DEFAULT false,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  is_official boolean DEFAULT false,
  verified_at timestamp with time zone,
  pending_follow_requests_count integer DEFAULT 0,
  hide_online_status boolean DEFAULT false,
  is_creator boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  is_popular boolean DEFAULT false,
  is_active boolean DEFAULT false,
  creator_at timestamp with time zone,
  premium_at timestamp with time zone,
  popular_at timestamp with time zone,
  active_at timestamp with time zone,
  is_banned boolean DEFAULT false,
  banned_reason text,
  ban_until timestamp without time zone,
  role text DEFAULT 'user',
  is_gold_early_member boolean DEFAULT false,
  is_silver_early_member boolean DEFAULT false,
  is_bronze_early_member boolean DEFAULT false,
  is_beta_tester boolean DEFAULT false,
  gold_early_member_at timestamp with time zone,
  silver_early_member_at timestamp with time zone,
  bronze_early_member_at timestamp with time zone,
  beta_tester_at timestamp with time zone,
  gender text
);

-- ============================================
-- Key Constraints
-- ============================================

-- Username is UNIQUE (case-insensitive in queries)
-- This constraint is enforced at the database level

-- ============================================
-- Changes Made on Nov 25, 2025
-- ============================================
-- 
-- CODE CHANGES ONLY (No database changes needed):
-- 
-- 1. File: server/routes.ts
--    Changed: POST /api/auth/check-username endpoint
--    From: Using neon client with raw SQL
--    To: Using Drizzle ORM for queries
--    
-- 2. Implementation: Case-insensitive username lookup
--    Query: SELECT id FROM profiles WHERE LOWER(username) = LOWER($1)
--    
-- 3. Edit Mode Support: Exclude current user from uniqueness check
--    Query: WHERE LOWER(username) = LOWER($1) AND id != $2
--
-- Database remains unchanged and fully compatible.

-- ============================================
-- Verification Queries
-- ============================================

-- Check if username exists (case-insensitive)
-- SELECT id FROM profiles 
-- WHERE LOWER(username) = LOWER('desired_username')
-- LIMIT 1;

-- Check all users and their usernames
-- SELECT id, username, full_name FROM profiles;

-- Verify unique constraint on username
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'profiles' AND constraint_type = 'UNIQUE';
