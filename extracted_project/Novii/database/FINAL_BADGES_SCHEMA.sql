-- ============================================================================
-- 🎖️ NOVII PLATFORM - COMPLETE BADGES SYSTEM
-- ============================================================================
-- نظام شامل ومركزي للبادجات والميداليات
-- تاريخ الإنشاء: 23 نوفمبر 2025
-- ============================================================================

-- ============================================================================
-- 📋 الجداول الأساسية:
-- ============================================================================
-- 1. badges - جدول البادجات (الفهرس المركزي)
-- 2. user_badges - علاقة المستخدمين بالبادجات (Many-to-Many)
-- 3. profiles - جدول المستخدمين (موجود بالفعل)

-- ============================================================================
-- 1️⃣ BADGES TABLE - جدول البادجات
-- ============================================================================
-- يحتوي على تعريف لكل البادجات المتاحة في النظام

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,                    -- اسم البادج (مثل: Gold Early Member)
  type TEXT NOT NULL UNIQUE,                    -- نوع فريد (مثل: gold_early_member)
  description TEXT,                             -- وصف تفصيلي للبادج
  category TEXT NOT NULL,                       -- الفئة: 'medal' | 'verification' | 'status' | 'achievement'
  icon TEXT,                                    -- أيقونة (emoji أو icon identifier)
  color TEXT,                                   -- لون hex (مثل: #FFD700)
  "imageUrl" TEXT,                              -- مسار الصورة (للميداليات)
  "isActive" BOOLEAN DEFAULT TRUE,              -- هل البادج مفعل أم لا
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS badges_type_idx ON badges(type);
CREATE INDEX IF NOT EXISTS badges_category_idx ON badges(category);

-- ============================================================================
-- 2️⃣ USER_BADGES TABLE - جدول العلاقة (Many-to-Many)
-- ============================================================================
-- يربط المستخدمين بالبادجات التي استحقوها

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "badgeId" UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT TRUE,              -- TRUE = مفعل / FALSE = معطل
  "awardedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "badgeId")                  -- كل مستخدم يمكن أن يحصل على كل بادج مرة واحدة فقط
);

CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges("userId");
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges("badgeId");

-- ============================================================================
-- 3️⃣ البيانات الأولية - جميع البادجات الـ 10
-- ============================================================================

-- 🥇🥈🥉⚙️ الميداليات (4)
INSERT INTO badges (name, type, description, category, icon, color, "imageUrl") 
SELECT 
  'Gold Early Member', 'gold_early_member', 
  'ميدالية العضو المبكر الذهبي - عضو من الفترة الذهبية للمنصة',
  'medal', '👑', '#FFD700', '/medals/gold.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'gold_early_member');

INSERT INTO badges (name, type, description, category, icon, color, "imageUrl") 
SELECT 
  'Silver Early Member', 'silver_early_member',
  'ميدالية العضو المبكر الفضي - عضو من الفترة الفضية للمنصة',
  'medal', '🥈', '#C0C0C0', '/medals/silver.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'silver_early_member');

INSERT INTO badges (name, type, description, category, icon, color, "imageUrl") 
SELECT 
  'Bronze Early Member', 'bronze_early_member',
  'ميدالية العضو المبكر البرونزي - عضو من الفترة البرونزية للمنصة',
  'medal', '🥉', '#CD7F32', '/medals/bronze.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'bronze_early_member');

INSERT INTO badges (name, type, description, category, icon, color, "imageUrl") 
SELECT 
  'Beta Tester', 'beta_tester',
  'بادج مختبر بيتا - شارك في اختبار النسخة التجريبية من المنصة',
  'medal', '⚙️', '#06B6D4', '/medals/beta.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'beta_tester');

-- ✓ التحقق (1)
INSERT INTO badges (name, type, description, category, icon, color) 
SELECT 
  'Verified User', 'verified',
  'حساب موثق من قبل نوفي - حساب أصلي للشخصيات المهمة والعلامات التجارية',
  'verification', '✓', '#3B82F6'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'verified');

-- 🏛️⭐ الحالة (2)
INSERT INTO badges (name, type, description, category, icon, color) 
SELECT 
  'Official Account', 'official',
  'حساب رسمي من نوفي - الحساب الرسمي للمنصة والشركات والمؤسسات المعروفة',
  'status', '🏛️', '#EC4899'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'official');

INSERT INTO badges (name, type, description, category, icon, color) 
SELECT 
  'Premium Member', 'premium',
  'عضو بريميوم - اشتراك بريميوم مع مميزات حصرية وأولويات خاصة',
  'status', '⭐', '#FBBF24'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'premium');

-- 🎬🔥⚡ الإنجازات (3)
INSERT INTO badges (name, type, description, category, icon, color) 
SELECT 
  'Creator', 'creator',
  'صانع محتوى - منشئ محتوى بتأثير كبير على المنصة',
  'achievement', '🎬', '#8B5CF6'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'creator');

INSERT INTO badges (name, type, description, category, icon, color) 
SELECT 
  'Popular', 'popular',
  'شخصية شهيرة - مستخدم بشهرة عالية وتفاعل كبير من المجتمع',
  'achievement', '🔥', '#F59E0B'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'popular');

