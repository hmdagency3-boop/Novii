import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { UserPlus, AlertCircle, X, Users, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ContactsSyncBanner from "@/components/contacts-sync-banner";

export default function SuggestionsSidebar() {
  const queryClient = useQueryClient();
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [dismissedLocally, setDismissedLocally] = useState<Set<string>>(new Set());

  const { data: suggestions = [], isLoading, error } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => api.getSuggestedUsers(50),
    staleTime: 5 * 60 * 1000,
  });

  const { data: currentProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getCurrentProfile(),
  });

  const { data: followingUsers = [] } = useQuery({
    queryKey: ['followingUsers'],
    queryFn: () => api.getMyFollowing(),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => api.toggleFollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['followingUsers'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
    },
    onError: () => {
      toast.error(isRTL ? "حدث خطأ في المتابعة" : "Failed to update follow status");
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (userId: string) => api.dismissSuggestion(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    },
  });

  const handleDismiss = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedLocally(prev => new Set(prev).add(userId));
    dismissMutation.mutate(userId);
  };

  const getUserFollowingIds = (): Set<string> => {
    return new Set(followingUsers.map((user: any) => user.id));
  };

  const followingIds = getUserFollowingIds();

  const visibleSuggestions = suggestions.filter((u: any) => !dismissedLocally.has(u.id) && !followingIds.has(u.id));
  const displaySuggestions = visibleSuggestions.slice(0, 5);
  const allSuggestions = visibleSuggestions;

  const SuggestionItem = ({ user, compact = false }: { user: any; compact?: boolean }) => {
    const isFollowing = followingIds.has(user.id);
    const reason = user.suggestion_reason || (isRTL ? 'مقترح لك' : 'Suggested for you');

    return (
      <div className="relative group">
        <Link key={user.id} href={`/@${user.username}`}>
          <div className={`flex items-center justify-between ${compact ? 'p-2' : 'p-3'} hover:bg-accent/50 rounded-lg transition-colors cursor-pointer`}>
            <div className="hover:opacity-80 transition-opacity flex items-center gap-3 flex-1 min-w-0">
              <Avatar className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} flex-shrink-0`}>
                <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'user'}`} />
                <AvatarFallback>{(user.username || 'U')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm leading-tight truncate">{user.username}</span>
                  {user.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[11px] text-muted-foreground truncate">
                    {reason}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  followMutation.mutate({ targetUserId: user.id, isFollowingNow: isFollowing } as any);
                }}
                disabled={followMutation.isPending}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                  isFollowing
                    ? 'bg-muted text-foreground hover:bg-muted/80'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followMutation.isPending ? (
                  <Spinner className="w-3 h-3" />
                ) : (
                  <>
                    {!isFollowing && <UserPlus className="w-3 h-3" />}
                    {isRTL 
                      ? (isFollowing ? 'متابع' : 'متابعة')
                      : (isFollowing ? 'Following' : 'Follow')
                    }
                  </>
                )}
              </button>
              <button
                onClick={(e) => handleDismiss(user.id, e)}
                className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                title={isRTL ? 'إخفاء' : 'Dismiss'}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  const AllSuggestionsDialog = () => {
    return (
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isRTL ? 'جميع التوصيات' : 'All Suggestions'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {allSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  {isRTL ? 'لا توجد توصيات متاحة' : 'No suggestions available'}
                </p>
              </div>
            ) : (
              allSuggestions.map((user: any) => (
                <SuggestionItem key={user.id} user={user} compact />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <aside className={`hidden xl:flex flex-col w-80 h-screen sticky top-0 p-6 pt-10 z-40 overflow-y-auto ${isRTL ? 'border-l' : 'border-r'} border-border/40`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">
              {isRTL ? 'توصيات لك' : 'Suggestions for you'}
            </span>
          </div>
          {allSuggestions.length > 5 && (
            <button 
              onClick={() => setIsViewAllOpen(true)}
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              {isRTL ? 'عرض الكل' : 'See All'}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="w-5 h-5" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">
              {isRTL ? 'حدث خطأ في تحميل التوصيات' : 'Failed to load suggestions'}
            </p>
          </div>
        ) : displaySuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Users className="w-8 h-8 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-semibold text-sm mb-1">
                {isRTL ? 'لا توجد توصيات متاحة' : 'No suggestions available'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRTL 
                  ? 'تابع المزيد من المستخدمين لاكتشاف محتوى جديد!'
                  : 'Follow more users to discover new content!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 mb-6">
            {displaySuggestions.map((user: any) => (
              <SuggestionItem key={user.id} user={user} />
            ))}
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-border/40 text-xs text-muted-foreground/60 space-y-3">
          <div className="space-y-2">
            <p>
              {isRTL
                ? 'عن التطبيق • المساعدة • الصحافة • API • الوظائف • الخصوصية • الشروط'
                : 'About • Help • Press • API • Jobs • Privacy • Terms'}
            </p>
            <p>© 2025 {isRTL ? 'نوفي' : 'NOVII'}</p>
          </div>
        </div>
      </aside>

      <AllSuggestionsDialog />
    </>
  );
}
