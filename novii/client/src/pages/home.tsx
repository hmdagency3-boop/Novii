import Layout from "@/components/layout";
import StoryBar from "@/components/story-bar";
import PostCard from "@/components/post-card";
import { CreateStoryModal } from "@/components/create-story-modal";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { useFeed, useStories, useCurrentProfile, useFollowing } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { toast } from "sonner";
import { Heart, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useSettings } from "@/lib/settings-context";

export default function Home() {
  const { data: posts, isLoading: postsLoading, refetch: refetchFeed } = useFeed();
  const { data: stories, isLoading: storiesLoading } = useStories();
  const { data: currentUser } = useCurrentProfile();
  const { data: followingUsers = [] } = useFollowing(currentUser?.id || '');
  const { blockedIds, mutedIds, favoriteIds, closeFriendIds } = useSettings();
  const [location] = useLocation();
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  
  // Filter stories for selected user
  const userStories = useMemo(() => {
    if (!selectedUserId || !stories || stories.length === 0) {
      return [];
    }
    const filtered = stories.filter(story => story.user_id === selectedUserId);
    console.log('📖 userStories filtered:', { selectedUserId, totalStories: stories.length, filteredStories: filtered.length, filtered });
    return filtered;
  }, [selectedUserId, stories]);



  // Listen for double-click on Home icon to refresh feed
  useEffect(() => {
    const handleDoubleClickHome = async () => {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setIsRefreshing(true);
      try {
        await refetchFeed();
      } catch (error) {
        toast.error(isRTL ? "حدث خطأ" : "Error refreshing");
      } finally {
        setIsRefreshing(false);
      }
    };

    window.addEventListener('doubleClickHome', handleDoubleClickHome);
    return () => window.removeEventListener('doubleClickHome', handleDoubleClickHome);
  }, [refetchFeed, isRTL]);

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
      {/* Refresh Loading Bar at Top */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-background/10">
          <div 
            className="h-full bg-gradient-to-r from-primary via-purple-400 to-primary"
            style={{
              animation: 'loadingBar 1.5s ease-in-out infinite',
              width: '30%',
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      )}

      {/* Restrict width for Home Feed to standard size */}
      <div className="flex flex-col gap-2 sm:gap-4 lg:gap-6 lg:pt-6 w-full px-0 sm:px-2 max-w-full lg:max-w-[630px] mx-auto">
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
          ) : posts && posts.length > 0 ? (
            [...posts]
              .filter(post => !blockedIds.has(post.user_id) && !mutedIds.has(post.user_id))
              .sort((a, b) => {
                const aFav = favoriteIds.has(a.user_id) ? 1 : 0;
                const bFav = favoriteIds.has(b.user_id) ? 1 : 0;
                if (aFav !== bFav) return bFav - aFav;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              })
              .map(post => (
              <PostCard key={post.id} post={post} />
            ))
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
