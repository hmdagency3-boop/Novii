-- ============================================================================
-- NOVII SOCIAL MEDIA PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- نسخة شاملة وكاملة لإنشاء قاعدة بيانات Novii من الصفر
-- قم بتشغيل هذا الملف كاملاً في Supabase SQL Editor
-- ============================================================================
-- الترتيب المتبع:
--   1.  الامتدادات (Extensions)
--   2.  الجداول (Tables) - بالترتيب الصحيح للمراجع
--   3.  الفهارس (Indexes)
--   4.  Row Level Security
--   5.  دوال مساعدة لـ RLS (SECURITY DEFINER)
--   6.  السياسات (Policies)
--   7.  الدوال والمشغّلات (Functions & Triggers)
--   8.  الصلاحيات (Grants)
--   9.  Storage Buckets
--   10. البيانات الأساسية (Seed Data)
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
-- 2.1 PROFILES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username                      TEXT UNIQUE NOT NULL,
  full_name                     TEXT,
  bio                           TEXT,
  avatar_url                    TEXT,
  cover_url                     TEXT,
  website                       TEXT,
  location                      TEXT,
  gender                        TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),

  -- حالة الحساب
  is_verified                   BOOLEAN DEFAULT FALSE,
  verified_at                   TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_private                    BOOLEAN DEFAULT FALSE,
  is_official                   BOOLEAN DEFAULT FALSE,
  is_creator                    BOOLEAN DEFAULT FALSE,
  is_premium                    BOOLEAN DEFAULT FALSE,
  is_popular                    BOOLEAN DEFAULT FALSE,
  is_active                     BOOLEAN DEFAULT FALSE,
  is_banned                     BOOLEAN DEFAULT FALSE,
  banned_reason                 TEXT,
  ban_until                     TIMESTAMP WITH TIME ZONE,
  role                          TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- ميداليات العضوية المبكرة
  is_gold_early_member          BOOLEAN DEFAULT FALSE,
  gold_early_member_at          TIMESTAMP WITH TIME ZONE,
  is_silver_early_member        BOOLEAN DEFAULT FALSE,
  silver_early_member_at        TIMESTAMP WITH TIME ZONE,
  is_bronze_early_member        BOOLEAN DEFAULT FALSE,
  bronze_early_member_at        TIMESTAMP WITH TIME ZONE,
  is_beta_tester                BOOLEAN DEFAULT FALSE,
  beta_tester_at                TIMESTAMP WITH TIME ZONE,

  -- عدادات
  followers_count               INTEGER DEFAULT 0,
  following_count               INTEGER DEFAULT 0,
  posts_count                   INTEGER DEFAULT 0,
  pending_follow_requests_count INTEGER DEFAULT 0,

  -- الحضور والنشاط
  is_online                     BOOLEAN DEFAULT FALSE,
  last_seen                     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- سياسة تغيير البيانات الشخصية (cooldown)
  username_changed_at           TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  full_name_changed_at          TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  gender_changed_at             TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  -- نظام التحذيرات
  strikes_count                 INTEGER DEFAULT 0,

  created_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  is_deleted       BOOLEAN DEFAULT FALSE,
  deleted_at       TIMESTAMP WITH TIME ZONE DEFAULT NULL,
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
-- 2.4 FOLLOW REQUESTS
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
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url         TEXT NOT NULL,
  media_type        TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  views_count       INTEGER DEFAULT 0,
  expires_at        TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  music_url         TEXT,
  music_title       TEXT,
  music_artist      TEXT,
  music_artwork_url TEXT,
  music_start_time  INTEGER DEFAULT 0,
  filter_name       TEXT DEFAULT 'normal'
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
-- 2.7 COMMENTS (post_id nullable لدعم تعليقات الريلز)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID REFERENCES posts(id) ON DELETE CASCADE,
  reel_id           UUID,   -- سيُضاف المرجع بعد جدول reels
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  gif_url           TEXT,
  likes_count       INTEGER DEFAULT 0,
  is_deleted        BOOLEAN DEFAULT FALSE,
  deleted_at        TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.8 LIKES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reel_id    UUID,   -- سيُضاف المرجع بعد جدول reels
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  UNIQUE(comment_id, user_id),
  CONSTRAINT check_likes_exactly_one CHECK (
    (post_id    IS NOT NULL)::int +
    (comment_id IS NOT NULL)::int +
    (reel_id    IS NOT NULL)::int = 1
  )
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
  is_deleted     BOOLEAN DEFAULT FALSE,
  deleted_at     TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة مراجع reel_id
