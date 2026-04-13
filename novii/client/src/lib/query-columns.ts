/**
 * Optimized Column Selections for Reducing PostgREST Egress
 * Define exactly which columns are needed for each query type
 */

// Profile columns - essential only
export const PROFILE_COLUMNS = `
  id,
  username,
  full_name,
  bio,
  avatar_url,
  cover_url,
  website,
  location,
  is_verified,
  verified_at,
  is_official,
  is_creator,
  is_premium,
  is_private,
  is_active,
  is_popular,
  is_online,
  last_seen,
  followers_count,
  following_count,
  posts_count,
  is_gold_early_member,
  is_silver_early_member,
  is_bronze_early_member,
  is_beta_tester,
  gender,
  username_changed_at,
  full_name_changed_at,
  gender_changed_at,
  created_at,
  updated_at
`;

// Minimal profile for lists
export const PROFILE_MINIMAL = `
  id,
  username,
  avatar_url,
  is_verified,
  is_official,
  followers_count
`;

// Profile for cards (follow buttons context)
export const PROFILE_CARD = `
  id,
  username,
  full_name,
  avatar_url,
  bio,
  is_verified,
  is_private,
  followers_count,
  following_count
`;

// Post columns
export const POST_COLUMNS = `
  id,
  user_id,
  caption,
  image_url,
  location,
  likes_count,
  comments_count,
  views_count,
  hide_likes,
  replies_disabled,
  is_archived,
  is_pinned,
  created_at,
  updated_at
`;

// Post with profile (for feeds)
export const POST_WITH_PROFILE = `
  id,
  user_id,
  caption,
  image_url,
  location,
  likes_count,
  comments_count,
  views_count,
  hide_likes,
  replies_disabled,
  is_archived,
  is_pinned,
  created_at,
  updated_at,
  profile:profiles!posts_user_id_fkey(${PROFILE_CARD})
`;

// Minimal post for lists
export const POST_MINIMAL = `
  id,
  user_id,
  image_url,
  likes_count,
  comments_count,
  created_at
`;

// Comment columns
export const COMMENT_COLUMNS = `
  id,
  post_id,
  user_id,
  content,
  gif_url,
  parent_comment_id,
  likes_count,
  created_at,
  updated_at
`;

// Comment with profile
export const COMMENT_WITH_PROFILE = `
  id,
  post_id,
  user_id,
  content,
  gif_url,
  parent_comment_id,
  likes_count,
  created_at,
  profile:profiles!comments_user_id_fkey(${PROFILE_MINIMAL})
`;

// Story columns
export const STORY_COLUMNS = `
  id,
  user_id,
  media_url,
  media_type,
  views_count,
  expires_at,
  created_at,
  music_url,
  music_title,
  music_artist,
  music_artwork_url,
  filter_name
`;

// Story with profile
export const STORY_WITH_PROFILE = `
  id,
  user_id,
  media_url,
  media_type,
  views_count,
  expires_at,
  created_at,
  music_url,
  music_title,
  music_artist,
  music_artwork_url,
  filter_name,
  profile:profiles!stories_user_id_fkey(${PROFILE_MINIMAL})
`;

// Reel columns
export const REEL_COLUMNS = `
  id,
  user_id,
  video_url,
  thumbnail_url,
  caption,
  likes_count,
  comments_count,
  views_count,
  created_at,
  updated_at
`;

// Reel with profile
export const REEL_WITH_PROFILE = `
  id,
  user_id,
  video_url,
  thumbnail_url,
  caption,
  likes_count,
  comments_count,
  views_count,
  created_at,
  profile:profiles!reels_user_id_fkey(${PROFILE_MINIMAL})
`;

// Message columns
export const MESSAGE_COLUMNS = `
  id,
  sender_id,
  receiver_id,
  content,
  image_url,
  is_read,
  is_edited,
  created_at
`;

// Message with profiles
export const MESSAGE_WITH_PROFILES = `
  id,
  sender_id,
  receiver_id,
  content,
  image_url,
  is_read,
  created_at,
  sender:profiles!messages_sender_id_fkey(${PROFILE_MINIMAL}),
  receiver:profiles!messages_receiver_id_fkey(${PROFILE_MINIMAL})
`;

// Notification columns
export const NOTIFICATION_COLUMNS = `
  id,
  user_id,
  actor_id,
  type,
  post_id,
  comment_id,
  content,
  is_read,
  created_at
`;

// Notification with actor
export const NOTIFICATION_WITH_ACTOR = `
  id,
  user_id,
  actor_id,
  type,
  post_id,
  content,
  is_read,
  created_at,
  actor:profiles!notifications_actor_id_fkey(${PROFILE_MINIMAL})
`;

// Follow columns (minimal)
export const FOLLOW_COLUMNS = `
  id,
  follower_id,
  following_id,
  created_at
`;

// Like check (just id)
export const LIKE_CHECK = `id`;

// Saved post check (just id)
export const SAVED_POST_CHECK = `id`;
