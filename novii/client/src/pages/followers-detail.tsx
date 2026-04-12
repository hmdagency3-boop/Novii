import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useFollowers, useFollowing, useToggleFollow } from "@/hooks/use-data";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/api";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";
import { useState, useMemo } from "react";

interface FollowersDetailPageProps {
  userId?: string;
  username?: string;
}

export default function FollowersDetailPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user: currentUser } = useAuth();
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  
  // Get params from URL
  const params = new URLSearchParams(search);
  const userId = params.get("id") || currentUser?.id || "";
  const username = params.get("username") || "";
  const initialTab = (params.get("tab") || "followers") as "followers" | "following";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  
  const { data: followersData, isLoading: loadingFollowers } = useFollowers(userId);
  const { data: followingData, isLoading: loadingFollowing } = useFollowing(userId);
  const toggleFollow = useToggleFollow();
  
  // Ensure data is always an array
  const followers = Array.isArray(followersData) ? followersData : [];
  const following = Array.isArray(followingData) ? followingData : [];
  
  // Filter by search query
  const filteredFollowers = useMemo(() => {
    if (!searchQuery.trim()) return followers;
    const query = searchQuery.toLowerCase();
    return followers.filter(user => 
      user.username.toLowerCase().includes(query) || 
      (user.full_name && user.full_name.toLowerCase().includes(query))
    );
  }, [followers, searchQuery]);
  
  const filteredFollowing = useMemo(() => {
    if (!searchQuery.trim()) return following;
    const query = searchQuery.toLowerCase();
    return following.filter(user => 
      user.username.toLowerCase().includes(query) || 
      (user.full_name && user.full_name.toLowerCase().includes(query))
    );
  }, [following, searchQuery]);
  
  const handleFollowClick = (targetUserId: string, isFollowingNow?: boolean) => {
    toggleFollow.mutate({ targetUserId, isFollowingNow });
  };
  
  const UserListItem = ({ user, showFollowButton, isFollowersTab }: { user: Profile; showFollowButton: boolean; isFollowersTab: boolean }) => {
    const isCurrentUser = currentUser?.id === user.id;
    const isFollowing = user.is_following ?? false;
    
    return (
      <div className={cn(
        "flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors",
        isRTL && "flex-row-reverse"
      )}>
        <Link href={`/user?id=${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
            <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{user.username}</span>
              <div className="flex items-center gap-0.5">
                {user.is_verified && <VerifiedBadge size="sm" />}
                {user.is_official && <OfficialBadge size="sm" />}
                {user.is_creator && <CreatorBadge size="sm" />}
                {user.is_premium && <PremiumBadge size="sm" />}
                {user.is_popular && <PopularBadge size="sm" />}
                {user.is_active && <ActiveBadge size="sm" />}
              </div>
            </div>
            {user.full_name && (
              <span className="text-xs text-muted-foreground truncate">{user.full_name}</span>
            )}
          </div>
        </Link>
        
        {showFollowButton && !isCurrentUser && isFollowing && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-4 text-xs font-bold"
          >
            <MessageCircle className="w-3 h-3 mr-1.5" />
            {isRTL ? "رسالة" : "Message"}
          </Button>
        )}
        
        {showFollowButton && !isCurrentUser && !isFollowing && isFollowersTab && (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleFollowClick(user.id, false)}
            disabled={toggleFollow.isPending}
            className="h-8 px-4 text-xs font-bold"
          >
            {toggleFollow.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              isRTL ? "متابعة مقابل" : "Follow back"
            )}
          </Button>
        )}
        
        {showFollowButton && !isCurrentUser && !isFollowing && !isFollowersTab && (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleFollowClick(user.id, false)}
            disabled={toggleFollow.isPending}
            className="h-8 px-4 text-xs font-bold"
          >
            {toggleFollow.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              isRTL ? "متابعة" : "Follow"
            )}
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <div className="w-full h-screen flex flex-col bg-background" dir={direction}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-sm",
        isRTL && "flex-row-reverse"
      )}>
        <button
          onClick={() => setLocation("/")}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">{username}</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>
      
      {/* Search Bar */}
      <div className={cn(
        "flex items-center gap-2 p-4 border-b border-border",
        isRTL && "flex-row-reverse"
      )}>
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder={isRTL ? "بحث..." : "Search..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-background border-border h-10 text-sm"
          dir={direction}
        />
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border px-4 pt-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "followers" | "following")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto">
            <TabsTrigger value="followers" className="relative py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              {isRTL ? "المتابعون" : "Followers"}
              <span className={cn("text-xs text-muted-foreground", isRTL ? "mr-2" : "ml-2")}>
                {followers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="following" className="relative py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              {isRTL ? "المتابَعون" : "Following"}
              <span className={cn("text-xs text-muted-foreground", isRTL ? "mr-2" : "ml-2")}>
                {following.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-0">
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="p-4">
                {loadingFollowers ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredFollowers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    {searchQuery.trim() ? (
                      isRTL ? "لا توجد نتائج" : "No results found"
                    ) : (
                      isRTL ? "لا يوجد متابعون بعد" : "No followers yet"
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFollowers.map((follower) => (
                      <UserListItem 
                        key={follower.id} 
                        user={follower} 
                        showFollowButton={currentUser?.id !== userId}
                        isFollowersTab={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="following" className="mt-0">
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="p-4">
                {loadingFollowing ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredFollowing.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    {searchQuery.trim() ? (
                      isRTL ? "لا توجد نتائج" : "No results found"
                    ) : (
                      isRTL ? "لا يتابع أحداً بعد" : "Not following anyone yet"
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFollowing.map((followedUser) => (
                      <UserListItem 
                        key={followedUser.id} 
                        user={followedUser} 
                        showFollowButton={currentUser?.id !== userId}
                        isFollowersTab={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
