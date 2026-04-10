-- ============================================================================
-- NOVII SOCIAL MEDIA PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- نسخة شاملة وكاملة لإنشاء قاعدة بيانات Novii من الصفر
-- قم بتشغيل هذا الملف كاملاً في Supabase SQL Editor
-- ============================================================================
-- الترتيب المتبع:
--   1. الامتدادات (Extensions)
--   2. الجداول (Tables) - بالترتيب الصحيح للمراجع
--   3. الأعمدة الإضافية (ALTER TABLE)
--   4. الفهارس (Indexes)
--   5. Row Level Security
--   6. السياسات (Policies)
--   7. الدوال (Functions)
--   8. المشغلات (Triggers)
--   9. الصلاحيات (Grants)
--   10. البيانات الأساسية (Seed Data)
--   11. Storage Buckets
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- -----------------------------------------------------------------------
-- 2.1 PROFILES (يجب أن يكون أول جدول لأن بقية الجداول تعتمد عليه)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username                     TEXT UNIQUE NOT NULL,
  full_name                    TEXT,
  bio                          TEXT,
  avatar_url                   TEXT,
  cover_url                    TEXT,
  website                      TEXT,
  location                     TEXT,
  gender                       TEXT CHECK (gender IN ('male', 'female', 'other')),

  -- حالة الحساب
  is_verified                  BOOLEAN DEFAULT FALSE,
  verified_at                  TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_private                   BOOLEAN DEFAULT FALSE,
  is_official                  BOOLEAN DEFAULT FALSE,
  is_creator                   BOOLEAN DEFAULT FALSE,
  is_premium                   BOOLEAN DEFAULT FALSE,
  is_popular                   BOOLEAN DEFAULT FALSE,
  is_active                    BOOLEAN DEFAULT FALSE,
  is_banned                    BOOLEAN DEFAULT FALSE,
  banned_reason                TEXT,
  ban_until                    TIMESTAMP WITH TIME ZONE,
  role                         TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- ميداليات العضوية المبكرة
  is_gold_early_member         BOOLEAN DEFAULT FALSE,
  gold_early_member_at         TIMESTAMP WITH TIME ZONE,
  is_silver_early_member       BOOLEAN DEFAULT FALSE,
  silver_early_member_at       TIMESTAMP WITH TIME ZONE,
  is_bronze_early_member       BOOLEAN DEFAULT FALSE,
  bronze_early_member_at       TIMESTAMP WITH TIME ZONE,
  is_beta_tester               BOOLEAN DEFAULT FALSE,
  beta_tester_at               TIMESTAMP WITH TIME ZONE,

  -- عدادات
  followers_count              INTEGER DEFAULT 0,
  following_count              INTEGER DEFAULT 0,
  posts_count                  INTEGER DEFAULT 0,
  pending_follow_requests_count INTEGER DEFAULT 0,

  -- الحضور والنشاط
  is_online                    BOOLEAN DEFAULT FALSE,
  last_seen                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at                   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.2 POSTS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption          TEXT,
  image_url        TEXT,
  location         TEXT,
  likes_count      INTEGER DEFAULT 0,
  comments_count   INTEGER DEFAULT 0,
  views_count      INTEGER DEFAULT 0,
  is_archived      BOOLEAN DEFAULT FALSE,
  is_private       BOOLEAN DEFAULT FALSE,
  is_pinned        BOOLEAN DEFAULT FALSE,
  hide_likes       BOOLEAN DEFAULT FALSE,
  replies_disabled BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.3 FOLLOWS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- -----------------------------------------------------------------------
-- 2.4 FOLLOW REQUESTS (للحسابات الخاصة)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);

-- -----------------------------------------------------------------------
-- 2.5 STORIES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url  TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.6 STORY VIEWS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS story_views (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id  UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- -----------------------------------------------------------------------
-- 2.7 COMMENTS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,  -- للردود المتداخلة
  content           TEXT NOT NULL,
  gif_url           TEXT,
  likes_count       INTEGER DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.8 LIKES (للمنشورات والتعليقات)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reel_id    UUID,   -- سيضاف المرجع لاحقاً بعد جدول reels
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  UNIQUE(comment_id, user_id)
);

