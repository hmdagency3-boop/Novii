-- =============================================
-- Novii — إنشاء الجداول الناقصة + سياسات الأمان
-- شغّل هذا الكود في Supabase Dashboard > SQL Editor
-- =============================================

-- 1. جدول إعدادات المستخدم
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  like_notifications BOOLEAN DEFAULT TRUE,
  comment_notifications BOOLEAN DEFAULT TRUE,
  follow_notifications BOOLEAN DEFAULT TRUE,
  messages_privacy TEXT DEFAULT 'everyone' CHECK (messages_privacy IN ('everyone', 'followers', 'approved')),
  comments_privacy TEXT DEFAULT 'everyone' CHECK (comments_privacy IN ('everyone', 'followers', 'approved')),
  tags_privacy TEXT DEFAULT 'everyone' CHECK (tags_privacy IN ('everyone', 'followers', 'none')),
  mentions_privacy TEXT DEFAULT 'everyone' CHECK (mentions_privacy IN ('everyone', 'followers', 'none')),
  sharing_privacy TEXT DEFAULT 'everyone' CHECK (sharing_privacy IN ('everyone', 'followers', 'none')),
  hide_online_status BOOLEAN DEFAULT FALSE,
  hide_story BOOLEAN DEFAULT FALSE,
  hidden_words TEXT[] DEFAULT '{}',
  hidden_words_enabled BOOLEAN DEFAULT FALSE,
  content_language TEXT DEFAULT 'ar',
  show_suggested BOOLEAN DEFAULT TRUE,
  show_trending BOOLEAN DEFAULT TRUE,
  sensitive_content BOOLEAN DEFAULT FALSE,
  hide_like_counts BOOLEAN DEFAULT FALSE,
  hide_others_like_counts BOOLEAN DEFAULT FALSE,
  auto_archive_stories BOOLEAN DEFAULT TRUE,
  auto_archive_reels BOOLEAN DEFAULT FALSE,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  high_contrast BOOLEAN DEFAULT FALSE,
  reduce_motion BOOLEAN DEFAULT FALSE,
  account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'creator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. جدول المستخدمين المحظورين
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- 3. جدول الأصدقاء المقربين
CREATE TABLE IF NOT EXISTS close_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 4. جدول المكتومين
CREATE TABLE IF NOT EXISTS muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mute_stories BOOLEAN DEFAULT TRUE,
  mute_posts BOOLEAN DEFAULT TRUE,
  mute_messages BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muted_user_id)
);

-- 5. جدول المقيّدين
CREATE TABLE IF NOT EXISTS restricted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restricted_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restricted_user_id)
);

-- 6. جدول المفضّلين
CREATE TABLE IF NOT EXISTS favorite_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, favorite_user_id)
);

-- 7. جدول المحادثات
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_group BOOLEAN DEFAULT FALSE,
  group_name TEXT,
  group_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول أعضاء المحادثة
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 9. جدول أبرز القصص (Highlights)
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول قصص الهايلايت
CREATE TABLE IF NOT EXISTS highlight_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, story_id)
);

-- =============================================
-- تفعيل Row Level Security على كل الجداول
-- =============================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- سياسات الأمان (RLS Policies)
-- =============================================

-- user_settings: المستخدم يشوف ويعدّل إعداداته فقط
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- blocked_users: المستخدم يشوف ويدير قائمة المحظورين بتاعته
CREATE POLICY "Users can view own blocked list" ON blocked_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can block others" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unblock others" ON blocked_users FOR DELETE USING (auth.uid() = user_id);

-- close_friends: المستخدم يدير الأصدقاء المقربين
CREATE POLICY "Users can view own close friends" ON close_friends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add close friends" ON close_friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove close friends" ON close_friends FOR DELETE USING (auth.uid() = user_id);

-- muted_users: المستخدم يدير المكتومين
CREATE POLICY "Users can view own muted list" ON muted_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mute others" ON muted_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unmute others" ON muted_users FOR DELETE USING (auth.uid() = user_id);

-- restricted_users: المستخدم يدير المقيّدين
CREATE POLICY "Users can view own restricted list" ON restricted_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can restrict others" ON restricted_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unrestrict others" ON restricted_users FOR DELETE USING (auth.uid() = user_id);

-- favorite_users: المستخدم يدير المفضّلين
CREATE POLICY "Users can view own favorites" ON favorite_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON favorite_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON favorite_users FOR DELETE USING (auth.uid() = user_id);

-- conversations: أعضاء المحادثة يشوفوها
CREATE POLICY "Members can view conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- conversation_members: الأعضاء يشوفوا بعض
CREATE POLICY "Members can view conversation members" ON conversation_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Conversation creator can add members" ON conversation_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND created_by = auth.uid())
);

-- highlights: المستخدم يدير الهايلايتس بتاعته والكل يشوفها
CREATE POLICY "Anyone can view highlights" ON highlights FOR SELECT USING (true);
CREATE POLICY "Users can create own highlights" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own highlights" ON highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own highlights" ON highlights FOR DELETE USING (auth.uid() = user_id);

-- highlight_stories
CREATE POLICY "Anyone can view highlight stories" ON highlight_stories FOR SELECT USING (true);
CREATE POLICY "Highlight owner can add stories" ON highlight_stories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM highlights WHERE id = highlight_id AND user_id = auth.uid())
);
CREATE POLICY "Highlight owner can remove stories" ON highlight_stories FOR DELETE USING (
  EXISTS (SELECT 1 FROM highlights WHERE id = highlight_id AND user_id = auth.uid())
);

-- =============================================
-- دالة تحديث updated_at تلقائياً
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- فهارس لتسريع البحث
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_user_id ON close_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_user_id ON muted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_restricted_users_user_id ON restricted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_users_user_id ON favorite_users(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_id ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_highlight_id ON highlight_stories(highlight_id);
