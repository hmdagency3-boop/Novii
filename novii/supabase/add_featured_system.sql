-- نظام التعزيز (Featured/Trending) للحسابات والبوستات والريلز
-- يُنفّذ في Supabase Dashboard → SQL Editor

-- 1. إضافة is_featured على profiles (الحسابات)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

-- 2. التأكد من وجود is_featured على posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

-- 3. التأكد من وجود is_featured على reels
ALTER TABLE reels ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

-- 4. Index للبحث السريع عن المحتوى المعزّز
CREATE INDEX IF NOT EXISTS idx_profiles_featured ON profiles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_reels_featured ON reels(is_featured) WHERE is_featured = true;