ALTER TABLE likes    ADD CONSTRAINT fk_likes_reel_id    FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE;
ALTER TABLE comments ADD CONSTRAINT fk_comments_reel_id FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE;

-- unique constraint لإعجابات الريلز
ALTER TABLE likes DROP CONSTRAINT IF EXISTS unique_reel_user_like;
ALTER TABLE likes ADD CONSTRAINT unique_reel_user_like UNIQUE (reel_id, user_id);

-- -----------------------------------------------------------------------
-- 2.10 MESSAGES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  image_url        TEXT,
  audio_url        TEXT,
  story_id         UUID REFERENCES stories(id) ON DELETE CASCADE,
  reply_to_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
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
-- 2.18 BADGES
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
-- 2.19 USER BADGES
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
-- 2.20 COMMUNITIES
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
-- 2.24 TYPING INDICATORS (composite PK: community_id + user_id)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typing_indicators (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  username     TEXT NOT NULL,
  avatar_url   TEXT,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- -----------------------------------------------------------------------
-- 2.25 USER DEVICES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_devices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint  TEXT NOT NULL,
  ip_address          TEXT NOT NULL,
  browser             TEXT,
  browser_version     TEXT,
  device_type         TEXT,
  device_name         TEXT,
  device_model        TEXT,
  os_name             TEXT,
  os_version          TEXT,
  country             TEXT,
  country_code        TEXT,
  city                TEXT,
  screen_resolution   TEXT,
  timezone            TEXT,
  language            TEXT,
  is_trusted          BOOLEAN DEFAULT FALSE,
  status              TEXT DEFAULT 'active',
  login_count         INTEGER DEFAULT 1,
  last_login_ip       TEXT,
  session_token       TEXT,
  last_active_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_login_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.26 USER SETTINGS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled    BOOLEAN DEFAULT TRUE,
  push_notifications       BOOLEAN DEFAULT TRUE,
  message_notifications    BOOLEAN DEFAULT TRUE,
  like_notifications       BOOLEAN DEFAULT TRUE,
  comment_notifications    BOOLEAN DEFAULT TRUE,
  follow_notifications     BOOLEAN DEFAULT TRUE,
  messages_privacy         TEXT DEFAULT 'everyone' CHECK (messages_privacy IN ('everyone', 'followers', 'approved')),
  comments_privacy         TEXT DEFAULT 'everyone' CHECK (comments_privacy IN ('everyone', 'followers', 'approved')),
  tags_privacy             TEXT DEFAULT 'everyone' CHECK (tags_privacy IN ('everyone', 'followers', 'none')),
  mentions_privacy         TEXT DEFAULT 'everyone' CHECK (mentions_privacy IN ('everyone', 'followers', 'none')),
  sharing_privacy          TEXT DEFAULT 'everyone' CHECK (sharing_privacy IN ('everyone', 'followers', 'none')),
  hide_online_status       BOOLEAN DEFAULT FALSE,
  hide_story               BOOLEAN DEFAULT FALSE,
  hidden_words             TEXT[] DEFAULT '{}',
  hidden_words_enabled     BOOLEAN DEFAULT FALSE,
  content_language         TEXT DEFAULT 'ar',
  show_suggested           BOOLEAN DEFAULT TRUE,
  show_trending            BOOLEAN DEFAULT TRUE,
  sensitive_content        BOOLEAN DEFAULT FALSE,
  hide_like_counts         BOOLEAN DEFAULT FALSE,
  hide_others_like_counts  BOOLEAN DEFAULT FALSE,
  auto_archive_stories     BOOLEAN DEFAULT TRUE,
  auto_archive_reels       BOOLEAN DEFAULT FALSE,
  font_size                TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  high_contrast            BOOLEAN DEFAULT FALSE,
  reduce_motion            BOOLEAN DEFAULT FALSE,
  account_type             TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'creator')),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- -----------------------------------------------------------------------