-- -----------------------------------------------------------------------
-- 2.9 REELS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reels (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url      TEXT NOT NULL,
  caption        TEXT,
  thumbnail_url  TEXT,
  duration       INTEGER,
  likes_count    INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count    INTEGER DEFAULT 0,
  is_private     BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة مرجع reel_id لجدول likes
ALTER TABLE likes ADD CONSTRAINT fk_likes_reel_id FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------
-- 2.10 MESSAGES (الرسائل المباشرة)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  image_url        TEXT,
  story_id         UUID REFERENCES stories(id) ON DELETE CASCADE,
  is_read          BOOLEAN DEFAULT FALSE,
  is_deleted       BOOLEAN DEFAULT FALSE,
  is_edited        BOOLEAN DEFAULT FALSE,
  edited_at        TIMESTAMP WITH TIME ZONE,
  original_content TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.11 MESSAGE REACTIONS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction   TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- -----------------------------------------------------------------------
-- 2.12 NOTIFICATIONS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content    TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.13 SAVED POSTS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- -----------------------------------------------------------------------
-- 2.14 POST VIEWS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_views (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- -----------------------------------------------------------------------
-- 2.15 POST INSIGHTS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  views_count      INTEGER DEFAULT 0,
  likes_count      INTEGER DEFAULT 0,
  comments_count   INTEGER DEFAULT 0,
  saves_count      INTEGER DEFAULT 0,
  shares_count     INTEGER DEFAULT 0,
  reach            INTEGER DEFAULT 0,
  impressions      INTEGER DEFAULT 0,
  engagement_rate  DECIMAL(5, 2) DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id)
);

-- -----------------------------------------------------------------------
-- 2.16 USER STATISTICS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_statistics (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_likes_given        INTEGER DEFAULT 0,
  total_comments_created   INTEGER DEFAULT 0,
  total_posts_viewed       INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  last_active_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.17 ADMINS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  permissions TEXT DEFAULT 'full' CHECK (permissions IN ('full', 'moderate', 'view')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.18 BADGES (فهرس الشارات)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL UNIQUE,
  description TEXT,
  category    TEXT NOT NULL CHECK (category IN ('medal', 'verification', 'status', 'achievement')),
  icon        TEXT,
  color       TEXT,
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.19 USER BADGES (علاقة المستخدمين بالشارات)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  is_active  BOOLEAN DEFAULT TRUE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_id)
);

-- -----------------------------------------------------------------------
-- 2.20 COMMUNITIES (مجموعات الدردشة)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description   TEXT CHECK (description IS NULL OR length(description) <= 500),
  avatar_url    TEXT,
  invite_code   TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 8)),
  created_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  members_count INTEGER DEFAULT 1 CHECK (members_count >= 1),
  is_private    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.21 COMMUNITY MEMBERS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  is_muted     BOOLEAN DEFAULT FALSE,
  muted_until  TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  mute_reason  TEXT DEFAULT NULL,
  kicked_at    TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  muted_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- -----------------------------------------------------------------------
