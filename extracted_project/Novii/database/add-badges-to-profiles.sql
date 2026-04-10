-- ============================================================
-- ADD BADGES/MEDALS COLUMNS TO PROFILES TABLE
-- ============================================================

-- Add the four new medal columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_gold_early_member BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_silver_early_member BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bronze_early_member BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT FALSE;

-- Add timestamps for when badges were awarded
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gold_early_member_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS silver_early_member_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bronze_early_member_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_tester_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient queries on badge columns
CREATE INDEX IF NOT EXISTS idx_profiles_gold_early_member ON profiles(is_gold_early_member) WHERE is_gold_early_member = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_silver_early_member ON profiles(is_silver_early_member) WHERE is_silver_early_member = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_bronze_early_member ON profiles(is_bronze_early_member) WHERE is_bronze_early_member = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_beta_tester ON profiles(is_beta_tester) WHERE is_beta_tester = TRUE;

-- Create a helper function to award badge to user (admin only)
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_type TEXT
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  badge_awarded BOOLEAN,
  awarded_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_award_at TIMESTAMP WITH TIME ZONE := TIMEZONE('utc', NOW());
  v_badge_awarded BOOLEAN := FALSE;
BEGIN
  -- Update the appropriate badge column based on badge_type
  CASE p_badge_type
    WHEN 'gold_early_member' THEN
      UPDATE profiles SET is_gold_early_member = TRUE, gold_early_member_at = v_award_at
      WHERE id = p_user_id;
      v_badge_awarded := TRUE;
    WHEN 'silver_early_member' THEN
      UPDATE profiles SET is_silver_early_member = TRUE, silver_early_member_at = v_award_at
      WHERE id = p_user_id;
      v_badge_awarded := TRUE;
    WHEN 'bronze_early_member' THEN
      UPDATE profiles SET is_bronze_early_member = TRUE, bronze_early_member_at = v_award_at
      WHERE id = p_user_id;
      v_badge_awarded := TRUE;
    WHEN 'beta_tester' THEN
      UPDATE profiles SET is_beta_tester = TRUE, beta_tester_at = v_award_at
      WHERE id = p_user_id;
      v_badge_awarded := TRUE;
    ELSE
      RAISE EXCEPTION 'Invalid badge type: %', p_badge_type;
  END CASE;

  -- Return the updated profile info
  RETURN QUERY
  SELECT profiles.id, profiles.username, v_badge_awarded, v_award_at;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to remove badge from user (admin only)
CREATE OR REPLACE FUNCTION remove_badge(
  p_user_id UUID,
  p_badge_type TEXT
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  badge_removed BOOLEAN
) AS $$
BEGIN
  -- Update the appropriate badge column based on badge_type
  CASE p_badge_type
    WHEN 'gold_early_member' THEN
      UPDATE profiles SET is_gold_early_member = FALSE, gold_early_member_at = NULL
      WHERE id = p_user_id;
    WHEN 'silver_early_member' THEN
      UPDATE profiles SET is_silver_early_member = FALSE, silver_early_member_at = NULL
      WHERE id = p_user_id;
    WHEN 'bronze_early_member' THEN
      UPDATE profiles SET is_bronze_early_member = FALSE, bronze_early_member_at = NULL
      WHERE id = p_user_id;
    WHEN 'beta_tester' THEN
      UPDATE profiles SET is_beta_tester = FALSE, beta_tester_at = NULL
      WHERE id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Invalid badge type: %', p_badge_type;
  END CASE;

  -- Return the updated profile info
  RETURN QUERY
  SELECT profiles.id, profiles.username, TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a view to see users with specific badges
CREATE OR REPLACE VIEW users_with_gold_badges AS
SELECT id, username, full_name, avatar_url, gold_early_member_at as awarded_at
FROM profiles
WHERE is_gold_early_member = TRUE
ORDER BY gold_early_member_at DESC;

CREATE OR REPLACE VIEW users_with_silver_badges AS
SELECT id, username, full_name, avatar_url, silver_early_member_at as awarded_at
FROM profiles
WHERE is_silver_early_member = TRUE
ORDER BY silver_early_member_at DESC;

CREATE OR REPLACE VIEW users_with_bronze_badges AS
SELECT id, username, full_name, avatar_url, bronze_early_member_at as awarded_at
FROM profiles
WHERE is_bronze_early_member = TRUE
ORDER BY bronze_early_member_at DESC;

CREATE OR REPLACE VIEW users_with_beta_tester_badges AS
SELECT id, username, full_name, avatar_url, beta_tester_at as awarded_at
FROM profiles
WHERE is_beta_tester = TRUE
ORDER BY beta_tester_at DESC;

-- Example queries to use these functions:
-- SELECT * FROM award_badge('591c7917-e1c6-4dc5-a49f-36e8e1aef617'::UUID, 'gold_early_member');
-- SELECT * FROM remove_badge('591c7917-e1c6-4dc5-a49f-36e8e1aef617'::UUID, 'gold_early_member');
-- SELECT * FROM users_with_gold_badges;
