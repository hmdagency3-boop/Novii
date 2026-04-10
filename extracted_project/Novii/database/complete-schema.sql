-- ============================================================
-- NOVII PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================
-- All tables, relationships, RLS policies, functions & triggers
-- Execute this file once in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  website VARCHAR(255),
  location VARCHAR(100),
  gender VARCHAR(20),
  is_verified BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_reason TEXT,
  ban_until TIMESTAMP WITH TIME ZONE,
  is_official BOOLEAN DEFAULT FALSE,
  is_creator BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  posts_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_gold_early_member BOOLEAN DEFAULT FALSE,
  gold_early_member_at TIMESTAMP WITH TIME ZONE,
  is_silver_early_member BOOLEAN DEFAULT FALSE,
  silver_early_member_at TIMESTAMP WITH TIME ZONE,
  is_bronze_early_member BOOLEAN DEFAULT FALSE,
  bronze_early_member_at TIMESTAMP WITH TIME ZONE,
  is_beta_tester BOOLEAN DEFAULT FALSE,
  beta_tester_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  popular_at TIMESTAMP WITH TIME ZONE,
  premium_at TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. POSTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption TEXT,
  image_url TEXT,
  location VARCHAR(255),
  is_private BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  hide_likes BOOLEAN DEFAULT FALSE,
  replies_disabled BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived) WHERE is_archived = FALSE;

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (
    -- User's own posts are always visible
    posts.user_id = auth.uid()
    OR
    -- Public posts from public profiles
    (
      posts.is_private = FALSE
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = posts.user_id
        AND profiles.is_private = FALSE
      )
    )
    OR
    -- Public posts from private profiles (if following)
    (
      posts.is_private = FALSE
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = posts.user_id
        AND profiles.is_private = TRUE
      )
      AND EXISTS (
        SELECT 1 FROM follows
        WHERE follows.following_id = posts.user_id
        AND follows.follower_id = auth.uid()
      )
    )
    OR
    -- Private posts (only visible to followers)
    (
      posts.is_private = TRUE
      AND EXISTS (
        SELECT 1 FROM follows
        WHERE follows.following_id = posts.user_id
        AND follows.follower_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. FOLLOWS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for follows
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Follows Policies
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================
-- 4. LIKES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id, comment_id)
);

-- Indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Likes Policies
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. COMMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  gif_url TEXT,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments Policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. REELS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  duration INTEGER,
  is_private BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for reels
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_user_created ON reels(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- Reels Policies
CREATE POLICY "Reels are viewable by everyone"
  ON reels FOR SELECT
  USING (
    -- User's own reels are always visible
    reels.user_id = auth.uid()
    OR
    -- Public reels from public profiles
    (
      reels.is_private = FALSE
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = reels.user_id
        AND profiles.is_private = FALSE
      )
    )
  );

CREATE POLICY "Users can insert own reels"
  ON reels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reels"
  ON reels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reels"
  ON reels FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. STORIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) DEFAULT 'image',
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Stories Policies
CREATE POLICY "Users can view own stories and public stories"
  ON stories FOR SELECT
  USING (
    stories.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = stories.user_id
      AND profiles.is_private = FALSE
    )
    OR EXISTS (
      SELECT 1 FROM follows
      WHERE follows.following_id = stories.user_id
      AND follows.follower_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. STORY VIEWS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(story_id, user_id)
);

-- Indexes for story_views
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON story_views(user_id);

-- Enable RLS
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Story Views Policies
CREATE POLICY "Anyone can view story views"
  ON story_views FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can add story views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. SAVED POSTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, post_id)
);

-- Indexes for saved_posts
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_created_at ON saved_posts(created_at DESC);

-- Enable RLS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Saved Posts Policies
CREATE POLICY "Users can view own saved posts"
  ON saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 10. MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  original_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages Policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================
-- 11. MESSAGE REACTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(message_id, user_id)
);

-- Indexes for message_reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Message Reactions Policies
CREATE POLICY "Anyone can view reactions"
  ON message_reactions FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 12. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 13. USER STATISTICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_likes_given INTEGER DEFAULT 0,
  total_comments_created INTEGER DEFAULT 0,
  total_posts_viewed INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for user_statistics
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);

-- Enable RLS
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- User Statistics Policies
CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage statistics"
  ON user_statistics FOR ALL
  WITH CHECK (TRUE);

-- ============================================================
-- 14. ADMINS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  permissions VARCHAR(50) DEFAULT 'full',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for admins
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admins Policies
CREATE POLICY "Anyone can view active admins"
  ON admins FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage admins"
  ON admins FOR ALL
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- 15. BADGES CATALOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for badges
CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(type);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Badges Policies
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (is_active = TRUE);

-- ============================================================
-- 16. USER BADGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, badge_id)
);

-- Indexes for user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- User Badges Policies
CREATE POLICY "Anyone can view user badges"
  ON user_badges FOR SELECT
  USING (is_active = TRUE);

