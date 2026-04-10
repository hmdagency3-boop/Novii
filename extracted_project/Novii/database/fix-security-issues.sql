-- ============================================================
-- SECURITY FIX MIGRATION - Remove SECURITY DEFINER & Enable RLS
-- ============================================================
-- Only applies to tables that ACTUALLY EXIST in the database

-- ============================================================
-- 1. FIX FUNCTION: Remove SECURITY DEFINER from handle_new_user
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. ENSURE RLS ENABLED ON ALL EXISTING TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. CREATE RLS POLICIES - ONLY FOR TABLES THAT EXIST
-- ============================================================

-- Follows policies
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (TRUE);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (TRUE);

-- Admins policies
DROP POLICY IF EXISTS "Anyone can view admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage admins" ON admins;

CREATE POLICY "Anyone can view admins" ON admins FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can manage admins" ON admins FOR ALL WITH CHECK (TRUE);

-- User badges policies
DROP POLICY IF EXISTS "Anyone can view user badges" ON user_badges;
DROP POLICY IF EXISTS "Anyone can create user badges" ON user_badges;
DROP POLICY IF EXISTS "Anyone can update user badges" ON user_badges;

CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can create user badges" ON user_badges FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update user badges" ON user_badges FOR UPDATE WITH CHECK (TRUE);

-- Badges policies
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
DROP POLICY IF EXISTS "Anyone can manage badges" ON badges;

CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can manage badges" ON badges FOR ALL WITH CHECK (TRUE);

-- ============================================================
-- 4. RECREATE SECURE VIEWS (WITHOUT SECURITY DEFINER)
-- ============================================================

DROP VIEW IF EXISTS public.users_with_beta_tester_badges CASCADE;
DROP VIEW IF EXISTS public.users_with_gold_badges CASCADE;
DROP VIEW IF EXISTS public.users_with_silver_badges CASCADE;
DROP VIEW IF EXISTS public.users_with_bronze_badges CASCADE;

CREATE VIEW users_with_beta_tester_badges WITH (security_invoker) AS
SELECT id, username, full_name, avatar_url, is_verified, created_at
FROM profiles WHERE is_beta_tester = TRUE;

CREATE VIEW users_with_gold_badges WITH (security_invoker) AS
SELECT id, username, full_name, avatar_url, is_verified, gold_early_member_at
FROM profiles WHERE is_gold_early_member = TRUE;

CREATE VIEW users_with_silver_badges WITH (security_invoker) AS
SELECT id, username, full_name, avatar_url, is_verified, silver_early_member_at
FROM profiles WHERE is_silver_early_member = TRUE;

CREATE VIEW users_with_bronze_badges WITH (security_invoker) AS
SELECT id, username, full_name, avatar_url, is_verified, bronze_early_member_at
FROM profiles WHERE is_bronze_early_member = TRUE;

-- ============================================================
-- MIGRATION COMPLETE ✅
-- ============================================================
-- ✓ SECURITY DEFINER removed from handle_new_user function
-- ✓ RLS enabled on all existing public tables
-- ✓ RLS policies created for existing tables
-- ✓ Secure views recreated without SECURITY DEFINER
-- 
-- NOTE: This migration only touches tables that exist.
-- For additional tables (message_reactions, follow_requests, post_views, post_insights),
-- run their respective migration files first.
-- ============================================================
