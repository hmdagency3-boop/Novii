-- يضمن وجود trigger لتحديث reels.comments_count تلقائياً
-- ويعيد احتساب القيم الحالية لكل الريلز.
-- شغّل الملف ده مرة واحدة في Supabase Studio → SQL editor.

CREATE OR REPLACE FUNCTION update_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reel_id IS NOT NULL AND NEW.parent_comment_id IS NULL THEN
    UPDATE reels SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reel_id IS NOT NULL AND OLD.parent_comment_id IS NULL THEN
    UPDATE reels SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.reel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_reel_comments_count ON comments;
CREATE TRIGGER trigger_update_reel_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_reel_comments_count();

-- إعادة احتساب العداد لكل الريلز (مرة واحدة)
UPDATE reels r
SET comments_count = COALESCE((
  SELECT COUNT(*) FROM comments c
  WHERE c.reel_id = r.id AND c.parent_comment_id IS NULL
), 0);