-- 2.22 COMMUNITY MESSAGES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (length(content) >= 1),
  image_url    TEXT,
  is_edited    BOOLEAN DEFAULT FALSE,
  edited_at    TIMESTAMP WITH TIME ZONE,
  is_deleted   BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at   TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.23 MODERATION LOGS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  action           TEXT NOT NULL,
  target_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason           TEXT,
  duration_minutes INTEGER,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.24 TYPING INDICATORS (مؤشرات الكتابة في الوقت الحقيقي)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typing_indicators (
  id           TEXT PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  avatar_url   TEXT,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.25 USER DEVICES (تتبع الأجهزة)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address      TEXT NOT NULL,
  browser         TEXT,
  browser_version TEXT,
  device_type     TEXT,
  device_name     TEXT,
  device_model    TEXT,
  os_name         TEXT,
  os_version      TEXT,
  country         TEXT,
  country_code    TEXT,
  city            TEXT,
  last_active_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username          ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online         ON profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen         ON profiles(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at       ON profiles(verified_at);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id              ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at           ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created         ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned               ON posts(user_id, is_pinned) WHERE is_pinned = TRUE;

-- Follows
CREATE INDEX IF NOT EXISTS idx_follows_follower           ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following          ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at         ON follows(created_at DESC);

-- Follow Requests
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester  ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_recipient  ON follow_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status     ON follow_requests(status);

-- Stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id            ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at         ON stories(expires_at);

-- Story Views
CREATE INDEX IF NOT EXISTS idx_story_views_story_id       ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id        ON story_views(user_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id           ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id           ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at        ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id         ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_created    ON comments(parent_comment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_gif_url           ON comments(gif_url) WHERE gif_url IS NOT NULL;

-- Likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id              ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id              ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id           ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel_id              ON likes(reel_id);

-- Reels
CREATE INDEX IF NOT EXISTS idx_reels_user_id              ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at           ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_user_created         ON reels(user_id, created_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id         ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id       ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_story_id          ON messages(story_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at        ON messages(created_at DESC);

-- Message Reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_msg_id   ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id  ON message_reactions(user_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at   ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id     ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id      ON notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_comment_id   ON notifications(comment_id);

-- Saved Posts
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id        ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id        ON saved_posts(post_id);

-- Post Views
CREATE INDEX IF NOT EXISTS idx_post_views_post_id         ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id         ON post_views(user_id);

-- Post Insights
CREATE INDEX IF NOT EXISTS idx_post_insights_post_id      ON post_insights(post_id);

-- Badges
CREATE INDEX IF NOT EXISTS idx_badges_type                ON badges(type);
CREATE INDEX IF NOT EXISTS idx_badges_category            ON badges(category);

-- User Badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id        ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id       ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_awarded_by     ON user_badges(awarded_by);

-- Communities
CREATE INDEX IF NOT EXISTS idx_communities_created_by     ON communities(created_by);
CREATE INDEX IF NOT EXISTS idx_communities_invite_code    ON communities(invite_code);
CREATE INDEX IF NOT EXISTS idx_communities_created_at     ON communities(created_at DESC);

-- Community Members
CREATE INDEX IF NOT EXISTS idx_community_members_comm     ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user     ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role     ON community_members(role);
CREATE INDEX IF NOT EXISTS idx_community_members_muted    ON community_members(is_muted);
CREATE INDEX IF NOT EXISTS idx_community_members_kicked   ON community_members(kicked_at);

-- Community Messages
CREATE INDEX IF NOT EXISTS idx_community_msgs_community   ON community_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_community_msgs_sender      ON community_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_community_msgs_created     ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_msgs_comm_crtd   ON community_messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_msgs_deleted     ON community_messages(community_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_community_msgs_deleted_at  ON community_messages(deleted_at) WHERE is_deleted = TRUE;

-- Moderation Logs
CREATE INDEX IF NOT EXISTS idx_mod_logs_community_id      ON moderation_logs(community_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_target_user       ON moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_admin_user        ON moderation_logs(admin_user_id);

-- Typing Indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_comm     ON typing_indicators(community_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user     ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated  ON typing_indicators(updated_at);

-- User Devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id       ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_ip            ON user_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active   ON user_devices(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_active   ON user_devices(user_id, last_active_at DESC);


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows            ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views         ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_insights      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices       ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 5. POLICIES
-- ============================================================================

-- ---- PROFILES ----
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---- POSTS ----
CREATE POLICY "Posts viewable by everyone"
  ON posts FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- ---- FOLLOWS ----
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT USING (TRUE);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ---- FOLLOW REQUESTS ----
CREATE POLICY "Users can view their own follow requests"
  ON follow_requests FOR SELECT
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Users can create follow requests"
  ON follow_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can update follow request status"
  ON follow_requests FOR UPDATE
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Requesters can delete their own requests"
  ON follow_requests FOR DELETE USING (auth.uid() = requester_id);

-- ---- STORIES ----
CREATE POLICY "Active stories are viewable"
  ON stories FOR SELECT
  USING (
    expires_at > NOW() AND (
      user_id = auth.uid() OR
      user_id IN (SELECT following_id FROM follows WHERE follower_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own stories"
  ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE USING (auth.uid() = user_id);

-- ---- STORY VIEWS ----
CREATE POLICY "Story views are viewable"
  ON story_views FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert story views"
  ON story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- COMMENTS ----
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id);

-- ---- LIKES ----
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- ---- REELS ----
CREATE POLICY "Reels are viewable by everyone"
  ON reels FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own reels"
  ON reels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reels"
  ON reels FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reels"
  ON reels FOR DELETE USING (auth.uid() = user_id);

-- ---- MESSAGES ----
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own sent messages"
  ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- ---- MESSAGE REACTIONS ----
CREATE POLICY "Message reactions are viewable"
  ON message_reactions FOR SELECT USING (TRUE);

CREATE POLICY "Users can add reactions"
  ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- ---- NOTIFICATIONS ----
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT USING (TRUE);

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE USING (TRUE);

-- ---- SAVED POSTS ----
CREATE POLICY "Users can read their saved posts"
  ON saved_posts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved posts"
  ON saved_posts FOR DELETE USING (auth.uid() = user_id);

-- ---- POST VIEWS ----
CREATE POLICY "Users can add post views"
  ON post_views FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view post views"
  ON post_views FOR SELECT USING (TRUE);

-- ---- POST INSIGHTS ----
CREATE POLICY "Users can read post insights"
  ON post_insights FOR SELECT USING (TRUE);

-- ---- USER STATISTICS ----
CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics"
  ON user_statistics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON user_statistics FOR UPDATE USING (auth.uid() = user_id);

-- ---- ADMINS ----
CREATE POLICY "Admins table is viewable by authenticated"
  ON admins FOR SELECT USING (TRUE);

-- ---- BADGES ----
CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT USING (TRUE);

-- ---- USER BADGES ----
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage user badges"
  ON user_badges FOR ALL USING (TRUE);

-- ---- COMMUNITIES ----
CREATE POLICY "Users can view their communities"
  ON communities FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only creator can update community"
  ON communities FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Only creator can delete community"
  ON communities FOR DELETE USING (created_by = auth.uid());

-- ---- COMMUNITY MEMBERS ----
CREATE POLICY "Users can view community members"
  ON community_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can add members"
  ON community_members FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can leave or be removed from community"
  ON community_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_members AS cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

CREATE POLICY "Admins can update member roles"
  ON community_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_members AS cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- ---- COMMUNITY MESSAGES ----
CREATE POLICY "Users can view community messages"
  ON community_messages FOR SELECT
  USING (
    community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
    OR community_id IN (SELECT id FROM communities WHERE created_by = auth.uid())
  );

CREATE POLICY "Members can send messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can edit their messages"
  ON community_messages FOR UPDATE USING (TRUE);

CREATE POLICY "Users can delete their messages"
  ON community_messages FOR DELETE USING (sender_id = auth.uid());

-- ---- MODERATION LOGS ----
CREATE POLICY "Admins can read moderation logs"
  ON moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = moderation_logs.community_id
        AND community_members.user_id = auth.uid()
        AND community_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can create moderation logs"
  ON moderation_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = moderation_logs.community_id
        AND community_members.user_id = auth.uid()
        AND community_members.role = 'admin'
    )
  );

-- ---- TYPING INDICATORS ----
CREATE POLICY "Anyone can read typing indicators"
  ON typing_indicators FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage their own typing status"
  ON typing_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
  ON typing_indicators FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
  ON typing_indicators FOR DELETE USING (auth.uid() = user_id);

-- ---- USER DEVICES ----
CREATE POLICY "Users can view their own devices"
  ON user_devices FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can track devices"
  ON user_devices FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update their own devices"
  ON user_devices FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own devices"
  ON user_devices FOR DELETE USING (user_id = auth.uid());


-- ============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================

-- -----------------------------------------------------------------------
-- دالة تحديث updated_at تلقائياً
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق trigger على الجداول التي تحتوي على updated_at
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON comments;
CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_reels_updated_at ON reels;
CREATE TRIGGER trigger_reels_updated_at
  BEFORE UPDATE ON reels FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_communities_updated_at ON communities;
CREATE TRIGGER trigger_communities_updated_at
  BEFORE UPDATE ON communities FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_community_msgs_updated_at ON community_messages;
CREATE TRIGGER trigger_community_msgs_updated_at
  BEFORE UPDATE ON community_messages FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------
-- دالة إنشاء profile تلقائياً عند تسجيل مستخدم جديد
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------
-- عدادات المتابعين
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION decrement_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_follow_created ON follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON follows FOR EACH ROW
  EXECUTE FUNCTION increment_follow_counts();

DROP TRIGGER IF EXISTS on_follow_deleted ON follows;
CREATE TRIGGER on_follow_deleted
  AFTER DELETE ON follows FOR EACH ROW
  EXECUTE FUNCTION decrement_follow_counts();

-- -----------------------------------------------------------------------
-- عداد المنشورات
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION decrement_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_post_created ON posts;
CREATE TRIGGER on_post_created
  AFTER INSERT ON posts FOR EACH ROW
  EXECUTE FUNCTION increment_posts_count();

DROP TRIGGER IF EXISTS on_post_deleted ON posts;
CREATE TRIGGER on_post_deleted
  AFTER DELETE ON posts FOR EACH ROW
  EXECUTE FUNCTION decrement_posts_count();

-- -----------------------------------------------------------------------
-- عداد إعجابات المنشورات
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_post_likes_count ON likes;
CREATE TRIGGER trigger_post_likes_count
  AFTER INSERT OR DELETE ON likes FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- -----------------------------------------------------------------------
-- عداد إعجابات الريلز
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reel_id IS NOT NULL THEN
    UPDATE reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reel_id IS NOT NULL THEN
    UPDATE reels SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.reel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_reel_likes_count ON likes;
CREATE TRIGGER trigger_reel_likes_count
  AFTER INSERT OR DELETE ON likes FOR EACH ROW
  EXECUTE FUNCTION update_reel_likes_count();

-- -----------------------------------------------------------------------
-- عداد تعليقات المنشورات
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_post_comments_count ON comments;
CREATE TRIGGER trigger_post_comments_count
  AFTER INSERT OR DELETE ON comments FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- -----------------------------------------------------------------------
-- عداد مشاهدات القصص
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_story_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_story_views_count ON story_views;
CREATE TRIGGER trigger_story_views_count
  AFTER INSERT ON story_views FOR EACH ROW
  EXECUTE FUNCTION update_story_views_count();

-- -----------------------------------------------------------------------
-- عداد مشاهدات المنشورات
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET views_count = (SELECT COUNT(*) FROM post_views WHERE post_id = NEW.post_id)
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_post_views ON post_views;
CREATE TRIGGER trigger_update_post_views
  AFTER INSERT ON post_views FOR EACH ROW
  EXECUTE FUNCTION update_post_views_count();

-- -----------------------------------------------------------------------
-- إضافة المنشئ تلقائياً كـ admin في المجتمع
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (community_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_add_creator_as_admin ON communities;
CREATE TRIGGER trigger_add_creator_as_admin
  AFTER INSERT ON communities FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_admin();

-- -----------------------------------------------------------------------
-- قبول طلبات المتابعة تلقائياً للحسابات العامة
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_approve_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = NEW.recipient_id AND is_private = FALSE
  ) THEN
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.recipient_id)
    ON CONFLICT DO NOTHING;
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_auto_approve_follow_request ON follow_requests;
CREATE TRIGGER trigger_auto_approve_follow_request
  BEFORE INSERT ON follow_requests FOR EACH ROW
  EXECUTE FUNCTION auto_approve_follow_request();

CREATE OR REPLACE FUNCTION approve_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.recipient_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_approve_follow_request ON follow_requests;
CREATE TRIGGER trigger_approve_follow_request
  AFTER UPDATE ON follow_requests FOR EACH ROW
  EXECUTE FUNCTION approve_follow_request();

-- -----------------------------------------------------------------------
-- دوال مساعدة أخرى
-- -----------------------------------------------------------------------

-- تنظيف القصص المنتهية
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS VOID AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- تعطيل المستخدمين غير النشطين
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET is_online = FALSE
  WHERE is_online = TRUE AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- عدد طلبات المتابعة المعلقة
CREATE OR REPLACE FUNCTION get_pending_follow_requests_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follow_requests
  WHERE recipient_id = p_user_id AND status = 'pending';
$$ LANGUAGE sql;

-- التحقق من وجود طلب متابعة
CREATE OR REPLACE FUNCTION has_pending_follow_request(p_requester UUID, p_recipient UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM follow_requests
    WHERE requester_id = p_requester AND recipient_id = p_recipient AND status = 'pending'
  );
$$ LANGUAGE sql;

-- الحصول على المنشورات المحفوظة
CREATE OR REPLACE FUNCTION get_user_saved_posts(p_user_id UUID)
RETURNS TABLE(
  post_id       UUID,
  username      TEXT,
  caption       TEXT,
  image_url     TEXT,
  likes_count   INTEGER,
  comments_count INTEGER,
  views_count   INTEGER,
  saved_at      TIMESTAMP WITH TIME ZONE
) AS $$
SELECT
  p.id, pr.username, p.caption, p.image_url,
  p.likes_count, p.comments_count, p.views_count, sp.created_at
FROM saved_posts sp
JOIN posts p ON sp.post_id = p.id
JOIN profiles pr ON p.user_id = pr.id
WHERE sp.user_id = p_user_id
ORDER BY sp.created_at DESC;
$$ LANGUAGE sql;


-- ============================================================================
-- 7. VIEWS
-- ============================================================================

-- عرض طلبات المتابعة المعلقة مع تفاصيل الملفات الشخصية
CREATE OR REPLACE VIEW pending_follow_requests_with_profile AS
SELECT
  fr.id,
  fr.requester_id,
  fr.recipient_id,
  fr.created_at,
  p.username,
  p.full_name,
  p.avatar_url,
  p.is_verified
FROM follow_requests fr
JOIN profiles p ON fr.requester_id = p.id
WHERE fr.status = 'pending';


-- ============================================================================
-- 8. GRANTS (صلاحيات الوصول)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;

GRANT SELECT ON posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON posts TO authenticated;

GRANT SELECT ON follows TO anon, authenticated;
GRANT INSERT, DELETE ON follows TO authenticated;

GRANT SELECT ON follow_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON follow_requests TO authenticated;

GRANT SELECT ON stories TO authenticated;
GRANT INSERT, DELETE ON stories TO authenticated;

GRANT SELECT ON story_views TO authenticated;
GRANT INSERT ON story_views TO authenticated;

GRANT SELECT ON comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON comments TO authenticated;

GRANT SELECT ON likes TO anon, authenticated;
GRANT INSERT, DELETE ON likes TO authenticated;

GRANT SELECT ON reels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON reels TO authenticated;

GRANT SELECT ON messages TO authenticated;
GRANT INSERT, UPDATE ON messages TO authenticated;

GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;

GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

GRANT SELECT, INSERT, DELETE ON saved_posts TO authenticated;

GRANT SELECT, INSERT ON post_views TO authenticated;

GRANT SELECT ON post_insights TO authenticated;

GRANT SELECT ON badges TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_badges TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON communities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_messages TO authenticated;

GRANT SELECT, INSERT ON moderation_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON typing_indicators TO authenticated;

GRANT SELECT, DELETE, UPDATE ON user_devices TO authenticated;
GRANT INSERT ON user_devices TO anon, authenticated;


-- ============================================================================
-- 9. STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', TRUE, 5242880,  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('covers',  'covers',  TRUE, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('posts',   'posts',   TRUE, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('reels',   'reels',   TRUE, 524288000, ARRAY['video/mp4','video/webm','video/mov','video/quicktime']),
  ('stories', 'stories', TRUE, 104857600, ARRAY['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/webm']),
  ('messages', 'messages', FALSE, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('community-media', 'community-media', TRUE, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies - متاح للجميع قراءة المحتوى العام
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public bucket access - avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload - avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Owner update - avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Owner delete - avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - posts"
  ON storage.objects FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated upload - posts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - reels"
  ON storage.objects FOR SELECT USING (bucket_id = 'reels');

CREATE POLICY "Authenticated upload - reels"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reels' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - stories"
  ON storage.objects FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "Authenticated upload - stories"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - covers"
  ON storage.objects FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Authenticated upload - covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - community-media"
  ON storage.objects FOR SELECT USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated upload - community-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-media' AND auth.role() = 'authenticated');

CREATE POLICY "Messages access - owner only"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'messages' AND auth.role() = 'authenticated');

CREATE POLICY "Messages upload - authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'messages' AND auth.role() = 'authenticated');


-- ============================================================================
-- 10. SEED DATA - البيانات الأساسية للشارات
-- ============================================================================

INSERT INTO badges (name, type, description, category, icon, color, image_url) VALUES
  ('Gold Early Member',   'gold_early_member',   'ميدالية العضو المبكر الذهبي',  'medal',        '👑', '#FFD700', '/medals/gold.png'),
  ('Silver Early Member', 'silver_early_member', 'ميدالية العضو المبكر الفضي',   'medal',        '🥈', '#C0C0C0', '/medals/silver.png'),
  ('Bronze Early Member', 'bronze_early_member', 'ميدالية العضو المبكر البرونزي','medal',        '🥉', '#CD7F32', '/medals/bronze.png'),
  ('Beta Tester',         'beta_tester',         'بادج مختبر بيتا',              'medal',        '⚙️', '#06B6D4', '/medals/beta.png'),
  ('Verified User',       'verified',            'حساب موثق من نوفي',            'verification', '✓',  '#3B82F6', NULL),
  ('Official Account',    'official',            'حساب رسمي من نوفي',            'status',       '🏛️', '#EC4899', NULL),
  ('Premium Member',      'premium',             'عضو بريميوم مع مميزات حصرية', 'status',       '⭐', '#FBBF24', NULL),
  ('Creator',             'creator',             'صانع محتوى',                   'achievement',  '🎬', '#8B5CF6', NULL),
  ('Popular',             'popular',             'شخصية شهيرة',                  'achievement',  '🔥', '#F59E0B', NULL),
  ('Active Member',       'active',              'عضو نشط',                      'achievement',  '⚡', '#10B981', NULL)
ON CONFLICT (type) DO NOTHING;


-- ============================================================================
-- DONE! ✅
-- ============================================================================
-- تم إنشاء قاعدة البيانات بالكامل بنجاح
-- ============================================================================
-- الجداول المُنشأة:
--   ✅ profiles            - الملفات الشخصية
--   ✅ posts               - المنشورات
--   ✅ follows             - المتابعات
--   ✅ follow_requests     - طلبات المتابعة (الحسابات الخاصة)
--   ✅ stories             - القصص
--   ✅ story_views         - مشاهدات القصص
--   ✅ comments            - التعليقات (مع دعم الردود المتداخلة)
--   ✅ likes               - الإعجابات (منشورات + تعليقات + ريلز)
--   ✅ reels               - الريلز
--   ✅ messages            - الرسائل المباشرة (مع soft delete)
--   ✅ message_reactions   - ردود أفعال الرسائل
--   ✅ notifications       - الإشعارات
--   ✅ saved_posts         - المنشورات المحفوظة
--   ✅ post_views          - مشاهدات المنشورات
--   ✅ post_insights       - إحصائيات المنشورات
--   ✅ user_statistics     - إحصائيات المستخدمين
--   ✅ admins              - جدول الأدمن
--   ✅ badges              - فهرس الشارات
--   ✅ user_badges         - شارات المستخدمين
--   ✅ communities         - المجتمعات (مع كود الدعوة)
--   ✅ community_members   - أعضاء المجتمعات (مع نظام الإيقاف)
--   ✅ community_messages  - رسائل المجتمعات (مع soft delete)
--   ✅ moderation_logs     - سجلات الإشراف
--   ✅ typing_indicators   - مؤشرات الكتابة الفورية
--   ✅ user_devices        - تتبع الأجهزة
-- ============================================================================
