import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { MoreVertical, Pencil, Trash2, Check, X, CheckCheck, Download, Smile } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { api, type Message, type Profile } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  otherUser?: Profile;
  currentUserId?: string;
  onStoryClick?: (storyId: string) => void;
}

export function MessageBubble({ message, isMe, otherUser, currentUserId, onStoryClick }: MessageBubbleProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const reactions_list = ['❤️', '😂', '😮', '😢', '👍'];

  // Load reactions on mount
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
      setReactions(prev => ({
        ...prev,
        [reaction]: (prev[reaction] || 0) + 1
      }));
      setShowReactionPicker(false);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error) {
      console.error('Error adding reaction:', error);
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
      toast.error('Failed to remove reaction');
    }
  };

  // Fetch story by ID
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

  // Focus input when entering edit mode
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
      // Invalidate queries to refresh messages
      if (otherUser) {
        queryClient.invalidateQueries({ queryKey: ['messages', otherUser.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? "فشل تعديل الرسالة" : "Failed to edit message"));
      setEditedContent(message.content); // Reset to original
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => api.deleteMessage(messageId),
    onSuccess: () => {
      toast.success(isRTL ? "تم حذف الرسالة" : "Message deleted");
      setShowDeleteDialog(false);
      // Invalidate queries to refresh messages
      if (otherUser) {
        queryClient.invalidateQueries({ queryKey: ['messages', otherUser.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? "فشل حذف الرسالة" : "Failed to delete message"));
    },
  });

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      updateMessageMutation.mutate({
        messageId: message.id,
        content: editedContent.trim(),
      });
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

    // Check if it's a base64 data URL
    if (message.image_url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = message.image_url;
      link.download = `message-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(isRTL ? "تم حفظ الصورة" : "Image saved");
    } else {
      // For regular URLs
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
        .catch(err => {
          console.error('Error downloading image:', err);
          toast.error(isRTL ? "فشل تحميل الصورة" : "Failed to download image");
        });
    }
  };

  // Show deleted message placeholder
  if (message.is_deleted) {
    return (
      <div 
        className={cn(
          "flex w-full gap-2",
          isMe ? "justify-end" : "justify-start"
        )}
      >
        {!isMe && otherUser && (
          <Avatar className="w-8 h-8 shrink-0 mt-0.5">
            <AvatarImage src={otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} />
            <AvatarFallback className="text-xs">{otherUser.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 text-xs italic shadow-sm",
          "bg-gray-700 text-gray-300"
        )}>
          {isRTL ? "تم حذف هذه الرسالة" : "This message was deleted"}
        </div>
      </div>
    );
  }

  // Check if this is a story reply
  const isStoryReply = !!message.story_id && message.image_url;

  if (isStoryReply) {
    return (
      <div 
        className={cn(
          "flex w-full gap-2 group animate-in slide-in-from-bottom-2 duration-300",
          isMe ? "justify-end" : "justify-start"
        )}
      >
        {!isMe && otherUser && (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} />
            <AvatarFallback className="text-xs">{otherUser.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn("flex flex-col gap-1.5 max-w-xs", isMe && "items-end")}>
          {/* Story Image - Clickable to view original story */}
          <button
            onClick={() => {
              if (message.story_id) {
                setShowStoryViewer(true);
              } else {
                setShowImageModal(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (message.story_id) {
                  setShowStoryViewer(true);
                } else {
                  setShowImageModal(true);
                }
              }
            }}
            aria-label={isRTL ? "عرض الاستوري" : "View Story"}
            type="button"
            className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group/image bg-transparent border-none p-0"
          >
            <img 
              src={message.image_url ?? undefined} 
              alt="Story reply" 
              className="w-32 h-48 object-cover hover:opacity-80 transition-opacity"
            />
            {/* View Story indicator */}
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
              <span className="text-white text-xs font-semibold">📸 {isRTL ? "عرض الاستوري" : "View Story"}</span>
            </div>
            {/* Time badge */}
            <div className={cn(
              "absolute top-1 px-2 py-1 text-xs rounded-full bg-black/60 text-white/70",
              isRTL ? "left-1" : "right-1"
            )}>
              {formatDistanceToNow(new Date(message.created_at), { 
                addSuffix: false, 
                locale: isRTL ? ar : undefined 
              })}
            </div>
          </button>

          {/* Reply Text in Bubble */}
          <div className={cn(
            "rounded-2xl px-4 py-2 text-sm shadow-sm max-w-xs",
            isMe 
              ? "bg-blue-500 text-white" 
              : "bg-gray-700 text-white"
          )}>
            <p className={cn("leading-relaxed break-words", isRTL && "text-right")}>
              {message.content}
            </p>
          </div>

          {/* Message Actions */}
          {currentUserId === message.sender_id && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 hover:bg-accent"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "end" : "start"}>
                  <DropdownMenuItem 
                    onClick={() => setIsEditing(true)}
                    className={isRTL ? "flex-row-reverse" : ""}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">{isRTL ? "تعديل" : "Edit"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">{isRTL ? "حذف" : "Delete"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isRTL ? "حذف الرسالة" : "Delete message"}</AlertDialogTitle>
              <AlertDialogDescription>
                {isRTL ? "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء" : "Are you sure? This cannot be undone"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={deleteMessageMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isRTL ? "حذف" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Story Viewer Modal */}
        {storyData && (
          <StoryViewerModal
            stories={[storyData]}
            initialIndex={0}
            open={showStoryViewer}
            onOpenChange={setShowStoryViewer}
            isRTL={isRTL}
          />
        )}

        {/* Image Modal - Navigate to original story */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] p-0 border-0">
            <img 
              src={message.image_url ?? undefined} 
              alt="Story" 
              className="w-full h-full object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex w-full gap-2 group animate-in slide-in-from-bottom-2 duration-300",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      {!isMe && otherUser && (
        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
          <AvatarImage src={otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} />
          <AvatarFallback className="text-xs">{otherUser.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex items-start gap-1", isMe && "flex-row-reverse")}>
        {/* Message Content */}
        <div className="flex flex-col gap-1">
          {isEditing ? (
            <div className={cn(
              "flex items-center gap-1 bg-secondary rounded-2xl px-3 py-1.5 border-2 border-primary",
              isRTL && "flex-row-reverse"
            )}>
              <Input
                ref={inputRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "border-none bg-transparent text-xs h-7 focus-visible:ring-0 px-2",
                  isRTL && "text-right"
                )}
                disabled={updateMessageMutation.isPending}
              />
              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:bg-primary/20"
                  onClick={handleSaveEdit}
                  disabled={updateMessageMutation.isPending}
                >
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:bg-destructive/20"
                  onClick={handleCancelEdit}
                  disabled={updateMessageMutation.isPending}
                >
                  <X className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Image - Without Bubble */}
              {message.image_url && (
                <img 
                  src={message.image_url} 
                  alt="Message image" 
                  onClick={() => setShowImageModal(true)}
                  className="max-w-sm rounded-2xl object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                />
              )}
              
              {/* Text in Bubble */}
              {message.content && (
                <div>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm relative max-w-sm bg-gray-900",
                    "text-white"
                  )}>
                    <p className={cn("leading-relaxed break-words text-sm font-light", isRTL && "text-right")}>{message.content}</p>
                    
                    <div className={cn("flex items-center gap-1 mt-0.5 text-xs", isRTL && "flex-row-reverse justify-start", !isRTL && "justify-end")}>
                      {/* Edited Indicator */}
                      {message.is_edited && (
                        <span 
                          className="opacity-50 text-gray-300"
                          title={message.edited_at ? 
                            formatDistanceToNow(new Date(message.edited_at), { 
                              addSuffix: true,
                              locale: isRTL ? ar : undefined 
                            }) : ''
                          }
                        >
                          {isRTL ? "محررة" : "edited"}
                        </span>
                      )}
                      
                      {/* Read Receipt (only for sent messages) */}
                      {isMe && (
                        <span className="opacity-50 flex items-center gap-0.5 text-gray-300">
                          {message.is_read ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <CheckCheck className="w-3 h-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reactions Display - Under Message */}
                  {Object.keys(reactions).length > 0 && (
                    <div className={cn("flex gap-1 mt-1 flex-wrap", isMe && "justify-end")}>
                      {Object.entries(reactions).map(([reaction, count]) => (
                        <button
                          key={reaction}
                          onClick={() => {
                            if (userReaction === reaction) {
                              handleRemoveReaction(reaction);
                            } else {
                              handleRemoveReaction(userReaction || '');
                              handleAddReaction(reaction);
                            }
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs transition-all",
                            userReaction === reaction
                              ? "bg-blue-500/30 border border-blue-500/50"
                              : "bg-gray-700/50 border border-gray-600/50 hover:bg-gray-600/50"
                          )}
                        >
                          {reaction} {count > 1 ? count : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reaction Picker Popover - Under Message */}
                  {showReactionPicker && (
                    <div className={cn("flex gap-1 mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700", isMe && "justify-end")}>
                      {reactions_list.map((reaction) => (
                        <button
                          key={reaction}
                          onClick={() => {
                            if (userReaction === reaction) {
                              handleRemoveReaction(reaction);
                            } else {
                              if (userReaction) handleRemoveReaction(userReaction);
                              handleAddReaction(reaction);
                            }
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
        </div>

        {/* Reaction Button on Hover */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className={cn(
              "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1",
              "hover:bg-accent"
            )}
          >
            <Smile className="w-3.5 h-3.5" />
          </Button>

          {/* Context Menu (only for own messages) */}
          {isMe && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1",
                    "hover:bg-accent"
                  )}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48">
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                className="gap-2 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                {isRTL ? "تعديل" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                {isRTL ? "حذف" : "Delete"}
              </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {message.image_url && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl p-0 bg-black border-0">
            <div className="relative w-full flex flex-col items-center justify-center">
              {/* Download Button */}
              <Button
                onClick={handleDownloadImage}
                className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white border border-white/30"
                size="icon"
              >
                <Download className="w-5 h-5" />
              </Button>

              {/* Image */}
              <img 
                src={message.image_url} 
                alt="Full size message image" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? "حذف الرسالة" : "Delete Message"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL 
                ? "هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this message? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(isRTL && "flex-row-reverse")}>
            <AlertDialogCancel>
              {isRTL ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMessageMutation.isPending}
            >
              {deleteMessageMutation.isPending 
                ? (isRTL ? "جاري الحذف..." : "Deleting...") 
                : (isRTL ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
