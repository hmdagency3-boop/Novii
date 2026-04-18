import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Heart, MessageCircle, Share2, Bookmark, X, Send, Reply, Trash2, ChevronDown, MoreHorizontal, BarChart3, Pin, Eye, MessageSquare, Link as LinkIcon, Check, ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { VerifiedUsername } from "@/components/ui/verified-username";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";
import { useToggleLike, useToggleSave, useComments, useCreateComment, useToggleCommentLike, useDeleteComment, useCurrentUser, useTogglePinPost, useToggleHideLikes, useToggleRepliesDisabled, useDeletePost, useTypingIndicator } from "@/hooks/use-data";
import { useLanguage } from "@/lib/language-context";
import { useSettings } from "@/lib/settings-context";
import { timeAgo } from "@/lib/time-ago";
import { MentionAutocomplete } from "./mention-autocomplete";
import { GifPicker } from "./gif-picker";
import "@/components/official-comment.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Post, Comment } from "@/lib/api";

interface PostViewerModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRTL?: boolean;
}

interface FloatingHeart {
  id: string;
  left: number;
  size: number;
}

export function PostViewerModal({ post, open, onOpenChange, isRTL }: PostViewerModalProps) {
  const [isDoubleTapLiked, setIsDoubleTapLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPinned, setIsPinned] = useState(post?.is_pinned ?? false);
  const hideLikes = post?.hide_likes ?? false;
  const repliesDisabled = post?.replies_disabled ?? false;
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const toggleCommentLike = useToggleCommentLike();
  const deleteComment = useDeleteComment();
  const togglePin = useTogglePinPost();
  const toggleHideLikes = useToggleHideLikes();
  const toggleReplies = useToggleRepliesDisabled();
  const deletePost = useDeletePost();
  const { data: currentUser } = useCurrentUser();
  const { data: comments = [], isLoading: commentsLoading } = useComments(post?.id || "");
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(post?.id || "", currentUser?.id || "");
  const createComment = useCreateComment();
  const { direction, language } = useLanguage();
  const { blockedIds, restrictedIds, settings } = useSettings();
  const t = direction === "rtl";

  const hiddenWords = settings.hidden_words.enabled ? settings.hidden_words.custom_words.map(w => w.toLowerCase()) : [];

  const filteredComments = comments.filter(c => {
    if (blockedIds.has(c.user_id)) return false;
    if (restrictedIds.has(c.user_id) && post?.user_id === currentUser?.id) return false;
    if (hiddenWords.length > 0 && c.content) {
      const lower = c.content.toLowerCase();
      if (hiddenWords.some(w => lower.includes(w))) return false;
    }
    return true;
  });

  if (!post) return null;

  const handleLike = () => {
    toggleLike.mutate(post.id);
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

  const createFloatingHearts = () => {
    const newHearts: FloatingHeart[] = [];
    const heartCount = Math.floor(3 + Math.random() * 3);
    
    for (let i = 0; i < heartCount; i++) {
      const id = Math.random().toString(36).substr(2, 9);
      const left = Math.random() * 60 + 20;
      const size = 20 + Math.random() * 30;
      
      newHearts.push({ id, left, size });
    }
    
    setFloatingHearts(prev => [...prev, ...newHearts]);
    
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 2000);
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
      return timeAgo(new Date(dateString), language.code);
    } catch {
      return dateString;
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !selectedGif) return;
    
    stopTyping();
    if (typingTimeout) clearTimeout(typingTimeout);
    
    createComment.mutate(
      { postId: post.id, content: commentText, parentCommentId: replyingTo || undefined, gifUrl: selectedGif || undefined },
      {
        onSuccess: () => {
          setCommentText("");
          setSelectedGif(null);
          setReplyingTo(null);
        }
      }
    );
  };

  const handleCommentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommentText(e.target.value);
    setShowMentions(e.target.value.includes('@'));

    // Send typing indicator
    startTyping();

    // Clear existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Set new timeout to stop typing after 3 seconds of inactivity
    const newTimeout = setTimeout(() => {
      stopTyping();
    }, 3000);

    setTypingTimeout(newTimeout);
  };

  const handleSelectMention = (username: string) => {
    const lastAtIndex = commentText.lastIndexOf('@');
    const beforeMention = commentText.substring(0, lastAtIndex);
    setCommentText(`${beforeMention}@${username} `);
    setShowMentions(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideDefaultClose={true}
        className={cn(
          "max-w-full w-screen sm:max-w-2xl lg:max-w-4xl p-0 border-0 rounded-none sm:rounded-2xl",
          "h-screen sm:h-[90vh] md:h-[90vh]",
          isRTL && "rtl"
        )}>
        {/* Post Options Menu - Top Right (before close button) */}
        {currentUser?.id === post.user_id && (
          <div className="absolute top-3 sm:top-4 z-50 flex items-center gap-1" style={isRTL ? { left: '12px' } : { right: '50px' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className={t ? "rtl" : ""}>
                {/* الرؤى */}
                <DropdownMenuItem className="cursor-pointer flex items-center justify-between gap-2">
                  <span>{t ? "الرؤى" : "Insights"}</span>
                  <BarChart3 className="w-4 h-4" />
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Close Button - Large X */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 hover:bg-muted rounded-full transition-colors"
          title={isRTL ? "إغلاق" : "Close"}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="flex h-full flex-col md:flex-row overflow-hidden gap-0 md:gap-0">
          {/* Image Section - Mobile: 35-40% height, Desktop: 2/3 width */}
          <div 
            className="w-full md:w-2/3 h-[35vh] sm:h-[40vh] md:h-auto bg-black flex items-center justify-center relative group cursor-pointer flex-shrink-0"
            onDoubleClick={handleDoubleTap}
          >
            <img
              src={post.image_url || "https://via.placeholder.com/600x600?text=No+Image"}
              alt="Post"
              className="max-h-full max-w-full object-contain"
            />

            {/* Heart Animation */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
                isDoubleTapLiked ? "opacity-100" : "opacity-0"
              )}
            >
              <Heart className="w-16 sm:w-24 h-16 sm:h-24 text-white fill-white animate-bounce drop-shadow-2xl" />
            </div>
          </div>

          {/* Details Section - Mobile: full width with scroll, Desktop: 1/3 width */}
          <div className="w-full md:w-1/3 bg-background flex flex-col border-t md:border-t-0 md:border-l border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-2 sm:p-4 border-b border-border flex-shrink-0">
              <Link href={`/u/${post.profile?.username}`} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border border-border/50 flex-shrink-0">
                  <AvatarImage src={post.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.user_id} />
                  <AvatarFallback>{post.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm truncate">{post.profile?.username}</span>
                    <div className="flex items-center gap-0.5">
                      {post.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={post.profile?.verified_at} />}
                      {post.profile?.is_official && <OfficialBadge size="sm" showText={false} />}
                      {post.profile?.is_creator && <CreatorBadge size="sm" />}
                      {post.profile?.is_premium && <PremiumBadge size="sm" />}
                      {post.profile?.is_popular && <PopularBadge size="sm" />}
                      {post.profile?.is_active && <ActiveBadge size="sm" />}
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Caption & Comments Section */}
            <div className="flex-1 overflow-y-auto flex flex-col p-2 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
              {/* User Info & Caption */}
              <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-3 border-b border-border flex-shrink-0">
                <div className="flex gap-2 sm:gap-3">
                  <Link href={`/u/${post.profile?.username}`}>
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-border/50 flex-shrink-0">
                      <AvatarImage src={post.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.user_id} />
                      <AvatarFallback>{post.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/u/${post.profile?.username}`} className="font-bold text-xs sm:text-sm hover:opacity-80 transition-opacity block truncate">
                      {post.profile?.username}
                    </Link>
                    <p className="text-xs sm:text-sm text-foreground/80 mt-1 break-words">{post.caption}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">{formatTime(post.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-2 sm:space-y-3">
                {commentsLoading ? (
                  <div className="text-center text-muted-foreground text-xs sm:text-sm py-4 sm:py-8">
                    <div className="inline-block animate-spin">⌛</div>
                    <p className="mt-1 sm:mt-2">{isRTL ? "جاري تحميل التعليقات..." : "Loading comments..."}</p>
                  </div>
                ) : filteredComments.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs sm:text-sm py-4 sm:py-8">
                    💬
                    <p className="mt-1 sm:mt-2">{isRTL ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
                  </div>
                ) : (
                  filteredComments.map((comment, index) => (
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
                          <Link href={`/u/${comment.profile?.username}`}>
                            <Avatar className={cn(
                              "flex-shrink-0 border transition-all duration-200",
                              comment.profile?.is_official ? "w-8 h-8 border-primary/40 ring-2 ring-primary/10" : "w-8 h-8 border-border/50 group-hover:border-primary/40 group-hover:ring-2 group-hover:ring-primary/10"
                            )}>
                              <AvatarImage src={comment.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + comment.user_id} />
                              <AvatarFallback>{comment.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/u/${comment.profile?.username}`} className={cn(
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
                              {(currentUser?.id === comment.user_id || currentUser?.id === post.user_id) && (
                                <button
                                  onClick={() => setDeleteCommentId(comment.id)}
                                  className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className={cn(
                              "text-xs sm:text-sm mt-1 sm:mt-1.5 break-words",
                              comment.profile?.is_official ? "official-comment-content font-medium" : "text-foreground/85"
                            )}>
                              {comment.content}
                            </p>
                            {comment.gif_url && (
                              <img 
                                src={comment.gif_url} 
                                alt="Comment GIF" 
                                className="max-w-40 sm:max-w-56 h-auto rounded-lg mt-2 sm:mt-3"
                              />
                            )}
                            <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs flex-wrap">
                              <span className="text-muted-foreground text-xs">{formatTime(comment.created_at)}</span>
                              {comment.likes_count > 0 && (
                                <span className="text-muted-foreground flex items-center gap-0.5">
                                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-destructive text-destructive" />
                                  {comment.likes_count}
                                </span>
                              )}
                              {comment.replies && comment.replies.length > 0 && (
                                <button
                                  onClick={() => setExpandedReplies(prev => ({
                                    ...prev,
                                    [comment.id]: !prev[comment.id]
                                  }))}
                                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 text-xs p-1"
                                >
                                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", expandedReplies[comment.id] && "rotate-180")} />
                                  <span>{comment.replies.length} {isRTL ? "رد" : "replies"}</span>
                                </button>
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
                                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 text-xs p-1"
                                >
                                  <Reply className="w-3 h-3" />
                                  <span className="hidden sm:inline">{isRTL ? "رد" : "Reply"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && expandedReplies[comment.id] && (
                        <div className={cn(
                          "mt-2 space-y-2 py-2 animate-in fade-in duration-200",
                          isRTL ? "mr-4 pr-2 border-r-2 border-primary/20" : "ml-4 pl-2 border-l-2 border-primary/20"
                        )}>
                          {comment.replies.filter(r => {
                            if (blockedIds.has(r.user_id)) return false;
                            if (restrictedIds.has(r.user_id) && post?.user_id === currentUser?.id) return false;
                            if (hiddenWords.length > 0 && r.content) {
                              const lower = r.content.toLowerCase();
                              if (hiddenWords.some(w => lower.includes(w))) return false;
                            }
                            return true;
                          }).map((reply) => (
                            <div key={reply.id} className="flex gap-2 group">
                              <Link href={`/u/${reply.profile?.username}`}>
                                <Avatar className="w-6 h-6 border border-border/50 flex-shrink-0 group-hover:border-primary/40 transition-all duration-200">
                                  <AvatarImage src={reply.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + reply.user_id} />
                                  <AvatarFallback>{reply.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 justify-between flex-wrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link href={`/u/${reply.profile?.username}`} className="font-bold text-xs hover:opacity-80 transition-opacity">
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
                                  </div>
                                  {(currentUser?.id === reply.user_id || currentUser?.id === post.user_id) && (
                                    <button
                                      onClick={() => setDeleteCommentId(reply.id)}
                                      className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-foreground/80 mt-0.5 break-words">{reply.content}</p>
                                {reply.gif_url && (
                                  <img 
                                    src={reply.gif_url} 
                                    alt="Reply GIF" 
                                    className="max-w-32 h-auto rounded-lg mt-2"
                                  />
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                                  <button
                                    onClick={() => toggleCommentLike.mutate(reply.id)}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Heart className={cn("w-2.5 h-2.5", reply.is_liked && "fill-primary text-primary")} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Typing Indicator - Inside Comments Section */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary/5 border border-primary/10 rounded text-xs text-primary/70 animate-pulse">
                  <div className="flex gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                    <span className="inline-block w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="inline-block w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                  <span className="flex-1 truncate">
                    {isRTL ? "جاري كتابة تعليق" : "Typing comment..."}
                  </span>
                </div>
              )}
            </div>

            {/* Actions & Comments Input */}
            <div className="flex-shrink-0 p-2 sm:p-4 border-t border-border space-y-2 sm:space-y-3 bg-gradient-to-b from-transparent to-muted/5 overflow-y-auto max-h-40 sm:max-h-auto">
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button
                    onClick={handleLike}
                    className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 sm:w-6 sm:h-6 transition-all duration-200",
                        post.is_liked ? "fill-destructive text-destructive" : "text-foreground hover:text-primary"
                      )}
                    />
                  </button>

                  <button
                    onClick={() => commentInputRef.current?.focus()}
                    className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 text-foreground"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 -rotate-90" />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 text-foreground"
                  >
                    <Share2 className={cn("w-4 h-4 sm:w-6 sm:h-6", shareSuccess && "text-green-500")} />
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Bookmark
                    className={cn(
                      "w-4 h-4 sm:w-6 sm:h-6 transition-all duration-200",
                      post.is_saved ? "fill-primary text-primary" : "text-foreground hover:text-primary"
                    )}
                  />
                </button>
              </div>

              {/* Likes Count - Hidden if hide_likes is true */}
              {!(post.hide_likes || (currentUser?.id === post.user_id ? settings.likes.hide_like_counts_own : settings.likes.hide_like_counts_others)) && (
                <div className="text-xs font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-destructive text-destructive" />
                  <span className="truncate">{post.likes_count.toLocaleString()} {isRTL ? "إعجاب" : "likes"}</span>
                </div>
              )}

              {/* Comment Input */}
              <div className="space-y-1 sm:space-y-2 relative">
                {replyingTo && (
                  <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-primary/10 border border-primary/20 rounded text-xs text-primary transition-all duration-200">
                    <Reply className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium flex-1 truncate">{isRTL ? "رد" : "Reply"}</span>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setCommentText("");
                        stopTyping();
                      }}
                      className="p-0.5 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
                      title={isRTL ? "إلغاء" : "Cancel"}
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSubmitComment} className="space-y-2">
                  {showGifPicker && (
                    <GifPicker
                      isRTL={!!isRTL}
                      height={220}
                      onSelect={(url) => { setSelectedGif(url); setShowGifPicker(false); }}
                    />
                  )}
                  {selectedGif && (
                    <div className="relative mx-1.5 sm:mx-3">
                      <div className="relative inline-block">
                        <img src={selectedGif} alt="Selected GIF" className="max-w-32 sm:max-w-48 h-24 sm:h-32 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => setSelectedGif(null)}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 hover:bg-destructive/90 transition-colors"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-end gap-1 sm:gap-2 p-1.5 sm:p-3 bg-muted/50 rounded border border-border/30 hover:border-primary/30 focus-within:border-primary/50 focus-within:shadow-sm transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => setShowGifPicker(p => !p)}
                      disabled={createComment.isPending}
                      className={cn("p-1 rounded hover:bg-muted transition-colors flex-shrink-0", showGifPicker && "text-pink-500")}
                      title="GIF"
                    >
                      <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <Input
                      ref={commentInputRef}
                      value={commentText}
                      onChange={handleCommentInput}
                      placeholder={isRTL ? "رد..." : "Add comment..."}
                      className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs sm:text-sm placeholder:text-muted-foreground/60"
                      disabled={createComment.isPending}
                    />
                    <button
                      type="submit"
                      disabled={(!commentText.trim() && !selectedGif) || createComment.isPending}
                      className={cn(
                        "p-1.5 sm:p-2 rounded font-bold text-xs transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95",
                        (!commentText.trim() && !selectedGif) || createComment.isPending
                          ? "text-muted-foreground/40 cursor-not-allowed opacity-50"
                          : "text-primary hover:bg-primary/10 bg-primary/5"
                      )}
                    >
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </form>
                <MentionAutocomplete
                  inputValue={commentText}
                  onSelectUser={handleSelectMention}
                  isOpen={showMentions}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent className={t ? "rtl" : ""}>
          <AlertDialogTitle>{t ? "حذف التعليق" : "Delete Comment"}</AlertDialogTitle>
          <AlertDialogDescription>
            {t ? "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure? This action cannot be undone."}
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>{t ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCommentId) {
                  deleteComment.mutate(deleteCommentId, {
                    onSuccess: () => {
                      setDeleteCommentId(null);
                    }
                  });
                }
              }}
              disabled={deleteComment.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteComment.isPending ? (t ? "جاري الحذف..." : "Deleting...") : (t ? "حذف" : "Delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Hearts Container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
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

    </Dialog>
  );
}
