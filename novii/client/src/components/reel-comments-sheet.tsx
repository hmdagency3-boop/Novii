import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/use-data";
import { useLanguage } from "@/lib/language-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Send, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "wouter";

interface ReelCommentsSheetProps {
  reelId: string;
  open: boolean;
  onClose: () => void;
}

export function ReelCommentsSheet({ reelId, open, onClose }: ReelCommentsSheetProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["reelComments", reelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profile:profiles(*)")
        .eq("reel_id", reelId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const map = new Map<string, any>();
      const roots: any[] = [];
      (data || []).forEach(c => map.set(c.id, { ...c, replies: [] }));
      (data || []).forEach(c => {
        if (c.parent_comment_id) {
          const parent = map.get(c.parent_comment_id);
          if (parent) parent.replies.push(map.get(c.id));
        } else {
          roots.push(map.get(c.id));
        }
      });
      return roots;
    },
    enabled: open && !!reelId,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!currentUser) throw new Error("Not authenticated");
      const { error } = await supabase.from("comments").insert({
        reel_id: reelId,
        user_id: currentUser.id,
        content,
        post_id: null,
        parent_comment_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reelComments", reelId] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      setText("");
      setReplyingTo(null);
    },
    onError: () => toast.error(isRTL ? "فشل إرسال التعليق" : "Failed to send comment"),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reelComments", reelId] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });

  const likeComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (existing) {
        await supabase.from("likes").delete().eq("id", existing.id);
      } else {
        await supabase.from("likes").insert({ comment_id: commentId, user_id: currentUser.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reelComments", reelId] }),
  });

  const handleSend = () => {
    if (!text.trim()) return;
    if (!currentUser) { toast.error(isRTL ? "سجّل دخولك أولاً" : "Please login first"); return; }
    addComment.mutate({ content: text.trim(), parentId: replyingTo?.id });
  };

  const handleReply = (comment: any) => {
    setReplyingTo({ id: comment.id, username: comment.profile?.username });
    setText(`@${comment.profile?.username} `);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[70] bg-background rounded-t-2xl flex flex-col",
          "lg:left-20"
        )}
        style={{ maxHeight: "80vh" }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-base">
            {isRTL ? "التعليقات" : "Comments"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: "none" }}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <span className="text-4xl">💬</span>
              <p className="text-sm">{isRTL ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUser?.id}
                isRTL={isRTL}
                onReply={handleReply}
                onDelete={(id) => deleteComment.mutate(id)}
                onLike={(id) => likeComment.mutate(id)}
              />
            ))
          )}
        </div>

        {/* Reply banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t border-border text-sm">
            <span className="text-muted-foreground">
              {isRTL ? `رد على @${replyingTo.username}` : `Replying to @${replyingTo.username}`}
            </span>
            <button onClick={() => { setReplyingTo(null); setText(""); }}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={currentUser?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
              {currentUser?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRTL ? "أضف تعليقاً..." : "Add a comment..."}
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none border-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || addComment.isPending}
            className="text-primary disabled:opacity-40 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}

function CommentItem({
  comment, currentUserId, isRTL, onReply, onDelete, onLike
}: {
  comment: any; currentUserId?: string; isRTL: boolean;
  onReply: (c: any) => void; onDelete: (id: string) => void; onLike: (id: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true, locale: isRTL ? ar : undefined,
  });

  return (
    <div className="flex gap-3">
      <Link href={`/user?id=${comment.profile?.id}`}>
        <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer">
          <AvatarImage src={comment.profile?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
            {comment.profile?.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link href={`/user?id=${comment.profile?.id}`}>
              <span className="font-semibold text-sm mr-2 cursor-pointer hover:opacity-80">
                {comment.profile?.username}
              </span>
            </Link>
            <span className="text-sm break-words">{comment.content}</span>
          </div>
          <button onClick={() => onLike(comment.id)} className="flex-shrink-0 mt-0.5">
            <Heart className={cn(
              "w-4 h-4 transition-colors",
              comment.is_liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
            )} />
          </button>
        </div>
        <div className={cn("flex items-center gap-4 mt-1", isRTL && "flex-row-reverse")}>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <button onClick={() => onReply(comment)} className="text-xs text-muted-foreground font-semibold hover:text-foreground">
            {isRTL ? "رد" : "Reply"}
          </button>
          {currentUserId === comment.user_id && (
            <button onClick={() => onDelete(comment.id)} className="text-xs text-destructive hover:opacity-80">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          {comment.likes_count > 0 && (
            <span className="text-xs text-muted-foreground">{comment.likes_count} ❤️</span>
          )}
        </div>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies(s => !s)}
              className="text-xs font-semibold text-primary hover:opacity-80 flex items-center gap-1"
            >
              <div className="w-5 h-px bg-muted-foreground/40" />
              {showReplies
                ? (isRTL ? "إخفاء الردود" : "Hide replies")
                : (isRTL ? `عرض ${comment.replies.length} رد` : `View ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`)}
            </button>
            {showReplies && (
              <div className="mt-2 space-y-3 pl-2 border-l-2 border-muted">
                {comment.replies.map((reply: any) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUserId={currentUserId}
                    isRTL={isRTL}
                    onReply={onReply}
                    onDelete={onDelete}
                    onLike={onLike}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