-- 2.27 BLOCKED USERS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocked_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- -----------------------------------------------------------------------
-- 2.28 CLOSE FRIENDS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS close_friends (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- -----------------------------------------------------------------------
-- 2.29 MUTED USERS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS muted_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mute_stories   BOOLEAN DEFAULT TRUE,
  mute_posts     BOOLEAN DEFAULT TRUE,
  mute_messages  BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muted_user_id)
);

-- -----------------------------------------------------------------------
-- 2.30 RESTRICTED USERS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restricted_users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restricted_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restricted_user_id)
);

-- -----------------------------------------------------------------------
-- 2.31 FAVORITE USERS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorite_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, favorite_user_id)
);

-- -----------------------------------------------------------------------
-- 2.32 CONVERSATIONS (دردشة جماعية)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_group     BOOLEAN DEFAULT FALSE,
  group_name   TEXT,
  group_avatar TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.33 CONVERSATION MEMBERS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- -----------------------------------------------------------------------
-- 2.34 MUTED CONVERSATIONS (كتم محادثة مباشرة)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS muted_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, other_user_id)
);

-- -----------------------------------------------------------------------
-- 2.35 HIGHLIGHTS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS highlights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  cover_image TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.36 HIGHLIGHT STORIES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS highlight_stories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  story_id     UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, story_id)
);

-- -----------------------------------------------------------------------
-- 2.37 HASHTAGS
-- -----------------------------------------------------------------------
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

