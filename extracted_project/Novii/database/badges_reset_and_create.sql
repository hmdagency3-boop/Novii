-- ============================================================================
-- 🎖️ NOVII PLATFORM - COMPLETE BADGES SYSTEM (RESET & CREATE)
-- ============================================================================
-- يحذف الجداول إن وجدت ويعيد بناءها من الصفر
-- ============================================================================

-- Drop existing tables (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS badges CASCADE;

-- ============================================================================
-- 1️⃣ BADGES TABLE - جدول البادجات (الفهرس المركزي)
-- ============================================================================

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,          -- 'medal' | 'verification' | 'status' | 'achievement'
  icon TEXT,
  color TEXT,
  "imageUrl" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX badges_type_idx ON badges(type);
CREATE INDEX badges_category_idx ON badges(category);

-- ============================================================================
-- 2️⃣ USER_BADGES TABLE - جدول العلاقة (Many-to-Many)
-- ============================================================================

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "badgeId" UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT TRUE,  -- TRUE = مفعل / FALSE = معطل
  "awardedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "badgeId")
);

CREATE INDEX user_badges_user_id_idx ON user_badges("userId");
CREATE INDEX user_badges_badge_id_idx ON user_badges("badgeId");

-- ============================================================================
-- 3️⃣ البيانات الأولية - جميع البادجات الـ 10
-- ============================================================================

-- ميداليات (4)
INSERT INTO badges (name, type, description, category, icon, color, "imageUrl") VALUES
('Gold Early Member', 'gold_early_member', 'ميدالية العضو المبكر الذهبي - عضو من الفترة الذهبية للمنصة', 'medal', '👑', '#FFD700', '/medals/gold.png'),
('Silver Early Member', 'silver_early_member', 'ميدالية العضو المبكر الفضي - عضو من الفترة الفضية للمنصة', 'medal', '🥈', '#C0C0C0', '/medals/silver.png'),
('Bronze Early Member', 'bronze_early_member', 'ميدالية العضو المبكر البرونزي - عضو من الفترة البرونزية للمنصة', 'medal', '🥉', '#CD7F32', '/medals/bronze.png'),
('Beta Tester', 'beta_tester', 'بادج مختبر بيتا - شارك في اختبار النسخة التجريبية من المنصة', 'medal', '⚙️', '#06B6D4', '/medals/beta.png');

-- التحقق (1)
INSERT INTO badges (name, type, description, category, icon, color) VALUES
('Verified User', 'verified', 'حساب موثق من قبل نوفي - حساب أصلي للشخصيات المهمة والعلامات التجارية', 'verification', '✓', '#3B82F6');

-- الحالة (2)
INSERT INTO badges (name, type, description, category, icon, color) VALUES
('Official Account', 'official', 'حساب رسمي من نوفي - الحساب الرسمي للمنصة والشركات والمؤسسات المعروفة', 'status', '🏛️', '#EC4899'),
('Premium Member', 'premium', 'عضو بريميوم - اشتراك بريميوم مع مميزات حصرية وأولويات خاصة', 'status', '⭐', '#FBBF24');

-- الإنجازات (3)
INSERT INTO badges (name, type, description, category, icon, color) VALUES
('Creator', 'creator', 'صانع محتوى - منشئ محتوى بتأثير كبير على المنصة', 'achievement', '🎬', '#8B5CF6'),
('Popular', 'popular', 'شخصية شهيرة - مستخدم بشهرة عالية وتفاعل كبير من المجتمع', 'achievement', '🔥', '#F59E0B'),
('Active Member', 'active', 'عضو نشط - مستخدم نشط بشكل مستمر على المنصة', 'achievement', '⚡', '#10B981');

-- ============================================================================
-- 4️⃣ التحقق من البيانات
-- ============================================================================

SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as total_badges FROM badges;

-- اعرض جميع البادجات
SELECT 
  ROW_NUMBER() OVER (ORDER BY category, name) as "#",
  name,
  type,
  category,
  icon,
  color
FROM badges
ORDER BY category, name;
