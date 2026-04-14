import { supabase } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUUID(value: string, label = 'ID'): void {
  if (!UUID_RE.test(value)) throw new Error(`Invalid ${label}`);
}

async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}
import {
  PROFILE_COLUMNS,
  PROFILE_MINIMAL,
  PROFILE_CARD,
  POST_COLUMNS,
  POST_WITH_PROFILE,
  POST_MINIMAL,
  COMMENT_COLUMNS,
  COMMENT_WITH_PROFILE,
  STORY_COLUMNS,
  STORY_WITH_PROFILE,
  REEL_COLUMNS,
  REEL_WITH_PROFILE,
  MESSAGE_COLUMNS,
  LIKE_CHECK,
  SAVED_POST_CHECK,
} from './query-columns';

export interface Profile {
  id: string;
  username: string;
  full_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  website?: string | null;
  location?: string | null;
  is_verified: boolean;
  verified_at?: string | null;
  is_official: boolean;
  is_private?: boolean;
  is_creator?: boolean;
  is_premium?: boolean;
  is_popular?: boolean;
  is_active?: boolean;
  is_gold_early_member?: boolean;
  gold_early_member_at?: string | null;
  is_silver_early_member?: boolean;
  silver_early_member_at?: string | null;
  is_bronze_early_member?: boolean;
  bronze_early_member_at?: string | null;
  is_beta_tester?: boolean;
  is_bug_hunter?: boolean;
  bug_hunter_at?: string | null;
  beta_tester_at?: string | null;
  gender?: string | null;
  username_changed_at?: string | null;
  full_name_changed_at?: string | null;
  gender_changed_at?: string | null;
  followers_count: number;
  following_count?: number;
  posts_count?: number;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
  is_following?: boolean;
  is_followed_by?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  is_archived: boolean;
  is_pinned?: boolean;
  hide_likes?: boolean;
  replies_disabled?: boolean;
  views_count?: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at?: string;
  profile?: Profile;
  is_liked?: boolean;
  parent_comment_id?: string | null;
  replies?: Comment[];
  replies_count?: number;
  mentioned_users?: string[];
  gif_url?: string | null;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  views_count: number;
  expires_at: string;
  created_at: string;
  music_url?: string | null;
  music_title?: string | null;
  music_artist?: string | null;
  music_artwork_url?: string | null;
  profile?: Profile;
  is_viewed?: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  story_id?: string | null;
  story?: Story | null;
  reply_to_id?: string | null;
  reply_to?: Message | null;
  is_read: boolean;
  is_deleted: boolean;
  is_edited: boolean;
  edited_at: string | null;
  original_content: string | null;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
  reactions?: { [key: string]: number };
  user_reaction?: string | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention' | 'reel_like' | 'story_reply' | 'save' | 'repost' | 'warning' | 'post_removed' | 'ban' | 'unban' | 'security' | 'report_resolved';
  post_id: string | null;
  comment_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string | null;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  is_liked?: boolean;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  ip_address: string;
  browser: string;
  browser_version: string;
  device_type: string;
  device_name: string;
  device_model: string;
  os_name: string;
  os_version: string;
  country: string;
  country_code: string;
  city: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  is_trusted: boolean;
  status: string;
  login_count: number;
  last_login_ip: string;
  session_token: string;
  last_active_at: string;
  first_login_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFingerprint {
  screenResolution?: string;
  timezone?: string;
  language?: string;
  colorDepth?: number;
  pixelRatio?: number;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  platform?: string;
}

export function collectClientFingerprint(): ClientFingerprint {
  return {
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    platform: navigator.platform,
  };
}

async function communityFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const authHeaders: Record<string, string> = {};
  if (session?.user?.id) authHeaders['x-user-id'] = session.user.id;
  if (session?.access_token) authHeaders['x-user-token'] = session.access_token;
  return fetch(url, {
    ...options,
    headers: { ...authHeaders, ...(options.headers as Record<string, string> || {}) },
  });
}

