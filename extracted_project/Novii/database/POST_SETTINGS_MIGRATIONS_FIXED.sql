-- ========================================
-- POST SETTINGS & FEATURES MIGRATIONS - FIXED ✅
-- ========================================
-- هذا الملف يحتوي على SQL migrations لإضافة:
-- 1. Pin to Profile (تثبيت في الملف الشخصي)
-- 2. Hide Likes (إخفاء الإعجابات)
-- 3. Reply Settings (خيارات الرد/التعليقات)
-- 4. Views Count (عداد المشاهدات)
-- 5. Saved Posts (البوستات المحفوظة)
-- 6. Post Insights (إحصائيات البوستات)

-- ========================================
-- 1. ALTER POSTS TABLE - إضافة الأعمدة الجديدة
-- ========================================
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hide_likes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS replies_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- ========================================
-- 2. CREATE SAVED POSTS TABLE - جدول البوستات المحفوظة
-- ========================================
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- منع التكرار: لا يمكن حفظ نفس البوست مرتين
  CONSTRAINT saved_posts_unique UNIQUE(user_id, post_id)
);

-- ========================================
-- 3. CREATE POST VIEWS TABLE - جدول مشاهدات البوستات
-- ========================================
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  
  -- منع التكرار: نفس المستخدم يشاهد نفس البوست مرة واحدة فقط
  CONSTRAINT post_views_unique UNIQUE(post_id, user_id)
);

-- ========================================
-- 4. CREATE POST INSIGHTS TABLE - جدول إحصائيات البوستات
-- ========================================
CREATE TABLE IF NOT EXISTS post_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  
  -- النسبة المئوية للـ engagement
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT post_insights_unique UNIQUE(post_id)
);

-- ========================================
-- 5. CREATE INDEXES - إضافة فهارس للأداء الأفضل
-- ========================================

-- Index للبحث السريع عن البوستات المحفوظة
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);

-- Index لمشاهدات البوستات
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);

-- Index لإحصائيات البوستات
CREATE INDEX IF NOT EXISTS idx_post_insights_post_id ON post_insights(post_id);

-- Index للبوستات المثبتة
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(user_id, is_pinned) 
WHERE is_pinned = TRUE;

-- Index للبوستات بدون إخفاء الإعجابات
CREATE INDEX IF NOT EXISTS idx_posts_hide_likes ON posts(user_id, hide_likes);

-- ========================================
-- 6. CREATE TRIGGER FUNCTIONS - دوال التحديث التلقائي
-- ========================================

-- إنشى function لتحديث عداد المشاهدات عند إدراج مشاهدة جديدة
CREATE OR REPLACE FUNCTION update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET views_count = (SELECT COUNT(*) FROM post_views WHERE post_id = NEW.post_id)
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء الـ trigger للمشاهدات
DROP TRIGGER IF EXISTS trigger_update_post_views ON post_views;
CREATE TRIGGER trigger_update_post_views
AFTER INSERT ON post_views
FOR EACH ROW
EXECUTE FUNCTION update_post_views_count();

-- ========================================
-- 7. CREATE TRIGGER - تحديث عداد البوستات المحفوظة
-- ========================================

CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_insights 
    SET saves_count = (SELECT COUNT(*) FROM saved_posts WHERE post_id = NEW.post_id)
    WHERE post_id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_insights 
    SET saves_count = (SELECT COUNT(*) FROM saved_posts WHERE post_id = OLD.post_id)
    WHERE post_id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saves_count ON saved_posts;
CREATE TRIGGER trigger_update_saves_count
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW
EXECUTE FUNCTION update_post_saves_count();

-- ========================================
-- 8. HELPER FUNCTIONS - دوال مساعدة
-- ========================================

-- دالة للحصول على البوستات المحفوظة للمستخدم
CREATE OR REPLACE FUNCTION get_user_saved_posts(p_user_id UUID)
RETURNS TABLE(
  post_id UUID,
  username TEXT,
  caption TEXT,
  image_url TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  views_count INTEGER,
  saved_at TIMESTAMP
) AS $$
SELECT 
  p.id,
  pr.username,
  p.caption,
  p.image_url,
  p.likes_count,
  p.comments_count,
  p.views_count,
  sp.created_at
FROM saved_posts sp
JOIN posts p ON sp.post_id = p.id
JOIN profiles pr ON p.user_id = pr.id
WHERE sp.user_id = p_user_id
ORDER BY sp.created_at DESC;
$$ LANGUAGE SQL;

-- دالة للحصول على إحصائيات البوست
CREATE OR REPLACE FUNCTION get_post_insights(p_post_id UUID)
RETURNS TABLE(
  post_id UUID,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  saves INTEGER,
  reach INTEGER,
  engagement_rate DECIMAL
) AS $$
SELECT 
  pi.post_id,
  pi.views_count,
  pi.likes_count,
  pi.comments_count,
  pi.saves_count,
  pi.reach,
  pi.engagement_rate
FROM post_insights pi
WHERE pi.post_id = p_post_id;
$$ LANGUAGE SQL;

-- دالة للتحقق من حفظ المستخدم للبوست
CREATE OR REPLACE FUNCTION is_post_saved(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS(
  SELECT 1 FROM saved_posts 
  WHERE user_id = p_user_id AND post_id = p_post_id
);
$$ LANGUAGE SQL;

-- ========================================
-- 10. GRANT PERMISSIONS - منح الصلاحيات
-- ========================================

-- السماح للمستخدمين الموثوقين بالقراءة والكتابة
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_posts TO authenticated;
GRANT SELECT, INSERT ON post_views TO authenticated;
GRANT SELECT ON post_insights TO authenticated;
GRANT UPDATE ON posts TO authenticated;

-- ========================================
-- 11. ROW LEVEL SECURITY (RLS) - الأمان على مستوى الصفوف
-- ========================================

-- تفعيل RLS للجداول الجديدة
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_insights ENABLE ROW LEVEL SECURITY;

-- Policy لـ saved_posts: كل مستخدم يستطيع حفظ البوستات
DROP POLICY IF EXISTS "Users can save posts" ON saved_posts;
CREATE POLICY "Users can save posts"
ON saved_posts
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy لـ saved_posts: كل مستخدم يستطيع حذف البوستات المحفوظة له
DROP POLICY IF EXISTS "Users can delete their saved posts" ON saved_posts;
CREATE POLICY "Users can delete their saved posts"
ON saved_posts
FOR DELETE
USING (user_id = auth.uid());

-- Policy لـ saved_posts: كل مستخدم يستطيع قراءة البوستات المحفوظة له
DROP POLICY IF EXISTS "Users can read their saved posts" ON saved_posts;
CREATE POLICY "Users can read their saved posts"
ON saved_posts
FOR SELECT
USING (user_id = auth.uid());

-- Policy لـ post_views: كل مستخدم يستطيع إضافة مشاهدة
DROP POLICY IF EXISTS "Users can add post views" ON post_views;
CREATE POLICY "Users can add post views"
ON post_views
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy لـ post_insights: كل مستخدم يستطيع قراءة الإحصائيات
DROP POLICY IF EXISTS "Users can read post insights" ON post_insights;
CREATE POLICY "Users can read post insights"
ON post_insights
FOR SELECT
USING (true);

-- تحديث الـ posts table لتفعيل RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy للسماح بقراءة جميع البوستات
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts"
ON posts
FOR SELECT
USING (true);

-- Policy للسماح بتحديث إعدادات البوست من مالكه فقط
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
CREATE POLICY "Users can update their own posts"
ON posts
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ========================================
-- ✅ DONE! الكود جاهز للتطبيق
-- ========================================
