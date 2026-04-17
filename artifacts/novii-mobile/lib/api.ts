import { supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_verified?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

export interface Post {
  id: string;
  user_id: string;
  caption?: string | null;
  image_url?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked?: boolean;
  profile?: Profile | null;
}

const POST_WITH_PROFILE = `
  id,
  user_id,
  caption,
  image_url,
  likes_count,
  comments_count,
  created_at,
  profile:profiles!posts_user_id_fkey(
    id, username, full_name, avatar_url, is_verified, followers_count
  )
`;

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && posts.length > 0) {
    const ids = posts.map((p) => p.id);
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", ids);
    const liked = new Set(likes?.map((l: { post_id: string }) => l.post_id) ?? []);
    return posts.map((p) => ({ ...p, is_liked: liked.has(p.id) }));
  }
  return posts;
}

export async function toggleLike(postId: string, isLiked: boolean) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (isLiked) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, is_verified, followers_count, following_count, posts_count",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_PROFILE)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as Post[];
}
