-- ============================================================
-- FUNCTION SEARCH_PATH FIX - Security Enhancement ✅
-- ============================================================
-- This migration adds proper search_path to all functions
-- to prevent privilege escalation attacks
-- Status: 14+ functions fixed, 7+ pending (require missing tables)
-- ============================================================

-- ============================================================
-- DROP OLD FUNCTION SIGNATURES (if they exist with different return types)
-- ============================================================
DROP FUNCTION IF EXISTS get_user_saved_posts(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_post_saved(uuid, uuid) CASCADE;

-- ============================================================
-- 1. CORE TRIGGER FUNCTIONS - from schema.sql ✅ APPLIED
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Create profile on user signup
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
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Increment posts_count
CREATE OR REPLACE FUNCTION increment_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Decrement posts_count
CREATE OR REPLACE FUNCTION decrement_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET posts_count = posts_count - 1 WHERE id = OLD.user_id AND posts_count > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Increment follow counts
CREATE OR REPLACE FUNCTION increment_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Decrement follow counts
CREATE OR REPLACE FUNCTION decrement_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id AND following_count > 0;
  UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id AND followers_count > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Increment likes_count on like insert
CREATE OR REPLACE FUNCTION increment_likes_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Decrement likes_count on like delete
CREATE OR REPLACE FUNCTION decrement_likes_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Increment comments_count
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Decrement comments_count
CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id AND comments_count > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- ============================================================
-- 2. BADGE FUNCTIONS - from add-badges-to-profiles.sql ✅ APPLIED
-- ============================================================

-- Function: Award badge to user
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_type TEXT)
RETURNS TABLE (id UUID, username VARCHAR, badge_awarded BOOLEAN, awarded_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_award_at TIMESTAMP WITH TIME ZONE := TIMEZONE('utc', NOW());
  v_badge_awarded BOOLEAN := FALSE;
BEGIN
  CASE p_badge_type
    WHEN 'gold_early_member' THEN
      UPDATE profiles SET is_gold_early_member = TRUE, gold_early_member_at = v_award_at WHERE id = p_user_id;
      v_badge_awarded := TRUE;
    WHEN 'silver_early_member' THEN
      UPDATE profiles SET is_silver_early_member = TRUE, silver_early_member_at = v_award_at WHERE id = p_user_id;
      v_badge_awarded := TRUE;
    WHEN 'bronze_early_member' THEN
      UPDATE profiles SET is_bronze_early_member = TRUE, bronze_early_member_at = v_award_at WHERE id = p_user_id;
      v_badge_awarded := TRUE;
    WHEN 'beta_tester' THEN
      UPDATE profiles SET is_beta_tester = TRUE, beta_tester_at = v_award_at WHERE id = p_user_id;
      v_badge_awarded := TRUE;
  END CASE;
  RETURN QUERY SELECT profiles.id, profiles.username, v_badge_awarded, v_award_at;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Function: Remove badge from user
CREATE OR REPLACE FUNCTION remove_badge(p_user_id UUID, p_badge_type TEXT)
RETURNS TABLE (id UUID, username VARCHAR, badge_removed BOOLEAN) AS $$
BEGIN
  CASE p_badge_type
    WHEN 'gold_early_member' THEN UPDATE profiles SET is_gold_early_member = FALSE, gold_early_member_at = NULL WHERE id = p_user_id;
    WHEN 'silver_early_member' THEN UPDATE profiles SET is_silver_early_member = FALSE, silver_early_member_at = NULL WHERE id = p_user_id;
    WHEN 'bronze_early_member' THEN UPDATE profiles SET is_bronze_early_member = FALSE, bronze_early_member_at = NULL WHERE id = p_user_id;
    WHEN 'beta_tester' THEN UPDATE profiles SET is_beta_tester = FALSE, beta_tester_at = NULL WHERE id = p_user_id;
  END CASE;
  RETURN QUERY SELECT profiles.id, profiles.username, TRUE;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- ============================================================
-- 3. SAVED POSTS HELPER FUNCTIONS ✅ APPLIED
-- ============================================================

-- Function: Get user's saved posts (with proper DROP first)
CREATE OR REPLACE FUNCTION get_user_saved_posts(p_user_id UUID)
RETURNS TABLE(post_id UUID, username TEXT, caption TEXT, image_url TEXT, likes_count INTEGER, comments_count INTEGER, saved_at TIMESTAMP) AS $$
SELECT p.id, pr.username, p.caption, p.image_url, p.likes_count, p.comments_count, sp.created_at
FROM saved_posts sp JOIN posts p ON sp.post_id = p.id JOIN profiles pr ON p.user_id = pr.id
WHERE sp.user_id = p_user_id ORDER BY sp.created_at DESC;
$$ LANGUAGE sql SET search_path = pg_catalog, public;

-- Function: Check if post is saved
CREATE OR REPLACE FUNCTION is_post_saved(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS(SELECT 1 FROM saved_posts WHERE user_id = p_user_id AND post_id = p_post_id);
$$ LANGUAGE sql SET search_path = pg_catalog, public;

-- ============================================================
-- 4. PENDING FUNCTIONS - Require additional table creation
-- ============================================================
-- These functions cannot be applied yet because they require tables
-- that haven't been created in the current database:
-- 
-- PENDING (need follow_requests table):
-- - auto_approve_follow_request()
-- - approve_follow_request()
-- - get_pending_follow_requests_count(user_id)
-- - has_pending_follow_request(requester_id, recipient_id)
--
-- PENDING (need post_views & post_insights tables):
-- - update_post_views_count()
-- - update_post_saves_count()
-- - get_post_insights(p_post_id)
--
-- To apply these, first run the appropriate migration to create:
-- - database/follow_requests_schema.sql (for follow requests functions)
-- - database/POST_SETTINGS_MIGRATIONS_FIXED.sql (for post views/insights functions)
-- ============================================================

-- ============================================================
-- MIGRATION STATUS ✅
-- ============================================================
-- Applied: 14 functions
-- ✅ 10 core trigger functions (100% with search_path)
-- ✅ 2 badge functions (100% with search_path)
-- ✅ 2 saved posts helper functions (100% with search_path)
--
-- Pending: 7+ functions (waiting for table creation)
-- ⏳ 4 follow request functions (requires follow_requests table)
-- ⏳ 3 post analytics functions (requires post_views/post_insights tables)
--
-- Security Impact:
-- ✅ Prevents privilege escalation via search_path manipulation
-- ✅ All applied functions now use: SET search_path = pg_catalog, public
-- ✅ 100% of currently applied functions are secured
-- ============================================================
