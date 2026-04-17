-- جدول المحفوظات للريلز (مشابه لـ saved_posts)
-- شغّل الملف ده مرة واحدة في Supabase Studio → SQL editor.

CREATE TABLE IF NOT EXISTS saved_reels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reel_id    UUID NOT NULL REFERENCES reels(id)    ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reel_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_reels_user_id ON saved_reels(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_reels_reel_id ON saved_reels(reel_id);

ALTER TABLE saved_reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their saved reels" ON saved_reels;
CREATE POLICY "Users can read their saved reels"
  ON saved_reels FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save reels" ON saved_reels;
CREATE POLICY "Users can save reels"
  ON saved_reels FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave reels" ON saved_reels;
CREATE POLICY "Users can unsave reels"
  ON saved_reels FOR DELETE USING (auth.uid() = user_id);