// -----------------------------------------------------------------------
// Helper: extract hashtags from caption and save to DB
// -----------------------------------------------------------------------
async function saveHashtags(
  contentId: string,
  contentType: 'post' | 'reel',
  caption: string
): Promise<void> {
  const tags = Array.from(new Set(
    (caption.match(/#(\w+)/g) || []).map(t => t.slice(1).toLowerCase())
  ));
  if (tags.length === 0) return;

  // Upsert hashtag rows and get their ids
  const { data: hashtagRows, error: upsertError } = await supabase
    .from('hashtags')
    .upsert(
      tags.map(name => ({ name })),
      { onConflict: 'name', ignoreDuplicates: false }
    )
    .select('id, name');

  if (upsertError || !hashtagRows) return;

  const linkTable = contentType === 'post' ? 'post_hashtags' : 'reel_hashtags';
  const fkCol    = contentType === 'post' ? 'post_id' : 'reel_id';

  await supabase
    .from(linkTable)
    .upsert(
      hashtagRows.map(h => ({ [fkCol]: contentId, hashtag_id: h.id })),
      { onConflict: `${fkCol},hashtag_id`, ignoreDuplicates: true }
    );
}

export const api = {
  // Profile APIs
  async getCurrentProfile(): Promise<Profile | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) return null;

    const [followersResult, followingResult] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id)
    ]);

    return {
      ...profile,
      followers_count: followersResult.count || 0,
      following_count: followingResult.count || 0,
    };
  },

  // ── Shared Cloudinary upload helper ──────────────────────────────────────────
  async _uploadToCloudinary(
    file: File,
    folder: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    if (onProgress) onProgress(10);

    const res = await communityFetch("/api/upload", { method: "POST", body: formData });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }

    if (onProgress) onProgress(90);
    const { url } = await res.json();
    if (onProgress) onProgress(100);
    return url;
  },

  async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this._uploadToCloudinary(file, "avatars", onProgress);
  },

  async deleteAvatar(_avatarUrl: string): Promise<void> {
    // Cloudinary handles storage — deletion optional via Cloudinary dashboard
  },

  async uploadCover(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this._uploadToCloudinary(file, "covers", onProgress);
  },

  async deleteCover(_coverUrl: string): Promise<void> {
    // Cloudinary handles storage — deletion optional via Cloudinary dashboard
  },

  async getProfile(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const ALLOWED_FIELDS = ['username', 'full_name', 'bio', 'website', 'location', 'avatar_url', 'cover_url', 'is_private', 'gender'] as const;
    const safeUpdates: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in updates) safeUpdates[key] = (updates as any)[key];
    }

    // Stamp change timestamps for policy-tracked fields
    const now = new Date().toISOString();
    if ('username' in updates) safeUpdates.username_changed_at = now;
    if ('full_name' in updates) safeUpdates.full_name_changed_at = now;
    if ('gender' in updates) safeUpdates.gender_changed_at = now;

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOnlineStatus(isOnline: boolean): Promise<void> {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  },

  async getUserOnlineStatus(userId: string): Promise<{ is_online: boolean; last_seen: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_online, last_seen')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching online status:', error);
        return { is_online: false, last_seen: new Date().toISOString() };
      }

      if (!data) {
        return { is_online: false, last_seen: new Date().toISOString() };
      }

      return {
        is_online: data.is_online === true,
        last_seen: data.last_seen || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Exception fetching online status:', error);
      return { is_online: false, last_seen: new Date().toISOString() };
    }
  },

  async createProfile(userId: string, username: string, gender?: string): Promise<Profile> {
    // Set default avatar based on gender
    let defaultAvatarUrl = '/assets/default_avatar_male.png'; // Default to male
    if (gender === 'female') {
      defaultAvatarUrl = '/assets/default_avatar_female.png';
    } else if (gender === 'male') {
      defaultAvatarUrl = '/assets/default_avatar_male.png';
    } else if (gender === 'other') {
      defaultAvatarUrl = '/assets/default_avatar_male.png'; // Use male for other as fallback
    }

    // Update the profile that was automatically created by the trigger
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: username,
        full_name: username,
        gender: gender || null,
        avatar_url: defaultAvatarUrl,
        is_online: false,
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Posts APIs
  async getFeed(limit = 20, offset = 0): Promise<Post[]> {
    // Optimized: use specific columns and pagination
    const { data, error } = await supabase
      .from('posts')
      .select(POST_WITH_PROFILE)
      .eq('is_archived', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const user = await getCurrentUser();
    const posts = data || [];

    if (user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      // Batch load likes and saved posts (optimized to only fetch ids)
      const [likesData, savedData] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      ]);

      const likedIds = new Set(likesData.data?.map(l => l.post_id) || []);
      const savedIds = new Set(savedData.data?.map(s => s.post_id) || []);

      return posts.map(post => ({
        ...post,
        is_liked: likedIds.has(post.id),
        is_saved: savedIds.has(post.id)
      })) as unknown as Post[];
    }

    return posts as unknown as Post[];
  },

  // Algorithmic feed: fetch a large batch, score by engagement + recency + seeded randomness
  async getFeedAlgorithmic(seed: number, limit = 10): Promise<Post[]> {
    const BATCH = 60;
    const { data, error } = await supabase
      .from('posts')
      .select(POST_WITH_PROFILE)
      .eq('is_archived', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(0, BATCH - 1);

    if (error) throw error;
    const user = await getCurrentUser();
    let posts: any[] = data || [];

    if (user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [likesData, savedData] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      ]);
      const likedIds = new Set(likesData.data?.map(l => l.post_id) || []);
      const savedIds = new Set(savedData.data?.map(s => s.post_id) || []);
      posts = posts.map(post => ({
        ...post,
        is_liked: likedIds.has(post.id),
        is_saved: savedIds.has(post.id),
      }));
    }

    // Scoring: recency + engagement + seeded randomness
    const now = Date.now();
    const scored = posts.map((post: any) => {
      const hoursAgo = (now - new Date(post.created_at).getTime()) / 3600000;
      const recencyScore  = 120 / (hoursAgo + 2);
      const engagementScore = (post.likes_count || 0) * 2.5 + (post.comments_count || 0) * 4;
      // Deterministic per-post randomness that changes with seed
      const idSum = post.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const seededRandom = ((seed * 31 + idSum * 17) % 100) / 100 * 30;
      return { ...post, _score: recencyScore + engagementScore + seededRandom };
    });

    scored.sort((a: any, b: any) => b._score - a._score);
    return scored.slice(0, limit) as Post[];
  },

  async getExplorePosts(limit = 30): Promise<Post[]> {
    // Optimized: use specific columns and pagination
    const { data, error } = await supabase
      .from('posts')
      .select(POST_WITH_PROFILE)
      .eq('is_archived', false)
      .eq('is_deleted', false)
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    const posts = data || [];

    // Add is_liked and is_saved for current user
    const user = await getCurrentUser();
    if (user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [likesData, savedData] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      ]);

      const likedIds = new Set(likesData.data?.map(l => l.post_id) || []);
      const savedIds = new Set(savedData.data?.map(s => s.post_id) || []);

      return posts.map(post => ({
        ...post,
        is_liked: likedIds.has(post.id),
        is_saved: savedIds.has(post.id)
      })) as unknown as Post[];
    }

    return posts as unknown as Post[];
  },

  async getExploreReels(limit = 20): Promise<Reel[]> {
    const { data, error } = await supabase
      .from('reels')
      .select(REEL_WITH_PROFILE)
      .eq('is_deleted', false)
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as Reel[];
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const user = await getCurrentUser();

    // Privacy gate: if private account and current user is not the owner → check follow
    if (user && user.id !== userId) {
      const { data: targetProfile } = await supabase
        .from('profiles').select('is_private').eq('id', userId).single();
      if (targetProfile?.is_private) {
        const { data: follow } = await supabase
          .from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single();
        if (!follow) return []; // Not a follower → return nothing
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .select(POST_WITH_PROFILE)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    const posts = data || [];

    // Add is_liked and is_saved for current user
    if (user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [likesData, savedData] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      ]);

      const likedIds = new Set(likesData.data?.map(l => l.post_id) || []);
      const savedIds = new Set(savedData.data?.map(s => s.post_id) || []);

      return posts.map(post => ({
        ...post,
        is_liked: likedIds.has(post.id),
        is_saved: savedIds.has(post.id)
      }));
    }

    return posts;
  },

  // Reels APIs
  async getReels(limit = 20, offset = 0): Promise<Reel[]> {
    // Optimized: use specific columns with pagination
    const { data, error } = await supabase
      .from('reels')
      .select(REEL_WITH_PROFILE)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const reels = data || [];

    // Add is_liked for current user (batch query)
    const user = await getCurrentUser();
    if (user && reels.length > 0) {
      const reelIds = reels.map(r => r.id);
      const { data: likesData } = await supabase
        .from('likes')
        .select('reel_id')
        .eq('user_id', user.id)
        .in('reel_id', reelIds);

      const likedIds = new Set(likesData?.map(l => l.reel_id) || []);

      return reels.map(reel => ({
        ...reel,
        is_liked: likedIds.has(reel.id)
      })) as unknown as Reel[];
    }

    return reels as unknown as Reel[];
  },

  async getPost(postId: string): Promise<Post | null> {
    // Use optimized column selection (40-70% egress reduction)
    const { data, error } = await supabase
      .from('posts')
      .select(`
        ${POST_COLUMNS},
        profile:profiles!posts_user_id_fkey(${PROFILE_CARD})
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }

    if (!data) return null;

    const user = await getCurrentUser();
    if (user) {
      const [likeData, saveData] = await Promise.all([
        supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle(),
        supabase.from('saved_posts').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
      ]);

      return {
        ...data,
        is_liked: !!likeData.data,
        is_saved: !!saveData.data
      } as unknown as Post;
    }

    return {
      ...data,
      is_liked: false,
      is_saved: false
    } as unknown as Post;
  },

  async uploadPostImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this._uploadToCloudinary(file, "posts", onProgress);
  },

  async createPost(caption: string, imageUrl: string, location?: string): Promise<Post> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Use optimized column selection (40-70% egress reduction)
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption,
        image_url: imageUrl,
        location
      })
      .select(`
        ${POST_COLUMNS},
        profile:profiles!posts_user_id_fkey(${PROFILE_CARD})
      `)
      .single();

    if (error) throw error;

    await supabase.rpc('increment_posts_count', { profile_id: user.id });

    // Extract and save hashtags in the background (non-blocking)
    saveHashtags(data.id, 'post', caption).catch(() => {});

    return data as unknown as Post;
  },

  async deleteReel(reelId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('reels')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', reelId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deletePost(postId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    await supabase.rpc('decrement_posts_count', { profile_id: user.id });
  },

  // Likes APIs
  async toggleLike(postId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingLike, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (likeError) throw likeError;

    if (existingLike) {
      // Unlike: delete the like (count decrement handled by trigger)
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (deleteError) throw deleteError;
      
      return false;
    } else {
      // Like: insert the like (count increment handled by trigger)
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });
      
      if (insertError) throw insertError;
      
      
      // Get post owner to create notification
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .maybeSingle();
      
      if (postError) throw postError;
      
      // Create notification for post owner (only if not liking own post)
      if (post && post.user_id !== user.id) {
        try {
          await this.createNotification({
            userId: post.user_id,
            actorId: user.id,
            type: 'like',
            postId: postId,
          });
        } catch (notifError) {
          console.error('⚠️ Failed to create like notification:', notifError);
        }
      }
      
      return true;
    }
  },

  // Reel Likes APIs
  async toggleReelLike(reelId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingLike, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('reel_id', reelId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (likeError) throw likeError;

    if (existingLike) {
      // Unlike: delete the like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (deleteError) throw deleteError;
      
      return false;
    } else {
      // Like: insert the like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ reel_id: reelId, user_id: user.id });
      
      if (insertError) throw insertError;
      
      
      // Get reel owner to create notification
      const { data: reel, error: reelError } = await supabase
        .from('reels')
        .select('user_id')
        .eq('id', reelId)
        .maybeSingle();
      
      if (reelError) throw reelError;
      
      // Create notification for reel owner (only if not liking own reel)
      if (reel && reel.user_id !== user.id) {
        try {
          await this.createNotification({
            userId: reel.user_id,
            actorId: user.id,
            type: 'like',
          });
        } catch (notifError) {
          console.error('⚠️ Failed to create reel like notification:', notifError);
        }
      }
      
      return true;
    }
  },

  // Comments APIs
  async getComments(postId: string): Promise<Comment[]> {
    // Optimized: use specific columns
    const { data: allCommentsRaw, error } = await supabase
      .from('comments')
      .select(COMMENT_WITH_PROFILE)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    const allComments = (allCommentsRaw || []) as unknown as Comment[];

    // Build nested structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    allComments?.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    allComments?.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    // Sort: official comments first, then by created_at
    rootComments.sort((a, b) => {
      const aIsOfficial = a.profile?.is_official ? 1 : 0;
      const bIsOfficial = b.profile?.is_official ? 1 : 0;
      if (aIsOfficial !== bIsOfficial) {
        return bIsOfficial - aIsOfficial; // Official first
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return rootComments;
  },

  async createComment(postId: string, content: string, parentCommentId?: string, gifUrl?: string): Promise<Comment> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Use optimized column selection with COMMENT_WITH_PROFILE (40% egress reduction)
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_comment_id: parentCommentId || null,
        gif_url: gifUrl || null
      })
      .select(COMMENT_WITH_PROFILE)
      .single();

    if (error) throw error;

    // Only increment comments count for root comments
    if (!parentCommentId) {
      await supabase.rpc('increment_comments_count', { post_id: postId });
    }

    // Extract mentioned usernames from content
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex) || [];
    
    // Get post owner to create notification
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
    
    // Create notification for post owner (only if not commenting on own post)
    if (post && post.user_id !== user.id) {
      try {
        await this.createNotification({
          userId: post.user_id,
          actorId: user.id,
          type: 'comment',
          postId: postId,
          commentId: data.id,
          content: content.substring(0, 100),
        });
      } catch (notifError) {
        console.error('⚠️ Failed to create comment notification:', notifError);
      }
    }

    // Create mention notifications
    if (mentions.length > 0) {
      const usernames = mentions.map(m => m.substring(1));
      const { data: mentionedProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('username', usernames);
      
      if (mentionedProfiles) {
        for (const profile of mentionedProfiles) {
          if (profile.id !== user.id) {
            try {
              await this.createNotification({
                userId: profile.id,
                actorId: user.id,
                type: 'mention',
                postId: postId,
                commentId: data.id,
                content: `mentioned you: ${content.substring(0, 50)}...`,
              });
            } catch (e) {
              console.error('Failed to create mention notification:', e);
            }
          }
        }
      }
    }

    return data as unknown as Comment;
  },

  async toggleCommentLike(commentId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
      return false;
    } else {
      await supabase.from('likes').insert({ comment_id: commentId, user_id: user.id });
      return true;
    }
  },

  async searchUsers(query: string): Promise<Profile[]> {
    // ✅ Optimized: search with minimal columns
    // ✅ Note: Debouncing should be handled by the caller using debounce()
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_CARD)
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return (data || []) as unknown as Profile[];
  },

  async deleteComment(commentId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Get the comment to verify permissions (also fetch reel_id for reel comments)
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, post_id, reel_id, parent_comment_id')
      .eq('id', commentId)
      .single();

    if (fetchError) throw fetchError;
    if (!comment) throw new Error('Comment not found');

    // Check if user is the comment author, post owner, or reel owner
    if (comment.user_id !== user.id) {
      if (comment.reel_id) {
        // Reel comment: check if user is the reel owner
        const { data: reel } = await supabase
          .from('reels')
          .select('user_id')
          .eq('id', comment.reel_id)
          .single();
        if (!reel || reel.user_id !== user.id) {
          throw new Error('Not authorized to delete this comment');
        }
      } else if (comment.post_id) {
        // Post comment: check if user is the post owner
        const { data: post } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', comment.post_id)
          .single();
        if (!post || post.user_id !== user.id) {
          throw new Error('Not authorized to delete this comment');
        }
      } else {
        throw new Error('Not authorized to delete this comment');
      }
    }

    const now = new Date().toISOString();

    // Soft-delete all replies first
    const { error: deleteRepliesError } = await supabase
      .from('comments')
      .update({ is_deleted: true, deleted_at: now })
      .eq('parent_comment_id', commentId);

    if (deleteRepliesError) throw deleteRepliesError;

    // Soft-delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .update({ is_deleted: true, deleted_at: now })
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    // Only decrement comments count for root post comments (not reel comments)
    if (!comment.parent_comment_id && comment.post_id) {
      await supabase.rpc('decrement_comments_count', { post_id: comment.post_id });
    }
  },

  // Stories APIs
  async getStories(): Promise<Story[]> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's following list (only ids)
    const { data: following, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followError) throw followError;

    // Create list of user IDs
    const followedUserIds = following?.map(f => f.following_id) || [];
    const userIdsToInclude = [user.id, ...followedUserIds];

    // Get stories with optimized columns
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_WITH_PROFILE)
      .in('user_id', userIdsToInclude)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark which stories the current user has already viewed
    const stories = (data || []) as unknown as Story[];
    if (stories.length > 0) {
      const storyIds = stories.map(s => s.id);
      const { data: viewedData } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('user_id', user.id)
        .in('story_id', storyIds);

      const viewedSet = new Set((viewedData || []).map((v: any) => v.story_id));
      stories.forEach(story => {
        story.is_viewed = viewedSet.has(story.id);
      });
    }

    return stories;
  },

  async getUserStories(userId: string): Promise<Story[]> {
    const user = await getCurrentUser();

    // Privacy gate: private account → must be a follower
    if (user && user.id !== userId) {
      const { data: targetProfile } = await supabase
        .from('profiles').select('is_private').eq('id', userId).single();
      if (targetProfile?.is_private) {
        const { data: follow } = await supabase
          .from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single();
        if (!follow) return [];
      }
    }

    const { data, error } = await supabase
      .from('stories')
      .select(STORY_WITH_PROFILE)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Story[];
  },

  async createStory(mediaUrl: string, mediaType: 'image' | 'video' = 'image', music?: { url: string; title: string; artist: string; artwork_url: string } | null, filterName?: string): Promise<Story> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const insertData: any = {
      user_id: user.id,
      media_url: mediaUrl,
      media_type: mediaType,
      filter_name: filterName || 'normal',
    };

    if (music) {
      insertData.music_url = music.url;
      insertData.music_title = music.title;
      insertData.music_artist = music.artist;
      insertData.music_artwork_url = music.artwork_url;
    }

    const { data, error } = await supabase
      .from('stories')
      .insert(insertData)
      .select(STORY_WITH_PROFILE)
      .single();

    if (error) throw error;
    return data as unknown as Story;
  },

  async deleteStory(storyId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Get the story to verify ownership
      const { data: story, error: getError } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (getError) throw new Error('Story not found');
      
      // Check if current user is the owner
      if (story.user_id !== user.id) {
        throw new Error('You can only delete your own stories');
      }

      // Delete the story
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (deleteError) throw deleteError;
      
    } catch (error) {
      console.error('❌ Error deleting story:', error);
      throw error;
    }
  },

  // Follow APIs — uses dedicated `follow_requests` table for private-account requests
  async toggleFollow(targetUserId: string): Promise<{isFollowing: boolean; actorProfile: Profile | null; isPending?: boolean; wasCancelled?: boolean}> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const [{ data: currentProfile }, { data: targetProfile }, { data: existingFollow }, { data: pendingRequest }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('is_private').eq('id', targetUserId).single(),
      supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetUserId).single(),
      supabase.from('follow_requests').select('id').eq('requester_id', user.id).eq('recipient_id', targetUserId).eq('status', 'pending').single(),
    ]);

    // ── Case 1: Already following → Unfollow ──
    if (existingFollow) {
      await supabase.from('follows').delete().eq('id', existingFollow.id);
      // Clean up any stale follow_request row
      await supabase.from('follow_requests').delete()
        .eq('requester_id', user.id).eq('recipient_id', targetUserId);
      return { isFollowing: false, actorProfile: currentProfile };
    }

    // ── Case 2: Request already pending → Cancel it (requester can delete own request) ──
    if (pendingRequest) {
      await supabase.from('follow_requests').delete().eq('id', pendingRequest.id);
      return { isFollowing: false, actorProfile: currentProfile, wasCancelled: true };
    }

    // ── Case 3: Private account → Send follow request ──
    if (targetProfile?.is_private) {
      // Delete any old rejected/approved request first (unique constraint)
      await supabase.from('follow_requests').delete()
        .eq('requester_id', user.id).eq('recipient_id', targetUserId);
      const { error: reqError } = await supabase.from('follow_requests').insert({
        requester_id: user.id,
        recipient_id: targetUserId,
        status: 'pending',
      });
      if (reqError) { console.error('❌ Follow request insert error:', reqError); throw reqError; }

      // Create notification directly (bypassing createNotification for reliability)
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: 'follow_request',
        is_read: false,
      });
      if (notifError) {
        console.error('❌ Follow request notification error:', notifError);
      }

      return { isFollowing: false, actorProfile: currentProfile, isPending: true };
    }

    // ── Case 4: Public account → Follow directly ──
    const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    if (error) { console.error('❌ Follow insert error:', error); throw error; }
    try {
      await this.createNotification({ userId: targetUserId, actorId: user.id, type: 'follow' });
    } catch {}
    return { isFollowing: true, actorProfile: currentProfile };
  },

  async getPendingFollowRequests(): Promise<any[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('follow_requests')
      .select(`
        id,
        requester_id,
        created_at,
        requester:profiles!follow_requests_requester_id_fkey(*)
      `)
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching follow requests:', error);
      return [];
    }

    return (data || []).map(r => ({
      id: r.id,
      actor_id: r.requester_id,
      created_at: r.created_at,
      actor: r.requester,
    }));
  },

  async approveFollowRequest(actorId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // 1. Update follow_requests status → DB trigger should auto-create the follow
      const { error: updateError } = await supabase.from('follow_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('requester_id', actorId)
        .eq('recipient_id', user.id)
        .eq('status', 'pending');
      if (updateError) { console.error('❌ Error approving follow request:', updateError); throw updateError; }

      // Safety net: ensure the follow row exists (in case DB trigger is missing)
      const { data: existingFollow } = await supabase.from('follows').select('id')
        .eq('follower_id', actorId).eq('following_id', user.id).single();
      if (!existingFollow) {
        await supabase.from('follows').insert({ follower_id: actorId, following_id: user.id });
      }

      // 2. Mark the follow_request notification as read
      await supabase.from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id).eq('actor_id', actorId).eq('type', 'follow_request');

      // 3. Notify the requester that their request was accepted
      try {
        await this.createNotification({ userId: actorId, actorId: user.id, type: 'follow' });
      } catch {}
    } catch (error) {
      console.error('❌ Error in approveFollowRequest:', error);
      throw error;
    }
  },

  async sendStoryReply(storyId: string, content: string): Promise<Message> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Get the story to find the story creator
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('user_id, media_url, media_type')
        .eq('id', storyId)
        .single();

      if (storyError || !story) throw new Error('Story not found');

      // Don't send message to self
      if (story.user_id === user.id) {
        throw new Error('Cannot reply to your own story');
      }

      // Send message with story reference
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: story.user_id,
          content: content,
          story_id: storyId,
          image_url: story.media_url,
        })
        .select()
        .single();

      if (messageError) throw messageError;
      
      return message;
    } catch (error) {
      console.error('❌ Error sending story reply:', error);
      throw error;
    }
  },

  async addStoryView(storyId: string): Promise<number> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Don't count the story owner viewing their own story
      const { data: storyOwner } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (storyOwner && storyOwner.user_id === user.id) {
        // Just return current count without recording a view
        const { data: viewsData } = await supabase
          .from('story_views')
          .select('id')
          .eq('story_id', storyId);
        return viewsData?.length || 0;
      }

      // Check if already viewed
      const { data: existing, error: checkError } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Only insert if not already viewed
      if (!existing) {
        const { error: insertError } = await supabase
          .from('story_views')
          .insert({
            story_id: storyId,
            user_id: user.id,
          });

        if (insertError) throw insertError;
        
      }

      // Get current views count
      const { data: viewsData, error: viewsError } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId);

      if (viewsError) throw viewsError;

      const viewsCount = viewsData?.length || 0;

      // Update views_count in stories table
      const { error: updateError } = await supabase
        .from('stories')
        .update({ views_count: viewsCount })
        .eq('id', storyId);

      if (updateError) {
        console.warn('⚠️ Could not update views count:', updateError);
      }

      return viewsCount;
    } catch (error) {
      console.error('❌ Error recording story view:', error);
      return 0;
    }
  },

  async getStoryViews(storyId: string): Promise<any[]> {
    try {
      
      const { data, error } = await supabase
        .from('story_views')
        .select(`
          viewed_at,
          profiles:user_id(id, username, avatar_url, full_name, is_verified, is_official, is_creator, is_premium, is_popular, is_active)
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching story views:', error);
        throw error;
      }


      // Map the data to include profile info with viewedAt
      const views = data?.map((view: any) => ({
        ...(view.profiles || {}),
        viewedAt: view.viewed_at
      })) || [];

      return views;
    } catch (error) {
      console.error('❌ Error getting story views:', error);
      return [];
    }
  },

  async rejectFollowRequest(actorId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Update follow_requests status to 'rejected' (recipient can update)
      const { error } = await supabase.from('follow_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('requester_id', actorId)
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

      if (error) { console.error('❌ Error rejecting follow request:', error); throw error; }

      // Mark the notification as read
      await supabase.from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id).eq('actor_id', actorId).eq('type', 'follow_request');
    } catch (error) {
      console.error('❌ Error in rejectFollowRequest:', error);
      throw error;
    }
  },

  async hasFollowRequest(targetUserId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data } = await supabase
      .from('follow_requests')
      .select('id')
      .eq('requester_id', user.id)
      .eq('recipient_id', targetUserId)
      .eq('status', 'pending')
      .single();

    return !!data;
  },

  async hasIncomingFollowRequest(fromUserId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data } = await supabase
      .from('follow_requests')
      .select('id')
      .eq('requester_id', fromUserId)
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .single();

    return !!data;
  },

  async isFollowing(targetUserId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    return !!data;
  },

  async isMutualFollow(targetUserId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // Check if current user follows target AND target follows current user
    const { count: count1 } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (!count1) return false;

    const { count: count2 } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId)
      .eq('following_id', user.id);

    return !!count2;
  },

  // Messages APIs
  async getConversations(): Promise<any[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    // Group messages by conversation (unique pair of users)
    const conversations = new Map();
    (data || []).forEach(message => {
      // Determine who the other user is in this conversation
      const isCurrentUserSender = message.sender_id === user.id;
      const otherUserId = isCurrentUserSender ? message.receiver_id : message.sender_id;
      const otherUserProfile = isCurrentUserSender ? message.receiver : message.sender;
      
      // Only add if this conversation hasn't been added yet
      // Since messages are ordered by created_at DESC, the first occurrence is the latest message
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          user: otherUserProfile,
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      // Count unread messages (messages received by current user that are not read)
      // Treat null as unread (DB default may be null, not false)
      if (message.receiver_id === user.id && (message.is_read === false || message.is_read === null)) {
        const conv = conversations.get(otherUserId);
        if (conv) {
          conv.unreadCount++;
        }
      }
    });

    return Array.from(conversations.values());
  },

  async getMessages(userId: string): Promise<Message[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    
    // Prevent fetching messages to self
    if (user.id === userId) {
      console.warn('⚠️ Attempting to fetch messages to self! Returning empty array.');
      return [];
    }

    // Get all messages between current user and the specified user
    // This includes:
    // 1. Messages sent by current user TO userId
    // 2. Messages sent by userId TO current user
    assertUUID(userId, 'userId');
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
    
    return data || [];
  },

  async uploadMessageImage(file: File): Promise<string> {
    return this._uploadToCloudinary(file, "messages");
  },

  async uploadAudio(blob: Blob): Promise<string> {
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
    return this._uploadToCloudinary(file, 'audio');
  },

  async sendMessage(receiverId: string, content: string, imageUrl?: string, replyToId?: string, audioUrl?: string): Promise<Message> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Prevent sending messages to self
    if (user.id === receiverId) {
      console.error('⚠️ Attempted to send message to self!');
      throw new Error('Cannot send messages to yourself');
    }


    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content || (audioUrl ? '🎤' : ''),
        // Store audio with a special prefix in image_url (no DB migration needed)
        image_url: audioUrl ? `[voice]${audioUrl}` : (imageUrl || null),
        // reply_to_id: replyToId || null, // requires DB migration — skipping for now
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
    
    return data;
  },

  async markMessagesAsRead(senderId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');


    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id)
      .or('is_read.eq.false,is_read.is.null');

    if (error) {
      console.error('❌ Error marking messages as read:', error);
      throw error;
    }
    
  },

  async updateMessage(messageId: string, newContent: string): Promise<Message> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .update({
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      throw error;
    }
    if (!data) throw new Error('Failed to update message');
    return data;
  },

  async deleteMessage(messageId: string): Promise<Message> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        content: '[deleted]',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
    if (!data) throw new Error('Failed to delete message');
    return data;
  },

  // Notifications APIs
  async getNotifications(): Promise<Notification[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    // Fetch notifications + pending follow_requests in parallel
    const [{ data: notifs }, { data: pendingReqs }] = await Promise.all([
      supabase.from('notifications')
        .select(`*, actor:profiles!notifications_actor_id_fkey(*), post:posts!notifications_post_id_fkey(id, image_url, caption)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(80),
      supabase.from('follow_requests')
        .select(`id, requester_id, created_at, requester:profiles!follow_requests_requester_id_fkey(*)`)
        .eq('recipient_id', user.id)
        .eq('status', 'pending'),
    ]);

    const all = [...(notifs || [])];

    // Inject synthetic follow_request notifications from follow_requests table
    // (in case the notification insert failed due to RLS)
    if (pendingReqs && pendingReqs.length > 0) {
      const existingActors = new Set(
        all.filter(n => n.type === 'follow_request' && !n.is_read).map(n => n.actor_id)
      );
      for (const req of pendingReqs) {
        if (!existingActors.has(req.requester_id)) {
          all.push({
            id: `fr_${req.id}`,
            user_id: user.id,
            actor_id: req.requester_id,
            type: 'follow_request',
            post_id: null,
            comment_id: null,
            content: null,
            is_read: false,
            created_at: req.created_at,
            actor: req.requester,
            post: null,
          } as any);
        }
      }
    }

    return all.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async createNotification(params: {
    userId: string;
    actorId: string;
    type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention';
    postId?: string;
    commentId?: string;
    content?: string;
  }): Promise<{id: string; actor: Profile}> {
    // Get actor profile to check if official
    const { data: actor, error: actorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.actorId)
      .single();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        actor_id: params.actorId,
        type: params.type,
        post_id: params.postId || null,
        comment_id: params.commentId || null,
        content: params.content || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
    
    return {
      id: data.id,
      actor: actor || { id: params.actorId, is_official: false, is_verified: false } as Profile
    };
  },

  async addMessageReaction(messageId: string, reaction: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        reaction: reaction,
      });

    if (error) throw error;
  },

  async removeMessageReaction(messageId: string, reaction: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('reaction', reaction);

    if (error) throw error;
  },

  async getMessageReactions(messageId: string): Promise<{ [key: string]: number }> {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('reaction')
      .eq('message_id', messageId);

    if (error) throw error;

    const grouped: { [key: string]: number } = {};
    data?.forEach(r => {
      grouped[r.reaction] = (grouped[r.reaction] || 0) + 1;
    });
    return grouped;
  },

  async getUserMessageReaction(messageId: string): Promise<string | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('message_reactions')
      .select('reaction')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data?.reaction || null;
  },

  async markAllMessageNotificationsAsRead(): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Mark all message-related notifications as read
    // You can customize this based on your notification types
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Error marking notifications as read:', error);
      throw error;
    }
    
  },

  // Saved Posts APIs
  async toggleSave(postId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingSave } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingSave) {
      await supabase.from('saved_posts').delete().eq('id', existingSave.id);
      return false;
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
      return true;
    }
  },

  async getSavedPosts(): Promise<Post[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    // Use optimized column selection (40-70% egress reduction)
    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        post_id,
        posts!inner(
          ${POST_COLUMNS},
          profile:profiles!posts_user_id_fkey(${PROFILE_CARD})
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map((item: any) => ({ ...item.posts, is_saved: true })) || [];
  },

  // Followers and Following
  async getFollowers(userId: string): Promise<Profile[]> {
    assertUUID(userId, 'userId');
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:profiles!follows_follower_id_fkey(*)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    
    const followers = data?.map((item: any) => item.follower).filter(Boolean) || [];
    
    // If no followers, return empty array
    if (followers.length === 0) {
      return [];
    }
    
    // If not logged in, return followers without is_following
    if (!currentUser) {
      return followers.map((follower: Profile) => ({
        ...follower,
        is_following: false,
      }));
    }
    
    // Check if current user is following each follower
    const followerIds = followers.map((f: Profile) => f.id);
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)
      .in('following_id', followerIds);
    
    const followingSet = new Set(followData?.map(f => f.following_id) || []);
    
    return followers.map((follower: Profile) => ({
      ...follower,
      is_following: followingSet.has(follower.id),
    }));
  },

  async getFollowing(userId: string): Promise<Profile[]> {
    assertUUID(userId, 'userId');
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:profiles!follows_following_id_fkey(*)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    
    const following = data?.map((item: any) => item.following).filter(Boolean) || [];
    
    // If no following, return empty array
    if (following.length === 0) {
      return [];
    }
    
    // If not logged in, return following without is_following
    if (!currentUser) {
      return following.map((person: Profile) => ({
        ...person,
        is_following: false,
      }));
    }
    
    // Check if current user is following each person in the list
    const followingIds = following.map((f: Profile) => f.id);
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)
      .in('following_id', followingIds);
    
    const followingSet = new Set(followData?.map(f => f.following_id) || []);
    
    return following.map((person: Profile) => ({
      ...person,
      is_following: followingSet.has(person.id),
    }));
  },

  async getMyFollowing(): Promise<Profile[]> {
    const user = await getCurrentUser();
    if (!user) return [];
    
    return this.getFollowing(user.id);
  },

  // Suggestions with advanced recommendation algorithm
  async getSuggestedUsers(limit = 50): Promise<Profile[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
      // Call the advanced recommendation algorithm endpoint
      const response = await fetch('/api/suggestions/recommended', {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const { data } = await response.json();
      return (data || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        followers_count: profile.followers_count,
        is_verified: profile.is_verified,
        is_official: profile.is_official,
        is_creator: profile.is_creator,
        is_premium: profile.is_premium,
        is_active: profile.is_active,
      })) as Profile[];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to basic suggestions from Supabase
      try {
        const { data, error: supabaseError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .order('followers_count', { ascending: false })
          .limit(limit);

        if (supabaseError) throw supabaseError;
        return data || [];
      } catch (fallbackError) {
        console.error('Fallback suggestion error:', fallbackError);
        return [];
      }
    }
  },

  async getProfileById(userId: string): Promise<Profile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!profile) return null;

    const currentUser = await getCurrentUser();

    // Calculate correct counts from follows table
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    let isFollowedBy = false;
    
    // Check if this profile follows current user
    if (currentUser) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', currentUser.id)
        .maybeSingle();
      
      isFollowedBy = !!followData;
    }

    return {
      ...profile,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_followed_by: isFollowedBy,
    };
  },

  async getUserStatistics() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Count likes given
    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count comments created
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count posts created
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count saved posts
    const { count: savedCount } = await supabase
      .from('saved_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get time spent from session storage and estimate total
    const sessionKey = `time_spent_${user.id}`;
    const sessionTimeSeconds = parseInt(sessionStorage.getItem(sessionKey) || '0');
    const timeSpentHours = (sessionTimeSeconds / 3600).toFixed(2);

    return {
      likes_given: likesCount || 0,
      comments_created: commentsCount || 0,
      posts_created: postsCount || 0,
      posts_saved: savedCount || 0,
      total_posts_viewed: 0,
      time_spent_hours: parseFloat(timeSpentHours),
      time_spent_seconds: sessionTimeSeconds,
    };
  },

  async updateTimeSpent(seconds: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Update session storage immediately
      const sessionKey = `time_spent_${user.id}`;
      sessionStorage.setItem(sessionKey, seconds.toString());
      
      return { success: true };
    } catch (error) {
      console.error('Error updating time spent:', error);
      throw error;
    }
  },

  // Pin/Unpin Posts
  async togglePinPost(postId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: post, error: getError } = await supabase
      .from('posts')
      .select('is_pinned')
      .eq('id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (getError) throw getError;
    if (!post) throw new Error('Post not found');

    const newPinnedStatus = !post.is_pinned;

    const { error: updateError } = await supabase
      .from('posts')
      .update({ is_pinned: newPinnedStatus })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;
    return newPinnedStatus;
  },

  // Hide/Show Likes
  async toggleHideLikes(postId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: post, error: getError } = await supabase
      .from('posts')
      .select('hide_likes')
      .eq('id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (getError) throw getError;
    if (!post) throw new Error('Post not found');

    const newHideLikesStatus = !post.hide_likes;

    const { error: updateError } = await supabase
      .from('posts')
      .update({ hide_likes: newHideLikesStatus })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;
    return newHideLikesStatus;
  },

  // Toggle Reply Settings
  async toggleRepliesDisabled(postId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: post, error: getError } = await supabase
      .from('posts')
      .select('replies_disabled')
      .eq('id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (getError) throw getError;
    if (!post) throw new Error('Post not found');

    const newRepliesDisabledStatus = !post.replies_disabled;

    const { error: updateError } = await supabase
      .from('posts')
      .update({ replies_disabled: newRepliesDisabledStatus })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;
    return newRepliesDisabledStatus;
  },

  // Record Post View
  async recordPostView(postId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      await supabase
        .from('post_views')
        .insert({ 
          post_id: postId,
          user_id: user.id 
        })
        .maybeSingle();
      
    } catch (error) {
      // Ignore duplicate view errors - it's handled by the unique constraint
    }
  },

  // Get Post Insights
  async getPostInsights(postId: string): Promise<any> {
    const { data, error } = await supabase
      .from('post_insights')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();

    if (error) throw error;
    return data || {
      post_id: postId,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      saves_count: 0,
      shares_count: 0,
      reach: 0,
      impressions: 0,
      engagement_rate: 0
    };
  },

  // Device Tracking APIs
  async trackDevice(userId: string): Promise<UserDevice & { isNewDevice: boolean; sessionToken: string }> {
    const { collectClientFingerprint: collect } = await import('./api');
    const clientFingerprint = collect();
    const response = await communityFetch('/api/devices/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clientFingerprint }),
    });
    if (!response.ok) throw new Error('Failed to track device');
    const result = await response.json();
    if (result.sessionToken) {
      try { sessionStorage.setItem('novii_device_session', result.sessionToken); } catch (_) {}
    }
    return result;
  },

  async getUserDevices(userId: string): Promise<UserDevice[]> {
    const response = await communityFetch(`/api/devices/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch devices');
    return response.json();
  },

  async removeDevice(deviceId: string): Promise<void> {
    const response = await communityFetch(`/api/devices/${deviceId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove device');
  },

  async trustDevice(deviceId: string, trusted: boolean): Promise<UserDevice> {
    const response = await communityFetch(`/api/devices/trust/${deviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trusted }),
    });
    if (!response.ok) throw new Error('Failed to update device trust');
    return response.json();
  },

  async revokeAllDevices(userId: string, exceptDeviceId?: string): Promise<void> {
    const response = await communityFetch(`/api/devices/revoke-all/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exceptDeviceId }),
    });
    if (!response.ok) throw new Error('Failed to revoke all devices');
  },

  async sendHeartbeat(): Promise<void> {
    const sessionToken = sessionStorage.getItem('novii_device_session');
    if (!sessionToken) return;
    try {
      const response = await communityFetch('/api/devices/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });
      if (!response.ok) console.warn('Heartbeat failed:', response.status);
    } catch (_) {}
  },

  async getCurrentDeviceInfo(): Promise<any> {
    const response = await fetch('/api/devices/current', {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to get device info');
    return response.json();
  },

  // Communities APIs
  async createCommunity(name: string, description?: string, isPrivate?: boolean): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch('/api/communities/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ name, description, isPrivate }),
    });
    if (!response.ok) throw new Error('Failed to create community');
    return response.json();
  },

  async getCommunities(): Promise<any[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn("❌ getCommunities: No authenticated user");
        return [];
      }

      const response = await communityFetch('/api/communities', {
        headers: {},
      });
      
      if (!response.ok) {
        console.error("❌ getCommunities: Response not OK", response.status);
        return [];
      }
      
      const result = await response.json();
      const communities = result.data || [];
      return communities;
    } catch (error) {
      console.error("❌ getCommunities: Error:", error);
      return [];
    }
  },

  async sendCommunityMessage(communityId: string, content: string, imageUrl?: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ content, imageUrl }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async getCommunityMessages(communityId: string, limit?: number): Promise<any[]> {
    const response = await communityFetch(`/api/communities/${communityId}/messages?limit=${limit || 50}`);
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  },

  async addCommunityMember(communityId: string, memberId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ memberId }),
    });
    if (!response.ok) throw new Error('Failed to add member');
    return response.json();
  },

  async joinCommunityWithCode(inviteCode: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch('/api/communities/join-with-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ inviteCode }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join community');
    }
    return response.json();
  },

  async updateCommunityTypingStatus(communityId: string, isTyping: boolean): Promise<any> {
    const user = await getCurrentUser();
    if (!user) return null;

    if (isTyping) {
      // Insert or update typing indicator
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      const typingUser = {
        community_id: communityId,
        user_id: user.id,
        username: profile?.username || 'Anonymous',
        avatar_url: profile?.avatar_url || null,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('typing_indicators')
        .upsert(typingUser, { onConflict: 'community_id,user_id' })
        .select();
    } else {
      // Delete typing indicator
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);
    }
  },

  async getCommunityMembers(communityId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/members`, {
      headers: {}
    });
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  async muteCommunityMember(communityId: string, targetUserId: string, reason?: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/mute-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ targetUserId, reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mute member');
    }
    return response.json();
  },

  async unmuteCommunityMember(communityId: string, targetUserId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/unmute-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ targetUserId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unmute member');
    }
    return response.json();
  },

  async temporarilyMuteCommunityMember(communityId: string, targetUserId: string, durationMinutes: number, reason?: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/temporary-mute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ targetUserId, durationMinutes, reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mute member');
    }
    return response.json();
  },

  async kickCommunityMember(communityId: string, targetUserId: string, reason?: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/kick-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ targetUserId, reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to kick member');
    }
    return response.json();
  },

  async makeAdminCommunityMember(communityId: string, targetUserId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/make-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ targetUserId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to make admin');
    }
    return response.json();
  },

  async removeAdminCommunityMember(communityId: string, targetUserId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/remove-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ targetUserId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove admin');
    }
    return response.json();
  },

  async checkCommunityKickStatus(communityId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/check-kick-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',

      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check kick status');
    }
    return response.json();
  },

  async getKickedMembers(communityId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/kicked-members`, {
      headers: {}
    });
    if (!response.ok) throw new Error('Failed to fetch kicked members');
    return response.json();
  },

  async unkickCommunityMember(communityId: string, targetUserId: string, reason?: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/unkick-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ targetUserId, reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unkick member');
    }
    return response.json();
  },

  async deleteCommunityMessage(communityId: string, messageId: string): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',

      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }
    return response.json();
  },

  async uploadCommunityAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this._uploadToCloudinary(file, "community-avatars", onProgress);
  },

  async updateCommunity(communityId: string, updates: { name?: string; description?: string; avatarUrl?: string }): Promise<any> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const response = await communityFetch(`/api/communities/${communityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update community');
    }

    return response.json();
  },

  saveHashtags(contentId: string, contentType: 'post' | 'reel', caption: string) {
    return saveHashtags(contentId, contentType, caption);
  },
};