INSERT INTO badges (name, type, description, category, icon, color) 
SELECT 
  'Active Member', 'active',
  'عضو نشط - مستخدم نشط بشكل مستمر على المنصة',
  'achievement', '⚡', '#10B981'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE type = 'active');

-- ============================================================================
-- 4️⃣ التحقق من البيانات
-- ============================================================================

-- عدد البادجات
SELECT COUNT(*) as total_badges FROM badges;

-- قائمة كاملة بالبادجات
SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    CASE category
      WHEN 'medal' THEN 1
      WHEN 'verification' THEN 2
      WHEN 'status' THEN 3
      WHEN 'achievement' THEN 4
    END,
    name
  ) as "#",
  name,
  type,
  category,
  icon,
  color,
  CASE WHEN "imageUrl" IS NOT NULL THEN "imageUrl" ELSE 'N/A' END as image
FROM badges
ORDER BY category, name;

-- ============================================================================
-- 5️⃣ أمثلة الاستخدام (Queries شائعة)
-- ============================================================================

-- ➕ إضافة بادج لمستخدم (تفعيل)
-- INSERT INTO user_badges ("userId", "badgeId", "isActive")
-- SELECT 'user-uuid-here', b.id, TRUE
-- FROM badges b
-- WHERE b.type = 'gold_early_member'
-- ON CONFLICT ("userId", "badgeId") DO UPDATE
-- SET "isActive" = TRUE;

-- ❌ إلغاء بادج من مستخدم
-- UPDATE user_badges
-- SET "isActive" = FALSE
-- WHERE "userId" = 'user-uuid-here'
-- AND "badgeId" = (SELECT id FROM badges WHERE type = 'gold_early_member');

-- 📋 عرض كل بادجات مستخدم معين
-- SELECT 
--   p.username,
--   b.name as badge_name,
--   b.type,
--   b.category,
--   b.icon,
--   b.color,
--   ub."isActive",
--   ub."awardedAt"
-- FROM profiles p
-- JOIN user_badges ub ON p.id = ub."userId"
-- JOIN badges b ON ub."badgeId" = b.id
-- WHERE p.username = 'username-here'
-- ORDER BY b.category, b.name;

-- 📊 إحصائيات البادجات
-- SELECT 
--   b.name,
--   b.category,
--   COUNT(ub.id) FILTER (WHERE ub."isActive" = TRUE) as active_users
-- FROM badges b
-- LEFT JOIN user_badges ub ON b.id = ub."badgeId"
-- GROUP BY b.id, b.name, b.category
-- ORDER BY b.category, b.name;

-- ============================================================================
-- 📊 ملخص النظام
-- ============================================================================
-- 
-- PROFILES TABLE (موجود بالفعل)
-- ├─ id - معرف المستخدم
-- ├─ username - اسم المستخدم
-- └─ ... أعمدة أخرى
--
-- BADGES TABLE (الفهرس المركزي - 10 بادجات)
-- ├─ id - معرف البادج (UUID)
-- ├─ name - اسم البادج (UNIQUE)
-- ├─ type - نوع البادج (UNIQUE) - مثل: gold_early_member
-- ├─ description - وصف البادج
-- ├─ category - الفئة (medal/verification/status/achievement)
-- ├─ icon - أيقونة أو emoji
-- ├─ color - لون hex
-- ├─ imageUrl - صورة البادج (للميداليات)
-- └─ isActive - هل البادج مفعل؟
--
-- USER_BADGES TABLE (العلاقة Many-to-Many)
-- ├─ id - معرف السجل (UUID)
-- ├─ userId (FK) → profiles.id - معرف المستخدم
-- ├─ badgeId (FK) → badges.id - معرف البادج
-- ├─ isActive (BOOLEAN) - هل البادج مفعل للمستخدم؟ (TRUE = نعم)
-- └─ awardedAt - تاريخ الحصول على البادج
--
-- ============================================================================
-- الميداليات (4):
-- 1. Gold Early Member (👑 #FFD700)
-- 2. Silver Early Member (🥈 #C0C0C0)
-- 3. Bronze Early Member (🥉 #CD7F32)
-- 4. Beta Tester (⚙️ #06B6D4)
--
-- التحقق (1):
-- 5. Verified User (✓ #3B82F6)
--
-- الحالة (2):
-- 6. Official Account (🏛️ #EC4899)
-- 7. Premium Member (⭐ #FBBF24)
--
-- الإنجازات (3):
-- 8. Creator (🎬 #8B5CF6)
-- 9. Popular (🔥 #F59E0B)
-- 10. Active Member (⚡ #10B981)
--
-- ============================================================================
-- كيفية الاستخدام:
-- ============================================================================
-- 
-- لإضافة بادج لمستخدم:
-- 1. ابحث عن UUID المستخدم من جدول profiles
-- 2. ابحث عن ID البادج من جدول badges حسب type
-- 3. أضف صف في user_badges مع isActive = TRUE
--
-- لإلغاء بادج من مستخدم:
-- 1. غير isActive من TRUE إلى FALSE
--    أو احذف الصف من جدول user_badges
--
-- النظام مركزي وسهل الإدارة! ✅
-- ============================================================================