-- ============================================================
-- 17. USER DEVICES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address VARCHAR(50) NOT NULL,
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  device_type VARCHAR(50),
  device_name VARCHAR(100),
  device_model VARCHAR(100),
  os_name VARCHAR(50),
  os_version VARCHAR(50),
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for user_devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_browser ON user_devices(browser, os_name, device_type);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- User Devices Policies
CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage devices"
  ON user_devices FOR ALL
  WITH CHECK (TRUE);

-- ============================================================
-- 8. STORAGE BUCKET FOR AVATARS & COVERS
-- ============================================================

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create covers bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policies
CREATE POLICY "Public Access to Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (SPLIT_PART(name, '/', 1) = auth.uid()::text)
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (SPLIT_PART(name, '/', 1) = auth.uid()::text)
  );

CREATE POLICY "Public Access to Covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'covers' 
    AND auth.role() = 'authenticated'
    AND (SPLIT_PART(name, '/', 1) = auth.uid()::text)
  );

CREATE POLICY "Users can delete own covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers' 
    AND auth.role() = 'authenticated'
    AND (SPLIT_PART(name, '/', 1) = auth.uid()::text)
  );

-- ============================================================
-- 9. FUNCTIONS
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment posts_count
CREATE OR REPLACE FUNCTION increment_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET posts_count = posts_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Decrement posts_count
CREATE OR REPLACE FUNCTION decrement_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET posts_count = posts_count - 1
  WHERE id = OLD.user_id
  AND posts_count > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment follow counts
CREATE OR REPLACE FUNCTION increment_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET following_count = following_count + 1
  WHERE id = NEW.follower_id;
  
  UPDATE profiles
  SET followers_count = followers_count + 1
  WHERE id = NEW.following_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Decrement follow counts
CREATE OR REPLACE FUNCTION decrement_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET following_count = following_count - 1
  WHERE id = OLD.follower_id
  AND following_count > 0;
  
  UPDATE profiles
  SET followers_count = followers_count - 1
  WHERE id = OLD.following_id
  AND followers_count > 0;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment likes_count on like insert
CREATE OR REPLACE FUNCTION increment_likes_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF NEW.comment_id IS NOT NULL THEN
    UPDATE comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Decrement likes_count on like delete
CREATE OR REPLACE FUNCTION decrement_likes_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.post_id IS NOT NULL THEN
    UPDATE posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  ELSIF OLD.comment_id IS NOT NULL THEN
    UPDATE comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment comments_count
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Decrement comments_count
CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count - 1
  WHERE id = OLD.post_id
  AND comments_count > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment story views count
CREATE OR REPLACE FUNCTION increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories
  SET views_count = views_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. TRIGGERS
-- ============================================================

-- Profiles triggers
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Posts triggers
CREATE TRIGGER IF NOT EXISTS update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS on_post_created
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_posts_count();

CREATE TRIGGER IF NOT EXISTS on_post_deleted
  AFTER DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_posts_count();

-- Follows triggers
CREATE TRIGGER IF NOT EXISTS on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION increment_follow_counts();

CREATE TRIGGER IF NOT EXISTS on_follow_deleted
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION decrement_follow_counts();

-- Likes triggers
CREATE TRIGGER IF NOT EXISTS likes_increment_trigger
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_likes_on_insert();

CREATE TRIGGER IF NOT EXISTS likes_decrement_trigger
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_likes_on_delete();

-- Comments triggers
CREATE TRIGGER IF NOT EXISTS update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_comments_count();

CREATE TRIGGER IF NOT EXISTS on_comment_deleted
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_comments_count();

-- Messages triggers
CREATE TRIGGER IF NOT EXISTS update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Stories triggers
CREATE TRIGGER IF NOT EXISTS on_story_view_created
  AFTER INSERT ON story_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_story_views();

-- Reels triggers
CREATE TRIGGER IF NOT EXISTS update_reels_updated_at
  BEFORE UPDATE ON reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User statistics triggers
CREATE TRIGGER IF NOT EXISTS update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. VIEWS (Optional - for reporting/analytics)
-- ============================================================

-- View: Active users
CREATE OR REPLACE VIEW active_users AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  is_online,
  last_seen,
  followers_count,
  following_count,
  posts_count
FROM profiles
WHERE is_active = TRUE AND is_banned = FALSE
ORDER BY last_seen DESC;

-- View: Trending posts
CREATE OR REPLACE VIEW trending_posts AS
SELECT 
  p.id,
  p.user_id,
  p.caption,
  p.image_url,
  p.likes_count,
  p.comments_count,
  p.created_at,
  pr.username,
  pr.avatar_url
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.is_archived = FALSE AND pr.is_banned = FALSE
ORDER BY (p.likes_count + p.comments_count) DESC
LIMIT 100;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
