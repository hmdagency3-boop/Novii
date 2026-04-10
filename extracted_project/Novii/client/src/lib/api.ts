import { supabase } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getFromCache, saveToCache, invalidateCache, getOrFetch, CACHE_DURATIONS } from './cache-utils';
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
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website: string | null;
  location: string | null;
  is_verified: boolean;
  verified_at: string | null;
  is_official: boolean;
  is_private: boolean;
  is_creator: boolean;
  is_premium: boolean;
  is_popular: boolean;
  is_active: boolean;
  is_gold_early_member?: boolean;
  gold_early_member_at?: string | null;
  is_silver_early_member?: boolean;
  silver_early_member_at?: string | null;
  is_bronze_early_member?: boolean;
  bronze_early_member_at?: string | null;
  is_beta_tester?: boolean;
  beta_tester_at?: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
  is_following?: boolean; // Optional: indicates if current user follows this profile
  is_followed_by?: boolean; // Optional: indicates if this profile follows current user
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
  updated_at: string;
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
  profile?: Profile;
  is_viewed?: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string | null;
  story_id?: string | null;
  story?: Story | null;
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
  type: 'like' | 'comment' | 'follow' | 'mention';
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
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export const api = {
  // Profile APIs
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try cache first
    const cacheKey = `profile_current_${user.id}`;
    const cached = getFromCache<Profile>(cacheKey);
    if (cached) {
      console.log('✅ Current profile from cache');
      return cached;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) return null;

    // Calculate counts using count-only queries (more efficient)
    const [followersResult, followingResult] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id)
    ]);

    const result = {
      ...profile,
      followers_count: followersResult.count || 0,
      following_count: followingResult.count || 0,
    };

    saveToCache(cacheKey, result);
    return result;
  },

  async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current profile to save old avatar URL
    const currentProfile = await this.getCurrentProfile();
    const oldAvatarUrl = currentProfile?.avatar_url;

    // Create unique filename with proper folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Report initial progress
    if (onProgress) onProgress(10);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Report upload complete
    if (onProgress) onProgress(80);

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const newAvatarUrl = data.publicUrl;

    // Only delete old avatar after successful upload
    if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
      try {
        await this.deleteAvatar(oldAvatarUrl);
      } catch (error) {
        console.warn('Failed to delete old avatar:', error);
        // Don't fail the upload if deletion fails
      }
    }

    if (onProgress) onProgress(100);

    return newAvatarUrl;
  },

  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl || !avatarUrl.includes('/storage/v1/object/public/avatars/')) return;

    try {
      // Extract file path from URL
      // URL format: https://.../storage/v1/object/public/avatars/user-id/filename.ext
      const urlParts = avatarUrl.split('/storage/v1/object/public/avatars/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.warn('Failed to delete avatar from storage:', error);
      }
    } catch (error) {
      console.warn('Error deleting avatar:', error);
    }
  },

  async uploadCover(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current profile to save old cover URL
    const currentProfile = await this.getCurrentProfile();
    const oldCoverUrl = currentProfile?.cover_url;

    // Create unique filename with proper folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Report initial progress
    if (onProgress) onProgress(10);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Report upload complete
    if (onProgress) onProgress(80);

    // Get public URL
    const { data } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath);

    const newCoverUrl = data.publicUrl;

    // Only delete old cover after successful upload
    if (oldCoverUrl && oldCoverUrl !== newCoverUrl) {
      try {
        await this.deleteCover(oldCoverUrl);
      } catch (error) {
        console.warn('Failed to delete old cover:', error);
        // Don't fail the upload if deletion fails
      }
    }

    if (onProgress) onProgress(100);

    return newCoverUrl;
  },

  async deleteCover(coverUrl: string): Promise<void> {
    if (!coverUrl || !coverUrl.includes('/storage/v1/object/public/covers/')) return;

    try {
      // Extract file path from URL
      // URL format: https://.../storage/v1/object/public/covers/user-id/filename.ext
      const urlParts = coverUrl.split('/storage/v1/object/public/covers/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('covers')
        .remove([filePath]);

      if (error) {
        console.warn('Failed to delete cover from storage:', error);
      }
    } catch (error) {
      console.warn('Error deleting cover:', error);
    }
  },

  async getProfile(username: string): Promise<Profile | null> {
    const cacheKey = `profile_${username}`;
    
    // Try cache first
    const cached = getFromCache<Profile>(cacheKey);
    if (cached) {
      console.log(`✅ Profile ${username} from cache`);
      return cached;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('username', username)
      .single();

    if (error) throw error;
    if (data) saveToCache(cacheKey, data);
    return data;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // الـ trigger في قاعدة البيانات يحدث verified_at تلقائياً
    // فقط مرر التحديثات كما هي
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOnlineStatus(isOnline: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const { data: { user } } = await supabase.auth.getUser();
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
      }));
    }

    return posts;
  },

  async getExplorePosts(limit = 30): Promise<Post[]> {
    // Optimized: use specific columns and pagination
    const { data, error } = await supabase
      .from('posts')
      .select(POST_WITH_PROFILE)
      .eq('is_archived', false)
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    const posts = data || [];

    // Add is_liked and is_saved for current user
    const { data: { user } } = await supabase.auth.getUser();
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

  async getUserPosts(userId: string): Promise<Post[]> {
    // Optimized: use specific columns, no joins for performance
    const { data, error } = await supabase
      .from('posts')
      .select(POST_COLUMNS)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    const posts = data || [];

    // Add is_liked and is_saved for current user
    const { data: { user } } = await supabase.auth.getUser();
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const reels = data || [];

    // Add is_liked for current user (batch query)
    const { data: { user } } = await supabase.auth.getUser();
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
      }));
    }

    return reels;
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

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [likeData, saveData] = await Promise.all([
        supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle(),
        supabase.from('saved_posts').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
      ]);

      return {
        ...data,
        is_liked: !!likeData.data,
        is_saved: !!saveData.data
      };
    }

    return {
      ...data,
      is_liked: false,
      is_saved: false
    };
  },

  async uploadPostImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create unique filename with proper folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Report initial progress
    if (onProgress) onProgress(10);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Report upload complete
    if (onProgress) onProgress(80);

    // Get public URL
    const { data } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    if (onProgress) onProgress(100);

    return data.publicUrl;
  },

  async createPost(caption: string, imageUrl: string, location?: string): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
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

    return data;
  },

  async deletePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    await supabase.rpc('decrement_posts_count', { profile_id: user.id });
  },

  // Likes APIs
  async toggleLike(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
      
      console.log('❤️ Like removed');
      return false;
    } else {
      // Like: insert the like (count increment handled by trigger)
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });
      
      if (insertError) throw insertError;
      
      console.log('❤️ Like added');
      
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
          console.log('✅ Like notification created');
        } catch (notifError) {
          console.error('⚠️ Failed to create like notification:', notifError);
        }
      }
      
      return true;
    }
  },

  // Reel Likes APIs
  async toggleReelLike(reelId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
      
      console.log('❤️ Reel like removed');
      return false;
    } else {
      // Like: insert the like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ reel_id: reelId, user_id: user.id });
      
      if (insertError) throw insertError;
      
      console.log('❤️ Reel like added');
      
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
          console.log('✅ Reel like notification created');
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
    const { data: allComments, error } = await supabase
      .from('comments')
      .select(COMMENT_WITH_PROFILE)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

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
    const { data: { user } } = await supabase.auth.getUser();
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
        console.log('✅ Comment notification created');
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

    return data;
  },

  async toggleCommentLike(commentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
    console.log(`🔍 Search results for "${query}":`, data?.length || 0, 'users');
    return data || [];
  },

  async deleteComment(commentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the comment to verify permissions
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, post_id, parent_comment_id')
      .eq('id', commentId)
      .single();

    if (fetchError) throw fetchError;
    if (!comment) throw new Error('Comment not found');

    // Check if user is the comment author or post owner
    if (comment.user_id !== user.id) {
      // Check if user is the post owner
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', comment.post_id)
        .single();
      
      if (!post || post.user_id !== user.id) {
        throw new Error('Not authorized to delete this comment');
      }
    }

    // Delete all replies first (cascade delete)
    const { error: deleteRepliesError } = await supabase
      .from('comments')
      .delete()
      .eq('parent_comment_id', commentId);

    if (deleteRepliesError) throw deleteRepliesError;

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    // Only decrement comments count for root comments
    if (!comment.parent_comment_id) {
      await supabase.rpc('decrement_comments_count', { post_id: comment.post_id });
    }
  },

  // Stories APIs
  async getStories(): Promise<Story[]> {
    const { data: { user } } = await supabase.auth.getUser();
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserStories(userId: string): Promise<Story[]> {
    // Optimized: use specific columns
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_WITH_PROFILE)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createStory(mediaUrl: string, mediaType: 'image' | 'video' = 'image'): Promise<Story> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Use optimized columns to reduce egress (70% savings!)
    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType
      })
      .select(STORY_WITH_PROFILE)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStory(storyId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
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
      
      console.log('✅ Story deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting story:', error);
      throw error;
    }
  },

  // Follow APIs
  async toggleFollow(targetUserId: string): Promise<{isFollowing: boolean; actorProfile: Profile | null; isPending?: boolean}> {
    console.log('🔄 toggleFollow called for user:', targetUserId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get target user profile to check if private
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('is_private')
      .eq('id', targetUserId)
      .single();

    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      // Delete follow
      console.log('❌ Unfollowing user:', targetUserId);
      await supabase.from('follows').delete().eq('id', existingFollow.id);
      return { isFollowing: false, actorProfile: currentProfile };
    } else {
      // Check if target user has private account
      if (targetProfile?.is_private) {
        // Send follow request instead
        console.log('📨 Sending follow request to private account:', targetUserId);
        try {
          await this.createNotification({
            userId: targetUserId,
            actorId: user.id,
            type: 'follow_request',
          });
          console.log('✅ Follow request sent');
          return { isFollowing: false, actorProfile: currentProfile, isPending: true };
        } catch (error) {
          console.error('❌ Failed to send follow request:', error);
          throw error;
        }
      } else {
        // Public account - follow directly
        console.log('✅ Following user:', targetUserId);
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId
        });
        if (error) {
          console.error('❌ Follow insert error:', error);
          throw error;
        }
        console.log('✅ Follow inserted successfully');
        
        // Create notification for the followed user
        try {
          await this.createNotification({
            userId: targetUserId,
            actorId: user.id,
            type: 'follow',
          });
          console.log('✅ Follow notification created');
        } catch (notifError) {
          console.error('⚠️ Failed to create follow notification:', notifError);
        }
        
        return { isFollowing: true, actorProfile: currentProfile };
      }
    }
  },

  async getPendingFollowRequests(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        actor_id,
        created_at,
        actor:profiles!notifications_actor_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('type', 'follow_request')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching follow requests:', error);
      return [];
    }

    return data || [];
  },

  async approveFollowRequest(actorId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      console.log('✅ Approving follow request from:', actorId);

      // Create follow
      const { error: followError } = await supabase.from('follows').insert({
        follower_id: actorId,
        following_id: user.id
      });

      if (followError) {
        console.error('❌ Error creating follow:', followError);
        throw followError;
      }

      console.log('✅ Follow created successfully');

      // Delete follow request notification
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('actor_id', actorId)
        .eq('type', 'follow_request');

      if (deleteError) {
        console.error('❌ Error deleting follow request notification:', deleteError);
      } else {
        console.log('✅ Follow request notification deleted');
      }
    } catch (error) {
      console.error('❌ Error in approveFollowRequest:', error);
      throw error;
    }
  },

  async sendStoryReply(storyId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
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
      
      console.log('✅ Story reply sent:', message);
      return message;
    } catch (error) {
      console.error('❌ Error sending story reply:', error);
      throw error;
    }
  },

  async addStoryView(storyId: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
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
        
        console.log('✅ Story view recorded');
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
      console.log('📊 Fetching story views for story:', storyId);
      
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

      console.log('📊 Fetched story views:', data?.length || 0);

      // Map the data to include profile info with viewedAt
      const views = data?.map((view: any) => ({
        ...(view.profiles || {}),
        viewedAt: view.viewed_at
      })) || [];

      console.log('📊 Mapped views:', views);
      return views;
    } catch (error) {
      console.error('❌ Error getting story views:', error);
      return [];
    }
  },

  async rejectFollowRequest(actorId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      console.log('❌ Rejecting follow request from:', actorId);

      // Delete follow request notification
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('actor_id', actorId)
        .eq('type', 'follow_request');

      if (error) {
        console.error('❌ Error rejecting follow request:', error);
        throw error;
      }

      console.log('✅ Follow request rejected');
    } catch (error) {
      console.error('❌ Error in rejectFollowRequest:', error);
      throw error;
    }
  },

  async hasFollowRequest(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('actor_id', user.id)
      .eq('type', 'follow_request')
      .single();

    return !!data;
  },

  async isFollowing(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get all messages where current user is involved
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

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
      if (message.receiver_id === user.id && !message.is_read) {
        const conv = conversations.get(otherUserId);
        if (conv) {
          conv.unreadCount++;
        }
      }
    });

    return Array.from(conversations.values());
  },

  async getMessages(userId: string): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    console.log(`📨 getMessages called - Current User: ${user.id}, Target User: ${userId}`);
    
    // Prevent fetching messages to self
    if (user.id === userId) {
      console.warn('⚠️ Attempting to fetch messages to self! Returning empty array.');
      return [];
    }

    // Get all messages between current user and the specified user
    // This includes:
    // 1. Messages sent by current user TO userId
    // 2. Messages sent by userId TO current user
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
    
    console.log(`✅ Fetched ${data?.length || 0} messages between Current User (${user.id}) and Target User (${userId})`);
    return data || [];
  },

  async uploadMessageImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        console.log(`✅ Image converted to base64`);
        resolve(base64);
      };
      reader.onerror = () => {
        console.error('❌ Error reading file:', reader.error);
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  },

  async sendMessage(receiverId: string, content: string, imageUrl?: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Prevent sending messages to self
    if (user.id === receiverId) {
      console.error('⚠️ Attempted to send message to self!');
      throw new Error('Cannot send messages to yourself');
    }

    console.log(`📤 Sending message from ${user.id} to ${receiverId}`);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        image_url: imageUrl || null
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
    
    console.log(`✅ Message sent successfully`);
    return data;
  },

  async markMessagesAsRead(senderId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log(`📖 Marking messages as read from ${senderId} to ${user.id}`);

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Error marking messages as read:', error);
      throw error;
    }
    
    console.log(`✅ Messages marked as read successfully`);
  },

  async updateMessage(messageId: string, newContent: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log(`✏️ Updating message ${messageId}`);

    const { data, error } = await supabase.rpc('update_message', {
      message_id: messageId,
      new_content: newContent
    });

    if (error) {
      console.error('❌ Error updating message:', error);
      throw error;
    }
    
    // RPC returns array, get first item
    const updatedMessage = Array.isArray(data) ? data[0] : data;
    
    if (!updatedMessage) {
      throw new Error('Failed to update message');
    }
    
    console.log(`✅ Message updated successfully`);
    return updatedMessage;
  },

  async deleteMessage(messageId: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log(`🗑️ Deleting message ${messageId}`);

    const { data, error } = await supabase.rpc('delete_message', {
      message_id: messageId
    });

    if (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
    
    // RPC returns array, get first item
    const deletedMessage = Array.isArray(data) ? data[0] : data;
    
    if (!deletedMessage) {
      throw new Error('Failed to delete message');
    }
    
    console.log(`✅ Message deleted successfully`);
    return deletedMessage;
  },

  // Notifications APIs
  async getNotifications(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
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
    
    console.log(`✅ Notification created: ${params.type}`);
    return {
      id: data.id,
      actor: actor || { id: params.actorId, is_official: false, is_verified: false } as Profile
    };
  },

  async addMessageReaction(messageId: string, reaction: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    
    console.log('✅ All unread notifications marked as read');
  },

  // Saved Posts APIs
  async toggleSave(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:profiles!follows_follower_id_fkey(*)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:profiles!follows_following_id_fkey(*)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    return this.getFollowing(user.id);
  },

  // Suggestions with advanced recommendation algorithm
  async getSuggestedUsers(limit = 50): Promise<Profile[]> {
    const { data: { user } } = await supabase.auth.getUser();
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

    const { data: { user: currentUser } } = await supabase.auth.getUser();

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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    console.log(`📌 Post ${newPinnedStatus ? 'pinned' : 'unpinned'}`);
    return newPinnedStatus;
  },

  // Hide/Show Likes
  async toggleHideLikes(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
    console.log(`👁️ Post likes ${newHideLikesStatus ? 'hidden' : 'visible'}`);
    return newHideLikesStatus;
  },

  // Toggle Reply Settings
  async toggleRepliesDisabled(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
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
    console.log(`💬 Post replies ${newRepliesDisabledStatus ? 'disabled' : 'enabled'}`);
    return newRepliesDisabledStatus;
  },

  // Record Post View
  async recordPostView(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('post_views')
        .insert({ 
          post_id: postId,
          user_id: user.id 
        })
        .maybeSingle();
      
      console.log('👀 Post view recorded');
    } catch (error) {
      // Ignore duplicate view errors - it's handled by the unique constraint
      console.log('View already recorded or error:', error);
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
  async trackDevice(userId: string): Promise<UserDevice> {
    const response = await fetch('/api/devices/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to track device');
    return response.json();
  },

  async getUserDevices(userId: string): Promise<UserDevice[]> {
    const response = await fetch(`/api/devices/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch devices');
    return response.json();
  },

  async removeDevice(deviceId: string): Promise<void> {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove device');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch('/api/communities/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({ name, description, isPrivate }),
    });
    if (!response.ok) throw new Error('Failed to create community');
    return response.json();
  },

  async getCommunities(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("❌ getCommunities: No authenticated user");
        return [];
      }

      console.log("🔄 getCommunities: Fetching with user ID:", user.id);
      const response = await fetch('/api/communities', {
        headers: { 'x-user-id': user.id },
      });
      
      if (!response.ok) {
        console.error("❌ getCommunities: Response not OK", response.status);
        return [];
      }
      
      const result = await response.json();
      const communities = result.data || [];
      console.log("✅ getCommunities: Fetched", communities.length, "communities:", communities);
      return communities;
    } catch (error) {
      console.error("❌ getCommunities: Error:", error);
      return [];
    }
  },

  async sendCommunityMessage(communityId: string, content: string, imageUrl?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({ content, imageUrl }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async getCommunityMessages(communityId: string, limit?: number): Promise<any[]> {
    const response = await fetch(`/api/communities/${communityId}/messages?limit=${limit || 50}`);
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  },

  async addCommunityMember(communityId: string, memberId: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({ memberId }),
    });
    if (!response.ok) throw new Error('Failed to add member');
    return response.json();
  },

  async joinCommunityWithCode(inviteCode: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch('/api/communities/join-with-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    if (isTyping) {
      // Insert or update typing indicator
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      const typingUser = {
        id: `${communityId}-${user.id}`,
        community_id: communityId,
        user_id: user.id,
        username: profile?.username || 'Anonymous',
        avatar_url: profile?.avatar_url || null,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('typing_indicators')
        .upsert(typingUser, { onConflict: 'id' })
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/members`, {
      headers: { 'x-user-id': user.id }
    });
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  async muteCommunityMember(communityId: string, targetUserId: string, reason?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/mute-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/unmute-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/temporary-mute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/kick-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/make-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/remove-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/check-kick-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check kick status');
    }
    return response.json();
  },

  async getKickedMembers(communityId: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/kicked-members`, {
      headers: { 'x-user-id': user.id }
    });
    if (!response.ok) throw new Error('Failed to fetch kicked members');
    return response.json();
  },

  async unkickCommunityMember(communityId: string, targetUserId: string, reason?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/unkick-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }
    return response.json();
  },

  async uploadCommunityAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `community/${user.id}/${fileName}`;

    if (onProgress) onProgress(10);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    if (onProgress) onProgress(80);

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (onProgress) onProgress(100);

    return data.publicUrl;
  },

  async updateCommunity(communityId: string, updates: { name?: string; description?: string; avatarUrl?: string }): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`/api/communities/${communityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update community');
    }

    return response.json();
  }
};
