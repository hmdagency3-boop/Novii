/**
 * StoryAwareAvatar
 * Shows a story ring (gradient = unviewed, grey = all viewed, none = no story).
 * Clicking opens the story viewer; otherwise falls back to profile navigation.
 */
import { useState } from "react";
import { Link } from "wouter";
import { StoryViewerModal } from "./story-viewer-modal";
import { useStories } from "@/hooks/use-data";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

interface StoryAwareAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  username?: string;
  /** Tailwind size class for the image wrapper, e.g. "w-12 h-12" */
  sizeClass?: string;
  /** Extra classes on the outer ring wrapper */
  className?: string;
  /** Called when user has no story and clicks (fallback); usually handled by parent Link */
  onNoStoryClick?: (e: React.MouseEvent) => void;
}

export function StoryAwareAvatar({
  userId,
  avatarUrl,
  username,
  sizeClass = "w-12 h-12",
  className,
  onNoStoryClick,
}: StoryAwareAvatarProps) {
  const [showStories, setShowStories] = useState(false);
  const { data: allStories = [] } = useStories();
  const { direction } = useLanguage();

  /* Stories for this specific user that are still active */
  const userStories = allStories.filter((s) => s.user_id === userId);
  const hasStory    = userStories.length > 0;
  const allViewed   = hasStory && userStories.every((s) => s.is_viewed);
  const hasUnviewed = hasStory && !allViewed;

  const handleClick = (e: React.MouseEvent) => {
    if (hasStory) {
      e.preventDefault();
      e.stopPropagation();
      setShowStories(true);
    } else {
      onNoStoryClick?.(e);
    }
  };

  return (
    <>
      {/* Wrapper — either a clickable div (story) or a Link (profile) */}
      {hasStory ? (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "rounded-full flex-shrink-0 p-[2.5px] transition-all duration-300 focus:outline-none",
            hasUnviewed
              ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-primary"
              : "bg-border",
            className
          )}
          aria-label={`View ${username || "user"}'s story`}
        >
          <div className={cn("rounded-full border-[2.5px] border-card overflow-hidden bg-muted", sizeClass)}>
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
              alt={username || "avatar"}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      ) : (
        <Link
          href={`/user?id=${userId}`}
          className={cn("rounded-full flex-shrink-0 block", className)}
        >
          <div className={cn("rounded-full overflow-hidden bg-muted border-2 border-primary/30 ring-2 ring-primary/10 hover:opacity-80 transition-opacity", sizeClass)}>
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
              alt={username || "avatar"}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      )}

      {/* Story viewer */}
      {showStories && userStories.length > 0 && (
        <StoryViewerModal
          stories={userStories}
          initialIndex={0}
          open={showStories}
          onOpenChange={setShowStories}
          isRTL={direction === "rtl"}
        />
      )}
    </>
  );
}
