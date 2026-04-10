-- Novii Platform Safe Database Migration
-- هذا الكود يضيف الأعمدة الناقصة فقط بدون حذف البيانات

-- Add missing columns to profiles table (if they don't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_reason text,
ADD COLUMN IF NOT EXISTS ban_until timestamp;

-- Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);

-- Insert or update the admin user (if not exists)
INSERT INTO profiles (id, username, full_name, followers_count, following_count, posts_count, role, is_verified, is_private, is_banned, created_at, updated_at) 
VALUES ('50454f71-9cc9-40e4-9363-aa6bdf739b34'::uuid, 'admin_user', 'Admin User', 0, 0, 0, 'admin', false, false, false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Insert admin entry (if not exists)
INSERT INTO admins (user_id) 
VALUES ('50454f71-9cc9-40e4-9363-aa6bdf739b34'::uuid)
ON CONFLICT (user_id) DO NOTHING;

-- Ensure user_statistics exists for the admin
INSERT INTO user_statistics (user_id) 
VALUES ('50454f71-9cc9-40e4-9363-aa6bdf739b34'::uuid)
ON CONFLICT (user_id) DO NOTHING;