-- -----------------------------------------------------------------------
-- 2.38 USER WARNINGS / STRIKES
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_warnings (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issued_by    UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  reason       TEXT    NOT NULL,
  warning_type TEXT    DEFAULT 'warning' CHECK (warning_type IN ('warning', 'strike', 'ban')),
  is_active    BOOLEAN DEFAULT TRUE,
  expires_at   TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2.39 FEED SCORES (خوارزمية الـ Feed)
-- -----------------------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_comments_reel_id           ON comments(reel_id);
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
CREATE INDEX IF NOT EXISTS idx_messages_reply_to          ON messages(reply_to_id);
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
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated  ON typing_indicators(updated_at);

-- User Devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id       ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_ip            ON user_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active   ON user_devices(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_active   ON user_devices(user_id, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint   ON user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_session       ON user_devices(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_devices_status        ON user_devices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_devices_trusted       ON user_devices(user_id, is_trusted) WHERE is_trusted = TRUE;

-- User Settings / extra tables
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id           ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id           ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_user_id           ON close_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_user_id             ON muted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_restricted_users_user_id        ON restricted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_users_user_id          ON favorite_users(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id    ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_id    ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id              ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_highlight_id  ON highlight_stories(highlight_id);
CREATE INDEX IF NOT EXISTS idx_muted_conversations_user_id     ON muted_conversations(user_id);

-- Soft delete indexes
CREATE INDEX IF NOT EXISTS idx_posts_not_deleted    ON posts(user_id, created_at DESC)    WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_not_deleted ON comments(post_id)                  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_reels_not_deleted    ON reels(user_id, created_at DESC)    WHERE is_deleted = FALSE;

-- User Devices fingerprint
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_fingerprint
  ON user_devices(device_fingerprint) WHERE device_fingerprint IS NOT NULL;

-- Hashtags
CREATE INDEX IF NOT EXISTS idx_hashtags_name           ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_posts_count    ON hashtags(posts_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post      ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag   ON post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_reel_hashtags_reel      ON reel_hashtags(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_hashtags_hashtag   ON reel_hashtags(hashtag_id);

-- User Warnings
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id   ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_active    ON user_warnings(is_active) WHERE is_active = TRUE;

-- Feed Scores
CREATE INDEX IF NOT EXISTS idx_feed_scores_user_score  ON feed_scores(user_id, score DESC) WHERE seen = FALSE;
CREATE INDEX IF NOT EXISTS idx_feed_scores_post_id     ON feed_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_reel_id     ON feed_scores(reel_id);


-- ============================================================================
-- 4. ROW LEVEL SECURITY
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
ALTER TABLE user_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_friends      ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights         ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_hashtags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_scores        ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 5. HELPER FUNCTIONS FOR RLS (SECURITY DEFINER - تكسر حلقة التكرار)
-- ============================================================================

-- التحقق إذا كان المستخدم عضواً في المجتمع
CREATE OR REPLACE FUNCTION auth_is_community_member(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- التحقق إذا كان المستخدم أدمناً أو مشرفاً في المجتمع
CREATE OR REPLACE FUNCTION auth_is_community_admin(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- ============================================================================
-- 6. POLICIES
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
  ON follow_requests FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = requester_id);
CREATE POLICY "Users can create follow requests"
  ON follow_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Recipients can update follow request status"
  ON follow_requests FOR UPDATE USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "Requesters can delete their own requests"
  ON follow_requests FOR DELETE USING (auth.uid() = requester_id);

-- ---- STORIES ----
CREATE POLICY "Active stories are viewable"
  ON stories FOR SELECT USING (
    expires_at > NOW() AND (
      user_id = auth.uid() OR
      user_id IN (SELECT following_id FROM follows WHERE follower_id = auth.uid())
    )
  );
CREATE POLICY "Users can insert own stories"
  ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
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
CREATE POLICY "notifications_insert"  ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "notifications_select"  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update"  ON notifications FOR UPDATE USING (auth.uid() = user_id);

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

-- ---- COMMUNITIES (fixed - no recursion) ----
CREATE POLICY "Users can view their communities"
  ON communities FOR SELECT
  USING (created_by = auth.uid() OR auth_is_community_member(id));
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Only creator can update community"
  ON communities FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Only creator can delete community"
  ON communities FOR DELETE USING (created_by = auth.uid());

-- ---- COMMUNITY MEMBERS (fixed - no recursion) ----
CREATE POLICY "Users can view community members"
  ON community_members FOR SELECT
  USING (user_id = auth.uid() OR auth_is_community_member(community_id));
CREATE POLICY "Admins can add members"
  ON community_members FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can leave or be removed from community"
  ON community_members FOR DELETE
  USING (user_id = auth.uid() OR auth_is_community_admin(community_id));
CREATE POLICY "Admins can update member roles"
  ON community_members FOR UPDATE USING (auth_is_community_admin(community_id));

-- ---- COMMUNITY MESSAGES (fixed - no recursion) ----
CREATE POLICY "Users can view community messages"
  ON community_messages FOR SELECT
  USING (
    auth_is_community_member(community_id)
    OR community_id IN (SELECT id FROM communities WHERE created_by = auth.uid())
  );
CREATE POLICY "Members can send messages"
  ON community_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND auth_is_community_member(community_id));
CREATE POLICY "Users can edit their messages"
  ON community_messages FOR UPDATE USING (TRUE);
CREATE POLICY "Users can delete their messages"
  ON community_messages FOR DELETE USING (sender_id = auth.uid());

-- ---- MODERATION LOGS (fixed - no recursion) ----
CREATE POLICY "Admins can read moderation logs"
  ON moderation_logs FOR SELECT USING (auth_is_community_admin(community_id));
CREATE POLICY "Admins can create moderation logs"
  ON moderation_logs FOR INSERT WITH CHECK (auth_is_community_admin(community_id));

-- ---- TYPING INDICATORS (fixed - no recursion) ----
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
  ON user_devices FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own devices"
  ON user_devices FOR DELETE USING (user_id = auth.uid());

-- ---- USER SETTINGS ----
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- ---- BLOCKED USERS ----
CREATE POLICY "Users can view own blocked list"
  ON blocked_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE USING (auth.uid() = user_id);

-- ---- CLOSE FRIENDS ----
CREATE POLICY "Users can view own close friends"
  ON close_friends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add close friends"
  ON close_friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove close friends"
  ON close_friends FOR DELETE USING (auth.uid() = user_id);

-- ---- MUTED USERS ----
CREATE POLICY "Users can view own muted list"
  ON muted_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mute others"
  ON muted_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unmute others"
  ON muted_users FOR DELETE USING (auth.uid() = user_id);

-- ---- RESTRICTED USERS ----
CREATE POLICY "Users can view own restricted list"
  ON restricted_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can restrict others"
  ON restricted_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unrestrict others"
  ON restricted_users FOR DELETE USING (auth.uid() = user_id);

-- ---- FAVORITE USERS ----
CREATE POLICY "Users can view own favorites"
  ON favorite_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites"
  ON favorite_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites"
  ON favorite_users FOR DELETE USING (auth.uid() = user_id);

-- ---- CONVERSATIONS ----
CREATE POLICY "Members can view conversations"
  ON conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ---- CONVERSATION MEMBERS ----
CREATE POLICY "Members can view conversation members"
  ON conversation_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
  );
CREATE POLICY "Conversation creator can add members"
  ON conversation_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND created_by = auth.uid())
  );

-- ---- MUTED CONVERSATIONS ----
CREATE POLICY "Users manage own mutes"
  ON muted_conversations USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---- HIGHLIGHTS ----
CREATE POLICY "Anyone can view highlights"
  ON highlights FOR SELECT USING (TRUE);
CREATE POLICY "Users can create own highlights"
  ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own highlights"
  ON highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own highlights"
  ON highlights FOR DELETE USING (auth.uid() = user_id);

-- ---- HIGHLIGHT STORIES ----
CREATE POLICY "Anyone can view highlight stories"
  ON highlight_stories FOR SELECT USING (TRUE);
CREATE POLICY "Highlight owner can add stories"
  ON highlight_stories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM highlights WHERE id = highlight_id AND user_id = auth.uid())
  );
CREATE POLICY "Highlight owner can remove stories"
  ON highlight_stories FOR DELETE USING (
    EXISTS (SELECT 1 FROM highlights WHERE id = highlight_id AND user_id = auth.uid())
  );

-- ---- HASHTAGS ----
CREATE POLICY "Hashtags are public"
  ON hashtags FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated can create hashtags"
  ON hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Post hashtags are public"
  ON post_hashtags FOR SELECT USING (TRUE);
CREATE POLICY "Post owners manage post hashtags"
  ON post_hashtags FOR ALL USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
  );
CREATE POLICY "Reel hashtags are public"
  ON reel_hashtags FOR SELECT USING (TRUE);
CREATE POLICY "Reel owners manage reel hashtags"
  ON reel_hashtags FOR ALL USING (
    EXISTS (SELECT 1 FROM reels WHERE id = reel_id AND user_id = auth.uid())
  );

-- ---- USER WARNINGS ----
CREATE POLICY "Users can view own warnings"
  ON user_warnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage warnings"
  ON user_warnings FOR ALL USING (TRUE);

-- ---- FEED SCORES ----
CREATE POLICY "Users can view own feed scores"
  ON feed_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System manages feed scores"
  ON feed_scores FOR ALL USING (TRUE);


-- ============================================================================
-- 7. FUNCTIONS & TRIGGERS
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

DROP TRIGGER IF EXISTS trigger_profiles_updated_at       ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_posts_updated_at          ON posts;
CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_comments_updated_at       ON comments;
CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_messages_updated_at       ON messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_reels_updated_at          ON reels;
CREATE TRIGGER trigger_reels_updated_at
  BEFORE UPDATE ON reels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_communities_updated_at    ON communities;
CREATE TRIGGER trigger_communities_updated_at
  BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_community_msgs_updated_at ON community_messages;
CREATE TRIGGER trigger_community_msgs_updated_at
  BEFORE UPDATE ON community_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at   ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at   ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_highlights_updated_at      ON highlights;
CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON highlights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION increment_follow_counts();

DROP TRIGGER IF EXISTS on_follow_deleted ON follows;
CREATE TRIGGER on_follow_deleted
  AFTER DELETE ON follows FOR EACH ROW EXECUTE FUNCTION decrement_follow_counts();

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
  AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION increment_posts_count();

DROP TRIGGER IF EXISTS on_post_deleted ON posts;
CREATE TRIGGER on_post_deleted
  AFTER DELETE ON posts FOR EACH ROW EXECUTE FUNCTION decrement_posts_count();

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
  AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

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
  AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_reel_likes_count();

-- -----------------------------------------------------------------------
-- عداد تعليقات المنشورات
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL AND NEW.parent_comment_id IS NULL THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL AND OLD.parent_comment_id IS NULL THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_post_comments_count ON comments;
CREATE TRIGGER trigger_post_comments_count
  AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- -----------------------------------------------------------------------
-- عداد تعليقات الريلز
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reel_id IS NOT NULL AND NEW.parent_comment_id IS NULL THEN
    UPDATE reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reel_id IS NOT NULL AND OLD.parent_comment_id IS NULL THEN
    UPDATE reels SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.reel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_reel_comments_count ON comments;
CREATE TRIGGER trigger_update_reel_comments_count
  AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_reel_comments_count();

-- -----------------------------------------------------------------------
-- عداد مشاهدات القصص
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_story_views_count()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_story_views_count ON story_views;
CREATE TRIGGER trigger_story_views_count
  AFTER INSERT ON story_views FOR EACH ROW EXECUTE FUNCTION update_story_views_count();

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
  AFTER INSERT ON post_views FOR EACH ROW EXECUTE FUNCTION update_post_views_count();

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
  AFTER INSERT ON communities FOR EACH ROW EXECUTE FUNCTION add_creator_as_admin();

-- -----------------------------------------------------------------------
-- قبول طلبات المتابعة تلقائياً للحسابات العامة
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_approve_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.recipient_id AND is_private = FALSE) THEN
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
  BEFORE INSERT ON follow_requests FOR EACH ROW EXECUTE FUNCTION auto_approve_follow_request();

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
  AFTER UPDATE ON follow_requests FOR EACH ROW EXECUTE FUNCTION approve_follow_request();

