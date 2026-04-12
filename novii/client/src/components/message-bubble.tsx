import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical, Pencil, Trash2, Check, X, CheckCheck, Download,
  Smile, Copy, Reply, Forward, Volume2, Mic
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { api, type Message, type Profile } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// ---------- Voice Message Player Sub-Component ----------
function VoiceMessagePlayer({ audioUrl, isMe, isRead, isRTL }: { audioUrl: string; isMe: boolean; isRead: boolean; isRTL: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => { setIsPlaying(false); setProgress(0); };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1));
      };
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
      };
    }
    return audioRef.current;
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = getAudio();
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const bars = [3, 5, 4, 7, 5, 8, 4, 9, 6, 5, 8, 4, 6, 7, 5, 4, 8, 6, 5, 7];

  return (
    <div className={cn(
      "rounded-2xl px-3 py-2.5 shadow-sm max-w-[260px] flex items-center gap-2.5",
      isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
    )}>
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9 shrink-0 rounded-full hover:bg-white/20 border border-current/30"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <span className="flex gap-[3px] items-center justify-center">
            <span className="w-[3px] h-4 bg-current rounded-sm" />
            <span className="w-[3px] h-4 bg-current rounded-sm" />
          </span>
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-end gap-[2px] h-6">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full transition-colors duration-100"
              style={{
                height: `${h * 2.5}px`,
                backgroundColor: 'currentColor',
                opacity: i / bars.length <= progress ? 1 : 0.3,
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] opacity-60">
          <span className="flex items-center gap-0.5">
            <Mic className="w-2.5 h-2.5" />
            {isRTL ? "صوتي" : "Voice"}
          </span>
          <span>{duration > 0 ? formatTime(isPlaying ? progress * duration : duration) : '—'}</span>
        </div>
      </div>
      {isMe && (
        <span className="self-end opacity-60">
          {isRead ? <CheckCheck className="w-3 h-3" /> : <CheckCheck className="w-3 h-3 opacity-50" />}
        </span>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  otherUser?: Profile;
  currentUserId?: string;
  onStoryClick?: (storyId: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  allUsers?: Profile[];
}

export function MessageBubble({
  message,
  isMe,
  otherUser,
  currentUserId,
  onStoryClick,
  onReply,
  onForward,
  allUsers = [],
}: MessageBubbleProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const reactions_list = ['❤️', '😂', '😮', '😢', '👍', '🔥', '😍', '👏'];

  useEffect(() => {
    const loadReactions = async () => {
      try {
        const reacts = await api.getMessageReactions(message.id);
        setReactions(reacts);
        const userReact = await api.getUserMessageReaction(message.id);
        setUserReaction(userReact);
      } catch (error) {
        console.error('Error loading reactions:', error);
      }
    };
    loadReactions();
  }, [message.id]);

  const handleAddReaction = async (reaction: string) => {
    try {
      await api.addMessageReaction(message.id, reaction);
      setUserReaction(reaction);
      setReactions(prev => ({ ...prev, [reaction]: (prev[reaction] || 0) + 1 }));
      setShowReactionPicker(false);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleRemoveReaction = async (reaction: string) => {
    try {
      await api.removeMessageReaction(message.id, reaction);
      setUserReaction(null);
      setReactions(prev => {
        const updated = { ...prev };
        updated[reaction] = (updated[reaction] || 1) - 1;
        if (updated[reaction] <= 0) delete updated[reaction];
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const { data: storyData } = useQuery({
    queryKey: ['story', message.story_id],
    queryFn: async () => {
      if (!message.story_id) return null;
      const { data, error } = await supabase
        .from('stories')
        .select(`*, profile:profiles!stories_user_id_fkey(*)`)
        .eq('id', message.story_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!message.story_id && showStoryViewer,
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const updateMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      api.updateMessage(messageId, content),
    onSuccess: () => {
      toast.success(isRTL ? "تم تعديل الرسالة" : "Message edited");
      setIsEditing(false);
      if (otherUser) {
        queryClient.invalidateQueries({ queryKey: ['messages', otherUser.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to edit message");
      setEditedContent(message.content);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => api.deleteMessage(messageId),
    onSuccess: () => {
      toast.success(isRTL ? "تم حذف الرسالة" : "Message deleted");
      setShowDeleteDialog(false);
      if (otherUser) {
        queryClient.invalidateQueries({ queryKey: ['messages', otherUser.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete message");
    },
  });

  const forwardMessageMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await api.sendMessage(targetUserId, message.content, message.image_url || undefined);
    },
    onSuccess: () => {
      toast.success(isRTL ? "تم إعادة التوجيه" : "Message forwarded");
      setShowForwardDialog(false);
    },
    onError: () => {
      toast.error(isRTL ? "فشل إعادة التوجيه" : "Failed to forward");
    },
  });

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      updateMessageMutation.mutate({ messageId: message.id, content: editedContent.trim() });
    } else {
      setIsEditing(false);
      setEditedContent(message.content);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleDelete = () => {
    deleteMessageMutation.mutate(message.id);
  };

  const handleCopy = () => {
    if (message.content && message.content !== '🎤') {
      navigator.clipboard.writeText(message.content);
      toast.success(isRTL ? "تم نسخ الرسالة" : "Copied to clipboard");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDownloadImage = () => {
    if (!message.image_url) return;
    if (message.image_url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = message.image_url;
      link.download = `message-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(isRTL ? "تم حفظ الصورة" : "Image saved");
    } else {
      fetch(message.image_url)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `message-image-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success(isRTL ? "تم حفظ الصورة" : "Image saved");
        })
        .catch(() => toast.error(isRTL ? "فشل تحميل الصورة" : "Failed to download image"));
    }
  };

  if (message.is_deleted) {
    return (
      <div className={cn("flex w-full gap-2", isMe ? "justify-end" : "justify-start")}>
        {!isMe && otherUser && (
          <Avatar className="w-8 h-8 shrink-0 mt-0.5">
            <AvatarImage src={otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} />
            <AvatarFallback className="text-xs">{otherUser.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className="max-w-[70%] rounded-2xl px-4 py-2 text-xs italic shadow-sm bg-muted text-muted-foreground flex items-center gap-1.5">
          <Trash2 className="w-3 h-3 opacity-50" />
          {isRTL ? "تم حذف هذه الرسالة" : "This message was deleted"}
        </div>
      </div>
    );
  }

  const isStoryReply = !!message.story_id && message.image_url;

  if (isStoryReply) {
    return (
      <div className={cn("flex w-full gap-2 group animate-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
        {!isMe && otherUser && (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} />
            <AvatarFallback className="text-xs">{otherUser.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className={cn("flex flex-col gap-1.5 max-w-xs", isMe && "items-end")}>
          <button
            onClick={() => { if (message.story_id) { setShowStoryViewer(true); } else { setShowImageModal(true); } }}
            type="button"
            className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group/image bg-transparent border-none p-0"
          >
            <img src={message.image_url ?? undefined} alt="Story reply" className="w-32 h-48 object-cover hover:opacity-80 transition-opacity" />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
              <span className="text-white text-xs font-semibold">📸 {isRTL ? "عرض الاستوري" : "View Story"}</span>
            </div>
            <div className={cn("absolute top-1 px-2 py-1 text-xs rounded-full bg-black/60 text-white/70", isRTL ? "left-1" : "right-1")}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: false, locale: isRTL ? ar : undefined })}
            </div>
          </button>
          <div className={cn("rounded-2xl px-4 py-2 text-sm shadow-sm max-w-xs", isMe ? "bg-blue-500 text-white" : "bg-muted text-foreground")}>
            <p className={cn("leading-relaxed break-words", isRTL && "text-right")}>{message.content}</p>
          </div>
          {currentUserId === message.sender_id && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "end" : "start"}>
                  <DropdownMenuItem onClick={handleCopy} className="gap-2">
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-xs">{isRTL ? "نسخ" : "Copy"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReply?.(message)} className="gap-2">
                    <Reply className="w-3.5 h-3.5" />
                    <span className="text-xs">{isRTL ? "رد" : "Reply"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="gap-2 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-xs">{isRTL ? "حذف" : "Delete"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isRTL ? "حذف الرسالة" : "Delete message"}</AlertDialogTitle>
              <AlertDialogDescription>{isRTL ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleteMessageMutation.isPending} className="bg-destructive hover:bg-destructive/90">
                {isRTL ? "حذف" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {storyData && (
          <StoryViewerModal stories={[storyData]} initialIndex={0} open={showStoryViewer} onOpenChange={setShowStoryViewer} isRTL={isRTL} />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full gap-2 group animate-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
      {!isMe && otherUser && (
        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
          <AvatarImage src={otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} />
          <AvatarFallback className="text-xs">{otherUser.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex items-start gap-1", isMe && "flex-row-reverse")}>
        <div className="flex flex-col gap-1">
          {isEditing ? (
            <div className={cn("flex items-center gap-1 bg-secondary rounded-2xl px-3 py-1.5 border-2 border-primary", isRTL && "flex-row-reverse")}>
              <Input
                ref={inputRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn("border-none bg-transparent text-xs h-7 focus-visible:ring-0 px-2", isRTL && "text-right")}
                disabled={updateMessageMutation.isPending}
              />
              <div className="flex items-center gap-0.5">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveEdit} disabled={updateMessageMutation.isPending}>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit} disabled={updateMessageMutation.isPending}>
                  <X className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Quoted Reply Preview */}
              {message.reply_to && (
                <div className={cn(
                  "rounded-xl px-3 py-1.5 text-xs border-l-4 mb-0.5 max-w-sm opacity-80",
                  isMe
                    ? "bg-primary/20 border-primary-foreground/50 text-primary-foreground/80"
                    : "bg-muted/60 border-muted-foreground/40 text-muted-foreground"
                )}>
                  <p className="font-semibold text-[10px] mb-0.5 opacity-70">
                    {isRTL ? "ردًا على" : "Reply to"} {(message.reply_to as any).sender?.username}
                  </p>
                  {message.reply_to.image_url?.startsWith('[voice]') ? (
                    <span className="flex items-center gap-1"><Mic className="w-3 h-3" />{isRTL ? "رسالة صوتية" : "Voice message"}</span>
                  ) : message.reply_to.image_url ? (
                    <span className="flex items-center gap-1">📷 {isRTL ? "صورة" : "Image"}</span>
                  ) : (
                    <p className="truncate">{message.reply_to.content}</p>
                  )}
                </div>
              )}

              {/* Voice Message — detected by [voice] prefix in image_url */}
              {message.image_url?.startsWith('[voice]') ? (
                <VoiceMessagePlayer
                  audioUrl={message.image_url.replace('[voice]', '')}
                  isMe={isMe}
                  isRead={message.is_read}
                  isRTL={isRTL}
                />
              ) : (
                <>
                  {/* Regular Image */}
                  {message.image_url && !message.image_url.startsWith('[voice]') && (
                    <img
                      src={message.image_url}
                      alt="Message image"
                      onClick={() => setShowImageModal(true)}
                      className="max-w-sm rounded-2xl object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    />
                  )}

                  {/* Text Bubble */}
                  {message.content && message.content !== '🎤' && (
                    <div>
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm relative max-w-sm",
                        isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      )}>
                        <p className={cn("leading-relaxed break-words text-sm font-light", isRTL && "text-right")}>{message.content}</p>
                        <div className={cn("flex items-center gap-1 mt-0.5 text-xs", isRTL && "flex-row-reverse justify-start", !isRTL && "justify-end")}>
                          {message.is_edited && (
                            <span className="opacity-50 text-gray-300" title={message.edited_at ? formatDistanceToNow(new Date(message.edited_at), { addSuffix: true, locale: isRTL ? ar : undefined }) : ''}>
                              {isRTL ? "محررة" : "edited"}
                            </span>
                          )}
                          {isMe && (
                            <span className="opacity-50 flex items-center gap-0.5 text-gray-300">
                              {message.is_read ? <CheckCheck className="w-3 h-3" /> : <CheckCheck className="w-3 h-3 opacity-50" />}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reactions Display */}
                      {Object.keys(reactions).length > 0 && (
                        <div className={cn("flex gap-1 mt-1 flex-wrap", isMe && "justify-end")}>
                          {Object.entries(reactions).map(([reaction, count]) => (
                            <button
                              key={reaction}
                              onClick={() => {
                                if (userReaction === reaction) { handleRemoveReaction(reaction); }
                                else { if (userReaction) handleRemoveReaction(userReaction); handleAddReaction(reaction); }
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs transition-all",
                                userReaction === reaction ? "bg-blue-500/30 border border-blue-500/50" : "bg-muted/50 border border-border hover:bg-muted"
                              )}
                            >
                              {reaction} {count > 1 ? count : ''}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Reaction Picker */}
                      {showReactionPicker && (
                        <div className={cn("flex gap-1 mt-2 p-2 bg-muted rounded-lg border border-border flex-wrap", isMe && "justify-end")}>
                          {reactions_list.map((reaction) => (
                            <button
                              key={reaction}
                              onClick={() => {
                                if (userReaction === reaction) { handleRemoveReaction(reaction); }
                                else { if (userReaction) handleRemoveReaction(userReaction); handleAddReaction(reaction); }
                              }}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {reaction}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1 hover:bg-accent"
          >
            <Smile className="w-3.5 h-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-accent"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48">
              {/* Reply — both parties */}
              <DropdownMenuItem onClick={() => onReply?.(message)} className="gap-2 cursor-pointer">
                <Reply className="w-4 h-4" />
                {isRTL ? "رد" : "Reply"}
              </DropdownMenuItem>

              {/* Copy — only for text messages */}
              {message.content && message.content !== '🎤' && !message.image_url?.startsWith('[voice]') && (
                <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
                  <Copy className="w-4 h-4" />
                  {isRTL ? "نسخ النص" : "Copy text"}
                </DropdownMenuItem>
              )}

              {/* Forward */}
              <DropdownMenuItem onClick={() => setShowForwardDialog(true)} className="gap-2 cursor-pointer">
                <Forward className="w-4 h-4" />
                {isRTL ? "إعادة توجيه" : "Forward"}
              </DropdownMenuItem>

              {/* Sender-only options */}
              {isMe && (
                <>
                  <DropdownMenuSeparator />
                  {!message.image_url?.startsWith('[voice]') && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2 cursor-pointer">
                      <Pencil className="w-4 h-4" />
                      {isRTL ? "تعديل" : "Edit"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isRTL ? "حذف للجميع" : "Delete for everyone"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Image Modal */}
      {message.image_url && !message.image_url.startsWith('[voice]') && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl p-0 bg-black border-0">
            <div className="relative w-full flex flex-col items-center justify-center">
              <Button onClick={handleDownloadImage} className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white border border-white/30" size="icon">
                <Download className="w-5 h-5" />
              </Button>
              <img src={message.image_url} alt="Full size message image" className="w-full h-auto max-h-[80vh] object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "حذف الرسالة للجميع" : "Delete for Everyone"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? "سيتم حذف الرسالة للجميع ولا يمكن التراجع." : "This message will be deleted for everyone. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(isRTL && "flex-row-reverse")}>
            <AlertDialogCancel>{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteMessageMutation.isPending}>
              {deleteMessageMutation.isPending ? (isRTL ? "جاري الحذف..." : "Deleting...") : (isRTL ? "حذف للجميع" : "Delete for everyone")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forward Dialog */}
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isRTL ? "إعادة توجيه إلى..." : "Forward to..."}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{isRTL ? "لا يوجد محادثات" : "No conversations"}</p>
            ) : (
              allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => forwardMessageMutation.mutate(user.id)}
                  disabled={forwardMessageMutation.isPending}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                    <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name || user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
