import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
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
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

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
  currentUserId: propCurrentUserId 
}: FollowersDialogProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const { user: authUser } = useAuth();
  const currentUserId = propCurrentUserId || authUser?.id;
  const isOwnList = currentUserId === userId;
  
  const { data: followersData, isLoading: loadingFollowers, refetch: refetchFollowers } = useFollowers(userId);
  const { data: followingData, isLoading: loadingFollowing, refetch: refetchFollowing } = useFollowing(userId);
  const toggleFollow = useToggleFollow();

  const followers = Array.isArray(followersData) ? followersData : [];
  const following = Array.isArray(followingData) ? followingData : [];

  const [localFollowState, setLocalFollowState] = useState<Record<string, boolean>>({});

  const handleFollowClick = (targetUserId: string, currentlyFollowing: boolean) => {
    setLocalFollowState(prev => ({ ...prev, [targetUserId]: !currentlyFollowing }));
    toggleFollow.mutate(
      { targetUserId, isFollowingNow: currentlyFollowing },
      {
        onSettled: () => {
          refetchFollowers();
          refetchFollowing();
        },
      }
    );
  };

  const getFollowState = (user: Profile): boolean => {
    if (localFollowState[user.id] !== undefined) return localFollowState[user.id];
    return user.is_following ?? false;
  };

  const UserListItem = ({ user, isFollowersTab }: { user: Profile; isFollowersTab: boolean }) => {
    const isCurrentUser = currentUserId === user.id;
    const amFollowing = getFollowState(user);

    const getButtonContent = () => {
      if (isCurrentUser) return null;

      if (amFollowing) {
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleFollowClick(user.id, true)}
            disabled={toggleFollow.isPending}
            className="h-8 px-4 text-xs font-bold"
          >
            {toggleFollow.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              isRTL ? "متابَع" : "Following"
            )}
          </Button>
        );
      }

      const isFollowBack = isFollowersTab && isOwnList;
      return (
        <Button
          size="sm"
          variant="default"
          onClick={() => handleFollowClick(user.id, false)}
          disabled={toggleFollow.isPending}
          className="h-8 px-4 text-xs font-bold"
        >
          {toggleFollow.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isFollowBack ? (
            isRTL ? "متابعة بالمقابل" : "Follow back"
          ) : (
            isRTL ? "متابعة" : "Follow"
          )}
        </Button>
      );
    };
    
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
        
        {getButtonContent()}
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
