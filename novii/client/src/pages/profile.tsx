import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Settings, Grid3X3, Bookmark, UserSquare2, Heart, MessageCircle, Lock, Shield, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { VerifiedUsername } from "@/components/ui/verified-username";
import { OfficialBadge } from "@/components/ui/official-badge";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";
import { GoldMemberBadge } from "@/components/ui/gold-member-badge";
import { SilverMemberBadge } from "@/components/ui/silver-member-badge";
import { BronzeMemberBadge } from "@/components/ui/bronze-member-badge";
import { BetaTesterBadge } from "@/components/ui/beta-tester-badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { FollowersDialog } from "@/components/followers-dialog";
import { PostViewerModal } from "@/components/post-viewer-modal";
import { ReelViewerModal } from "@/components/reel-viewer-modal";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUserStories } from "@/hooks/use-data";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { REEL_COLUMNS, PROFILE_CARD } from "@/lib/query-columns";
import { ProfileShareModal } from "@/components/profile-share-modal";

export default function Profile() {
  const { user } = useAuth();
  const { direction } = useLanguage();
  const [, setLocation] = useLocation();
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followersDialogTab, setFollowersDialogTab] = useState<"followers" | "following">("followers");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [reelModalOpen, setReelModalOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const isRTL = direction === "rtl";
  const queryClient = useQueryClient();
  
  // Track online status
  useOnlineStatus();

  // Track mobile size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch current user profile with stale time and refetch on mount
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.getCurrentProfile(),
    enabled: !!user,
    staleTime: 0,  // Mark as stale immediately
    gcTime: 1000 * 60 * 5,  // Keep in cache for 5 minutes but always fetch fresh data
  });

  // Force refetch on component mount
  useEffect(() => {
    if (user?.id) {
      refetchProfile();
    }
  }, [user?.id, refetchProfile]);

  // Log profile data including badges
  useEffect(() => {
    if (profile) {
      console.log('🏆 Profile badges data:', {
        is_gold_early_member: profile.is_gold_early_member,
        is_silver_early_member: profile.is_silver_early_member,
        is_bronze_early_member: profile.is_bronze_early_member,
        is_beta_tester: profile.is_beta_tester,
        full_profile: profile
      });
    }
  }, [profile]);

  // Check if user is admin
  const { data: isAdmin = false } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch user posts
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: () => user ? api.getUserPosts(user.id) : [],
    enabled: !!user,
  });

  // Fetch saved posts
  const { data: savedPosts = [], isLoading: savedLoading } = useQuery({
    queryKey: ['savedPosts', user?.id],
    queryFn: () => api.getSavedPosts(),
    enabled: !!user,
  });

  // Fetch user reels
  const { data: userReels = [], isLoading: reelsLoading } = useQuery({
    queryKey: ['userReels', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('reels')
        .select(`${REEL_COLUMNS}, user:profiles(${PROFILE_CARD})`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!data) return [];
      
      // Calculate is_liked for each reel
      const { data: likedReelIds } = await supabase
        .from('likes')
        .select('reel_id')
        .eq('user_id', user.id)
        .in('reel_id', data.map(r => r.id));
      
      const likedIds = new Set(likedReelIds?.map(l => l.reel_id) || []);
      
      return data.map(reel => ({
        ...reel,
        is_liked: likedIds.has(reel.id),
      }));
    },
    enabled: !!user,
  });

  // Fetch user stories
  const { data: userStories = [], isLoading: storiesLoading } = useUserStories(user?.id || '');
  
  // Debug log
  useEffect(() => {
    console.log('📖 Profile - User ID:', user?.id);
    console.log('📖 Profile - User Stories:', userStories);
    console.log('📖 Profile - Stories Loading:', storiesLoading);
  }, [user?.id, userStories, storiesLoading]);

  // Listen for double-click on Profile icon to refresh profile data
  useEffect(() => {
    const handleDoubleClickProfile = async () => {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setIsRefreshing(true);
      try {
        await Promise.all([
          refetchProfile(),
          queryClient.refetchQueries({ queryKey: ['userPosts', user?.id] }),
          queryClient.refetchQueries({ queryKey: ['savedPosts', user?.id] }),
          queryClient.refetchQueries({ queryKey: ['userReels', user?.id] }),
          queryClient.refetchQueries({ queryKey: ['userStories', user?.id] })
        ]);
      } catch (error) {
        toast.error(isRTL ? "حدث خطأ" : "Error refreshing");
      } finally {
        setIsRefreshing(false);
      }
    };

    window.addEventListener('doubleClickProfile', handleDoubleClickProfile);
    return () => window.removeEventListener('doubleClickProfile', handleDoubleClickProfile);
  }, [refetchProfile, queryClient, user?.id, isRTL]);

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-8 h-8" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </Layout>
    );
  } 

  const isOfficialProfile = profile?.is_official;

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

      <div className={cn(
        "flex flex-col w-full min-h-screen bg-background relative",
        isOfficialProfile && "before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-purple-500 before:to-transparent before:opacity-60"
      )}>
        
        {/* Profile Header - Responsive Layout */}
        <div className="w-full px-3 sm:px-4 lg:px-0 lg:max-w-6xl lg:mx-auto py-4 sm:py-6 lg:py-8 animate-in fade-in duration-500 relative z-10">
          {/* Unified Layout - Avatar and Info - Mobile: Left-Right, Desktop: Left-Right with more space */}
          <div className="flex flex-row gap-4 md:gap-16 items-start w-full">
            {/* Avatar */}
            <div 
              className={cn(
                "relative group cursor-pointer shrink-0",
                isOfficialProfile && "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-purple-500 before:to-pink-500 before:opacity-30 before:blur-xl md:before:blur-2xl before:-z-10 before:animate-pulse"
              )}
              onClick={() => {
                console.log('🖱️ Clicked avatar - stories:', userStories.length);
                if (userStories.length > 0) setStoryViewerOpen(true);
                else console.log('❌ No stories to display');
              }}
            >
              <div className={cn(
                "w-28 h-28 md:w-48 md:h-48 rounded-full p-1 shadow-xl group-hover:scale-105 transition-transform duration-300",
                isOfficialProfile
                  ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 ring-2 ring-purple-400/50 md:ring-purple-400/60"
                  : "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500"
              )}>
                <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-background">
                  <img 
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                    alt={profile.username} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col gap-2 md:gap-5 text-left min-w-0">
              {/* Full Name for Mobile - Above Username */}
              <div className="md:hidden">
                <div className="font-semibold text-sm truncate">{profile.full_name || profile.username}</div>
              </div>

              {/* Username and Verified Badge */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h1 className="text-lg md:text-3xl font-display">
                  <VerifiedUsername
                    username={profile.username}
                    isVerified={profile.is_verified}
                  />
                </h1>
                <div className="flex items-center gap-1">
                  {profile.is_verified && <VerifiedBadge size={isMobile ? "sm" : "lg"} verifiedAt={profile.verified_at} />}
                  {profile.is_official && <OfficialBadge size={isMobile ? "sm" : "lg"} showText={!isMobile} />}
                </div>
              </div>

              {/* Other Badges */}
              <div className="flex items-center gap-1 flex-wrap">
                {profile.is_creator && <CreatorBadge size={isMobile ? "xs" : "md"} />}
                {profile.is_premium && <PremiumBadge size={isMobile ? "xs" : "md"} />}
                {profile.is_popular && <PopularBadge size={isMobile ? "xs" : "md"} />}
                {!isMobile && profile.is_active && <ActiveBadge size="md" />}
              </div>

              {/* Stats Panel */}
              <div className="flex flex-col gap-4 pt-2 md:pt-4">
                <div className={cn(
                  "flex items-center gap-6 md:gap-10",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  <div className={isMobile ? "flex flex-col items-center" : "flex flex-col items-start gap-1"}>
                    <span className={isMobile ? "font-bold" : "text-2xl font-bold"}>{profile.posts_count}</span>
                    <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>{isRTL ? "منشور" : "posts"}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (isMobile) {
                        setLocation(`/followers-detail?id=${profile.id}&username=${profile.username}&tab=followers`);
                      } else {
                        setFollowersDialogTab("followers");
                        setFollowersDialogOpen(true);
                      }
                    }}
                    className={cn("hover:opacity-70 transition-opacity", isMobile ? "flex flex-col items-center" : "flex flex-col items-start gap-1")}
                  >
                    <span className={isMobile ? "font-bold" : "text-2xl font-bold"}>{profile.followers_count}</span>
                    <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>{isRTL ? "متابع" : "followers"}</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (isMobile) {
                        setLocation(`/followers-detail?id=${profile.id}&username=${profile.username}&tab=following`);
                      } else {
                        setFollowersDialogTab("following");
                        setFollowersDialogOpen(true);
                      }
                    }}
                    className={cn("hover:opacity-70 transition-opacity", isMobile ? "flex flex-col items-center" : "flex flex-col items-start gap-1")}
                  >
                    <span className={isMobile ? "font-bold" : "text-2xl font-bold"}>{profile.following_count}</span>
                    <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>{isRTL ? "متابَع" : "following"}</span>
                  </button>
                </div>

                {/* Display member medals under stats */}
                {(profile.is_gold_early_member || profile.is_silver_early_member || profile.is_bronze_early_member || profile.is_beta_tester) && (
                  <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-border">
                    {profile.is_gold_early_member && <GoldMemberBadge size={isMobile ? "xs" : "md"} iconOnly />}
                    {profile.is_silver_early_member && <SilverMemberBadge size={isMobile ? "xs" : "md"} iconOnly />}
                    {profile.is_bronze_early_member && <BronzeMemberBadge size={isMobile ? "xs" : "md"} iconOnly />}
                    {profile.is_beta_tester && <BetaTesterBadge size={isMobile ? "xs" : "md"} iconOnly />}
                  </div>
                )}

                {/* Buttons - Below Stats */}
                <div className="flex gap-1 md:gap-2 pt-3 md:pt-4">
                  <EditProfileDialog profile={profile} onProfileUpdate={() => refetchProfile()}>
                    <Button variant="secondary" className={cn(
                      "font-semibold rounded-lg hover:bg-muted",
                      isMobile ? "h-8 px-4 text-sm flex-1" : "h-9 px-8"
                    )}>
                      {isRTL ? (isMobile ? "تعديل" : "تعديل الملف") : (isMobile ? "Edit" : "Edit Profile")}
                    </Button>
                  </EditProfileDialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isMobile ? "h-8 w-8" : "h-9 w-9"}
                    onClick={() => setShareModalOpen(true)}
                    title={isRTL ? "مشاركة الملف الشخصي" : "Share Profile"}
                  >
                    <QrCode className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                  </Button>
                  <Link href="/settings">
                    <Button variant="ghost" size="icon" className={isMobile ? "h-8 w-8" : "h-9 w-9"}>
                      <Settings className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "hover:bg-purple-500/20 text-purple-500",
                        isMobile ? "h-8 w-8" : "h-9 w-9"
                      )}
                      onClick={() => setLocation("/admin")}
                      title={isRTL ? "لوحة التحكم" : "Admin Panel"}
                    >
                      <Shield className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio Section - Desktop Only */}
              <div className="hidden md:block space-y-2 max-w-lg">
                <div className="font-semibold text-base">{profile.full_name || profile.username}</div>
                {profile.bio && (
                  <div className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">{profile.bio}</div>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block font-medium">
                    {profile.website}
                  </a>
                )}
                {profile.location && (
                  <div className="text-sm text-muted-foreground">{profile.location}</div>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section - Mobile Only (Below everything) */}
          <div className="md:hidden space-y-2 text-left pt-4">
            {profile.bio && (
              <div className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">{profile.bio}</div>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block font-medium">
                {profile.website}
              </a>
            )}
            {profile.location && (
              <div className="text-sm text-muted-foreground">{profile.location}</div>
            )}
          </div>
        </div>

        {/* Tabs & Grid */}
        <div className="flex-1 border-t border-border overflow-hidden">
            <Tabs defaultValue="posts" className="w-full h-full flex flex-col">
                <div className="border-b border-border">
                    <TabsList className="h-12 bg-transparent gap-0.5 md:gap-8 w-full justify-center">
                        <TabsTrigger value="posts" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-2.5 md:px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none whitespace-nowrap flex-1 md:flex-none">
                            <Grid3X3 className="w-4 h-4" /> POSTS
                        </TabsTrigger>
                        <TabsTrigger value="reels" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-2.5 md:px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none whitespace-nowrap flex-1 md:flex-none">
                            <Heart className="w-4 h-4" /> REELS
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-2.5 md:px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none whitespace-nowrap flex-1 md:flex-none">
                            <Bookmark className="w-4 h-4" /> SAVED
                        </TabsTrigger>
                        <TabsTrigger value="tagged" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-2.5 md:px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none whitespace-nowrap flex-1 md:flex-none">
                            <UserSquare2 className="w-4 h-4" /> TAGGED
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="posts" className="p-1 md:p-4 max-w-4xl mx-auto mt-0 overflow-y-auto flex-1">
                    {postsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner className="w-6 h-6" />
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Grid3X3 className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Posts Yet</h3>
                        <p className="text-muted-foreground">Start sharing your moments!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1 md:gap-4">
                        {userPosts.map((post) => (
                            <div 
                              key={post.id} 
                              onClick={() => {
                                setSelectedPost(post);
                                setPostModalOpen(true);
                              }}
                              className="relative aspect-square group cursor-pointer overflow-hidden bg-muted rounded-sm md:rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300">
                                {post.image_url ? (
                                  <img src={post.image_url} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-90" alt="Post" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Grid3X3 className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 text-white font-semibold">
                                    <div className="flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                      <Heart className="w-5 h-5 fill-white" /> 
                                      <span>{post.likes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                      <MessageCircle className="w-5 h-5 fill-white" /> 
                                      <span>{post.comments_count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="reels" className="p-2 md:p-4 max-w-4xl mx-auto mt-0 overflow-y-auto flex-1">
                    {reelsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner className="w-6 h-6" />
                      </div>
                    ) : userReels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Reels Yet</h3>
                        <p className="text-muted-foreground">Create your first reel!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                        {userReels.map((reel: any) => (
                            <div 
                              key={reel.id} 
                              onClick={() => {
                                setSelectedReel(reel);
                                setReelModalOpen(true);
                              }}
                              className="relative aspect-[9/16] group cursor-pointer overflow-hidden bg-black rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                                <video 
                                  src={reel.video_url} 
                                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-75"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-white font-semibold">
                                  <Heart className="w-10 h-10 fill-white" />
                                </div>
                                {reel.caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 text-white text-sm line-clamp-3">
                                    {reel.caption}
                                  </div>
                                )}
                            </div>
                        ))}
                      </div>
                    )}
                </TabsContent>
                
                <TabsContent value="saved" className="p-1 md:p-4 max-w-4xl mx-auto mt-0 overflow-y-auto flex-1">
                    {savedLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner className="w-6 h-6" />
                      </div>
                    ) : savedPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Saved Posts</h3>
                        <p className="text-muted-foreground">Save posts to view them later</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1 md:gap-4">
                        {savedPosts.map((post) => (
                            <div 
                              key={post.id}
                              onClick={() => {
                                setSelectedPost(post);
                                setPostModalOpen(true);
                              }}
                              className="relative aspect-square group cursor-pointer overflow-hidden bg-muted rounded-sm md:rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300">
                                {post.image_url ? (
                                  <img src={post.image_url} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-90" alt="Post" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Grid3X3 className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 text-white font-semibold">
                                    <div className="flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                      <Heart className="w-5 h-5 fill-white" /> 
                                      <span>{post.likes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                      <MessageCircle className="w-5 h-5 fill-white" /> 
                                      <span>{post.comments_count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                      </div>
                    )}
                </TabsContent>
                
                <TabsContent value="tagged" className="p-1 md:p-4 max-w-4xl mx-auto mt-0 overflow-y-auto flex-1">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <UserSquare2 className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">No Tagged Posts</h3>
                      <p className="text-muted-foreground">Posts you're tagged in will appear here</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

      </div>

      {/* Followers Dialog */}
      {profile && user && (
        <FollowersDialog
          open={followersDialogOpen}
          onOpenChange={setFollowersDialogOpen}
          userId={profile.id}
          username={profile.username}
          initialTab={followersDialogTab}
          currentUserId={user.id}
        />
      )}

      {/* Post Viewer Modal */}
      <PostViewerModal
        post={selectedPost}
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
        isRTL={isRTL}
      />

      {/* Reel Viewer Modal */}
      <ReelViewerModal
        reel={selectedReel}
        open={reelModalOpen}
        onOpenChange={setReelModalOpen}
        allReels={userReels as any}
        onNavigate={setSelectedReel}
      />

      {/* Story Viewer Modal */}
      {userStories && userStories.length > 0 && (
        <StoryViewerModal
          stories={userStories}
          initialIndex={0}
          open={storyViewerOpen}
          onOpenChange={setStoryViewerOpen}
          isRTL={isRTL}
        />
      )}

      {/* Profile Share Modal */}
      {profile && user && (
        <ProfileShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          username={profile.username}
          userId={user.id}
          avatarUrl={profile.avatar_url ?? undefined}
          fullName={profile.full_name ?? undefined}
        />
      )}
    </Layout>
  );
}
