-- ============================================
-- جدول الريلز (reels)
-- ============================================
CREATE TABLE IF NOT EXISTS reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  duration INTEGER,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_is_deleted ON reels(is_deleted);

-- إنشاء Trigger لتحديث updated_at
CREATE TRIGGER IF NOT EXISTS update_reels_updated_at
  BEFORE UPDATE ON reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- تحقق
SELECT 'Reels table created successfully!' as status;
