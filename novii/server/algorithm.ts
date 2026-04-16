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

export interface AlgorithmConfig {
  feed_weight_author: number;
  feed_weight_interest: number;
  feed_weight_engagement: number;
  feed_weight_recency: number;
  feed_weight_boost: number;
  feed_batch_size: number;
  feed_max_per_author: number;
  explore_weight_interest: number;
  explore_weight_engagement: number;
  explore_weight_recency: number;
  explore_weight_quality: number;
  explore_batch_size: number;
  explore_max_per_author: number;
  reels_weight_interest: number;
  reels_weight_engagement: number;
  reels_weight_recency: number;
  reels_batch_size: number;
  verified_boost: number;
  official_boost: number;
  creator_boost: number;
  profile_lookback_days: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: AlgorithmConfig = {
  feed_weight_author: 0.30,
  feed_weight_interest: 0.25,
  feed_weight_engagement: 0.20,
  feed_weight_recency: 0.15,
  feed_weight_boost: 0.10,
  feed_batch_size: 80,
  feed_max_per_author: 3,
  explore_weight_interest: 0.35,
  explore_weight_engagement: 0.35,
  explore_weight_recency: 0.15,
  explore_weight_quality: 0.15,
  explore_batch_size: 100,
  explore_max_per_author: 2,
  reels_weight_interest: 0.30,
  reels_weight_engagement: 0.40,
  reels_weight_recency: 0.20,
  reels_batch_size: 60,
  verified_boost: 0.3,
  official_boost: 0.2,
  creator_boost: 0.15,
  profile_lookback_days: 30,
  enabled: true,
};

let cachedConfig: AlgorithmConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000;

export function getDefaultConfig(): AlgorithmConfig {
  return { ...DEFAULT_CONFIG };
}

export async function getAlgorithmConfig(db: SupabaseClient, _settingsDb?: SupabaseClient): Promise<AlgorithmConfig> {
  const settingsDb = _settingsDb || db;
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }
  try {
    const { data } = await settingsDb
      .from("platform_settings")
      .select("key, value")
      .like("key", "algo_%");

    const config = { ...DEFAULT_CONFIG };
    if (data) {
      for (const row of data) {
        const field = row.key.replace("algo_", "") as keyof AlgorithmConfig;
        if (field in config) {
          if (field === "enabled") {
            (config as any)[field] = row.value === "true";
          } else {
            (config as any)[field] = parseFloat(row.value);
          }
        }
      }
    }
    cachedConfig = config;
    cacheTime = Date.now();
    return config;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function clearConfigCache() {
  cachedConfig = null;
  cacheTime = 0;
}

function shuffleWithinBands(items: ScoredPost[], bandSize: number = 3): ScoredPost[] {
  if (items.length <= 1) return items;
  const result = [...items];
  const seed = Date.now() + Math.random() * 1000000;
  for (let i = 0; i < result.length; i += bandSize) {
    const end = Math.min(i + bandSize, result.length);
    for (let j = end - 1; j > i; j--) {
      const x = Math.sin(seed * (j + 1) * 9301 + 49297) * 10000;
      const r = Math.abs(x - Math.floor(x));
      const k = i + Math.floor(r * (j - i + 1));
      [result[j], result[k]] = [result[k], result[j]];
    }
  }
  return result;
}

const POST_SELECT = `
  id, user_id, caption, image_url, location,
  likes_count, comments_count, views_count,
  hide_likes, replies_disabled, is_archived, is_pinned, is_featured,
  created_at, updated_at,
  profile:profiles!posts_user_id_fkey(
    id, username, full_name, avatar_url, bio,
    is_verified, is_official, is_creator, is_premium,
    is_popular, is_active, is_private, is_featured,
    is_gold_early_member, is_silver_early_member, is_bronze_early_member,
    is_beta_tester, is_bug_hunter,
    followers_count, following_count
  )
`;

async function buildUserInterestProfile(
  db: SupabaseClient,
  userId: string,
  lookbackDays: number = 30
): Promise<UserInterestProfile> {
  const thirtyDaysAgo = new Date(Date.now() - lookbackDays * 86400000).toISOString();

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
  limit: number = 20,
  settingsDb?: SupabaseClient
): Promise<any[]> {
  const config = await getAlgorithmConfig(db, settingsDb);

  const [profile, followingRes] = await Promise.all([
    buildUserInterestProfile(db, userId, config.profile_lookback_days),
    db.from("follows")
      .select("following_id")
      .eq("follower_id", userId),
  ]);

  const followingIds = new Set(
    (followingRes.data || []).map((f: any) => f.following_id)
  );
  followingIds.add(userId);

  if (!config.enabled) {
    const { data: chronoPosts } = await db
      .from("posts")
      .select(POST_SELECT)
      .eq("is_archived", false)
      .eq("is_deleted", false)
      .in("user_id", [...followingIds])
      .order("created_at", { ascending: false })
      .range(page * limit, page * limit + limit - 1);
    return chronoPosts || [];
  }

  const batchSize = config.feed_batch_size;
  const { data: posts, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .in("user_id", [...followingIds])
    .order("created_at", { ascending: false })
    .range(0, batchSize - 1);

  if (error || !posts) return [];

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
    if (p?.is_verified) boostScore += config.verified_boost;
    if (p?.is_official) boostScore += config.official_boost;
    if (p?.is_creator) boostScore += config.creator_boost;
    if (post.is_pinned) {
      boostScore += 0.5;
      reasons.push("pinned");
    }
    if (post.is_featured) {
      boostScore += 0.25;
      reasons.push("featured_post");
    }
    if (p?.is_featured) {
      boostScore += 0.2;
      reasons.push("featured_account");
    }
    boostScore = Math.min(boostScore, 1);

    const finalScore =
      authorScore * config.feed_weight_author +
      interestScore * config.feed_weight_interest +
      engagementScore * config.feed_weight_engagement +
      recencyScore * config.feed_weight_recency +
      boostScore * config.feed_weight_boost;

    return { ...post, _score: finalScore, _reasons: reasons };
  });

  scored.sort((a, b) => b._score - a._score);
  const diversified = shuffleWithinBands(applyDiversityPenalty(scored, config.feed_max_per_author), 4);

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
  limit: number = 30,
  settingsDb?: SupabaseClient
): Promise<any[]> {
  const config = await getAlgorithmConfig(db, settingsDb);

  if (!config.enabled) {
    const { data: chronoPosts } = await db
      .from("posts")
      .select(POST_SELECT)
      .eq("is_archived", false)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(0, limit - 1);
    return chronoPosts || [];
  }

  const [profile, followingRes] = await Promise.all([
    buildUserInterestProfile(db, userId, config.profile_lookback_days),
    db.from("follows")
      .select("following_id")
      .eq("follower_id", userId),
  ]);

  const followingIds = new Set(
    (followingRes.data || []).map((f: any) => f.following_id)
  );
  followingIds.add(userId);

  const batchSize = config.explore_batch_size;
  const { data: posts, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(0, batchSize - 1);

  if (error) {
    console.error("🔍 Explore query error:", error.message);
    return [];
  }
  if (!posts) return [];

  const ownPosts = posts.filter((p: any) => p.user_id !== userId);

  console.log(`🔍 Explore: fetched ${posts.length} posts, showing ${ownPosts.length} (excluded own)`);

  const scored: ScoredPost[] = ownPosts.map((post: any) => {
    const reasons: string[] = [];

    const interestScore = calculateInterestScore(profile, post.caption);
    if (interestScore > 0.3) reasons.push("matches_interests");

    const engagementScore = calculateEngagementScore(post);
    if (engagementScore > 0.5) reasons.push("trending");

    const recencyScore = calculateRecencyScore(post.created_at);

    let qualityScore = 0;
    const p = post.profile;
    if (p?.is_verified) qualityScore += config.verified_boost + 0.1;
    if (p?.is_official) qualityScore += config.official_boost + 0.1;
    if (p?.is_creator) qualityScore += config.creator_boost + 0.05;
    if ((p?.followers_count || 0) > 10) qualityScore += 0.1;
    if (post.is_featured) {
      qualityScore += 0.25;
      reasons.push("featured_post");
    }
    if (p?.is_featured) {
      qualityScore += 0.2;
      reasons.push("featured_account");
    }
    qualityScore = Math.min(qualityScore, 1);

    const finalScore =
      interestScore * config.explore_weight_interest +
      engagementScore * config.explore_weight_engagement +
      recencyScore * config.explore_weight_recency +
      qualityScore * config.explore_weight_quality;

    return { ...post, _score: finalScore, _reasons: reasons };
  });

  scored.sort((a, b) => b._score - a._score);
  const diversified = shuffleWithinBands(applyDiversityPenalty(scored, config.explore_max_per_author), 5);
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
  limit: number = 20,
  settingsDb?: SupabaseClient,
  offset: number = 0
): Promise<any[]> {
  const config = await getAlgorithmConfig(db, settingsDb);

  const REEL_SELECT = `
    id, user_id, video_url, thumbnail_url, caption,
    likes_count, comments_count, views_count, is_featured, created_at,
    profile:profiles!reels_user_id_fkey(
      id, username, avatar_url, is_verified, is_official, is_featured, followers_count
    )
  `;

  if (!config.enabled) {
    const { data: chronoReels } = await db
      .from("reels")
      .select(REEL_SELECT)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(0, limit - 1);
    return chronoReels || [];
  }

  const [profile, followingRes] = await Promise.all([
    buildUserInterestProfile(db, userId, config.profile_lookback_days),
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
    .select(REEL_SELECT)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(0, config.reels_batch_size);

  if (error || !reels) return [];

  const allReels = reels.filter((r: any) => r.user_id !== userId);

  const scored: ScoredPost[] = allReels.map((reel: any) => {
    const interestScore = calculateInterestScore(profile, reel.caption);
    const engagementScore = calculateEngagementScore(reel);
    const recencyScore = calculateRecencyScore(reel.created_at);

    let boostScore = 0;
    if (reel.profile?.is_verified) boostScore += config.verified_boost * 0.33;
    if (reel.is_featured) boostScore += 0.25;
    if (reel.profile?.is_featured) boostScore += 0.2;
    boostScore = Math.min(boostScore, 1);

    const finalScore =
      interestScore * config.reels_weight_interest +
      engagementScore * config.reels_weight_engagement +
      recencyScore * config.reels_weight_recency +
      boostScore * 0.15;

    return { ...reel, _score: finalScore, _reasons: [] };
  });

  scored.sort((a: any, b: any) => b._score - a._score);
  const shuffled = shuffleWithinBands(scored, 4);
  return shuffled.slice(offset, offset + limit).map(({ _score, _reasons, ...reel }) => reel);
}
