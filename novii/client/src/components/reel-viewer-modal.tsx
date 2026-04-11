import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, X, Send, Trash2, Play, Pause, Volume2, VolumeX, Reply, MoreVertical, ImageIcon } from "lucide-react";
import { GifPicker, GIF_PREFIX } from "@/components/gif-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";
import { useLanguage } from "@/lib/language-context";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useToggleReelLike, useCreateComment, useToggleCommentLike, useDeleteComment, useCurrentUser } from "@/hooks/use-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";


function renderCommentContent(content: string, isOfficial?: boolean) {
  if (content.startsWith(GIF_PREFIX)) {
    const url = content.slice(GIF_PREFIX.length);
    return (
      <img
        src={url}
        alt="GIF"
        className="mt-1.5 rounded-lg max-w-[180px] max-h-[130px] object-cover border border-neutral-700"
        loading="lazy"
      />
    );
  }
  return (
    <p className={cn(
      "text-xs sm:text-sm mt-1 sm:mt-1.5 break-words",
      isOfficial ? "official-comment-content font-medium" : "text-foreground/85"
    )}>
      {content}
    </p>
  );
}

const formatTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  caption?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked?: boolean;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
    is_official?: boolean;
    is_creator?: boolean;
    is_premium?: boolean;
    is_popular?: boolean;
    is_active?: boolean;
  };
}

interface ReelViewerModalProps {
  reel: Reel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allReels?: Reel[];
  onNavigate?: (reel: Reel) => void;
}

