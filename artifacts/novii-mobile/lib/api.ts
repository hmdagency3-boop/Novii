import { supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  is_verified?: boolean | null;
  is_official?: boolean | null;
  is_private?: boolean | null;
  followers_count?: number | null;
  following_count?: number | null;
  posts_count?: number | null;
  website?: string | null;
  location?: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  caption?: string | null;
  image_url?: string | null;
  location?: string | null;
  likes_count: number;
  comments_count: number;
  views_count?: number;
  hide_likes?: boolean;
  created_at: string;
  is_liked?: boolean;
  is_saved?: boolean;
  profile?: Profile | null;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  expires_at: string;
  created_at: string;
  is_viewed?: boolean;
  profile?: Profile | null;
}

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  likes_count: number;
  comments_count: number;
  views_count?: number;
  created_at: string;
  is_liked?: boolean;
  profile?: Profile | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string | null;
  likes_count: number;
  created_at: string;
  profile?: Profile | null;
  replies?: Comment[];
}

export interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string | null;
  is_read?: boolean | null;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string;
  type: "like" | "comment" | "follow" | "follow_request" | "mention";
  post_id?: string | null;
  content?: string | null;
  is_read?: boolean | null;
  created_at: string;
  actor?: Profile | null;
  post?: { id: string; image_url?: string | null; caption?: string | null } | null;
}

const PROFILE_CARD = `
  id, username, full_name, avatar_url, bio, website, location,
  is_verified, is_official, is_private,
  followers_count, following_count, posts_count
`;

const POST_WITH_PROFILE = `
  id, user_id, caption, image_url, location,
  likes_count, comments_count, views_count, hide_likes,
  created_at,
  profile:profiles!posts_user_id_fkey(${PROFILE_CARD})
`;

const REEL_WITH_PROFILE = `
  id, user_id, video_url, thumbnail_url, caption,
  likes_count, comments_count, views_count, created_at,
  profile:profiles!reels_user_id_fkey(${PROFILE_CARD})
`;

const STORY_WITH_PROFILE = `
  id, user_id, media_url, media_type, expires_at, created_at,
  profile:profiles!stories_user_id_fkey(${PROFILE_CARD})
`;

const COMMENT_WITH_PROFILE = `
  id, post_id, user_id, content, parent_comment_id,
  likes_count, created_at,
  profile:profiles!comments_user_id_fkey(${PROFILE_CARD})
`;

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function createProfile(
  userId: string,
  username: string,
  gender?: string,
  fullName?: string,
  phone?: string,
): Promise<Profile> {
  const defaultAvatarUrl =
    gender === "female"
      ? "/assets/default_avatar_female.png"
      : "/assets/default_avatar_male.png";
  const updateData: Record<string, unknown> = {
    username,
    full_name: fullName || username,
    gender: gender || null,
    avatar_url: defaultAvatarUrl,
    is_online: false,
    last_seen: new Date().toISOString(),
  };
  if (phone && phone.trim()) {
    updateData.phone_number = phone.trim();
  }
  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ───────── Posts / Feed ─────────

export async function getFeed(limit = 20, offset = 0): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_PROFILE)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  const posts = (data ?? []) as unknown as Post[];
  return enrichPostsForUser(posts);
}

export async function getExplorePosts(limit = 30): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_PROFILE)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("likes_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return enrichPostsForUser((data ?? []) as unknown as Post[]);
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_PROFILE)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as unknown as Post[];
}

export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_PROFILE)
    .eq("id", postId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const enriched = await enrichPostsForUser([data as unknown as Post]);
  return enriched[0] ?? null;
}

async function enrichPostsForUser(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts;
  const uid = await getCurrentUserId();
  if (!uid) return posts;
  const ids = posts.map((p) => p.id);
  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", uid).in("post_id", ids),
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", uid)
      .in("post_id", ids),
  ]);
  const liked = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
  const saved = new Set((saves ?? []).map((s: { post_id: string }) => s.post_id));
  return posts.map((p) => ({
    ...p,
    is_liked: liked.has(p.id),
    is_saved: saved.has(p.id),
  }));
}

export async function toggleLike(postId: string, isLiked: boolean) {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  if (isLiked) {
    await supabase.from("likes").delete().eq("user_id", uid).eq("post_id", postId);
  } else {
    await supabase.from("likes").insert({ user_id: uid, post_id: postId });
  }
}

export async function toggleSave(postId: string, isSaved: boolean) {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  if (isSaved) {
    await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", uid)
      .eq("post_id", postId);
  } else {
    await supabase.from("saved_posts").insert({ user_id: uid, post_id: postId });
  }
}

export async function createPost(
  caption: string,
  imageUrl: string,
  location?: string,
): Promise<Post> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: uid, caption, image_url: imageUrl, location })
    .select(POST_WITH_PROFILE)
    .single();
  if (error) throw error;
  return data as unknown as Post;
}

// ───────── Profiles ─────────

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_CARD)
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_CARD)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_CARD)
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function searchProfiles(q: string): Promise<Profile[]> {
  const term = q.trim();
  if (!term) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_CARD)
    .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
    .limit(30);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function isFollowing(targetId: string): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid || uid === targetId) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", uid)
    .eq("following_id", targetId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(targetId: string, currentlyFollowing: boolean) {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  if (currentlyFollowing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", uid)
      .eq("following_id", targetId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: uid, following_id: targetId });
  }
}

