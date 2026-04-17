-- يضمن إن صاحب البوست يقدر يحدّث بوسته (hide_likes / replies_disabled / is_pinned ... إلخ)
-- شغّل الملف ده مرة واحدة في Supabase Studio → SQL editor.

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- نفس الشيء لجدول reels (نفس النوع من الإعدادات)
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own reels" ON reels;
CREATE POLICY "Users can update own reels"
  ON reels
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
