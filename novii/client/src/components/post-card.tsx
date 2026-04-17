import type { Post } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2, MapPin, Check, BarChart3, Pin, Eye, MessageSquare, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface FloatingHeart {
  id: string;
  left: number;
  size: number;
}
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { VerifiedUsername } from "@/components/ui/verified-username";
import { OfficialBadge } from "@/components/ui/official-badge";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";
import { useToggleLike, useToggleSave, useCurrentUser, useDeletePost, useTogglePinPost, useToggleHideLikes, useToggleRepliesDisabled, useRecordPostView, usePostInsights } from "@/hooks/use-data";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";
import { PostViewerModal } from "./post-viewer-modal";
import { PostCommentsSheet } from "./post-comments-sheet";
import { UserHoverCard } from "./user-hover-card";
import { StoryAwareAvatar } from "./story-aware-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { useLanguage } from "@/lib/language-context";
import { useSettings } from "@/lib/settings-context";
import { ReportDialog } from "./report-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [isDoubleTapLiked, setIsDoubleTapLiked] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isPinned, setIsPinned] = useState(post.is_pinned ?? false);
  const hideLikes = post.hide_likes ?? false;
  const repliesDisabled = post.replies_disabled ?? false;
  const [showInsights, setShowInsights] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const deletePost = useDeletePost();
  const togglePin = useTogglePinPost();
  const toggleHideLikes = useToggleHideLikes();
  const toggleReplies = useToggleRepliesDisabled();
  const recordView = useRecordPostView();
  const { data: insights } = usePostInsights(showInsights ? post.id : '');
  
  const { data: currentUser } = useCurrentUser();
  const { direction } = useLanguage();
  const isMobile = useIsMobile();
  const { containerRef, overlay } = usePinchZoom();
  const { settings } = useSettings();
  const t = direction === "rtl";
  const shouldHideLikes = hideLikes || (currentUser?.id === post.user_id ? settings.likes.hide_like_counts_own : settings.likes.hide_like_counts_others);

  // Record view when post is viewed
  useEffect(() => {
    recordView.mutate(post.id);
  }, [post.id]);

  const createFloatingHearts = () => {
    const newHearts: FloatingHeart[] = [];
    const heartCount = 3 + Math.random() * 3; // 3-6 قلوب
    
    for (let i = 0; i < heartCount; i++) {
      const id = Math.random().toString(36).substr(2, 9);
      const left = Math.random() * 60 + 20; // يسار عشوائي 20%-80%
      const size = 20 + Math.random() * 30; // حجم عشوائي 20-50px
      
      newHearts.push({ id, left, size });
    }
    
    setFloatingHearts(prev => [...prev, ...newHearts]);
    
    // إزالة القلوب بعد الانتهاء من الـ animation
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 2000);
  };

  const handleLike = () => {
    toggleLike.mutate(post.id);
    createFloatingHearts();
  };

  const handleSave = () => {
    toggleSave.mutate(post.id);
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const renderCaptionWithHashtags = (caption: string | null) => {
    if (!caption) return null;
    
    const parts = caption.split(/(#[\w\u0600-\u06FF]+)/g);
    return (
      <span className="text-foreground/90 leading-relaxed">
        {parts.map((part, i) => {
          if (part?.startsWith('#') && part.length > 1) {
            const tagName = part.slice(1);
            return (
              <Link
                key={i}
                href={`/hashtag/${tagName}`}
                className="text-primary font-medium hover:text-primary/80 transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </Link>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const handleDoubleTap = () => {
    if (!post.is_liked) {
      toggleLike.mutate(post.id);
    }
    setIsDoubleTapLiked(true);
    createFloatingHearts();
    setTimeout(() => setIsDoubleTapLiked(false), 1000);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col w-full bg-card lg:border lg:rounded-3xl overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5 duration-500 lg:shadow-lg lg:hover:shadow-2xl lg:transition-shadow lg:duration-300 lg:border-primary/20 lg:hover:border-primary/40">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/30">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Avatar — standalone, story-aware (no HoverCard here to avoid conflict) */}
          <StoryAwareAvatar
            userId={post.user_id}
            avatarUrl={post.profile?.avatar_url}
            username={post.profile?.username}
            sizeClass="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16"
          />
          {/* Username + time + location — HoverCard triggers on the name */}
          <UserHoverCard userId={post.user_id}>
          <Link href={`/user?id=${post.user_id}`} className="flex flex-col leading-tight min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1 flex-wrap">
              <VerifiedUsername
                username={post.profile?.username || ""}
                isVerified={post.profile?.is_verified}
                className="text-sm sm:text-base lg:text-lg font-semibold truncate"
              />
              <div className="flex items-center gap-0.5 flex-wrap">
                {post.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={post.profile?.verified_at} />}
                {post.profile?.is_official && <OfficialBadge size="sm" showText={false} />}
                {post.profile?.is_creator && <CreatorBadge size="sm" />}
                {post.profile?.is_premium && <PremiumBadge size="sm" />}
                {post.profile?.is_popular && <PopularBadge size="sm" />}
                {post.profile?.is_active && <ActiveBadge size="sm" />}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span>{formatTime(post.created_at)}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{post.location}</span>
                  </div>
                </>
              )}
            </div>
          </Link>
          </UserHoverCard>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={t ? "rtl" : ""}>
            {currentUser?.id === post.user_id && (
              <>
                {/* الرؤى */}
                <DropdownMenuItem 
                  onClick={() => setShowInsights(!showInsights)}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{t ? "الرؤى" : "Insights"}</span>
                  <BarChart3 className="w-4 h-4" />
                </DropdownMenuItem>
                
                {/* حفظ */}
                <DropdownMenuItem 
                  onClick={handleSave}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{t ? "حفظ" : "Save"}</span>
                  <Bookmark className={cn("w-4 h-4", post.is_saved ? "fill-primary text-primary" : "")} />
                </DropdownMenuItem>
                
                {/* تثبيت */}
                <DropdownMenuItem 
                  onClick={() => {
                    togglePin.mutate(post.id);
                    setIsPinned(!isPinned);
                  }}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{t ? "تثبيت في الملف الشخصي" : "Pin to Profile"}</span>
                  <Pin className={cn("w-4 h-4", isPinned ? "text-primary fill-primary" : "")} />
                </DropdownMenuItem>
                
                {/* إخفاء الإعجابات */}
                <DropdownMenuItem 
                  onClick={() => {
                    toggleHideLikes.mutate(post.id);
                  }}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{t ? "إخفاء تسجيلات الإعجاب" : "Hide Likes"}</span>
                  <Eye className={cn("w-4 h-4", hideLikes ? "text-primary" : "")} />
                </DropdownMenuItem>
                
                {/* خيارات الرد */}
                <DropdownMenuItem 
                  onClick={() => {
                    toggleReplies.mutate(post.id);
                    setRepliesDisabled(!repliesDisabled);
                  }}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{t ? "خيارات الرد" : "Reply Settings"}</span>
                  <MessageSquare className={cn("w-4 h-4", repliesDisabled ? "text-primary" : "")} />
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* نسخ الرابط */}
                <DropdownMenuItem 
                  onClick={handleShare}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{t ? "نسخ الرابط" : "Copy Link"}</span>
                  {shareSuccess ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <LinkIcon className="w-4 h-4" />
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* حذف */}
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{t ? "حذف" : "Delete"}</span>
                  <Trash2 className="w-4 h-4" />
                </DropdownMenuItem>
              </>
            )}
            {currentUser?.id !== post.user_id && (
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
              >
                {t ? "الإبلاغ عن المنشور" : "Report Post"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-square lg:aspect-[4/5] bg-muted overflow-hidden cursor-pointer group"
        onDoubleClick={handleDoubleTap}
        style={{ touchAction: "pan-y" }}
      >
        <img 
            src={post.image_url || "https://via.placeholder.com/600x600?text=No+Image"} 
            alt="Post content" 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            draggable={false}
        />

        {/* Pinch-zoom overlay — renders outside overflow-hidden via portal */}
        {overlay.active && createPortal(
          <div
            style={{
              position: "fixed",
              left: overlay.x,
              top: overlay.y,
              width: overlay.width,
              height: overlay.height,
              transform: `scale(${overlay.scale})`,
              transformOrigin: `${overlay.originX}% ${overlay.originY}%`,
              transition: overlay.releasing ? "transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
              zIndex: 9999,
              pointerEvents: "none",
              overflow: "hidden",
              borderRadius: "inherit",
            }}
          >
            <img
              src={post.image_url || "https://via.placeholder.com/600x600?text=No+Image"}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
          </div>,
          document.body
        )}
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Heart Animation Overlay */}
        <div className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
            isDoubleTapLiked ? "opacity-100" : "opacity-0"
        )}>
            <div className="relative">
              <Heart className="w-24 h-24 text-white fill-white animate-bounce drop-shadow-2xl" />
              <Heart className="absolute inset-0 w-24 h-24 text-red-500/30 fill-red-500/20 animate-ping" />
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 sm:p-4 pb-2 flex items-center justify-between bg-gradient-to-r from-transparent via-primary/5 to-transparent">
        <div className="flex items-center gap-3 sm:gap-4">
            <button 
                onClick={handleLike}
                className="group focus:outline-none relative"
                data-testid={`button-like-${post.id}`}
            >
                <Heart className={cn(
                    "w-7 h-7 transition-all duration-300 group-active:scale-75 group-hover:scale-110",
                    post.is_liked ? "fill-destructive text-destructive drop-shadow-md" : "text-foreground hover:text-destructive/70"
                )} />
                {post.is_liked && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                )}
            </button>
            
            <button 
                onClick={() => isMobile ? setShowCommentsSheet(true) : setShowPostModal(true)}
                className="group focus:outline-none hover:text-primary transition-all duration-300 hover:scale-110"
            >
                <MessageCircle className="w-7 h-7 -rotate-90" />
            </button>

            <button 
              onClick={handleShare}
              className="group focus:outline-none hover:text-primary transition-all duration-300 hover:scale-110 relative"
            >
                {shareSuccess ? (
                  <Check className="w-7 h-7 text-green-500" />
                ) : (
                  <Share2 className="w-7 h-7" />
                )}
            </button>
        </div>

        <button 
          onClick={handleSave}
          className="group focus:outline-none hover:text-primary transition-all duration-300 hover:scale-110"
        >
            <Bookmark className={cn(
              "w-7 h-7 transition-all duration-300",
              post.is_saved ? "fill-primary text-primary drop-shadow-md" : ""
            )} />
        </button>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 pb-0 sm:pb-6 space-y-3">
        {/* Likes Counter - Hidden if hide_likes is true */}
        {!shouldHideLikes && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-destructive/40 to-destructive/20 flex items-center justify-center">
              <Heart className="w-3 h-3 text-destructive fill-destructive" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {post.likes_count.toLocaleString()} {t ? "إعجاب" : "likes"}
            </span>
          </div>
        )}
        
        {/* Caption */}
        <div className="text-sm space-y-2">
            <div className="flex items-start gap-1">
              <Link href={`/user?id=${post.user_id}`} className="inline-flex items-center gap-1 font-bold hover:opacity-80 transition-opacity flex-shrink-0">
                {post.profile?.username}
                {post.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={post.profile?.verified_at} />}
              </Link>
              <span className="flex-1">
                {renderCaptionWithHashtags(post.caption)}
              </span>
            </div>
        </div>
        
        {/* Comments Link */}
        {post.comments_count > 0 && (
            <div 
                onClick={() => isMobile ? setShowCommentsSheet(true) : setShowPostModal(true)}
                className="text-primary text-sm font-semibold cursor-pointer hover:text-primary/80 transition-colors flex items-center gap-1"
            >
                <MessageCircle className="w-4 h-4 -rotate-90" />
                عرض التعليقات ({post.comments_count})
            </div>
        )}
      </div>

      <PostViewerModal 
        post={post}
        open={showPostModal}
        onOpenChange={setShowPostModal}
        isRTL={direction === 'rtl'}
      />

      <PostCommentsSheet
        postId={post.id}
        open={showCommentsSheet}
        onClose={() => setShowCommentsSheet(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className={t ? "rtl" : ""}>
          <AlertDialogTitle>{t ? "حذف المنشور" : "Delete Post"}</AlertDialogTitle>
          <AlertDialogDescription>
            {t ? "هل أنت متأكد من رغبتك في حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this post? This action cannot be undone."}
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>{t ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deletePost.mutate(post.id, {
                  onSuccess: () => {
                    setShowDeleteConfirm(false);
                  }
                });
              }}
              disabled={deletePost.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletePost.isPending ? (t ? "جاري الحذف..." : "Deleting...") : (t ? "حذف" : "Delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Hearts Container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="floating-heart fixed text-destructive drop-shadow-lg"
            style={{
              left: `${heart.left}%`,
              bottom: '0',
              fontSize: `${heart.size}px`,
              width: `${heart.size}px`,
              height: `${heart.size}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart
              className="w-full h-full fill-destructive text-destructive"
              style={{
                filter: `drop-shadow(0 0 ${heart.size / 4}px rgba(239, 68, 68, 0.5))`,
              }}
            />
          </div>
        ))}
      </div>

      <ReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        postId={post.id}
        reportedUserId={post.user_id}
      />
    </div>
  );
}
