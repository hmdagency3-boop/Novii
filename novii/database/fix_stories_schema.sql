-- ============================================================
-- إصلاح جدول الاستوريز - شغّل هذا على Supabase SQL Editor
-- ============================================================

-- 1. إضافة الأعمدة المفقودة (الموسيقى والفلاتر)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_url         TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_title       TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_artist      TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_artwork_url TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS filter_name       TEXT DEFAULT 'normal';

-- 2. إصلاح الـ trigger function لتشتغل بصلاحيات كاملة (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_story_views_count()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$;

-- 3. إعادة إنشاء الـ trigger للتأكد
DROP TRIGGER IF EXISTS trigger_story_views_count ON story_views;
CREATE TRIGGER trigger_story_views_count
  AFTER INSERT ON story_views
  FOR EACH ROW
  EXECUTE FUNCTION update_story_views_count();

-- 4. إضافة UPDATE policy على جدول stories (مفقودة)
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- تحقق من النتائج
-- ============================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stories'
ORDER BY ordinal_position;
