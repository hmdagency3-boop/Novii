-- ============================================================================
-- BADGES SYSTEM - Complete SQL Schema
-- ============================================================================
-- This schema manages all badges/medals in the Novii platform
-- Tables: badges, user_badges
-- Total Badges: 10 (6 Regular + 4 Medals)
-- ============================================================================

-- Drop existing tables if needed (for clean setup)
-- DROP TABLE IF EXISTS user_badges CASCADE;
-- DROP TABLE IF EXISTS badges CASCADE;

-- ============================================================================
-- 1. BADGES CATALOG TABLE
-- ============================================================================
-- Stores all available badges in the system
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'medal' | 'verification' | 'status' | 'achievement'
  icon TEXT, -- emoji or icon identifier
  color TEXT, -- hex color code
  "imageUrl" TEXT, -- path to badge/medal image
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by type
CREATE INDEX IF NOT EXISTS badges_type_idx ON badges(type);
CREATE INDEX IF NOT EXISTS badges_category_idx ON badges(category);

-- ============================================================================
-- 2. USER BADGES JUNCTION TABLE (Many-to-Many)
-- ============================================================================
-- Tracks which badges each user has earned
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "badgeId" UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  "awardedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "awardedBy" UUID REFERENCES profiles(id) ON DELETE SET NULL, -- admin who awarded it
  reason TEXT, -- reason for awarding
  UNIQUE("userId", "badgeId") -- user can have each badge only once
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges("userId");
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges("badgeId");
CREATE INDEX IF NOT EXISTS user_badges_awarded_at_idx ON user_badges("awardedAt");

-- ============================================================================
-- 3. INSERT ALL BADGES (10 Total)
-- ============================================================================

-- ============================================================================
-- CATEGORY: MEDALS (4) - Early Member & Beta Tester
-- ============================================================================
INSERT INTO badges (name, description, type, category, icon, color, "imageUrl") VALUES
(
  'Gold Early Member',
  'Awarded to early members who joined the platform during its golden period. A symbol of founding member status and platform loyalty.',
  'gold_early_member',
  'medal',
  '👑',
  '#FFD700',
  '/medals/gold.png'
),
(
  'Silver Early Member',
  'Awarded to early members who joined the platform during its silver period. Recognizes valuable contributors to early growth.',
  'silver_early_member',
  'medal',
  '🥈',
  '#C0C0C0',
  '/medals/silver.png'
),
(
  'Bronze Early Member',
  'Awarded to early members who joined the platform during its bronze period. Acknowledges early platform adoption.',
  'bronze_early_member',
  'medal',
  '🥉',
  '#CD7F32',
  '/medals/bronze.png'
),
(
  'Beta Tester',
  'Awarded to users who actively participated in beta testing and provided valuable feedback to improve the platform.',
  'beta_tester',
  'medal',
  '⚙️',
  '#06B6D4',
  '/medals/beta.png'
)
ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- CATEGORY: VERIFICATION (1) - Official Status
-- ============================================================================
INSERT INTO badges (name, description, type, category, icon, color, "imageUrl") VALUES
(
  'Verified User',
  'This account has been verified by Novii. Indicates an authentic account of a notable person or brand.',
  'verified',
  'verification',
  '✓',
  '#3B82F6',
  NULL
)
ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- CATEGORY: STATUS (2) - Official & Premium
-- ============================================================================
INSERT INTO badges (name, description, type, category, icon, color, "imageUrl") VALUES
(
  'Official Account',
  'This is an official account of Novii or verified partner. Represents official presence on the platform.',
  'official',
  'status',
  '🏛️',
  '#EC4899',
  NULL
),
(
  'Premium Member',
  'Premium subscriber with exclusive features and benefits. Supports platform development.',
  'premium',
  'status',
  '⭐',
  '#FBBF24',
  NULL
)
ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- CATEGORY: ACHIEVEMENT (3) - Creator, Popular & Active
-- ============================================================================
INSERT INTO badges (name, description, type, category, icon, color, "imageUrl") VALUES
(
  'Creator',
  'Awarded to content creators with significant influence. Recognizes excellent content creation.',
  'creator',
  'achievement',
  '🎬',
  '#8B5CF6',
  NULL
),
(
  'Popular',
  'Awarded to users with high engagement and follower count. Indicates popular personality on platform.',
  'popular',
  'achievement',
  '🔥',
  '#F59E0B',
  NULL
),
(
  'Active Member',
  'Awarded to consistently active users who engage regularly with the platform.',
  'active',
  'achievement',
  '⚡',
  '#10B981',
  NULL
)
ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- 4. VERIFICATION QUERY
-- ============================================================================
-- Verify all badges were inserted correctly
SELECT 
  COUNT(*) as total_badges,
  COUNT(CASE WHEN category = 'medal' THEN 1 END) as medals,
  COUNT(CASE WHEN category = 'verification' THEN 1 END) as verification,
  COUNT(CASE WHEN category = 'status' THEN 1 END) as status_badges,
  COUNT(CASE WHEN category = 'achievement' THEN 1 END) as achievement_badges
FROM badges;

-- List all badges
SELECT 
  id,
  name,
  type,
  category,
  icon,
  color,
  "imageUrl"
FROM badges
ORDER BY 
  CASE category
    WHEN 'medal' THEN 1
    WHEN 'verification' THEN 2
    WHEN 'status' THEN 3
    WHEN 'achievement' THEN 4
  END,
  name;

-- ============================================================================
-- 5. EXAMPLE QUERIES FOR COMMON OPERATIONS
-- ============================================================================

-- Get all badges for a specific user
-- SELECT 
--   ub.id,
--   b.name,
--   b.type,
--   b.category,
--   b.icon,
--   ub."awardedAt"
-- FROM user_badges ub
-- JOIN badges b ON ub."badgeId" = b.id
-- WHERE ub."userId" = 'user-id-here'
-- ORDER BY b.category, b.name;

-- Award a badge to a user
-- INSERT INTO user_badges ("userId", "badgeId", "awardedBy", reason)
-- SELECT 
--   'user-id-here',
--   b.id,
--   'admin-id-here',
--   'Manual award'
-- FROM badges b
-- WHERE b.type = 'verified';

-- Get badge statistics
-- SELECT 
--   b.name,
--   COUNT(ub.id) as user_count
-- FROM badges b
-- LEFT JOIN user_badges ub ON b.id = ub."badgeId"
-- GROUP BY b.id, b.name
-- ORDER BY user_count DESC;

-- ============================================================================
-- END OF BADGES SCHEMA
-- ============================================================================