export function ReelViewerModal({ reel, open, onOpenChange, allReels = [], onNavigate }: ReelViewerModalProps) {
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyVisibilityCount, setReplyVisibilityCount] = useState<Map<string, number>>(new Map());
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: string; left: number; top: number }>>([]);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [localReel, setLocalReel] = useState<Reel | null>(reel);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showCenterButton, setShowCenterButton] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMobileComments, setShowMobileComments] = useState(false);
  const [showDesktopGifPicker, setShowDesktopGifPicker] = useState(false);
  const [showMobileGifPicker, setShowMobileGifPicker] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const centerButtonTimeoutRef = useRef<NodeJS.Timeout>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const { data: currentUser } = useCurrentUser();
  
  // Update local reel when prop changes
  useEffect(() => {
    setLocalReel(reel);
  }, [reel?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (centerButtonTimeoutRef.current) {
        clearTimeout(centerButtonTimeoutRef.current);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Auto-hide controls when playing
  useEffect(() => {
    if (isPlaying) {
      setShowControls(false);
    } else {
      setShowControls(true);
    }
  }, [isPlaying]);
  
  // Fetch reel comments with nested replies
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ['reelComments', reel?.id],
    queryFn: async () => {
      if (!reel?.id) return [];
      
      // Fetch all comments and replies
      const { data: allComments } = await supabase
        .from('comments')
        .select('*, profile:profiles(*)')
        .eq('reel_id', reel.id)
        .order('created_at', { ascending: false });
      
      if (!allComments) return [];
      
      // Build nested structure - only show top-level comments, with replies nested
      const commentMap = new Map();
      const topLevelComments: any[] = [];
      
      // First pass: map all comments with empty replies array
      allComments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });
      
      // Second pass: organize into nested structure
      allComments.forEach(comment => {
        if (comment.parent_comment_id) {
          // This is a reply - get the properly structured version from map
          const parent = commentMap.get(comment.parent_comment_id);
          const reply = commentMap.get(comment.id);
          if (parent && reply) {
            parent.replies.push(reply);
          }
        } else {
          // This is a top-level comment
          topLevelComments.push(commentMap.get(comment.id));
        }
      });
      
      return topLevelComments;
    },
    enabled: !!reel?.id,
  });
  
  const toggleReelLike = useToggleReelLike();
  const createComment = useCreateComment();
  const toggleCommentLike = useToggleCommentLike();
  const deleteComment = useDeleteComment();

  if (!reel || !localReel) return null;

  const currentIndex = allReels.findIndex(r => r.id === reel.id);
  const hasNext = currentIndex < allReels.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(allReels[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (hasPrev && onNavigate) {
      onNavigate(allReels[currentIndex - 1]);
    }
  };

  const handleLike = () => {
    if (localReel) {
      // Optimistic update
      setLocalReel({
        ...localReel,
        is_liked: !localReel.is_liked,
        likes_count: (localReel.is_liked ? localReel.likes_count - 1 : localReel.likes_count + 1),
      });
      createFloatingHearts();
      toggleReelLike.mutate(reel.id);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLVideoElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (localReel && !localReel.is_liked) {
      // Optimistic update
      setLocalReel({
        ...localReel,
        is_liked: true,
        likes_count: localReel.likes_count + 1,
      });
      toggleReelLike.mutate(reel.id);
    }
    
    createFloatingHearts(x / rect.width * 100, y / rect.height * 100);
  };

  const createFloatingHearts = (left: number = 50, top: number = 50) => {
    const hearts = Array.from({ length: 6 }, () => ({
      id: Math.random().toString(36),
      left: left + (Math.random() - 0.5) * 20,
      top: top + (Math.random() - 0.5) * 20,
    }));
    setFloatingHearts(hearts);
    setTimeout(() => setFloatingHearts([]), 1200);
  };

  const handleShare = async () => {
    const reelUrl = `${window.location.origin}/reel/${reel.id}`;
    try {
      await navigator.clipboard.writeText(reelUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const newVolume = volume === 0 ? 1 : 0;
    handleVolumeChange(newVolume);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    // Toggle play/pause directly on first click
    togglePlayPause();
    
    // Show center button
    setShowCenterButton(true);
    
    // Clear existing timeout
    if (centerButtonTimeoutRef.current) {
      clearTimeout(centerButtonTimeoutRef.current);
    }
    
    // Hide after 2 seconds
    centerButtonTimeoutRef.current = setTimeout(() => {
      setShowCenterButton(false);
    }, 2000);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser?.id) return;
    
    // Remove mention prefix if replying
    let content = commentText;
    if (replyingTo && commentText.startsWith("@")) {
      const spaceIndex = commentText.indexOf(" ");
      content = spaceIndex !== -1 ? commentText.substring(spaceIndex + 1) : commentText;
    }
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          reel_id: reel.id,
          user_id: currentUser.id,
          content: content.trim(),
          post_id: null,
          parent_comment_id: replyingTo || null,
        });
      
      if (error) {
        console.error('Error adding comment:', error);
        return;
      }
      
      setCommentText("");
      setReplyingTo(null);
      setShowDesktopGifPicker(false);
      setShowMobileGifPicker(false);
      // Refetch comments
      if (refetchComments) {
        refetchComments();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGifSelect = async (url: string, forMobile: boolean) => {
    if (!currentUser?.id || !reel?.id) return;
    try {
      await supabase.from("comments").insert({
        reel_id: reel.id,
        user_id: currentUser.id,
        content: GIF_PREFIX + url,
        post_id: null,
        parent_comment_id: replyingTo || null,
      });
      setReplyingTo(null);
      if (forMobile) setShowMobileGifPicker(false);
      else setShowDesktopGifPicker(false);
      if (refetchComments) refetchComments();
    } catch (e) {
      console.error(e);
    }
  };

  const formattedTime = formatDistanceToNow(new Date(reel.created_at), {
    addSuffix: true,
    locale: isRTL ? ar : undefined,
  });

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(commentId, {
      onSuccess: () => {
        refetchComments();
      }
    });
  };

  const toggleExpandReplies = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
      // Initialize showing 3 replies
      setReplyVisibilityCount(prev => new Map(prev).set(commentId, 3));
    }
    setExpandedComments(newExpanded);
  };

  const loadMoreReplies = (commentId: string) => {
    setReplyVisibilityCount(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(commentId) || 3;
      newMap.set(commentId, currentCount + 3);
      return newMap;
    });
  };

  const countReplies = (reply: any): number => {
    let count = 1;
    if (reply.replies && reply.replies.length > 0) {
      count += reply.replies.reduce((sum: number, r: any) => sum + countReplies(r), 0);
    }
    return count;
  };

  const getTotalReplyCount = (replies: any[]): number => {
    let count = 0;
    for (const reply of replies) {
      count += countReplies(reply);
    }
    return count;
  };

  const renderReplyThread = (reply: any) => {
    const isExpanded = expandedComments.has(reply.id);
    const allReplies = reply.replies || [];
    const visibleCount = replyVisibilityCount.get(reply.id) || 0;
    const visibleReplies = allReplies.slice(0, visibleCount);
    const hasMoreReplies = allReplies.length > visibleCount;
    const totalReplyCount = allReplies.reduce((sum: number, r: any) => sum + countReplies(r), 0);

    return (
      <div key={reply.id}>
        {/* Reply */}
        <div className={cn("flex gap-2 group", isRTL && "flex-row-reverse")}>
          <Link href={`/user?id=${reply.user_id}`}>
            <Avatar className="w-6 h-6 border border-border/50 flex-shrink-0 group-hover:border-primary/40 transition-all duration-200">
              <AvatarImage src={reply.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + reply.user_id} />
              <AvatarFallback>{reply.profile?.username?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className={cn("flex items-center gap-1.5 flex-wrap", isRTL && "flex-row-reverse")}>
              <Link href={`/user?id=${reply.user_id}`} className="font-bold text-xs hover:opacity-80 transition-opacity">
                {reply.profile?.username}
              </Link>
              <div className="flex items-center gap-0.5">
                {reply.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={reply.profile?.verified_at} />}
                {reply.profile?.is_official && <OfficialBadge size="sm" showText={false} />}
                {reply.profile?.is_creator && <CreatorBadge size="sm" />}
                {reply.profile?.is_premium && <PremiumBadge size="sm" />}
                {reply.profile?.is_popular && <PopularBadge size="sm" />}
                {reply.profile?.is_active && <ActiveBadge size="sm" />}
              </div>
              {(currentUser?.id === reply.user_id || currentUser?.id === reel?.user_id) && (
                <button
                  onClick={() => handleDeleteComment(reply.id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            {renderCommentContent(reply.content)}
            <div className={cn("flex items-center gap-2 mt-0.5", isRTL && "flex-row-reverse")}>
              <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
              {reply.likes_count > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Heart className="w-2.5 h-2.5 fill-destructive text-destructive" />
                  {reply.likes_count}
                </span>
              )}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleCommentLike.mutate(reply.id)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Heart className={cn("w-2.5 h-2.5", reply.is_liked && "fill-primary text-primary")} />
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(reply.id);
                    setCommentText(`@${reply.profile?.username} `);
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                >
                  <Reply className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">{isRTL ? "رد" : "Reply"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Replies Button or Nested Replies */}
        {totalReplyCount > 0 && (
          <>
            {!isExpanded ? (
              <button
                onClick={() => toggleExpandReplies(reply.id)}
                className={cn(
                  "mt-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium",
                  isRTL ? "mr-8" : "ml-8"
                )}
              >
                {isRTL ? `عرض ${totalReplyCount} رد` : `View ${totalReplyCount} ${totalReplyCount === 1 ? 'reply' : 'replies'}`}
              </button>
            ) : (
              <>
                <div className={cn(
                  "mt-2 space-y-2 py-2",
                  isRTL ? "mr-4 pr-2 border-r-2 border-primary/20" : "ml-4 pl-2 border-l-2 border-primary/20"
                )}>
                  {visibleReplies.map((nestedReply: any) => renderReplyThread(nestedReply))}
                </div>
                
                {hasMoreReplies && (
                  <button
                    onClick={() => loadMoreReplies(reply.id)}
                    className={cn(
                      "mt-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium",
                      isRTL ? "mr-8" : "ml-8"
                    )}
                  >
                    {isRTL ? `عرض ${allReplies.length - visibleCount} رد آخر` : `View ${allReplies.length - visibleCount} more ${allReplies.length - visibleCount === 1 ? 'reply' : 'replies'}`}
                  </button>
                )}
                
                <button
                  onClick={() => toggleExpandReplies(reply.id)}
                  className={cn(
                    "mt-2 text-xs text-muted-foreground hover:text-primary transition-colors font-medium",
                    isRTL ? "mr-8" : "ml-8"
                  )}
                >
                  {isRTL ? "إخفاء الردود" : "Hide replies"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[100dvh] md:h-[90vh] p-0 border-0 bg-black flex flex-col md:flex-row" hideDefaultClose>
        {/* Close Button */}
        <div className={cn("absolute z-50 top-4", isRTL ? "left-4 md:right-4" : "right-4")}>
          <button
            onClick={() => onOpenChange(false)}
            className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Section - Full Screen on Mobile */}
        <div className="flex-1 relative bg-black flex items-center justify-center group overflow-hidden">
          <video
            ref={videoRef}
            src={localReel.video_url}
            autoPlay
            muted
            onClick={handleVideoClick}
            onDoubleClick={handleDoubleTap}
            className="w-full h-full object-contain cursor-pointer"
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Center Play/Pause Button */}
          {showCenterButton && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
                {isPlaying ? (
                  <Pause className="w-20 h-20 fill-white text-white" />
                ) : (
                  <Play className="w-20 h-20 fill-white text-white ml-1" />
                )}
              </div>
            </div>
          )}

          {/* Video Controls */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 flex items-center justify-between transition-opacity duration-300 cursor-default hidden md:flex"
              onMouseEnter={() => {
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
              }}
              onMouseLeave={() => {
                if (isPlaying) {
                  controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
                }
              }}
            >
              <button
                onClick={togglePlayPause}
                className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-2 relative group/volume">
                <button
                  onClick={toggleMute}
                  className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <div className="hidden group-hover/volume:flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 transition-all duration-200">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
                    className="w-20 h-1 bg-white/20 rounded-full accent-white cursor-pointer"
                  />
                  <span className="text-white text-xs font-medium min-w-[2.5rem] text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons - Desktop Only */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10 hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10 hidden md:flex"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Floating Hearts */}
          {floatingHearts.map(heart => (
            <div
              key={heart.id}
              className="absolute pointer-events-none animate-pulse"
              style={{
                left: `${heart.left}%`,
                top: `${heart.top}%`,
                animation: 'float 1.2s ease-out forwards'
              }}
            >
              <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-lg" />
            </div>
          ))}

          {/* Side Action Buttons - Mobile Only */}
          <div className={cn(
            "absolute bottom-24 flex flex-col gap-6 md:hidden z-30",
            isRTL ? "left-4" : "right-4"
          )}>
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="bg-black/30 group-hover:bg-pink-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20">
                <Heart className={cn(
                  "w-6 h-6 transition-colors",
                  localReel.is_liked ? "fill-pink-500 text-pink-500" : "text-white"
                )} />
              </div>
              <span className="text-white text-xs font-semibold">{localReel.likes_count}</span>
            </button>

            <button
              className="flex flex-col items-center gap-1 group"
              onClick={() => setShowMobileComments(true)}
            >
              <div className="bg-black/30 group-hover:bg-blue-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-semibold">{comments.length}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={cn(
                "bg-black/30 group-hover:bg-green-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20",
                shareSuccess && "bg-green-500/40"
              )}>
                <Share2 className={cn(
                  "w-6 h-6 transition-colors",
                  shareSuccess ? "text-green-500" : "text-white"
                )} />
              </div>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <div className="bg-black/30 group-hover:bg-purple-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20">
                <MoreVertical className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>

          {/* User Info & Caption - Mobile Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 md:hidden bg-gradient-to-t from-black via-black/80 to-transparent p-4 space-y-3">
            <Link href={`/user?id=${localReel.user_id}`}>
              <div className={cn("flex items-center gap-2 cursor-pointer group", isRTL && "flex-row-reverse")}>
                <Avatar className="w-10 h-10 ring-2 ring-pink-500/30 group-hover:ring-pink-500/60 transition-all">
                  <AvatarImage src={localReel.user?.avatar_url} />
                  <AvatarFallback>{localReel.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm flex items-center gap-1">
                    {localReel.user?.username}
                    {localReel.user?.is_verified && <VerifiedBadge size="sm" />}
                  </p>
                  <p className="text-xs text-white/60">{formattedTime}</p>
                </div>
              </div>
            </Link>

            {localReel.caption && (
              <p className="text-sm text-white/90 leading-relaxed break-words">{localReel.caption}</p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Comments & Actions - Desktop Only */}
        <div className={cn(
          "hidden md:flex w-96 h-full bg-gradient-to-b from-black/90 via-black/80 to-black/90 border-l border-neutral-800 flex-col backdrop-blur-xl",
          isRTL && "border-l-0 border-r"
        )}>
            {/* User Info & Caption */}
            <div className="flex-none p-6 border-b border-neutral-800 space-y-4">
              <Link href={`/user?id=${localReel.user_id}`}>
                <div className={cn("flex items-center gap-3 cursor-pointer group", isRTL && "flex-row-reverse")}>
                  <Avatar className="w-12 h-12 ring-2 ring-pink-500/30 group-hover:ring-pink-500/60 transition-all">
                    <AvatarImage src={localReel.user?.avatar_url} />
                    <AvatarFallback>{localReel.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white group-hover:text-pink-400 transition-colors flex items-center gap-1.5 flex-wrap">
                      {localReel.user?.username}
                      {localReel.user?.is_verified && <VerifiedBadge size="sm" />}
                      {localReel.user?.is_official && <OfficialBadge size="sm" showText={false} />}
                      {localReel.user?.is_creator && <CreatorBadge size="sm" />}
                      {localReel.user?.is_premium && <PremiumBadge size="sm" />}
                      {localReel.user?.is_popular && <PopularBadge size="sm" />}
                      {localReel.user?.is_active && <ActiveBadge size="sm" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{formattedTime}</p>
                  </div>
                </div>
              </Link>

              {localReel.caption && (
                <p className="text-sm text-white/80 leading-relaxed break-words">{localReel.caption}</p>
              )}
            </div>

            {/* Comments List */}
            <ScrollArea className="flex-1">
              <div className="space-y-2 sm:space-y-3 px-4 py-4">
                {commentsLoading ? (
                  <div className="text-center text-muted-foreground text-xs sm:text-sm py-4 sm:py-8">
                    <div className="inline-block animate-spin">⌛</div>
                    <p className="mt-1 sm:mt-2">{isRTL ? "جاري تحميل التعليقات..." : "Loading comments..."}</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs sm:text-sm py-4 sm:py-8">
                    💬
                    <p className="mt-1 sm:mt-2">{isRTL ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
                  </div>
                ) : (
                  comments.map((comment: any, index: number) => (
                    <div 
                      key={comment.id}
                      className={cn(
                        "animate-in fade-in-50 slide-in-from-bottom-2 duration-300",
                        comment.profile?.is_official && "official-comment"
                      )}
                      style={comment.profile?.is_official ? { animationDelay: `${index * 0.05}s` } : { animationDelay: `${index * 0.03}s` }}
                    >
                      <div className={cn(
                        "p-2 sm:p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                        comment.profile?.is_official 
                          ? "official-comment-card bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-500/10" 
                          : "bg-muted/40 border-border/50 hover:border-primary/30 hover:bg-muted/60"
                      )}>
                        {/* Official Badge */}
                        {comment.profile?.is_official && (
                          <div className="official-comment-badge mb-2">الحساب الرسمي</div>
                        )}
                        
                        {/* Main Comment */}
                        <div className="flex gap-3 group">
                          <Link href={`/user?id=${comment.user_id}`}>
                            <Avatar className={cn(
                              "flex-shrink-0 border transition-all duration-200",
                              comment.profile?.is_official ? "w-8 h-8 border-primary/40 ring-2 ring-primary/10" : "w-8 h-8 border-border/50 group-hover:border-primary/40 group-hover:ring-2 group-hover:ring-primary/10"
                            )}>
                              <AvatarImage src={comment.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + comment.user_id} />
                              <AvatarFallback>{comment.profile?.username?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/user?id=${comment.user_id}`} className={cn(
                                  "hover:opacity-80 transition-opacity",
                                  comment.profile?.is_official ? "official-username text-sm font-bold" : "font-bold text-sm"
                                )}>
                                  {comment.profile?.username}
                                </Link>
                                <div className="flex items-center gap-0.5">
                                  {comment.profile?.is_official && (
                                    <div className="w-5 h-5 rounded-full bg-cover flex-shrink-0" style={{ backgroundImage: "url('/official-badge.png')" }} />
                                  )}
                                  {comment.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={comment.profile?.verified_at} />}
                                  {comment.profile?.is_creator && <CreatorBadge size="sm" />}
                                  {comment.profile?.is_premium && <PremiumBadge size="sm" />}
                                  {comment.profile?.is_popular && <PopularBadge size="sm" />}
                                  {comment.profile?.is_active && <ActiveBadge size="sm" />}
                                </div>
                              </div>
                              {(currentUser?.id === comment.user_id || currentUser?.id === reel?.user_id) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {renderCommentContent(comment.content, comment.profile?.is_official)}
                            <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs flex-wrap">
                              <span className="text-muted-foreground text-xs">{formatTime(comment.created_at)}</span>
                              {comment.likes_count > 0 && (
                                <span className="text-muted-foreground flex items-center gap-0.5">
                                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-destructive text-destructive" />
                                  {comment.likes_count}
                                </span>
                              )}
                              <div className="flex items-center gap-1 sm:gap-2 opacity-0 sm:opacity-100 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleCommentLike.mutate(comment.id)}
                                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                                >
                                  <Heart className={cn("w-3 h-3", comment.is_liked && "fill-primary text-primary")} />
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(comment.id);
                                    setCommentText(`@${comment.profile?.username} `);
                                  }}
                                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 p-1"
                                >
                                  <Reply className="w-3 h-3" />
                                  <span className="hidden sm:inline">{isRTL ? "رد" : "Reply"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* View Replies Button - Main Comment Level */}
                      {comment.replies && comment.replies.length > 0 && (
                        <>
                          {!expandedComments.has(comment.id) ? (
                            <button
                              onClick={() => toggleExpandReplies(comment.id)}
                              className={cn(
                                "mt-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium",
                                isRTL ? "mr-6" : "ml-6"
                              )}
                            >
                              {(() => {
                                const totalCount = getTotalReplyCount(comment.replies || []);
                                return isRTL ? `عرض ${totalCount} رد` : `View ${totalCount} ${totalCount === 1 ? 'reply' : 'replies'}`;
                              })()}
                            </button>
                          ) : (
                            <>
                              <div className={cn(
                                "mt-2 space-y-2 py-2",
                                isRTL ? "mr-4 pr-2 border-r-2 border-primary/20" : "ml-4 pl-2 border-l-2 border-primary/20"
                              )}>
                                {comment.replies.map((reply: any) => renderReplyThread(reply))}
                              </div>
                              <button
                                onClick={() => toggleExpandReplies(comment.id)}
                                className={cn(
                                  "mt-2 text-xs text-muted-foreground hover:text-primary transition-colors font-medium",
                                  isRTL ? "mr-6" : "ml-6"
                                )}
                              >
                                {isRTL ? "إخفاء الردود" : "Hide replies"}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex-none border-t border-neutral-800 p-4 space-y-4 bg-black/50">
              {/* Like & Comment Count */}
              <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-2 group"
                  >
                    <div className="bg-neutral-800/50 group-hover:bg-pink-500/20 p-2.5 rounded-full transition-all">
                      <Heart className={cn(
                        "w-5 h-5 transition-colors",
                        localReel.is_liked ? "fill-pink-500 text-pink-500" : "text-white group-hover:text-pink-500"
                      )} />
                    </div>
                    <span className="text-white font-semibold text-sm">{localReel.likes_count}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="bg-neutral-800/50 p-2.5 rounded-full">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">{comments.length}</span>
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  className="group"
                >
                  <div className={cn(
                    "bg-neutral-800/50 group-hover:bg-blue-500/20 p-2.5 rounded-full transition-all",
                    shareSuccess && "bg-green-500/20"
                  )}>
                    <Share2 className={cn(
                      "w-5 h-5 transition-colors",
                      shareSuccess ? "text-green-500" : "text-white group-hover:text-blue-500"
                    )} />
                  </div>
                </button>
              </div>

              {/* Reply Indicator */}
              {replyingTo && (
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-primary/10 border border-primary/20 rounded text-xs text-primary transition-all duration-200">
                  <Reply className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium flex-1 truncate">{isRTL ? "رد" : "Reply"}</span>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setCommentText("");
                    }}
                    className="p-0.5 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
                    title={isRTL ? "إلغاء" : "Cancel"}
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              )}

              {/* GIF Picker — desktop */}
              {showDesktopGifPicker && (
                <div className="mb-2">
                  <GifPicker isRTL={isRTL} height={240} onSelect={(url) => handleGifSelect(url, false)} />
                </div>
              )}

              {/* Comment Input */}
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={currentUser?.avatar_url || undefined} />
                  <AvatarFallback>{(currentUser?.username?.[0] || "U").toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder={isRTL ? "أضف تعليق..." : "Add a comment..."}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-muted-foreground focus:border-pink-500 h-10 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDesktopGifPicker(p => !p)}
                    className={cn("h-10 w-10 flex-shrink-0", showDesktopGifPicker && "text-pink-400")}
                    title="GIF"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || createComment.isPending}
                    size="sm"
                    className="bg-pink-500 hover:bg-pink-600 text-white px-3 h-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
        </div>
      </DialogContent>

      {/* Mobile Comments Sheet */}
      <Sheet open={showMobileComments} onOpenChange={setShowMobileComments}>
        <SheetContent side="bottom" className={cn("h-[85vh] bg-black/95 border-neutral-800 flex flex-col p-0", isRTL && "dir-rtl")}>
          <SheetHeader className="border-b border-neutral-800 p-4 pb-3">
            <SheetTitle className="text-white text-center text-lg">
              {isRTL ? "التعليقات" : "Comments"} ({comments.length})
            </SheetTitle>
          </SheetHeader>

          {/* Comments List */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-2 px-4 py-3">
              {commentsLoading ? (
                <div className="text-center text-muted-foreground text-xs py-8">
                  <div className="inline-block animate-spin">⌛</div>
                  <p className="mt-2">{isRTL ? "جاري تحميل التعليقات..." : "Loading comments..."}</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-8">
                  💬
                  <p className="mt-2">{isRTL ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
                </div>
              ) : (
                comments.map((comment: any, index: number) => (
                  <div 
                    key={comment.id}
                    className={cn(
                      "animate-in fade-in-50 slide-in-from-bottom-2 duration-300",
                      comment.profile?.is_official && "official-comment"
                    )}
                    style={comment.profile?.is_official ? { animationDelay: `${index * 0.05}s` } : { animationDelay: `${index * 0.03}s` }}
                  >
                    <div className={cn(
                      "p-3 rounded-lg border transition-all duration-200",
                      comment.profile?.is_official 
                        ? "official-comment-card bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-500/10" 
                        : "bg-muted/40 border-border/50 hover:border-primary/30 hover:bg-muted/60"
                    )}>
                      {/* Official Badge */}
                      {comment.profile?.is_official && (
                        <div className="official-comment-badge mb-2 text-xs">الحساب الرسمي</div>
                      )}
                      
                      {/* Main Comment */}
                      <div className={cn("flex gap-2 group", isRTL && "flex-row-reverse")}>
                        <Link href={`/user?id=${comment.user_id}`}>
                          <Avatar className={cn(
                            "flex-shrink-0 border transition-all duration-200",
                            comment.profile?.is_official ? "w-9 h-9 border-primary/40 ring-2 ring-primary/10" : "w-9 h-9 border-border/50 group-hover:border-primary/40 group-hover:ring-2 group-hover:ring-primary/10"
                          )}>
                            <AvatarImage src={comment.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + comment.user_id} />
                            <AvatarFallback>{comment.profile?.username?.[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className={cn("flex items-center gap-1 flex-wrap", isRTL && "flex-row-reverse")}>
                            <Link href={`/user?id=${comment.user_id}`} className={cn(
                              "hover:opacity-80 transition-opacity text-sm font-bold",
                              comment.profile?.is_official ? "official-username" : ""
                            )}>
                              {comment.profile?.username}
                            </Link>
                            <div className="flex items-center gap-0.5">
                              {comment.profile?.is_official && (
                                <div className="w-4 h-4 rounded-full bg-cover flex-shrink-0" style={{ backgroundImage: "url('/official-badge.png')" }} />
                              )}
                              {comment.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={comment.profile?.verified_at} />}
                              {comment.profile?.is_creator && <CreatorBadge size="sm" />}
                              {comment.profile?.is_premium && <PremiumBadge size="sm" />}
                              {comment.profile?.is_popular && <PopularBadge size="sm" />}
                              {comment.profile?.is_active && <ActiveBadge size="sm" />}
                            </div>
                            {(currentUser?.id === comment.user_id || currentUser?.id === reel?.user_id) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          {renderCommentContent(comment.content, comment.profile?.is_official)}
                          <div className={cn("flex items-center gap-1.5 mt-1.5 text-xs flex-wrap", isRTL && "flex-row-reverse")}>
                            <span className="text-muted-foreground text-xs">{formatTime(comment.created_at)}</span>
                            {comment.likes_count > 0 && (
                              <span className="text-muted-foreground flex items-center gap-0.5">
                                <Heart className="w-2 h-2 fill-destructive text-destructive" />
                                {comment.likes_count}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => toggleCommentLike.mutate(comment.id)}
                                className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                              >
                                <Heart className={cn("w-2.5 h-2.5", comment.is_liked && "fill-primary text-primary")} />
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingTo(comment.id);
                                  setCommentText(`@${comment.profile?.username} `);
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 p-0.5"
                              >
                                <Reply className="w-2.5 h-2.5" />
                                <span className="text-xs">{isRTL ? "رد" : "Reply"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* View Replies Button - Main Comment Level */}
                    {comment.replies && comment.replies.length > 0 && (
                      <>
                        {!expandedComments.has(comment.id) ? (
                          <button
                            onClick={() => toggleExpandReplies(comment.id)}
                            className={cn(
                              "mt-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium",
                              isRTL ? "mr-4" : "ml-4"
                            )}
                          >
                            {(() => {
                              const totalCount = getTotalReplyCount(comment.replies || []);
                              return isRTL ? `عرض ${totalCount} رد` : `View ${totalCount} ${totalCount === 1 ? 'reply' : 'replies'}`;
                            })()}
                          </button>
                        ) : (
                          <>
                            <div className={cn(
                              "mt-2 space-y-2 py-2",
                              isRTL ? "mr-2 pr-2 border-r-2 border-primary/20" : "ml-2 pl-2 border-l-2 border-primary/20"
                            )}>
                              {comment.replies.map((reply: any) => renderReplyThread(reply))}
                            </div>
                            <button
                              onClick={() => toggleExpandReplies(comment.id)}
                              className={cn(
                                "mt-2 text-xs text-muted-foreground hover:text-primary transition-colors font-medium",
                                isRTL ? "mr-4" : "ml-4"
                              )}
                            >
                              {isRTL ? "إخفاء الردود" : "Hide replies"}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions Bar */}
          <div className="flex-none border-t border-neutral-800 p-3 space-y-2 bg-black/50">
            {/* Reply Indicator */}
            {replyingTo && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary transition-all duration-200">
                <Reply className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="font-medium flex-1 truncate">{isRTL ? "رد" : "Reply"}</span>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setCommentText("");
                  }}
                  className="p-0.5 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
                  title={isRTL ? "إلغاء" : "Cancel"}
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            )}

            {/* GIF Picker — mobile */}
            {showMobileGifPicker && (
              <div className="mb-2">
                <GifPicker isRTL={isRTL} height={220} onSelect={(url) => handleGifSelect(url, true)} />
              </div>
            )}

            {/* Comment Input */}
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar_url || undefined} />
                <AvatarFallback>{(currentUser?.username?.[0] || "U").toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-1.5">
                <Input
                  placeholder={isRTL ? "أضف تعليق..." : "Add a comment..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-muted-foreground focus:border-pink-500 h-9 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileGifPicker(p => !p)}
                  className={cn("h-9 w-9 flex-shrink-0", showMobileGifPicker && "text-pink-400")}
                  title="GIF"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || createComment.isPending}
                  size="sm"
                  className="bg-pink-500 hover:bg-pink-600 text-white px-2.5 h-9"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <style>{`
        @keyframes float {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.5);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1);
          }
        }
      `}</style>
    </Dialog>
  );
}