-- -----------------------------------------------------------------------
-- عداد الهاشتاقات
-- -----------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trigger_hashtag_posts_count ON post_hashtags;
CREATE TRIGGER trigger_hashtag_posts_count
  AFTER INSERT OR DELETE ON post_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_posts_count();

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

DROP TRIGGER IF EXISTS trigger_hashtag_reels_count ON reel_hashtags;
CREATE TRIGGER trigger_hashtag_reels_count
  AFTER INSERT OR DELETE ON reel_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_reels_count();

-- -----------------------------------------------------------------------
-- عداد الـ strikes في profiles
-- -----------------------------------------------------------------------
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

-- -----------------------------------------------------------------------
-- تنظيف دوري
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS VOID AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET is_online = FALSE
  WHERE is_online = TRUE AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pending_follow_requests_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follow_requests
  WHERE recipient_id = p_user_id AND status = 'pending';
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION has_pending_follow_request(p_requester UUID, p_recipient UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM follow_requests
    WHERE requester_id = p_requester AND recipient_id = p_recipient AND status = 'pending'
  );
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_user_saved_posts(p_user_id UUID)
RETURNS TABLE(
  post_id        UUID,
  username       TEXT,
  caption        TEXT,
  image_url      TEXT,
  likes_count    INTEGER,
  comments_count INTEGER,
  views_count    INTEGER,
  saved_at       TIMESTAMP WITH TIME ZONE
) AS $$
SELECT p.id, pr.username, p.caption, p.image_url,
       p.likes_count, p.comments_count, p.views_count, sp.created_at
