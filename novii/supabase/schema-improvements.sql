-- ============================================================================
-- NOVII — Schema Improvements Migration
-- شغّل هذا الملف في Supabase Dashboard > SQL Editor على قاعدة بيانات موجودة
-- ============================================================================


-- ============================================================================
-- FIX 1: likes — CHECK يضمن إن واحد بس من الثلاثة موجود
-- ============================================================================
ALTER TABLE likes DROP CONSTRAINT IF EXISTS check_likes_exactly_one;
ALTER TABLE likes ADD CONSTRAINT check_likes_exactly_one CHECK (
  (post_id    IS NOT NULL)::int +
  (comment_id IS NOT NULL)::int +
  (reel_id    IS NOT NULL)::int = 1
);


-- ============================================================================
-- FIX 2: notifications — تأمين RLS (المستخدم يشوف إشعاراته بس)
-- ============================================================================
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT يفضل مفتوح عشان السيرفر يبعت إشعارات
-- UPDATE كمان مفتوح عشان تعليم "مقروء"
-- (هما موجودين بالفعل بـ TRUE)


-- ============================================================================
-- FIX 3: Soft Delete — posts / comments / reels
-- ============================================================================

-- posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN               DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN               DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- reels
ALTER TABLE reels ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN               DEFAULT FALSE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- فهارس للـ soft delete
CREATE INDEX IF NOT EXISTS idx_posts_not_deleted    ON posts(user_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_not_deleted ON comments(post_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_reels_not_deleted    ON reels(user_id, created_at DESC) WHERE is_deleted = FALSE;


-- ============================================================================
-- FIX 4: typing_indicators — composite PRIMARY KEY بدل TEXT
-- ============================================================================
-- نحذف الجدول ونعيد إنشاؤه بـ composite PK (بيانات مؤقتة تتجدد)
DROP TABLE IF EXISTS typing_indicators CASCADE;

CREATE TABLE typing_indicators (
  community_id UUID    NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID    NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  username     TEXT    NOT NULL,
  avatar_url   TEXT,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read typing indicators"
  ON typing_indicators FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage their own typing status"
  ON typing_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own typing status"
  ON typing_indicators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own typing status"
  ON typing_indicators FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_comm    ON typing_indicators(community_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated ON typing_indicators(updated_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON typing_indicators TO authenticated;


-- ============================================================================
-- FIX 5: user_devices — device_fingerprint + device_id
-- ============================================================================
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_id          TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_fingerprint
  ON user_devices(device_fingerprint) WHERE device_fingerprint IS NOT NULL;


-- ============================================================================
-- NEW 6: Hashtags System
-- ============================================================================
CREATE TABLE IF NOT EXISTS hashtags (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL UNIQUE,
  posts_count INTEGER DEFAULT 0,
  reels_count INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_hashtags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, hashtag_id)
);

CREATE TABLE IF NOT EXISTS reel_hashtags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id    UUID NOT NULL REFERENCES reels(id)    ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reel_id, hashtag_id)
);

ALTER TABLE hashtags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hashtags are public"         ON hashtags      FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated manage hashtags" ON hashtags    FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Post hashtags are public"    ON post_hashtags FOR SELECT USING (TRUE);
CREATE POLICY "Users manage post hashtags"  ON post_hashtags FOR ALL   USING (
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Reel hashtags are public"    ON reel_hashtags FOR SELECT USING (TRUE);
CREATE POLICY "Users manage reel hashtags"  ON reel_hashtags FOR ALL   USING (
  EXISTS (SELECT 1 FROM reels WHERE id = reel_id AND user_id = auth.uid())
);

-- trigger: تحديث posts_count / reels_count في hashtags
CREATE OR REPLACE FUNCTION update_hashtag_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags SET posts_count = posts_count + 1 WHERE id = NEW.hashtag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.hashtag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_hashtag_reels_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags SET reels_count = reels_count + 1 WHERE id = NEW.hashtag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags SET reels_count = GREATEST(reels_count - 1, 0) WHERE id = OLD.hashtag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_hashtag_posts_count ON post_hashtags;
CREATE TRIGGER trigger_hashtag_posts_count
  AFTER INSERT OR DELETE ON post_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_posts_count();

DROP TRIGGER IF EXISTS trigger_hashtag_reels_count ON reel_hashtags;
CREATE TRIGGER trigger_hashtag_reels_count
  AFTER INSERT OR DELETE ON reel_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_reels_count();

CREATE INDEX IF NOT EXISTS idx_hashtags_name          ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_posts_count   ON hashtags(posts_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post      ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag   ON post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_reel_hashtags_reel      ON reel_hashtags(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_hashtags_hashtag   ON reel_hashtags(hashtag_id);

GRANT SELECT ON hashtags      TO anon, authenticated;
GRANT INSERT, UPDATE ON hashtags TO authenticated;
GRANT SELECT, INSERT, DELETE ON post_hashtags TO authenticated;
GRANT SELECT, INSERT, DELETE ON reel_hashtags TO authenticated;


-- ============================================================================
-- NEW 7: User Warnings / Strikes System
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strikes_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_warnings (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issued_by      UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  reason         TEXT    NOT NULL,
  warning_type   TEXT    DEFAULT 'warning' CHECK (warning_type IN ('warning', 'strike', 'ban')),
  is_active      BOOLEAN DEFAULT TRUE,
  expires_at     TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage warnings"
  ON user_warnings FOR ALL USING (TRUE);
CREATE POLICY "Users can view own warnings"
  ON user_warnings FOR SELECT USING (auth.uid() = user_id);

-- trigger: تحديث strikes_count في profiles
CREATE OR REPLACE FUNCTION update_profile_strikes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.warning_type = 'strike' AND NEW.is_active = TRUE THEN
    UPDATE profiles SET strikes_count = strikes_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.warning_type = 'strike' AND OLD.is_active = TRUE THEN
    UPDATE profiles SET strikes_count = GREATEST(strikes_count - 1, 0) WHERE id = OLD.user_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.warning_type = 'strike' THEN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
      UPDATE profiles SET strikes_count = GREATEST(strikes_count - 1, 0) WHERE id = NEW.user_id;
    ELSIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
      UPDATE profiles SET strikes_count = strikes_count + 1 WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_profile_strikes ON user_warnings;
CREATE TRIGGER trigger_profile_strikes
  AFTER INSERT OR UPDATE OR DELETE ON user_warnings
  FOR EACH ROW EXECUTE FUNCTION update_profile_strikes();

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_type    ON user_warnings(warning_type);
CREATE INDEX IF NOT EXISTS idx_user_warnings_active  ON user_warnings(is_active) WHERE is_active = TRUE;

GRANT SELECT ON user_warnings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_warnings TO authenticated;


-- ============================================================================
-- NEW 8: Feed Scores (أساس خوارزمية الـ Feed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feed_scores (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID    REFERENCES posts(id) ON DELETE CASCADE,
  reel_id     UUID    REFERENCES reels(id) ON DELETE CASCADE,
  score       DECIMAL(10, 4) DEFAULT 0,
  reason      TEXT,
  seen        BOOLEAN DEFAULT FALSE,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_feed_one_target CHECK (
    (post_id IS NOT NULL)::int + (reel_id IS NOT NULL)::int = 1
  )
);

ALTER TABLE feed_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feed scores"
  ON feed_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage feed scores"
  ON feed_scores FOR ALL USING (TRUE);

CREATE INDEX IF NOT EXISTS idx_feed_scores_user_score ON feed_scores(user_id, score DESC) WHERE seen = FALSE;
CREATE INDEX IF NOT EXISTS idx_feed_scores_post_id    ON feed_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_reel_id    ON feed_scores(reel_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON feed_scores TO authenticated;


-- ============================================================================
-- NEW 9: Stories Cleanup — pg_cron (يحتاج تفعيل pg_cron Extension في Supabase)
-- ============================================================================
-- شغّل السطر التالي بعد تفعيل pg_cron من Supabase Dashboard > Database > Extensions:
--
-- SELECT cron.schedule(
--   'cleanup-expired-stories',
--   '0 * * * *',   -- كل ساعة
--   $$ DELETE FROM stories WHERE expires_at < NOW() $$
-- );


-- ============================================================================
-- ملخص التغييرات
-- ============================================================================
-- ✅ likes          — CHECK constraint (بالظبط واحد من post/comment/reel)
-- ✅ notifications  — RLS مقيّدة لصاحبها بس
-- ✅ posts/comments/reels — soft delete (is_deleted + deleted_at)
-- ✅ typing_indicators    — composite PRIMARY KEY بدل TEXT
-- ✅ user_devices         — device_fingerprint + device_id
-- ✅ hashtags             — جدول جديد + post_hashtags + reel_hashtags + triggers
-- ✅ user_warnings        — نظام التحذيرات والـ strikes
-- ✅ feed_scores          — أساس خوارزمية الـ Feed
-- ✅ pg_cron              — تعليق جاهز لتنظيف القصص المنتهية
-- ============================================================================
