-- ============================================================
-- BADGES SYSTEM MIGRATION
-- ============================================================
-- This migration adds support for user badges/medals
-- Badges supported: Gold Early Member, Silver Early Member, Bronze Early Member, Beta Tester

-- Create user_badges table to track which badges each user has
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  -- Badge types: 'gold_early_member', 'silver_early_member', 'bronze_early_member', 'beta_tester'
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, badge_type)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON user_badges(badge_type);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for user_badges
CREATE POLICY "Public badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can insert badges"
  ON user_badges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid() AND admins.is_active = true
    )
  );

CREATE POLICY "Only admins can update badges"
  ON user_badges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid() AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid() AND admins.is_active = true
    )
  );

CREATE POLICY "Only admins can delete badges"
  ON user_badges FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid() AND admins.is_active = true
    )
  );

-- Create a function to get user badges as a JSON array
CREATE OR REPLACE FUNCTION get_user_badges(user_uuid UUID)
RETURNS JSON AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', id::text,
        'badge_type', badge_type,
        'awarded_at', awarded_at
      )
    ),
    '[]'::json
  )
  FROM user_badges
  WHERE user_id = user_uuid
  ORDER BY awarded_at DESC;
$$ LANGUAGE SQL;
