import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { useFollowers, useFollowing, useToggleFollow } from "@/hooks/use-data";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/api";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  initialTab?: "followers" | "following";
  currentUserId?: string;
}

export function FollowersDialog({ 
  open, 
  onOpenChange, 
  userId, 
  username,
  initialTab = "followers",
  currentUserId 
}: FollowersDialogProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  
  const { data: followersData, isLoading: loadingFollowers } = useFollowers(userId);
  const { data: followingData, isLoading: loadingFollowing } = useFollowing(userId);
  const toggleFollow = useToggleFollow();

  // Ensure data is always an array
  const followers = Array.isArray(followersData) ? followersData : [];
  const following = Array.isArray(followingData) ? followingData : [];
  
  console.log('🔍 Followers Dialog - Followers Data:', followers);
  console.log('🔍 Followers Dialog - First follower is_following:', followers[0]?.is_following);

  const handleFollowClick = (targetUserId: string, isFollowingNow?: boolean) => {
    toggleFollow.mutate({ targetUserId, isFollowingNow });
  };

  const UserListItem = ({ user, showFollowButton, isFollowersTab }: { user: Profile; showFollowButton: boolean; isFollowersTab: boolean }) => {
    const isCurrentUser = currentUserId === user.id;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir={direction}>
        <DialogHeader>
          <DialogTitle className={cn(isRTL && "text-right")}>
            {username}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              {isRTL ? "المتابعون" : "Followers"}
              <span className="ml-2 text-xs text-muted-foreground">
                {followers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="following">
              {isRTL ? "المتابَعون" : "Following"}
              <span className="ml-2 text-xs text-muted-foreground">
                {following.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loadingFollowers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {isRTL ? "لا يوجد متابعون بعد" : "No followers yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {followers.map((follower) => (
                    <UserListItem 
                      key={follower.id} 
                      user={follower} 
                      showFollowButton={currentUserId !== userId}
                      isFollowersTab={true}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="following" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loadingFollowing ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {isRTL ? "لا يتابع أحداً بعد" : "Not following anyone yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {following.map((followedUser) => (
                    <UserListItem 
                      key={followedUser.id} 
                      user={followedUser} 
                      showFollowButton={currentUserId !== userId}
                      isFollowersTab={false}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
