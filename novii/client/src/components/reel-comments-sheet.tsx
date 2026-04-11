import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToggleCommentLike, useCreateComment, useDeleteComment, useCurrentUser } from "@/hooks/use-data";
import { useLanguage } from "@/lib/language-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send, Trash2, Reply, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";

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

interface ReelCommentsSheetProps {
  reelId: string;
  open: boolean;
  onClose: () => void;
}

export function ReelCommentsSheet({ reelId, open, onClose }: ReelCommentsSheetProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const { data: currentUser } = useCurrentUser();
  const [commentText, setCommentText]     = useState("");
  const [replyingTo, setReplyingTo]       = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyVisibilityCount, setReplyVisibilityCount] = useState<Map<string, number>>(new Map());

  const toggleCommentLike = useToggleCommentLike();
  const createComment     = useCreateComment();
  const deleteComment     = useDeleteComment();

  const { data: comments = [], isLoading: commentsLoading, refetch } = useQuery({
    queryKey: ["reelComments", reelId],
    queryFn: async () => {
      const { data: allComments } = await supabase
        .from("comments")
        .select("*, profile:profiles(*)")
        .eq("reel_id", reelId)
        .order("created_at", { ascending: false });
      if (!allComments) return [];
      const map = new Map<string, any>();
      const roots: any[] = [];
      allComments.forEach(c => map.set(c.id, { ...c, replies: [] }));
      allComments.forEach(c => {
        if (c.parent_comment_id) {
          const parent = map.get(c.parent_comment_id);
          const reply  = map.get(c.id);
          if (parent && reply) parent.replies.push(reply);
        } else {
          roots.push(map.get(c.id));
        }
      });
      return roots;
    },
    enabled: open && !!reelId,
  });

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser?.id) return;
    let content = commentText;
    if (replyingTo && commentText.startsWith("@")) {
      const spaceIdx = commentText.indexOf(" ");
      content = spaceIdx !== -1 ? commentText.substring(spaceIdx + 1) : commentText;
    }
    const { error } = await supabase.from("comments").insert({
      reel_id: reelId,
      user_id: currentUser.id,
      content: content.trim(),
      post_id: null,
      parent_comment_id: replyingTo || null,
    });
    if (!error) {
      setCommentText("");
      setReplyingTo(null);
      refetch();
    }
  };

  const handleDeleteComment = (id: string) => {
    deleteComment.mutate(id, { onSuccess: () => refetch() });
  };

  const toggleExpandReplies = (commentId: string) => {
    const next = new Set(expandedComments);
    if (next.has(commentId)) {
      next.delete(commentId);
    } else {
      next.add(commentId);
      setReplyVisibilityCount(prev => new Map(prev).set(commentId, 3));
    }
    setExpandedComments(next);
  };

  const loadMoreReplies = (commentId: string) => {
    setReplyVisibilityCount(prev => {
      const m = new Map(prev);
      m.set(commentId, (m.get(commentId) || 3) + 3);
      return m;
    });
  };

  const countReplies = (reply: any): number => {
    let n = 1;
    if (reply.replies?.length) n += reply.replies.reduce((s: number, r: any) => s + countReplies(r), 0);
    return n;
  };

  const getTotalReplyCount = (replies: any[]) =>
    replies.reduce((s, r) => s + countReplies(r), 0);

  const renderReplyThread = (reply: any): React.ReactNode => {
    const isExpanded   = expandedComments.has(reply.id);
    const allReplies   = reply.replies || [];
    const visibleCount = replyVisibilityCount.get(reply.id) || 0;
    const visible      = allReplies.slice(0, visibleCount);
    const hasMore      = allReplies.length > visibleCount;
    const totalCount   = allReplies.reduce((s: number, r: any) => s + countReplies(r), 0);

    return (
      <div key={reply.id}>
        <div className={cn("flex gap-2 group", isRTL && "flex-row-reverse")}>
          <Link href={`/user?id=${reply.user_id}`}>
            <Avatar className="w-7 h-7 flex-shrink-0 border border-border/50 group-hover:border-primary/40 transition-all">
              <AvatarImage src={reply.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + reply.user_id} />
              <AvatarFallback>{reply.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className={cn("flex items-center gap-1 flex-wrap", isRTL && "flex-row-reverse")}>
              <Link href={`/user?id=${reply.user_id}`} className="font-bold text-xs text-white hover:opacity-80">
                {reply.profile?.username}
              </Link>
              <div className="flex items-center gap-0.5">
                {reply.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={reply.profile?.verified_at} />}
                {reply.profile?.is_official && <OfficialBadge size="sm" showText={false} />}
                {reply.profile?.is_creator  && <CreatorBadge size="sm" />}
                {reply.profile?.is_premium  && <PremiumBadge size="sm" />}
                {reply.profile?.is_popular  && <PopularBadge size="sm" />}
                {reply.profile?.is_active   && <ActiveBadge size="sm" />}
              </div>
              {currentUser?.id === reply.user_id && (
                <button onClick={() => handleDeleteComment(reply.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-white/85 mt-0.5 break-words">{reply.content}</p>
            <div className={cn("flex items-center gap-1.5 mt-1 text-xs", isRTL && "flex-row-reverse")}>
              <span className="text-muted-foreground">{formatTime(reply.created_at)}</span>
              {reply.likes_count > 0 && (
                <span className="text-muted-foreground flex items-center gap-0.5">
                  <Heart className="w-2 h-2 fill-destructive text-destructive" />{reply.likes_count}
                </span>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleCommentLike.mutate(reply.id)} className="text-muted-foreground hover:text-primary p-0.5">
                  <Heart className={cn("w-2.5 h-2.5", reply.is_liked && "fill-primary text-primary")} />
                </button>
                <button onClick={() => { setReplyingTo(reply.id); setCommentText(`@${reply.profile?.username} `); }}
                  className="text-muted-foreground hover:text-primary flex items-center gap-0.5 p-0.5">
                  <Reply className="w-2.5 h-2.5" />
                  <span>{isRTL ? "رد" : "Reply"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {totalCount > 0 && (
          <>
            {!isExpanded ? (
              <button onClick={() => toggleExpandReplies(reply.id)}
                className={cn("mt-2 text-xs text-primary hover:text-primary/80 font-medium", isRTL ? "mr-8" : "ml-8")}>
                {isRTL ? `عرض ${totalCount} رد` : `View ${totalCount} ${totalCount === 1 ? "reply" : "replies"}`}
              </button>
            ) : (
              <>
                <div className={cn("mt-2 space-y-2 py-2", isRTL ? "mr-4 pr-2 border-r-2 border-primary/20" : "ml-4 pl-2 border-l-2 border-primary/20")}>
                  {visible.map((r: any) => renderReplyThread(r))}
                </div>
                {hasMore && (
                  <button onClick={() => loadMoreReplies(reply.id)}
                    className={cn("mt-1 text-xs text-primary hover:text-primary/80 font-medium", isRTL ? "mr-8" : "ml-8")}>
                    {isRTL ? `عرض ${allReplies.length - visibleCount} رد آخر` : `View ${allReplies.length - visibleCount} more`}
                  </button>
                )}
                <button onClick={() => toggleExpandReplies(reply.id)}
                  className={cn("mt-1 text-xs text-muted-foreground hover:text-primary font-medium", isRTL ? "mr-8" : "ml-8")}>
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
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="bottom"
        className={cn("h-[85vh] bg-black/95 border-neutral-800 flex flex-col p-0 lg:ms-20", isRTL && "dir-rtl")}
      >
        <SheetHeader className="border-b border-neutral-800 p-4 pb-3">
          <SheetTitle className="text-white text-center text-lg">
            {isRTL ? "التعليقات" : "Comments"} ({comments.length})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-2 px-4 py-3" dir={isRTL ? "rtl" : "ltr"}>
            {commentsLoading ? (
              <div className="text-center text-muted-foreground text-xs py-8">
                <div className="inline-block animate-spin">⌛</div>
                <p className="mt-2">{isRTL ? "جاري تحميل التعليقات..." : "Loading comments..."}</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-8">
                💬<p className="mt-2">{isRTL ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
              </div>
            ) : (
              comments.map((comment: any, index: number) => (
                <div
                  key={comment.id}
                  className={cn("animate-in fade-in-50 slide-in-from-bottom-2 duration-300", comment.profile?.is_official && "official-comment")}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className={cn(
                    "p-3 rounded-lg border transition-all duration-200",
                    comment.profile?.is_official
                      ? "official-comment-card bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/30 hover:border-primary/50"
                      : "bg-muted/40 border-border/50 hover:border-primary/30 hover:bg-muted/60"
                  )}>
                    {comment.profile?.is_official && (
                      <div className="official-comment-badge mb-2 text-xs">الحساب الرسمي</div>
                    )}
                    <div className={cn("flex gap-2 group", isRTL && "flex-row-reverse")}>
                      <Link href={`/user?id=${comment.user_id}`}>
                        <Avatar className={cn(
                          "flex-shrink-0 border transition-all duration-200",
                          comment.profile?.is_official
                            ? "w-9 h-9 border-primary/40 ring-2 ring-primary/10"
                            : "w-9 h-9 border-border/50 group-hover:border-primary/40 group-hover:ring-2 group-hover:ring-primary/10"
                        )}>
                          <AvatarImage src={comment.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + comment.user_id} />
                          <AvatarFallback>{comment.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className={cn("flex items-center gap-1 flex-wrap", isRTL && "flex-row-reverse")}>
                          <Link href={`/user?id=${comment.user_id}`}
                            className={cn("hover:opacity-80 transition-opacity text-sm font-bold", comment.profile?.is_official && "official-username")}>
                            {comment.profile?.username}
                          </Link>
                          <div className="flex items-center gap-0.5">
                            {comment.profile?.is_official && (
                              <div className="w-4 h-4 rounded-full bg-cover flex-shrink-0" style={{ backgroundImage: "url('/official-badge.png')" }} />
                            )}
                            {comment.profile?.is_verified && <VerifiedBadge size="sm" verifiedAt={comment.profile?.verified_at} />}
                            {comment.profile?.is_creator  && <CreatorBadge size="sm" />}
                            {comment.profile?.is_premium  && <PremiumBadge size="sm" />}
                            {comment.profile?.is_popular  && <PopularBadge size="sm" />}
                            {comment.profile?.is_active   && <ActiveBadge size="sm" />}
                          </div>
                          {currentUser?.id === comment.user_id && (
                            <button onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <p className={cn("text-sm mt-1.5 break-words",
                          comment.profile?.is_official ? "official-comment-content font-medium" : "text-white/85")}>
                          {comment.content}
                        </p>
                        <div className={cn("flex items-center gap-1.5 mt-1.5 text-xs flex-wrap", isRTL && "flex-row-reverse")}>
                          <span className="text-muted-foreground">{formatTime(comment.created_at)}</span>
                          {comment.likes_count > 0 && (
                            <span className="text-muted-foreground flex items-center gap-0.5">
                              <Heart className="w-2 h-2 fill-destructive text-destructive" />{comment.likes_count}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleCommentLike.mutate(comment.id)}
                              className="text-muted-foreground hover:text-primary p-0.5">
                              <Heart className={cn("w-2.5 h-2.5", comment.is_liked && "fill-primary text-primary")} />
                            </button>
                            <button
                              onClick={() => { setReplyingTo(comment.id); setCommentText(`@${comment.profile?.username} `); }}
                              className="text-muted-foreground hover:text-primary flex items-center gap-0.5 p-0.5">
                              <Reply className="w-2.5 h-2.5" />
                              <span>{isRTL ? "رد" : "Reply"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {comment.replies?.length > 0 && (
                    <>
                      {!expandedComments.has(comment.id) ? (
                        <button onClick={() => toggleExpandReplies(comment.id)}
                          className={cn("mt-2 text-xs text-primary hover:text-primary/80 font-medium", isRTL ? "mr-4" : "ml-4")}>
                          {(() => {
                            const total = getTotalReplyCount(comment.replies);
                            return isRTL ? `عرض ${total} رد` : `View ${total} ${total === 1 ? "reply" : "replies"}`;
                          })()}
                        </button>
                      ) : (
                        <>
                          <div className={cn("mt-2 space-y-2 py-2",
                            isRTL ? "mr-2 pr-2 border-r-2 border-primary/20" : "ml-2 pl-2 border-l-2 border-primary/20")}>
                            {comment.replies.map((reply: any) => renderReplyThread(reply))}
                          </div>
                          <button onClick={() => toggleExpandReplies(comment.id)}
                            className={cn("mt-1 text-xs text-muted-foreground hover:text-primary font-medium", isRTL ? "mr-4" : "ml-4")}>
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

        <div className="flex-none border-t border-neutral-800 p-3 space-y-2 bg-black/50" dir={isRTL ? "rtl" : "ltr"}>
          {replyingTo && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary">
              <Reply className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="font-medium flex-1 truncate">{isRTL ? "رد" : "Reply"}</span>
              <button onClick={() => { setReplyingTo(null); setCommentText(""); }}
                className="p-0.5 hover:bg-primary/20 rounded transition-colors">
                <X className="w-2 h-2" />
              </button>
            </div>
          )}
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={currentUser?.avatar_url || undefined} />
              <AvatarFallback>{(currentUser?.username?.[0] || "U").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-1.5">
              <Input
                placeholder={isRTL ? "أضف تعليق..." : "Add a comment..."}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-muted-foreground focus:border-pink-500 h-9 text-xs"
              />
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
  );
}
