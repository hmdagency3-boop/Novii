import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Loader2, Grid3X3, Users, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useCurrentUser, useIsFollowing, useToggleFollow, useStories } from "@/hooks/use-data";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { StoryViewerModal } from "./story-viewer-modal";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function UserHoverCard({ userId, children, disabled = false }: UserHoverCardProps) {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { data: currentUser } = useCurrentUser();
  const isOwnProfile = currentUser?.id === userId;
  const { data: isFollowing = false } = useIsFollowing(userId);
  const toggleFollow = useToggleFollow();
  const [showStories, setShowStories] = useState(false);

  /* ── Fetch profile (cached 5 min) ── */
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['hover-profile', userId],
    queryFn: () => api.getProfileById(userId),
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });

  /* ── Fetch 3 recent post thumbnails ── */
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['hover-posts', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('id, image_url')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });

  /* ── Story status: use cached global stories first, then lightweight check ── */
  const { data: globalStories = [] } = useStories();
  const cachedUserStories = globalStories.filter(s => s.user_id === userId);

  /* Lightweight DB check if user not found in global stories cache */
  const { data: storyCheck } = useQuery({
    queryKey: ['hover-story-status', userId, currentUser?.id],
    queryFn: async () => {
      const { data: stories } = await supabase
        .from('stories')
        .select('id')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString());

      if (!stories || stories.length === 0) return { hasStory: false, allViewed: true };

      const storyIds = stories.map(s => s.id);
      if (!currentUser?.id) return { hasStory: true, allViewed: false };

      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('user_id', currentUser.id)
        .in('story_id', storyIds);

      const viewedSet = new Set((views || []).map((v: any) => v.story_id));
      return {
        hasStory: true,
        allViewed: storyIds.every(id => viewedSet.has(id)),
      };
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!userId && cachedUserStories.length === 0, // only query if not in global cache
  });

  /* Derive story ring state */
  const hasStory   = cachedUserStories.length > 0 || (storyCheck?.hasStory ?? false);
  const allViewed  = cachedUserStories.length > 0
    ? cachedUserStories.every(s => s.is_viewed)
    : (storyCheck?.allViewed ?? true);
  const hasUnviewed = hasStory && !allViewed;

  /* Full stories for viewer (fetched on click) */
  const { data: fullStories = [], refetch: fetchFullStories } = useQuery({
    queryKey: ['hover-full-stories', userId],
    queryFn: () => api.getUserStories(userId),
    staleTime: 3 * 60 * 1000,
    enabled: false, // fetch on demand
  });

  const handleAvatarClick = async (e: React.MouseEvent) => {
    if (!hasStory) return;
    e.preventDefault();
    e.stopPropagation();
    if (cachedUserStories.length > 0) {
      setShowStories(true);
    } else {
      await fetchFullStories();
      setShowStories(true);
    }
  };

  const storiesToShow = cachedUserStories.length > 0 ? cachedUserStories : fullStories;

  if (disabled) return <>{children}</>;

  return (
    <>
      <HoverCard openDelay={400} closeDelay={150}>
        <HoverCardTrigger asChild>
          <span className="cursor-pointer">{children}</span>
        </HoverCardTrigger>

        <HoverCardContent
          side="bottom"
          align="start"
          sideOffset={8}
          avoidCollisions
          collisionPadding={12}
          className={cn(
            "!z-[9999] w-[300px] p-0 rounded-2xl overflow-hidden shadow-2xl border border-border/60",
            "bg-card/95 backdrop-blur-xl",
            isRTL && "rtl"
          )}
        >
          {loadingProfile ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : profile ? (
            <>
              {/* ── Top section: avatar + info ── */}
              <div className="flex items-start justify-between p-4 pb-3">
                {/* Left: name, bio, stats */}
                <div className="flex-1 min-w-0 pr-3">
                  <Link href={`/user?id=${userId}`} className="flex items-center gap-1 flex-wrap mb-0.5 hover:opacity-80 transition-opacity">
                    <span className="font-bold text-[15px] text-foreground truncate max-w-[150px]">
                      {profile.username}
                    </span>
                    {profile.is_verified && <VerifiedBadge size="sm" verifiedAt={profile.verified_at} />}
                    {profile.is_official && <OfficialBadge size="sm" showText={false} />}
                  </Link>

                  {profile.full_name && (
                    <p className="text-xs text-muted-foreground truncate mb-1.5">{profile.full_name}</p>
                  )}

                  {profile.bio && (
                    <p className="text-[12px] text-foreground/80 line-clamp-2 leading-relaxed mb-3">
                      {profile.bio}
                    </p>
                  )}

                  <div className={cn("flex gap-4 text-center", !profile.bio && "mt-2")}>
                    <div>
                      <div className="text-[13px] font-bold leading-none">{formatCount(profile.posts_count || 0)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'منشورات' : 'Posts'}</div>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold leading-none">{formatCount((profile as any).followers_count || 0)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'متابعون' : 'Followers'}</div>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold leading-none">{formatCount((profile as any).following_count || 0)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'يتابع' : 'Following'}</div>
                    </div>
                  </div>
                </div>

                {/* Right: avatar with story ring */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className={cn(
                    "flex-shrink-0 rounded-full transition-opacity focus:outline-none",
                    hasStory ? "p-[2.5px] cursor-pointer hover:opacity-90" : "cursor-default",
                    hasStory && hasUnviewed && "bg-gradient-to-tr from-yellow-400 via-orange-500 to-primary",
                    hasStory && !hasUnviewed && "bg-border",
                  )}
                  disabled={!hasStory}
                >
                  {!hasStory ? (
                    <Link href={`/user?id=${userId}`} className="block">
                      <div className="w-[62px] h-[62px] rounded-full overflow-hidden border-2 border-primary/20">
                        <img
                          src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                          alt={profile.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                  ) : (
                    <div className="w-[62px] h-[62px] rounded-full border-[2.5px] border-card overflow-hidden">
                      <img
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </button>
              </div>

              {/* ── Recent posts thumbnails ── */}
              {recentPosts.length > 0 && (
                <div className="grid grid-cols-3 gap-0.5 mx-4 mb-3 rounded-xl overflow-hidden">
                  {recentPosts.map((p: any) => (
                    <Link key={p.id} href={`/post/${p.id}`}>
                      <div className="aspect-square bg-muted overflow-hidden hover:opacity-90 transition-opacity">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Grid3X3 className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - recentPosts.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-muted/50" />
                  ))}
                </div>
              )}

              {/* ── Action buttons ── */}
              {!isOwnProfile && (
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow.mutate(userId); }}
                    disabled={toggleFollow.isPending}
                    className={cn(
                      "flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5",
                      isFollowing
                        ? "bg-muted text-foreground hover:bg-muted/70 border border-border"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {toggleFollow.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <><UserCheck className="w-3.5 h-3.5" />{isRTL ? 'تتابعه' : 'Following'}</>
                    ) : (
                      <><Users className="w-3.5 h-3.5" />{isRTL ? 'متابعة' : 'Follow'}</>
                    )}
                  </button>
                  <Link
                    href="/messages"
                    className="flex-1 h-9 rounded-xl text-[13px] font-semibold bg-muted text-foreground hover:bg-muted/70 border border-border flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isRTL ? 'مراسلة' : 'Message'}
                  </Link>
                </div>
              )}

              {isOwnProfile && (
                <div className="px-4 pb-4">
                  <Link
                    href="/profile"
                    className="block w-full h-9 rounded-xl text-[13px] font-semibold bg-muted text-foreground hover:bg-muted/70 border border-border text-center leading-9 transition-all"
                  >
                    {isRTL ? 'عرض الملف الشخصي' : 'View Profile'}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {isRTL ? 'لا توجد بيانات' : 'No data found'}
            </div>
          )}
        </HoverCardContent>
      </HoverCard>

      {/* Story viewer */}
      {showStories && storiesToShow.length > 0 && (
        <StoryViewerModal
          stories={storiesToShow}
          initialIndex={0}
          open={showStories}
          onOpenChange={setShowStories}
          isRTL={isRTL}
        />
      )}
    </>
  );
}
