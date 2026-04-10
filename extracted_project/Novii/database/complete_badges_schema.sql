-- ============================================================================
-- COMPLETE BADGES SYSTEM - Full SQL Schema
-- ============================================================================
-- نظام شامل للبادجات مع جميع المستخدمين والعلاقات
-- ============================================================================

-- ============================================================================
-- 1. BADGES TABLE - جدول البادجات (الفهرس)
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  "imageUrl" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS badges_type_idx ON badges(type);
CREATE INDEX IF NOT EXISTS badges_category_idx ON badges(category);

-- ============================================================================
-- 2. USER_BADGES TABLE - جدول العلاقة (كل مستخدم + بادجاته)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "badgeId" UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "awardedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "badgeId")
);

CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges("userId");
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges("badgeId");

-- ============================================================================
-- 3. INSERT ALL 10 BADGES - إدرج كل البادجات الـ 10
-- ============================================================================

-- ميداليات (4)
INSERT INTO badges (name, type, description, category, icon, color, "imageUrl") VALUES
('Gold Early Member', 'gold_early_member', 'ميدالية العضو المبكر الذهبي', 'medal', '👑', '#FFD700', '/medals/gold.png'),
('Silver Early Member', 'silver_early_member', 'ميدالية العضو المبكر الفضي', 'medal', '🥈', '#C0C0C0', '/medals/silver.png'),
('Bronze Early Member', 'bronze_early_member', 'ميدالية العضو المبكر البرونزي', 'medal', '🥉', '#CD7F32', '/medals/bronze.png'),
('Beta Tester', 'beta_tester', 'بادج مختبر بيتا', 'medal', '⚙️', '#06B6D4', '/medals/beta.png')
ON CONFLICT (type) DO NOTHING;

-- التحقق (1)
INSERT INTO badges (name, type, description, category, icon, color) VALUES
('Verified User', 'verified', 'حساب موثق من نوفي', 'verification', '✓', '#3B82F6')
ON CONFLICT (type) DO NOTHING;

-- الحالة (2)
INSERT INTO badges (name, type, description, category, icon, color) VALUES
('Official Account', 'official', 'حساب رسمي من نوفي', 'status', '🏛️', '#EC4899'),
('Premium Member', 'premium', 'عضو بريميوم مع مميزات حصرية', 'status', '⭐', '#FBBF24')
ON CONFLICT (type) DO NOTHING;

-- الإنجازات (3)
INSERT INTO badges (name, type, description, category, icon, color) VALUES
('Creator', 'creator', 'صانع محتوى', 'achievement', '🎬', '#8B5CF6'),
('Popular', 'popular', 'شخصية شهيرة', 'achievement', '🔥', '#F59E0B'),
('Active Member', 'active', 'عضو نشط', 'achievement', '⚡', '#10B981')
ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- 4. STRUCTURE VIEW - عرض البنية
-- ============================================================================

-- BADGES TABLE (جميع البادجات المتاحة)
-- | id | name | type | description | category | icon | color | imageUrl |
-- |----|------|------|-------------|----------|------|-------|----------|
-- | 1  | Gold Early Member | gold_early_member | ... | medal | 👑 | #FFD700 | /medals/gold.png |
-- | 2  | Silver Early Member | silver_early_member | ... | medal | 🥈 | #C0C0C0 | /medals/silver.png |
-- | ... (إجمالي 10 بادجات) |

-- USER_BADGES TABLE (علاقة المستخدمين بالبادجات)
-- | id | userId | badgeId | isActive | awardedAt |
-- |----|--------|---------|----------|-----------|
-- | 1  | user-uuid-1 | badge-uuid-1 | TRUE | 2025-01-15 |
-- | 2  | user-uuid-1 | badge-uuid-3 | TRUE | 2025-01-15 |
-- | 3  | user-uuid-2 | badge-uuid-1 | TRUE | 2025-01-16 |

-- ============================================================================
-- 5. EXAMPLE OPERATIONS - أمثلة تطبيقية
-- ============================================================================

-- 👉 مثال: أضف بادج Gold Member لمستخدم معين
-- INSERT INTO user_badges ("userId", "badgeId", "isActive")
-- SELECT 'user-id-here', b.id, TRUE
-- FROM badges b
-- WHERE b.type = 'gold_early_member'
-- ON CONFLICT ("userId", "badgeId") DO UPDATE
-- SET "isActive" = TRUE;

-- 👉 مثال: أظهر كل بادجات مستخدم معين
-- SELECT 
--   p.username,
--   b.name as badge_name,
--   b.type,
--   b.category,
--   b.icon,
--   b.color,
--   ub."isActive"
-- FROM profiles p
-- JOIN user_badges ub ON p.id = ub."userId"
-- JOIN badges b ON ub."badgeId" = b.id
-- WHERE p.username = 'username-here'
-- ORDER BY b.category, b.name;

-- 👉 مثال: ألغِ بادج من مستخدم
-- UPDATE user_badges
-- SET "isActive" = FALSE
-- WHERE "userId" = 'user-id-here'
-- AND "badgeId" = (SELECT id FROM badges WHERE type = 'gold_early_member');

-- 👉 مثال: احذف بادج تماماً من مستخدم
-- DELETE FROM user_badges
-- WHERE "userId" = 'user-id-here'
-- AND "badgeId" = (SELECT id FROM badges WHERE type = 'gold_early_member');

-- ============================================================================
-- 6. VERIFICATION - تحقق من البيانات
-- ============================================================================

-- تحقق من عدد البادجات
SELECT COUNT(*) as total_badges FROM badges;

-- اعرض جميع البادجات
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
-- SUMMARY - الملخص
-- ============================================================================
-- 
-- 📊 PROFILES TABLE (موجود بالفعل)
-- ├─ id (UUID) - معرف المستخدم الفريد
-- ├─ username - اسم المستخدم
-- └─ ... أعمدة أخرى
--
-- 🎖️ BADGES TABLE (الفهرس - كل البادجات المتاحة)
-- ├─ id (UUID) - معرف البادج
-- ├─ name - اسم البادج
-- ├─ type - نوع البادج (UNIQUE)
-- ├─ description - وصف البادج
-- ├─ category - فئة البادج (medal/verification/status/achievement)
-- ├─ icon - أيقونة البادج
-- ├─ color - اللون
-- └─ imageUrl - صورة البادج
--
-- 🔗 USER_BADGES TABLE (العلاقة - من استحق أي بادج)
-- ├─ id (UUID) - معرف السجل
-- ├─ userId (FK) → profiles.id - معرف المستخدم
-- ├─ badgeId (FK) → badges.id - معرف البادج
-- ├─ isActive (BOOLEAN) - هل البادج مفعل أم لا (TRUE/FALSE)
-- └─ awardedAt - تاريخ الحصول على البادج
--
-- ============================================================================
-- عندما تريد إضافة بادج لمستخدم:
-- 1. ابحث عن ID المستخدم من profiles
-- 2. ابحث عن ID البادج من badges
-- 3. أضف صف جديد في user_badges مع isActive = TRUE
-- 
-- عندما تريد إلغاء بادج من مستخدم:
-- 1. غير isActive من TRUE إلى FALSE أو احذف الصف
--
-- هذا النظام مركزي وسهل الإدارة!
-- ============================================================================