FROM saved_posts sp
JOIN posts    p  ON sp.post_id  = p.id
JOIN profiles pr ON p.user_id   = pr.id
WHERE sp.user_id = p_user_id
ORDER BY sp.created_at DESC;
$$ LANGUAGE sql;


-- ============================================================================
-- 8. VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW pending_follow_requests_with_profile AS
SELECT
  fr.id, fr.requester_id, fr.recipient_id, fr.created_at,
  p.username, p.full_name, p.avatar_url, p.is_verified
FROM follow_requests fr
JOIN profiles p ON fr.requester_id = p.id
WHERE fr.status = 'pending';


-- ============================================================================
-- 9. GRANTS
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
GRANT INSERT, UPDATE, DELETE ON stories TO authenticated;

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

GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON blocked_users TO authenticated;
GRANT SELECT, INSERT, DELETE ON close_friends TO authenticated;
GRANT SELECT, INSERT, DELETE ON muted_users TO authenticated;
GRANT SELECT, INSERT, DELETE ON restricted_users TO authenticated;
GRANT SELECT, INSERT, DELETE ON favorite_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON conversation_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON muted_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON highlights TO authenticated;
GRANT SELECT, INSERT, DELETE ON highlight_stories TO authenticated;

GRANT SELECT ON hashtags      TO anon, authenticated;
GRANT INSERT, UPDATE ON hashtags TO authenticated;
GRANT SELECT, INSERT, DELETE ON post_hashtags TO authenticated;
GRANT SELECT, INSERT, DELETE ON reel_hashtags TO authenticated;
GRANT SELECT ON user_warnings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_warnings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feed_scores TO authenticated;


