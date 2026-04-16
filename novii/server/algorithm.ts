import type { SupabaseClient } from "@supabase/supabase-js";

interface ScoredPost {
  _score: number;
  _reasons: string[];
  [key: string]: any;
}

interface UserInterestProfile {
  authorAffinities: Map<string, number>;
  hashtagInterests: Map<string, number>;
  totalInteractions: number;
}

const POST_SELECT = `
  id, user_id, caption, image_url, location,
  likes_count, comments_count, views_count,
  hide_likes, replies_disabled, is_archived, is_pinned,
  created_at, updated_at,
  profile:profiles!posts_user_id_fkey(
    id, username, full_name, avatar_url, bio,
    is_verified, is_official, is_creator, is_premium,
    is_popular, is_active, is_private,
    is_gold_early_member, is_silver_early_member, is_bronze_early_member,
    is_beta_tester, is_bug_hunter,
    followers_count, following_count
  )
`;

async function buildUserInterestProfile(
  db: SupabaseClient,
  userId: string
): Promise<UserInterestProfile> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [likesRes, commentsRes, savesRes] = await Promise.all([
    db.from("likes")
      .select("post_id, posts!inner(user_id, caption)")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo)
      .limit(200),
    db.from("comments")
      .select("post_id, posts!inner(user_id, caption)")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo)
      .limit(100),
    db.from("saved_posts")
      .select("post_id, posts!inner(user_id, caption)")
      .eq("user_id", userId)
      .limit(100),
  ]);

  const authorAffinities = new Map<string, number>();
  const hashtagInterests = new Map<string, number>();
  let totalInteractions = 0;

  function processInteraction(item: any, weight: number) {
    const post = (item as any).posts;
    if (!post) return;

    totalInteractions += weight;

    const authorId = post.user_id;
    if (authorId && authorId !== userId) {
      authorAffinities.set(
        authorId,
        (authorAffinities.get(authorId) || 0) + weight
      );
    }

    const caption = post.caption || "";
    const tags = caption.match(/#([\p{L}\p{N}_]+)/gu) || [];
    for (const tag of tags) {
      const normalized = tag.slice(1).toLowerCase();
      hashtagInterests.set(
        normalized,
        (hashtagInterests.get(normalized) || 0) + weight
      );
    }
  }

  for (const item of likesRes.data || []) processInteraction(item, 1);
  for (const item of commentsRes.data || []) processInteraction(item, 3);
  for (const item of savesRes.data || []) processInteraction(item, 2);

  return { authorAffinities, hashtagInterests, totalInteractions };
}

function calculateAuthorAffinityScore(
  profile: UserInterestProfile,
  authorId: string
): number {
  if (profile.totalInteractions === 0) return 0;
  const affinity = profile.authorAffinities.get(authorId) || 0;
  const maxAffinity = Math.max(...profile.authorAffinities.values(), 1);
  return Math.min(affinity / maxAffinity, 1);
}

