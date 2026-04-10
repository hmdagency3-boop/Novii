import type { Story, Profile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";

interface StoryBarProps {
  stories: Story[];
  followingUsers?: Profile[];
  currentUserAvatar: string;
  onAddStoryClick?: () => void;
  onStoryClick?: (userId: string) => void;
  onViewOwnStories?: () => void;
  currentUserId?: string;
}

export default function StoryBar({ stories, followingUsers = [], currentUserAvatar, onAddStoryClick, onStoryClick, onViewOwnStories, currentUserId }: StoryBarProps) {
  // Group stories by user_id and get the first (most recent) story for each user
  const groupedStories = useMemo(() => {
    const grouped = new Map<string, Story>();
    
    stories.forEach((story) => {
      // Only add if we don't have a story for this user yet (keeps the most recent one)
      if (!grouped.has(story.user_id)) {
        grouped.set(story.user_id, story);
      }
    });
    
    return Array.from(grouped.values());
  }, [stories]);

  // تحقق إذا كان المستخدم الحالي عنده استوري
  const currentUserStory = groupedStories.find(story => story.user_id === currentUserId);
  
  // إذا كان المستخدم الحالي عنده استوري، ضعه في البداية
  // وإلا عرض صورة الإضافة
  const displayStories = useMemo(() => {
    if (currentUserStory) {
      // المستخدم عنده استوري - عرض استوريات الجميع بدون الزر +
      return groupedStories;
    } else {
      // المستخدم بدون استوري - عرض الاستوريات الأخرى فقط
      return groupedStories.filter(story => story.user_id !== currentUserId);
    }
  }, [groupedStories, currentUserId, currentUserStory]);

  const hasOwnStory = !!currentUserStory;

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-4 px-4 md:px-0">
      <div className="flex items-center gap-4 min-w-max">
        {/* Current User - Show story if exists, otherwise show add button */}
        {hasOwnStory ? (
          // عرض استوري المستخدم الحالي
          <div 
            className="flex flex-col items-center gap-1 cursor-pointer group"
            onClick={() => {
              console.log('📱 Own story clicked - User ID:', currentUserId);
              onStoryClick?.(currentUserId!);
            }}
          >
            <div className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] transition-all duration-300 relative",
                !currentUserStory!.is_viewed 
                    ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-primary" 
                    : "bg-border"
            )}>
            <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-background relative z-10">
                <img 
                    src={currentUserAvatar} 
                    alt="Your Story" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
            </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">You</span>
          </div>
        ) : (
          // عرض زر إضافة استوري عندما لا يكون عنده استوري
          <div 
            className="flex flex-col items-center gap-1 cursor-pointer group"
            onClick={() => {
              console.log('👤 Add story clicked');
              onAddStoryClick?.();
            }}
          >
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <div className="w-full h-full rounded-full p-[2px] border border-border/50">
                   <img 
                      src={currentUserAvatar} 
                      alt="Your Story" 
                      className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105" 
                   />
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-background">
                  <Plus className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">You</span>
          </div>
        )}

        {/* Other Stories - One per user */}
        {displayStories
          .filter(story => story.user_id !== currentUserId) // لا تعرض استوري المستخدم الحالي هنا
          .map((story) => {
            const userId = story.user_id;
            const isUnviewed = !story.is_viewed;
            const username = story.profile?.username || 'User';
            const avatar = story.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
            
            return (
            <div 
              key={`${userId}-story`}
              className="flex flex-col items-center gap-1 cursor-pointer group"
              onClick={() => {
                console.log('📱 Story clicked - User ID:', userId);
                onStoryClick?.(userId);
              }}
            >
                <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] transition-all duration-300 relative",
                    isUnviewed 
                        ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-primary" 
                        : "bg-border"
                )}>
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-background relative z-10">
                    <img 
                        src={avatar} 
                        alt={username}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                </div>
                </div>
                <div className="flex items-center gap-0.5 justify-center flex-nowrap max-w-[90px]">
                  <span className="text-xs text-muted-foreground font-medium truncate flex-shrink-0">
                      {username}
                  </span>
                  {/* Badges Row */}
                  <div className="flex gap-px flex-shrink-0">
                    {story.profile?.is_verified && <VerifiedBadge size="sm" />}
                    {story.profile?.is_official && <OfficialBadge size="sm" />}
                    {story.profile?.is_creator && <CreatorBadge size="sm" />}
                    {story.profile?.is_premium && <PremiumBadge size="sm" />}
                    {story.profile?.is_popular && <PopularBadge size="sm" />}
                    {story.profile?.is_active && <ActiveBadge size="sm" />}
                  </div>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );
}