// ───────── Stories ─────────

export async function getStories(): Promise<Story[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", uid);
  const ids = [uid, ...(following ?? []).map((f: { following_id: string }) => f.following_id)];

  const { data, error } = await supabase
    .from("stories")
    .select(STORY_WITH_PROFILE)
    .in("user_id", ids)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;

  const stories = (data ?? []) as unknown as Story[];
  if (stories.length === 0) return stories;
  const sids = stories.map((s) => s.id);
  const { data: viewed } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("user_id", uid)
    .in("story_id", sids);
  const set = new Set((viewed ?? []).map((v: { story_id: string }) => v.story_id));
  return stories.map((s) => ({ ...s, is_viewed: set.has(s.id) }));
}

export async function getUserStories(userId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_WITH_PROFILE)
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Story[];
}

export async function markStoryViewed(storyId: string) {
  const uid = await getCurrentUserId();
  if (!uid) return;
  await supabase
    .from("story_views")
    .upsert({ story_id: storyId, user_id: uid }, { onConflict: "story_id,user_id" });
}

export async function createStory(mediaUrl: string, mediaType: "image" | "video") {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("stories")
    .insert({ user_id: uid, media_url: mediaUrl, media_type: mediaType, expires_at: expiresAt });
  if (error) throw error;
}

// ───────── Reels ─────────

export async function getSavedPosts(): Promise<Post[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("saved_posts")
    .select(`post:posts(${POST_WITH_PROFILE})`)
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? [])
    .map((row: any) => row.post)
    .filter(Boolean)) as unknown as Post[];
}

export async function getUserReels(userId: string): Promise<Reel[]> {
  const { data, error } = await supabase
    .from("reels")
    .select(`*, profile:profiles(${PROFILE_CARD})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Reel[];
}

export async function getReels(limit = 20, offset = 0): Promise<Reel[]> {
  const { data, error } = await supabase
    .from("reels")
    .select(REEL_WITH_PROFILE)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  const reels = (data ?? []) as unknown as Reel[];
  const uid = await getCurrentUserId();
  if (!uid || reels.length === 0) return reels;
  const ids = reels.map((r) => r.id);
  const { data: likes } = await supabase
    .from("likes")
    .select("reel_id")
    .eq("user_id", uid)
    .in("reel_id", ids);
  const liked = new Set((likes ?? []).map((l: { reel_id: string }) => l.reel_id));
  return reels.map((r) => ({ ...r, is_liked: liked.has(r.id) }));
}

export async function toggleReelLike(reelId: string, isLiked: boolean) {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  if (isLiked) {
    await supabase.from("likes").delete().eq("user_id", uid).eq("reel_id", reelId);
  } else {
    await supabase.from("likes").insert({ user_id: uid, reel_id: reelId });
  }
}

// ───────── Comments ─────────

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_WITH_PROFILE)
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const all = (data ?? []) as unknown as Comment[];
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  all.forEach((c) => {
    c.replies = [];
    map.set(c.id, c);
  });
  all.forEach((c) => {
    if (c.parent_comment_id) {
      const parent = map.get(c.parent_comment_id);
      if (parent) parent.replies!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
): Promise<Comment> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: uid,
      content,
      parent_comment_id: parentId ?? null,
    })
    .select(COMMENT_WITH_PROFILE)
    .single();
  if (error) throw error;
  return data as unknown as Comment;
}

// ───────── Messages ─────────

export async function getConversations(): Promise<
  Array<{ user: Profile; last: MessageRow; unread: number }>
> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("messages")
    .select(
      `*,
       sender:profiles!messages_sender_id_fkey(${PROFILE_CARD}),
       receiver:profiles!messages_receiver_id_fkey(${PROFILE_CARD})`,
    )
    .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const grouped = new Map<string, { user: Profile; last: MessageRow; unread: number }>();
  for (const m of (data ?? []) as unknown as MessageRow[]) {
    const otherId = m.sender_id === uid ? m.receiver_id : m.sender_id;
    const otherProfile = (m.sender_id === uid ? m.receiver : m.sender) as Profile;
    if (!otherProfile) continue;
    const existing = grouped.get(otherId);
    const unreadDelta =
      m.receiver_id === uid && !m.is_read ? 1 : 0;
    if (!existing) {
      grouped.set(otherId, { user: otherProfile, last: m, unread: unreadDelta });
    } else {
      existing.unread += unreadDelta;
    }
  }
  return Array.from(grouped.values());
}

export async function getMessages(otherId: string): Promise<MessageRow[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${uid},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${uid})`,
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(
  receiverId: string,
  content: string,
  imageUrl?: string,
): Promise<MessageRow> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: uid,
      receiver_id: receiverId,
      content,
      image_url: imageUrl ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function markMessagesRead(senderId: string) {
  const uid = await getCurrentUserId();
  if (!uid) return;
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", senderId)
    .eq("receiver_id", uid)
    .or("is_read.eq.false,is_read.is.null");
}

// ───────── Notifications ─────────

export async function getNotifications(): Promise<NotificationRow[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `id, user_id, actor_id, type, post_id, content, is_read, created_at,
       actor:profiles!notifications_actor_id_fkey(${PROFILE_CARD}),
       post:posts!notifications_post_id_fkey(id, image_url, caption)`,
    )
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data ?? []) as unknown as NotificationRow[];
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}
