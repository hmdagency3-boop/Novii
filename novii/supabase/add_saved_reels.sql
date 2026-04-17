-- جدول المحفوظات للريلز (مشابه لـ saved_posts)
-- شغّل الملف ده مرة واحدة في Supabase Studio → SQL editor.

-- تأكيد إن عمود saves_count موجود على جدول reels
ALTER TABLE reels ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

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

-- Trigger: تحديث عداد الحفظ على الريل
CREATE OR REPLACE FUNCTION update_reel_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reels SET saves_count = COALESCE(saves_count, 0) + 1 WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reels SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0) WHERE id = OLD.reel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_reel_saves_count ON saved_reels;
CREATE TRIGGER trigger_update_reel_saves_count
  AFTER INSERT OR DELETE ON saved_reels
  FOR EACH ROW EXECUTE FUNCTION update_reel_saves_count();

-- إعادة احتساب القيمة الحالية لكل الريلز (مرة واحدة)
UPDATE reels r
SET saves_count = COALESCE((SELECT COUNT(*) FROM saved_reels s WHERE s.reel_id = r.id), 0);