-- ============================================================================
-- 10. STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',         'avatars',         TRUE,  5242880,   ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('covers',          'covers',          TRUE,  10485760,  ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('posts',           'posts',           TRUE,  52428800,  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('reels',           'reels',           TRUE,  524288000, ARRAY['video/mp4','video/webm','video/mov','video/quicktime']),
  ('stories',         'stories',         TRUE,  104857600, ARRAY['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/webm']),
  ('messages',        'messages',        FALSE, 52428800,  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('community-media', 'community-media', TRUE,  52428800,  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public bucket access - avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated upload - avatars"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Owner update - avatars"
  ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Owner delete - avatars"
  ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - posts"
  ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Authenticated upload - posts"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - reels"
  ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Authenticated upload - reels"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - stories"
  ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Authenticated upload - stories"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - covers"
  ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Authenticated upload - covers"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Public access - community-media"
  ON storage.objects FOR SELECT USING (bucket_id = 'community-media');
CREATE POLICY "Authenticated upload - community-media"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community-media' AND auth.role() = 'authenticated');

CREATE POLICY "Messages access - owner only"
  ON storage.objects FOR SELECT USING (bucket_id = 'messages' AND auth.role() = 'authenticated');
CREATE POLICY "Messages upload - authenticated"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'messages' AND auth.role() = 'authenticated');


-- ============================================================================
-- 11. SEED DATA - الشارات الأساسية
-- ============================================================================
INSERT INTO badges (name, type, description, category, icon, color, image_url) VALUES
  ('Gold Early Member',   'gold_early_member',   'ميدالية العضو المبكر الذهبي',   'medal',        '👑', '#FFD700', '/medals/gold.png'),
  ('Silver Early Member', 'silver_early_member', 'ميدالية العضو المبكر الفضي',    'medal',        '🥈', '#C0C0C0', '/medals/silver.png'),
  ('Bronze Early Member', 'bronze_early_member', 'ميدالية العضو المبكر البرونزي', 'medal',        '🥉', '#CD7F32', '/medals/bronze.png'),
  ('Beta Tester',         'beta_tester',         'بادج مختبر بيتا',               'medal',        '⚙️', '#06B6D4', '/medals/beta.png'),
  ('Verified User',       'verified',            'حساب موثق من نوفي',             'verification', '✓',  '#3B82F6', NULL),
  ('Official Account',    'official',            'حساب رسمي من نوفي',             'status',       '🏛️', '#EC4899', NULL),
  ('Premium Member',      'premium',             'عضو بريميوم مع مميزات حصرية',  'status',       '⭐', '#FBBF24', NULL),
  ('Creator',             'creator',             'صانع محتوى',                    'achievement',  '🎬', '#8B5CF6', NULL),
  ('Popular',             'popular',             'شخصية شهيرة',                   'achievement',  '🔥', '#F59E0B', NULL),
  ('Active Member',       'active',              'عضو نشط',                       'achievement',  '⚡', '#10B981', NULL)
ON CONFLICT (type) DO NOTHING;


-- ============================================================================
-- DONE! ✅
-- ============================================================================
-- الجداول (39 جدول):
--   ✅ profiles              - الملفات الشخصية (+ cooldown timestamps)
--   ✅ posts                 - المنشورات
--   ✅ follows               - المتابعات
--   ✅ follow_requests       - طلبات المتابعة
--   ✅ stories               - القصص (+ music_start_time + filter_name)
--   ✅ story_views           - مشاهدات القصص
--   ✅ comments              - التعليقات (+ reel_id)
--   ✅ likes                 - الإعجابات (+ unique_reel_user_like)
--   ✅ reels                 - الريلز
--   ✅ messages              - الرسائل (+ reply_to_id + audio_url)
--   ✅ message_reactions     - ردود أفعال الرسائل
--   ✅ notifications         - الإشعارات
--   ✅ saved_posts           - المنشورات المحفوظة
--   ✅ post_views            - مشاهدات المنشورات
--   ✅ post_insights         - إحصائيات المنشورات
--   ✅ user_statistics       - إحصائيات المستخدمين
--   ✅ admins                - الأدمن
--   ✅ badges                - الشارات
--   ✅ user_badges           - شارات المستخدمين
--   ✅ communities           - المجتمعات
--   ✅ community_members     - أعضاء المجتمعات
--   ✅ community_messages    - رسائل المجتمعات
--   ✅ moderation_logs       - سجلات الإشراف
--   ✅ typing_indicators     - مؤشرات الكتابة
--   ✅ user_devices          - تتبع الأجهزة
--   ✅ user_settings         - إعدادات المستخدم
--   ✅ blocked_users         - المحظورون
--   ✅ close_friends         - الأصدقاء المقربون
--   ✅ muted_users           - المكتومون
--   ✅ restricted_users      - المقيّدون
--   ✅ favorite_users        - المفضّلون
--   ✅ conversations         - المحادثات الجماعية
--   ✅ conversation_members  - أعضاء المحادثات
--   ✅ muted_conversations   - المحادثات المكتومة
--   ✅ highlights            - أبرز القصص
--   ✅ highlight_stories     - قصص الهايلايت
--   ✅ hashtags              - الهاشتاقات (+ post_hashtags + reel_hashtags)
--   ✅ user_warnings         - نظام التحذيرات والـ strikes
--   ✅ feed_scores           - أساس خوارزمية الـ Feed
-- ============================================================================
-- التحسينات المطبّقة:
--   ✅ likes          — CHECK constraint (واحد بالظبط من post/comment/reel)
--   ✅ notifications  — RLS مقيّدة: SELECT فقط لصاحب الإشعار
--   ✅ posts/comments/reels — soft delete (is_deleted + deleted_at)
--   ✅ typing_indicators    — composite PRIMARY KEY بدل TEXT
--   ✅ user_devices         — device_fingerprint + device_id
--   ✅ profiles             — strikes_count
--   ✅ pg_cron              — راجع ملف schema-improvements.sql
-- ============================================================================