function calculateInterestScore(
  profile: UserInterestProfile,
  caption: string
): number {
  if (profile.hashtagInterests.size === 0) return 0;

  const tags = (caption || "").match(/#([\p{L}\p{N}_]+)/gu) || [];
  if (tags.length === 0) return 0;

  const maxInterest = Math.max(...profile.hashtagInterests.values(), 1);
  let score = 0;

  for (const tag of tags) {
    const normalized = tag.slice(1).toLowerCase();
    const interest = profile.hashtagInterests.get(normalized) || 0;
    score += interest / maxInterest;
  }

  return Math.min(score / tags.length, 1);
}

function calculateEngagementScore(post: any): number {
  const likes = post.likes_count || 0;
  const comments = post.comments_count || 0;
  const views = post.views_count || 1;

  const hoursAge = Math.max(
    (Date.now() - new Date(post.created_at).getTime()) / 3600000,
    1
  );

  const engagementRate = (likes + comments * 2) / Math.max(views, hoursAge * 2);
  return Math.min(engagementRate, 1);
}

function calculateRecencyScore(createdAt: string): number {
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  return 1 / (1 + hoursAgo / 12);
}

function applyDiversityPenalty(
  posts: ScoredPost[],
  maxPerAuthor: number = 3
): ScoredPost[] {
  const authorCounts = new Map<string, number>();
  const result: ScoredPost[] = [];

  for (const post of posts) {
    const authorId = post.user_id;
    const count = authorCounts.get(authorId) || 0;

    if (count >= maxPerAuthor) {
      post._score *= 0.3;
      post._reasons.push("diversity_penalty");
    }

    authorCounts.set(authorId, count + 1);
    result.push(post);
  }

  result.sort((a, b) => b._score - a._score);
  return result;
}

export async function getPersonalizedFeed(
  db: SupabaseClient,
  userId: string,
  page: number = 0,
  limit: number = 20
): Promise<any[]> {
  const [profile, followingRes] = await Promise.all([
    buildUserInterestProfile(db, userId),
    db.from("follows")
      .select("following_id")
      .eq("follower_id", userId),
  ]);

  const followingIds = new Set(
    (followingRes.data || []).map((f: any) => f.following_id)
  );
  followingIds.add(userId);

  const batchSize = 80;
  const { data: posts, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .in("user_id", [...followingIds])
    .order("created_at", { ascending: false })
    .range(0, batchSize - 1);

  if (error || !posts) return [];

  const WEIGHT_AUTHOR = 0.30;
  const WEIGHT_INTEREST = 0.25;
  const WEIGHT_ENGAGEMENT = 0.20;
  const WEIGHT_RECENCY = 0.15;
  const WEIGHT_BOOST = 0.10;

  const scored: ScoredPost[] = posts.map((post: any) => {
    const reasons: string[] = [];

    const authorScore = calculateAuthorAffinityScore(profile, post.user_id);
    if (authorScore > 0.5) reasons.push("author_affinity");

    const interestScore = calculateInterestScore(profile, post.caption);
    if (interestScore > 0.3) reasons.push("interest_match");

    const engagementScore = calculateEngagementScore(post);
    if (engagementScore > 0.5) reasons.push("high_engagement");

    const recencyScore = calculateRecencyScore(post.created_at);
    if (recencyScore > 0.7) reasons.push("recent");

    let boostScore = 0;
    const p = post.profile;
    if (p?.is_verified) boostScore += 0.3;
    if (p?.is_official) boostScore += 0.2;
    if (p?.is_creator) boostScore += 0.15;
    if (post.is_pinned) {
      boostScore += 0.5;
      reasons.push("pinned");
    }
    boostScore = Math.min(boostScore, 1);

    const idSum = post.id
      .split("")
      .reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const sessionSeed = Math.floor(Date.now() / 3600000);
    const jitter =
      (((sessionSeed * 31 + idSum * 17) % 100) / 100) * 0.05;

    const finalScore =
      authorScore * WEIGHT_AUTHOR +
      interestScore * WEIGHT_INTEREST +
      engagementScore * WEIGHT_ENGAGEMENT +
      recencyScore * WEIGHT_RECENCY +
      boostScore * WEIGHT_BOOST +
      jitter;

    return { ...post, _score: finalScore, _reasons: reasons };
  });

  scored.sort((a, b) => b._score - a._score);
  const diversified = applyDiversityPenalty(scored, 3);

  const start = page * limit;
  const paged = diversified.slice(start, start + limit);

  const postIds = paged.map((p) => p.id);
  if (postIds.length > 0) {
    const [likesData, savedData] = await Promise.all([
      db.from("likes").select("post_id").eq("user_id", userId).in("post_id", postIds),
      db.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", postIds),
    ]);
    const likedIds = new Set(likesData.data?.map((l: any) => l.post_id) || []);
    const savedIds = new Set(savedData.data?.map((s: any) => s.post_id) || []);
    for (const post of paged) {
      post.is_liked = likedIds.has(post.id);
      post.is_saved = savedIds.has(post.id);
    }
  }

  return paged.map(({ _score, _reasons, ...post }) => post);
}

export async function getPersonalizedExplore(
  db: SupabaseClient,
  userId: string,
  limit: number = 30
): Promise<any[]> {
  const [profile, followingRes] = await Promise.all([
    buildUserInterestProfile(db, userId),
    db.from("follows")
      .select("following_id")
      .eq("follower_id", userId),
  ]);

  const followingIds = new Set(
    (followingRes.data || []).map((f: any) => f.following_id)
  );
  followingIds.add(userId);

  const batchSize = 100;
  const { data: posts, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(0, batchSize - 1);

  if (error || !posts) return [];

  const nonFollowedPosts = posts.filter(
    (p: any) => !followingIds.has(p.user_id)
  );

  const WEIGHT_INTEREST = 0.35;
  const WEIGHT_ENGAGEMENT = 0.35;
  const WEIGHT_RECENCY = 0.15;
  const WEIGHT_QUALITY = 0.15;

  const scored: ScoredPost[] = nonFollowedPosts.map((post: any) => {
    const reasons: string[] = [];

    const interestScore = calculateInterestScore(profile, post.caption);
    if (interestScore > 0.3) reasons.push("matches_interests");

    const engagementScore = calculateEngagementScore(post);
    if (engagementScore > 0.5) reasons.push("trending");

    const recencyScore = calculateRecencyScore(post.created_at);

    let qualityScore = 0;
    const p = post.profile;
    if (p?.is_verified) qualityScore += 0.4;
    if (p?.is_official) qualityScore += 0.3;
    if (p?.is_creator) qualityScore += 0.2;
    if ((p?.followers_count || 0) > 10) qualityScore += 0.1;
    qualityScore = Math.min(qualityScore, 1);

    const idSum = post.id
      .split("")
      .reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const jitter = ((idSum * 13) % 100) / 100 * 0.08;

    const finalScore =
      interestScore * WEIGHT_INTEREST +
      engagementScore * WEIGHT_ENGAGEMENT +
      recencyScore * WEIGHT_RECENCY +
      qualityScore * WEIGHT_QUALITY +
      jitter;

    return { ...post, _score: finalScore, _reasons: reasons };
  });

  scored.sort((a, b) => b._score - a._score);
  const diversified = applyDiversityPenalty(scored, 2);
  const result = diversified.slice(0, limit);

  const postIds = result.map((p) => p.id);
  if (postIds.length > 0) {
    const [likesData, savedData] = await Promise.all([
      db.from("likes").select("post_id").eq("user_id", userId).in("post_id", postIds),
      db.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", postIds),
    ]);
    const likedIds = new Set(likesData.data?.map((l: any) => l.post_id) || []);
    const savedIds = new Set(savedData.data?.map((s: any) => s.post_id) || []);
    for (const post of result) {
      post.is_liked = likedIds.has(post.id);
      post.is_saved = savedIds.has(post.id);
    }
  }

  return result.map(({ _score, _reasons, ...post }) => post);
}

export async function getPersonalizedExploreReels(
  db: SupabaseClient,
  userId: string,
  limit: number = 20
): Promise<any[]> {
  const [profile, followingRes] = await Promise.all([
    buildUserInterestProfile(db, userId),
    db.from("follows")
      .select("following_id")
      .eq("follower_id", userId),
  ]);

  const followingIds = new Set(
    (followingRes.data || []).map((f: any) => f.following_id)
  );
  followingIds.add(userId);

  const { data: reels, error } = await db
    .from("reels")
    .select(`
      id, user_id, video_url, thumbnail_url, caption,
      likes_count, comments_count, views_count, created_at,
      profile:profiles!reels_user_id_fkey(
        id, username, avatar_url, is_verified, is_official, followers_count
      )
    `)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(0, 60);

  if (error || !reels) return [];

  const nonFollowed = reels.filter(
    (r: any) => !followingIds.has(r.user_id)
  );

  const scored = nonFollowed.map((reel: any) => {
    const interestScore = calculateInterestScore(profile, reel.caption);
    const engagementScore = calculateEngagementScore(reel);
    const recencyScore = calculateRecencyScore(reel.created_at);

    const finalScore =
      interestScore * 0.30 +
      engagementScore * 0.40 +
      recencyScore * 0.20 +
      (reel.profile?.is_verified ? 0.1 : 0);

    return { ...reel, _score: finalScore };
  });

  scored.sort((a: any, b: any) => b._score - a._score);
  return scored.slice(0, limit).map(({ _score, ...reel }) => reel);
}
