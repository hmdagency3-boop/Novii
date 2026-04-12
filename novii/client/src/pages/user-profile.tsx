import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Grid3X3, Bookmark, UserSquare2, Heart, MessageCircle, ArrowLeft, Lock, QrCode, MoreHorizontal, ShieldBan, VolumeX, ShieldAlert, Star, Users } from "lucide-react";
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
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getUserBadges } from "@/lib/badge-utils";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useState, useEffect } from "react";
import { FollowersDialog } from "@/components/followers-dialog";
import { PostViewerModal } from "@/components/post-viewer-modal";
import { ReelViewerModal } from "@/components/reel-viewer-modal";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { useToggleFollow, useUserStories } from "@/hooks/use-data";
import { OnlineIndicator } from "@/components/online-indicator";
import { supabase } from "@/lib/supabase";
import { ProfileShareModal } from "@/components/profile-share-modal";
import { useSettings } from "@/lib/settings-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function UserProfile() {
  const { user: currentUser } = useAuth();
  const { direction } = useLanguage();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followersDialogTab, setFollowersDialogTab] = useState<"followers" | "following">("followers");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postViewerOpen, setPostViewerOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [reelModalOpen, setReelModalOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [slideIn, setSlideIn] = useState(() => {
    const flag = sessionStorage.getItem("novii-qr-nav");
    if (flag) { sessionStorage.removeItem("novii-qr-nav"); return true; }
    return false;
  });

  const isRTL = direction === "rtl";
  const { isBlocked, isMuted, isRestricted, isCloseFriend, isFavorite, blockUser, unblockUser, muteUser, unmuteUser, restrictUser, unrestrictUser, addCloseFriend, removeCloseFriend, addFavorite, removeFavorite, settings } = useSettings();

  // Track mobile size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Get userId from URL query params - use window.location.search instead
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get('id');
  
  // Redirect to own profile only if no userId
  if (!userId) {
    setLocation('/profile');
    return null;
  }
  
  // Check if viewing own profile
  const isOwnProfile = userId === currentUser?.id;

  // Invalidate queries when userId changes
  useEffect(() => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
    }
  }, [userId, queryClient]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.getProfileById(userId),
    enabled: !!userId,
  });

  // Fetch user posts
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => api.getUserPosts(userId),
    enabled: !!userId,
  });

  // Fetch user reels
  const { data: userReels = [], isLoading: reelsLoading } = useQuery({
    queryKey: ['userReels', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Privacy gate
      if (currentUser && currentUser.id !== userId) {
        const { data: targetProf } = await supabase.from('profiles').select('is_private').eq('id', userId).single();
        if (targetProf?.is_private) {
          const { data: followCheck } = await supabase.from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', userId).single();
          if (!followCheck) return [];
        }
      }

      const { data } = await supabase
        .from('reels')
        .select('*, user:profiles(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!data) return [];
      
      // Calculate is_liked for each reel (for current user)
      if (currentUser?.id) {
        const { data: likedReelIds } = await supabase
          .from('likes')
          .select('reel_id')
          .eq('user_id', currentUser.id)
          .in('reel_id', data.map(r => r.id));
        
        const likedIds = new Set(likedReelIds?.map(l => l.reel_id) || []);
        
        return data.map(reel => ({
          ...reel,
          is_liked: likedIds.has(reel.id),
        }));
      }
      
      return data.map(reel => ({
        ...reel,
        is_liked: false,
      }));
    },
    enabled: !!userId,
  });

  // Check if following
  const { data: isFollowing, isLoading: followLoading } = useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: () => api.isFollowing(userId),
    enabled: !!userId && !!currentUser,
  });

  // Check if mutual follow (to show online indicator)
  const { data: isMutualFollow = false } = useQuery({
    queryKey: ['isMutualFollow', userId],
    queryFn: () => api.isMutualFollow(userId),
    enabled: !!userId && !!currentUser && !isOwnProfile,
  });

  // Check if I sent a follow request to them (outgoing)
  const { data: hasRequest = false } = useQuery({
    queryKey: ['hasFollowRequest', userId],
    queryFn: () => api.hasFollowRequest(userId),
    enabled: !!userId && !!currentUser && !isOwnProfile,
  });

  // Check if they sent a follow request to me (incoming)
  const { data: hasIncomingRequest = false } = useQuery({
    queryKey: ['hasIncomingFollowRequest', userId],
    queryFn: () => api.hasIncomingFollowRequest(userId),
    enabled: !!userId && !!currentUser && !isOwnProfile,
  });

  // Realtime: update follow-related state when follow_requests or follows change
  useEffect(() => {
    if (!userId || !currentUser) return;

    const invalidateFollow = () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['isMutualFollow', userId] });
      queryClient.invalidateQueries({ queryKey: ['hasFollowRequest', userId] });
      queryClient.invalidateQueries({ queryKey: ['hasIncomingFollowRequest', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    };

    const channel = supabase
      .channel(`profile-follow-${userId}-${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follow_requests',
        filter: `requester_id=eq.${userId}`,
      }, invalidateFollow)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follow_requests',
        filter: `recipient_id=eq.${userId}`,
      }, invalidateFollow)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `follower_id=eq.${userId}`,
      }, invalidateFollow)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${userId}`,
      }, invalidateFollow)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, currentUser?.id, queryClient]);

  // Fetch user stories
  const { data: userStories = [] } = useUserStories(userId || '');
  
  // Use the unified toggle follow hook
  const followMutation = useToggleFollow();
  const [isRequestPending, setIsRequestPending] = useState(false);

  // Approve incoming follow request
  const approveMutation = useMutation({
    mutationFn: () => api.approveFollowRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hasIncomingFollowRequest', userId] });
      queryClient.invalidateQueries({ queryKey: ['isMutualFollow', userId] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">{isRTL ? "الملف الشخصي غير موجود" : "Profile not found"}</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isRTL ? "العودة للرئيسية" : "Go back"}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isOfficialProfile = profile?.is_official;

  return (
    <Layout>
      {slideIn && (
        <style>{`
          @keyframes noviiSlideIn {
            from { transform: translateX(100%); opacity: 0.6; }
            to   { transform: translateX(0);    opacity: 1;   }
          }
          .novii-slide-in {
            animation: noviiSlideIn 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          }
        `}</style>
      )}
      <div className={cn(
        "flex flex-col w-full min-h-screen bg-background relative",
        isOfficialProfile && "before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-purple-500 before:to-transparent before:opacity-60",
        slideIn && "novii-slide-in"
      )}>
        
        {/* Profile Header - Responsive Unified Layout */}
        <div className="w-full px-3 sm:px-4 lg:px-0 lg:max-w-6xl lg:mx-auto py-4 sm:py-6 lg:py-8 animate-in fade-in duration-500 relative z-10">
          {/* Unified Avatar and Info Layout - Mobile: Left-Right, Desktop: Left-Right with more space */}
          <div className="flex flex-row gap-4 md:gap-10 items-start w-full">
            {/* Avatar */}
            <div 
              className={cn(
                "relative group cursor-pointer shrink-0",
                isOfficialProfile && "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-purple-500 before:to-pink-500 before:opacity-30 before:blur-lg md:before:blur-2xl before:-z-10 before:animate-pulse"
              )}
              onClick={() => {
                if (userStories.length > 0) setStoryViewerOpen(true);
              }}
            >
                <div className={cn(
                  "w-28 h-28 md:w-36 md:h-36 rounded-full p-1 shadow-xl group-hover:scale-105 transition-transform duration-300",
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
                {/* Online Indicator Badge */}
                {(isOwnProfile || isMutualFollow) && !settings.hide_online_status && (
                  <div className="absolute bottom-0 right-0">
                    <OnlineIndicator userId={userId} size={isMobile ? "md" : "lg"} shouldShow={isOwnProfile || isMutualFollow} />
                  </div>
                )}
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col gap-2 md:gap-4 text-left min-w-0">
              {/* Full Name for Mobile - Above Username */}
              <div className="md:hidden">
                <div className="font-semibold text-sm truncate">{profile.full_name || profile.username}</div>
              </div>

              {/* Username and Verified Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-2xl md:text-3xl font-display">
                  <VerifiedUsername
                    username={profile.username}
                    isVerified={profile.is_verified}
                  />
                </h1>
                {profile.is_verified && (
                  <>
                    <div className="md:hidden">
                      <VerifiedBadge size="sm" />
                    </div>
                    <div className="hidden md:inline">
                      <VerifiedBadge size="lg" verifiedAt={profile.verified_at} />
                    </div>
                  </>
                )}
                {profile.is_official && (
                  <>
                    <div className="md:hidden">
                      <OfficialBadge size="sm" showText={true} />
                    </div>
                    <div className="hidden md:inline">
                      <OfficialBadge size="lg" showText={true} />
                    </div>
                  </>
                )}
              </div>

              {/* Other badges */}
              <div className="flex items-center gap-1 flex-wrap">
                {profile.is_creator && (
                  <>
                    <div className="md:hidden">
                      <CreatorBadge size="xs" />
                    </div>
                    <div className="hidden md:inline">
                      <CreatorBadge size="md" />
                    </div>
                  </>
                )}
                {profile.is_premium && (
                  <>
                    <div className="md:hidden">
                      <PremiumBadge size="xs" />
                    </div>
                    <div className="hidden md:inline">
                      <PremiumBadge size="md" />
                    </div>
                  </>
                )}
                {profile.is_popular && (
                  <>
                    <div className="md:hidden">
                      <PopularBadge size="xs" />
                    </div>
                    <div className="hidden md:inline">
                      <PopularBadge size="md" />
                    </div>
                  </>
                )}
                {profile.is_active && (
                  <>
                    <div className="md:hidden">
                      <ActiveBadge size="xs" />
                    </div>
                    <div className="hidden md:inline">
                      <ActiveBadge size="md" />
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-2 pt-2 md:pt-4">
                <div className="flex items-center gap-6 md:gap-10 text-sm md:text-base">
                  <div className={isMobile ? "flex flex-col items-center" : "flex flex-col items-start gap-1"}>
                      <span className={isMobile ? "font-bold" : "text-2xl font-bold"}>{profile.posts_count}</span>
                      <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>{isRTL ? "منشور" : "posts"}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (isOwnProfile || (profile.is_private && isFollowing) || !profile.is_private) {
                        setFollowersDialogTab("followers");
                        setFollowersDialogOpen(true);
                      }
                    }}
                    disabled={profile.is_private && !isOwnProfile && !isFollowing}
                    className={cn("hover:opacity-70 transition-opacity disabled:opacity-50", isMobile ? "flex flex-col items-center" : "flex flex-col items-start gap-1")}
                  >
                      <span className={isMobile ? "font-bold" : "text-2xl font-bold"}>{profile.followers_count}</span>
                      <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>{isRTL ? "متابع" : "followers"}</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (isOwnProfile || (profile.is_private && isFollowing) || !profile.is_private) {
                        setFollowersDialogTab("following");
                        setFollowersDialogOpen(true);
                      }
                    }}
                    disabled={profile.is_private && !isOwnProfile && !isFollowing}
                    className={cn("hover:opacity-70 transition-opacity disabled:opacity-50", isMobile ? "flex flex-col items-center" : "flex flex-col items-start gap-1")}
                  >
                      <span className={isMobile ? "font-bold" : "text-2xl font-bold"}>{profile.following_count}</span>
                      <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>{isRTL ? "متابَع" : "following"}</span>
                  </button>
                </div>

                {/* Display member medals under stats */}
                {(profile.is_gold_early_member || profile.is_silver_early_member || profile.is_bronze_early_member || profile.is_beta_tester) && (
                  <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-border">
                    {profile.is_gold_early_member && (
                      <>
                        <div className="md:hidden">
                          <GoldMemberBadge size="xs" iconOnly />
                        </div>
                        <div className="hidden md:inline">
                          <GoldMemberBadge size="md" iconOnly />
                        </div>
                      </>
                    )}
                    {profile.is_silver_early_member && (
                      <>
                        <div className="md:hidden">
                          <SilverMemberBadge size="xs" iconOnly />
                        </div>
                        <div className="hidden md:inline">
                          <SilverMemberBadge size="md" iconOnly />
                        </div>
                      </>
                    )}
                    {profile.is_bronze_early_member && (
                      <>
                        <div className="md:hidden">
                          <BronzeMemberBadge size="xs" iconOnly />
                        </div>
                        <div className="hidden md:inline">
                          <BronzeMemberBadge size="md" iconOnly />
                        </div>
                      </>
                    )}
                    {profile.is_beta_tester && (
                      <>
                        <div className="md:hidden">
                          <BetaTesterBadge size="xs" iconOnly />
                        </div>
                        <div className="hidden md:inline">
                          <BetaTesterBadge size="md" iconOnly />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Buttons - Below Stats */}
                <div className="flex gap-1 md:gap-2 pt-3 md:pt-4">
                  {!isOwnProfile && (
                    <>
                      {hasIncomingRequest ? (
                        <Button
                          variant="default"
                          className={cn(
                            "font-semibold rounded-lg",
                            "h-8 px-3 text-sm md:h-8 md:px-4 flex-1 md:flex-none"
                          )}
                          onClick={() => approveMutation.mutate()}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Spinner className="w-3 h-3 md:w-4 md:h-4" />
                          ) : (
                            isRTL ? "قبول الطلب" : "Accept"
                          )}
                        </Button>
                      ) : (
                        <Button 
                          variant={isFollowing ? "secondary" : hasRequest ? "outline" : "default"} 
                          className={cn(
                            "font-semibold rounded-lg",
                            "h-8 px-3 text-sm md:h-8 md:px-4 flex-1 md:flex-none"
                          )}
                          onClick={() => followMutation.mutate({ targetUserId: userId, isPrivate: profile?.is_private, hasPending: hasRequest, isFollowingNow: isFollowing })}
                          disabled={followMutation.isPending || followLoading}
                        >
                          {followMutation.isPending ? (
                            <Spinner className="w-3 h-3 md:w-4 md:h-4" />
                          ) : isFollowing ? (
                            isRTL ? "تابِع ✓" : "Following"
                          ) : hasRequest ? (
                            isRTL ? "طلب مُرسَل" : "Requested"
                          ) : profile?.is_followed_by && !isFollowing ? (
                            isRTL ? "رد بالمتابعة" : "Follow Back"
                          ) : profile?.is_private ? (
                            isRTL ? "طلب متابعة" : "Request"
                          ) : (
                            isRTL ? "متابعة" : "Follow"
                          )}
                        </Button>
                      )}
                      <Link href={`/messages?user=${userId}`}>
                        <Button variant="secondary" className={cn(
                          "font-semibold rounded-lg",
                          "h-8 px-3 text-sm md:h-8 md:px-4 flex-1 md:flex-none"
                        )}>
                          {isRTL ? "رسالة" : "Message"}
                        </Button>
                      </Link>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-8 md:w-8"
                    onClick={() => setShareModalOpen(true)}
                    title={isRTL ? "مشاركة الملف الشخصي" : "Share Profile"}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                  {!isOwnProfile && userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => isBlocked(userId) ? unblockUser(userId) : blockUser(userId)}>
                          <ShieldBan className="w-4 h-4 mr-2" />
                          {isBlocked(userId) ? (isRTL ? "إلغاء الحظر" : "Unblock") : (isRTL ? "حظر" : "Block")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => isMuted(userId) ? unmuteUser(userId) : muteUser(userId)}>
                          <VolumeX className="w-4 h-4 mr-2" />
                          {isMuted(userId) ? (isRTL ? "إلغاء الكتم" : "Unmute") : (isRTL ? "كتم" : "Mute")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => isRestricted(userId) ? unrestrictUser(userId) : restrictUser(userId)}>
                          <ShieldAlert className="w-4 h-4 mr-2" />
                          {isRestricted(userId) ? (isRTL ? "إلغاء التقييد" : "Unrestrict") : (isRTL ? "تقييد" : "Restrict")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => isFavorite(userId) ? removeFavorite(userId) : addFavorite(userId)}>
                          <Star className={cn("w-4 h-4 mr-2", isFavorite(userId) && "fill-yellow-400 text-yellow-400")} />
                          {isFavorite(userId) ? (isRTL ? "إزالة من المفضلة" : "Remove from Favorites") : (isRTL ? "إضافة للمفضلة" : "Add to Favorites")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => isCloseFriend(userId) ? removeCloseFriend(userId) : addCloseFriend(userId)}>
                          <Users className={cn("w-4 h-4 mr-2", isCloseFriend(userId) && "text-green-500")} />
                          {isCloseFriend(userId) ? (isRTL ? "إزالة من الأصدقاء المقربين" : "Remove Close Friend") : (isRTL ? "إضافة للأصدقاء المقربين" : "Add Close Friend")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Bio Section - Desktop Only */}
              <div className="hidden md:block space-y-1 max-w-md">
                <div className="font-bold text-md">{profile.full_name || profile.username}</div>
                {profile.bio && (
                  <div className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground md:text-foreground">{profile.bio}</div>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
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
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                {profile.website}
              </a>
            )}
            {profile.location && (
              <div className="text-sm text-muted-foreground">{profile.location}</div>
            )}
          </div>
        </div>

        {/* Tabs & Grid */}
        <div className="flex-1 border-t border-border">
            <Tabs defaultValue="posts" className="w-full">
                <div className="flex justify-center border-b border-border">
                    <TabsList className="h-12 bg-transparent gap-8">
                        <TabsTrigger value="posts" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none">
                            <Grid3X3 className="w-4 h-4" /> {isRTL ? "منشورات" : "POSTS"}
                        </TabsTrigger>
                        <TabsTrigger value="reels" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none">
                            <Heart className="w-4 h-4" /> {isRTL ? "ريلز" : "REELS"}
                        </TabsTrigger>
                        <TabsTrigger value="tagged" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none">
                            <UserSquare2 className="w-4 h-4" /> {isRTL ? "مجاني" : "TAGGED"}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="posts" className="p-1 md:p-4 pb-20 md:pb-4 max-w-4xl mx-auto mt-0">
                    {postsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner className="w-6 h-6" />
                      </div>
                    ) : profile?.is_private && !isOwnProfile && !isFollowing ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">{isRTL ? "حساب خاص" : "Private Account"}</h3>
                        <p className="text-muted-foreground max-w-sm">{isRTL ? "هذا الحساب خاص. يمكنك فقط رؤية المنشورات إذا كنت من المتابعين المقبولين." : "This account is private. You can only see posts if you're an approved follower."}</p>
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Grid3X3 className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">{isRTL ? "لا توجد منشورات" : "No Posts Yet"}</h3>
                        <p className="text-muted-foreground">{isRTL ? "لم يشارك أي منشورات بعد" : "No posts shared yet"}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1 md:gap-4">
                        {userPosts.map((post) => (
                            <div 
                              key={post.id} 
                              className="relative aspect-square group cursor-pointer overflow-hidden bg-muted rounded-sm md:rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300"
                              onClick={() => {
                                setSelectedPost(post);
                                setPostViewerOpen(true);
                              }}
                            >
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

                <TabsContent value="reels" className="p-2 md:p-4 pb-20 md:pb-4 max-w-4xl mx-auto mt-0">
                    {reelsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner className="w-6 h-6" />
                      </div>
                    ) : profile?.is_private && !isOwnProfile && !isFollowing ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">{isRTL ? "حساب خاص" : "Private Account"}</h3>
                        <p className="text-muted-foreground max-w-sm">{isRTL ? "هذا الحساب خاص. يمكنك فقط رؤية الريلز إذا كنت من المتابعين المقبولين." : "This account is private. You can only see reels if you're an approved follower."}</p>
                      </div>
                    ) : userReels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">{isRTL ? "لا توجد ريلز" : "No Reels Yet"}</h3>
                        <p className="text-muted-foreground">{isRTL ? "لم يشارك أي ريلز بعد" : "No reels shared yet"}</p>
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

                <TabsContent value="tagged" className="p-1 md:p-4 pb-20 md:pb-4 max-w-4xl mx-auto mt-0">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <UserSquare2 className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">{isRTL ? "لا توجد منشورات مجاني" : "No Tagged Posts"}</h3>
                      <p className="text-muted-foreground">{isRTL ? "المنشورات التي تم وسم هذا المستخدم فيها ستظهر هنا" : "Posts you're tagged in will appear here"}</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </div>

      {/* Followers Dialog */}
      {profile && (
        <FollowersDialog
          open={followersDialogOpen}
          onOpenChange={setFollowersDialogOpen}
          userId={userId}
          username={profile.username}
          initialTab={followersDialogTab}
          currentUserId={currentUser?.id}
        />
      )}

      {/* Post Viewer Modal */}
      <PostViewerModal
        post={selectedPost}
        open={postViewerOpen}
        onOpenChange={setPostViewerOpen}
        isRTL={isRTL}
      />

      {/* Reel Viewer Modal */}
      <ReelViewerModal
        reel={selectedReel}
        open={reelModalOpen}
        onOpenChange={setReelModalOpen}
        allReels={userReels}
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
      {profile && (
        <ProfileShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          username={profile.username}
          userId={userId}
          avatarUrl={profile.avatar_url ?? undefined}
          fullName={profile.full_name ?? undefined}
        />
      )}
    </Layout>
  );
}
