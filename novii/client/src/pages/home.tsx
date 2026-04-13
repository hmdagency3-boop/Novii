import Layout from "@/components/layout";
import StoryBar from "@/components/story-bar";
import PostCard from "@/components/post-card";
import { CreateStoryModal } from "@/components/create-story-modal";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { useInfiniteFeed, useStories, useCurrentProfile, useFollowing } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { toast } from "sonner";
import { Heart, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useSettings } from "@/lib/settings-context";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const queryClient = useQueryClient();
  const [feedSeed, setFeedSeed] = useState<number>(() => Date.now());
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const {
    data: infiniteData,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFeed(feedSeed);
  const { data: stories, isLoading: storiesLoading } = useStories();
  const { data: currentUser } = useCurrentProfile();
  const { data: followingUsers = [] } = useFollowing(currentUser?.id || '');
  const { blockedIds, mutedIds, favoriteIds, closeFriendIds } = useSettings();
  const [location] = useLocation();
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const sentinelRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Flatten all pages into one array
  const posts = useMemo(
    () => infiniteData?.pages.flat() ?? [],
    [infiniteData]
  );

  // IntersectionObserver — load next page when sentinel enters view
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);
  
  // Filter stories for selected user
  const userStories = useMemo(() => {
    if (!selectedUserId || !stories || stories.length === 0) {
      return [];
    }
    const filtered = stories.filter(story => story.user_id === selectedUserId);
    console.log('📖 userStories filtered:', { selectedUserId, totalStories: stories.length, filteredStories: filtered.length, filtered });
    return filtered;
  }, [selectedUserId, stories]);



  // Listen for double-click on Home icon → pull-down animation + algorithmic refresh
  useEffect(() => {
    const handleDoubleClickHome = async () => {
      if (isPullRefreshing) return;

      // Scroll to top first
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger pull-down animation
      setIsPullRefreshing(true);
      if (feedRef.current) {
        feedRef.current.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        feedRef.current.style.transform  = 'translateY(64px)';
      }

      // Wait for animation, then swap seed (triggers new algorithmic fetch)
      await new Promise(r => setTimeout(r, 420));
      const newSeed = Date.now();
      // Remove old query cache so fresh data is fetched
      queryClient.removeQueries({ queryKey: ['feed-infinite'] });
      setFeedSeed(newSeed);

      // Animate back up
      await new Promise(r => setTimeout(r, 600));
      if (feedRef.current) {
        feedRef.current.style.transition = 'transform 0.4s ease';
        feedRef.current.style.transform  = 'translateY(0)';
      }
      setIsPullRefreshing(false);
    };

    window.addEventListener('doubleClickHome', handleDoubleClickHome);
    return () => window.removeEventListener('doubleClickHome', handleDoubleClickHome);
  }, [isPullRefreshing, queryClient, feedSeed]);

  // Empty Feed State Component
  const EmptyFeedState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
        <Heart className="w-10 h-10 text-primary/60" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">{isRTL ? 'لا توجد منشورات بعد' : 'No Posts Yet'}</h3>
        <p className="text-muted-foreground max-w-md">
          {isRTL 
            ? 'ابدأ بمتابعة مستخدمين آخرين لرؤية منشوراتهم، أو أنشئ منشورك الأول!'
            : 'Start following users to see their posts, or create your first post!'}
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/explore">
          <a className="text-primary hover:text-primary/80 font-semibold flex items-center gap-2 transition-colors">
            {isRTL ? 'استكشاف' : 'Explore'} <ArrowRight className="w-4 h-4" />
          </a>
        </Link>
        <span className="text-muted-foreground">•</span>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openPostModal'))}
          className="text-primary hover:text-primary/80 font-semibold flex items-center gap-2 transition-colors"
        >
          {isRTL ? 'إنشاء منشور' : 'Create Post'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Pull-down refresh spinner */}
      <div
        className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{
          top: '56px',
          transform: isPullRefreshing ? 'translateY(0)' : 'translateY(-80px)',
          opacity: isPullRefreshing ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        }}
      >
        <div className="w-10 h-10 rounded-full bg-background shadow-lg border border-border flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>

      {/* Restrict width for Home Feed to standard size */}
      <div ref={feedRef} className="flex flex-col gap-0 sm:gap-4 lg:gap-6 lg:pt-6 w-full px-0 sm:px-2 max-w-full lg:max-w-[630px] mx-auto">
        {storiesLoading ? (
          <div className="flex gap-4 p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-full" />
            ))}
          </div>
        ) : (
          <StoryBar 
            stories={(stories || []).filter(s => !blockedIds.has(s.user_id) && !mutedIds.has(s.user_id))} 
            followingUsers={followingUsers}
            currentUserAvatar={currentUser?.avatar_url || ""}
            currentUserId={currentUser?.id}
            closeFriendIds={closeFriendIds}
            isRTL={isRTL}
            onAddStoryClick={() => setIsCreateStoryModalOpen(true)}
            onStoryClick={(userId) => {
              console.log('🏠 Home - Story clicked for user:', userId);
              setSelectedUserId(userId);
              setIsStoryViewerOpen(true);
            }}
            onViewOwnStories={() => {
              console.log('🏠 Home - View own stories');
              setSelectedUserId(currentUser?.id || null);
              setIsStoryViewerOpen(true);
            }}
          />
        )}
        
        <div className="flex flex-col items-center w-full">
          {postsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="w-full mb-4 p-4 border-b">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="w-full h-96 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : posts.length > 0 ? (
            <>
              {[...posts]
                .filter(post => !blockedIds.has(post.user_id) && !mutedIds.has(post.user_id))
                .sort((a, b) => {
                  const aFav = favoriteIds.has(a.user_id) ? 1 : 0;
                  const bFav = favoriteIds.has(b.user_id) ? 1 : 0;
                  if (aFav !== bFav) return bFav - aFav;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="w-full h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-6 w-full">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
              {!hasNextPage && posts.length > 0 && (
                <p className="text-muted-foreground text-sm py-6">
                  {isRTL ? 'وصلت لآخر المنشورات' : 'You\'re all caught up!'}
                </p>
              )}
            </>
          ) : (
            <EmptyFeedState />
          )}
        </div>
      </div>

      {/* Create Story Modal */}
      <CreateStoryModal
        open={isCreateStoryModalOpen}
        onOpenChange={setIsCreateStoryModalOpen}
        isRTL={isRTL}
      />

      {/* Story Viewer Modal */}
      {userStories && userStories.length > 0 && (
        <StoryViewerModal
          stories={userStories}
          initialIndex={0}
          open={isStoryViewerOpen}
          onOpenChange={setIsStoryViewerOpen}
          isRTL={isRTL}
        />
      )}
    </Layout>
  );
}
