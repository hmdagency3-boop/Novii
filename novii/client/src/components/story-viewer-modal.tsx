import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Heart, Send, MoreVertical, ChevronLeft, ChevronRight, Pause, Play, Eye, Trash2, Music2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { api, type Story, type Profile } from "@/lib/api";
import { getFilterById } from "@/lib/story-filters";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRTL?: boolean;
}

export function StoryViewerModal({ stories, initialIndex, open, onOpenChange, isRTL }: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBeforeMenu, setPausedBeforeMenu] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [storyViews, setStoryViews] = useState<(Profile & { viewedAt: string })[]>([]);
  const [showViews, setShowViews] = useState(false);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewsCount, setViewsCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [musicBlocked, setMusicBlocked] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  // Tells the image timer to always start from 0 on next run
  const startFromZeroRef = useRef(true);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Reset all state every time the modal opens or the initial index changes
  // MUST be declared before the image timer effect so it runs first
  useEffect(() => {
    if (open) {
      startFromZeroRef.current = true;   // force timer to start from 0
      // Reset music to beginning
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.currentTime = 0;
      }
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
      setShowViews(false);
      setReplyText("");
      setStoryViews([]);
    }
  }, [open, initialIndex]);

  // When the story index changes inside the modal, also force fresh start
  useEffect(() => {
    startFromZeroRef.current = true;
    setMusicBlocked(false);
    // Reset music to beginning when switching stories
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!open || !currentStory) return;
    
    // Record story view and get updated count
    const recordView = async () => {
      const count = await api.addStoryView(currentStory.id);
      setViewsCount(count);
    };
    recordView();
  }, [open, currentStory?.id]);

  useEffect(() => {
    // Pause story when views menu is open, resume when closed
    if (showViews) {
      setPausedBeforeMenu(isPaused);
      setIsPaused(true);
    } else {
      setIsPaused(pausedBeforeMenu);
    }
  }, [showViews]);

  // Music playback
  useEffect(() => {
    if (!open || !currentStory) {
      musicRef.current?.pause();
      return;
    }

    const musicUrl = (currentStory as any).music_url;
    if (musicUrl) {
      if (!musicRef.current) musicRef.current = new Audio();
      if (musicRef.current.src !== musicUrl) {
        musicRef.current.src = musicUrl;
        musicRef.current.loop = true;
      }
      if (!isPaused) {
        const playPromise = musicRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setMusicBlocked(false))
            .catch(() => setMusicBlocked(true));
        }
      } else {
        musicRef.current.pause();
      }
    } else {
      musicRef.current?.pause();
      setMusicBlocked(false);
    }
  }, [open, currentStory?.id, isPaused]);

  useEffect(() => {
    return () => { musicRef.current?.pause(); };
  }, []);

  useEffect(() => {
    if (!open) musicRef.current?.pause();
  }, [open]);

  useEffect(() => {
    if (!open || !currentStory) return;

    if (currentStory.media_type === 'video' && videoRef.current) {
      const video = videoRef.current;

      video.play().catch(() => {});

      const handleVideoEnded = () => handleNext();
      video.addEventListener('ended', handleVideoEnded);

      const updateProgressInterval = setInterval(() => {
        if (!isPaused && video.duration) {
          const progress = (video.currentTime / video.duration) * 100;
          setProgress(Math.min(progress, 100));
        }
      }, 100);

      return () => {
        video.removeEventListener('ended', handleVideoEnded);
        clearInterval(updateProgressInterval);
      };
    } else if (currentStory.media_type === 'image') {
      const hasMusic = !!(currentStory as any).music_url;
      const DURATION = hasMusic ? 30000 : 10000;

      if (isPaused) return;

      // Always start from 0 if flagged (fresh open or new story).
      // Only continue from current progress when resuming after pause.
      const startProgress = startFromZeroRef.current ? 0 : progress;
      startFromZeroRef.current = false; // consume the flag

      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(startProgress + (elapsed / DURATION) * 100, 100);
        setProgress(newProgress);
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          handleNext();
        }
      }, 100);

      return () => clearInterval(progressInterval);
    }
  }, [currentIndex, open, currentStory?.id, currentStory?.media_type, isPaused]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    // If music was blocked by autoplay policy, try again on direct user click
    if (!newPaused && musicBlocked && musicRef.current) {
      musicRef.current.play()
        .then(() => setMusicBlocked(false))
        .catch(() => {});
    }
  };

  const handleUnblockMusic = () => {
    if (!musicRef.current) return;
    musicRef.current.play()
      .then(() => setMusicBlocked(false))
      .catch(() => {});
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory) return;

    setIsSending(true);
    try {
      await api.sendStoryReply(currentStory.id, replyText.trim());
      setReplyText("");
      toast({
        title: language.code === 'ar' ? '✅ تم الإرسال' : '✅ Sent',
        description: language.code === 'ar' ? 'تم إرسال ردك كرسالة' : 'Your reply has been sent as a message',
      });
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: language.code === 'ar' ? '❌ خطأ' : '❌ Error',
        description: error.message || (language.code === 'ar' ? 'فشل إرسال الرد' : 'Failed to send reply'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
    } catch {
      return dateString;
    }
  };

  const loadStoryViews = async () => {
    if (!currentStory) return;
    setIsLoadingViews(true);
    try {
      console.log('👁️ Loading story views for story:', currentStory.id);
      const views = await api.getStoryViews(currentStory.id);
      console.log('👁️ Story views loaded:', views);
      setStoryViews(views);
    } catch (error) {
      console.error('❌ Error loading story views:', error);
    } finally {
      setIsLoadingViews(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    
    const confirmDelete = window.confirm(
      language.code === 'ar' ? 'هل تريد حذف هذا الاستوري؟' : 'Are you sure you want to delete this story?'
    );
    
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await api.deleteStory(currentStory.id);
      toast({
        title: language.code === 'ar' ? '✅ تم الحذف' : '✅ Deleted',
        description: language.code === 'ar' ? 'تم حذف الاستوري بنجاح' : 'Story deleted successfully',
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Error deleting story:', error);
      toast({
        title: language.code === 'ar' ? '❌ خطأ' : '❌ Error',
        description: error.message || (language.code === 'ar' ? 'فشل حذف الاستوري' : 'Failed to delete story'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-full sm:max-w-sm lg:max-w-md w-screen sm:w-full h-screen sm:h-[90vh] lg:h-[80vh] p-0 bg-black border-0 rounded-none sm:rounded-xl overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100"
                style={{ 
                  width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-40 flex items-center justify-between px-4 pt-8">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={currentStory.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStory.user_id}`} />
              <AvatarFallback>{currentStory.profile?.username?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="font-bold text-sm">{currentStory.profile?.username}</p>
              <p className="text-xs opacity-80">{formatTime(currentStory.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentStory.user_id === currentUserId && (
              <>
                <button
                  onClick={() => {
                    loadStoryViews();
                    setShowViews(!showViews);
                  }}
                  className="text-white p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 group"
                  title={language.code === 'ar' ? 'من شاهد الاستوري' : 'Story views'}
                >
                  <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold bg-white/20 px-1.5 py-0.5 rounded-full group-hover:bg-white/30 transition-colors">
                    {viewsCount > 0 ? viewsCount : currentStory.views_count || 0}
                  </span>
                </button>
                <button
                  onClick={handleDeleteStory}
                  disabled={isDeleting}
                  className="text-white p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors disabled:opacity-50"
                  title={language.code === 'ar' ? 'حذف الاستوري' : 'Delete story'}
                >
                  {isDeleting ? (
                    <span className="animate-spin inline-block">⏳</span>
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
            <button
              onClick={togglePause}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Content */}
        <div 
          className="w-full h-full flex items-center justify-center relative bg-black"
          onClick={togglePause}
        >
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="max-h-full max-w-full object-contain"
              style={{ filter: getFilterById((currentStory as any).filter_name || 'normal').css }}
              autoPlay
              controls
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="max-h-full max-w-full object-contain"
              style={{ filter: getFilterById((currentStory as any).filter_name || 'normal').css }}
            />
          )}

          {/* Music Info Overlay */}
          {(currentStory as any).music_url && (
            <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center gap-2 z-20">
              {/* Blocked indicator — tap to unmute */}
              {musicBlocked && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnblockMusic(); }}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/40 rounded-full px-4 py-2 animate-pulse pointer-events-auto relative z-40"
                >
                  <VolumeX className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-semibold">
                    {isRTL ? "اضغط لتشغيل الصوت" : "Tap to play sound"}
                  </span>
                </button>
              )}

              {/* Music pill */}
              <div className="pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 max-w-[80%]">
                {(currentStory as any).music_artwork_url && (
                  <img
                    src={(currentStory as any).music_artwork_url}
                    alt=""
                    className={cn("w-6 h-6 rounded-full object-cover flex-shrink-0", !musicBlocked && "animate-spin")}
                    style={{ animationDuration: '4s' }}
                  />
                )}
                <Music2 className="w-4 h-4 text-white flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-white text-xs font-semibold truncate whitespace-nowrap">
                    {(currentStory as any).music_title || ''} — {(currentStory as any).music_artist || ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Areas — pointer-events-none on wrapper so overlays (music button etc.) can receive clicks */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div 
              className="w-1/3 h-full cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
            />
            <div className="w-1/3 h-full" />
            <div 
              className="w-1/3 h-full cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            />
          </div>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          {currentIndex < stories.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Story Views Sidebar */}
        {showViews && currentStory.user_id === currentUserId && (
          <div className="absolute top-16 right-0 w-64 max-h-[calc(100%-8rem)] bg-gradient-to-b from-black/95 to-black/85 border-l border-white/20 backdrop-blur-sm overflow-y-auto z-50 rounded-l-2xl">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <Eye className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">
                    {language.code === 'ar' ? 'من شاهد الاستوري' : 'Story Views'}
                  </h3>
                  <p className="text-xs text-white/50">
                    {storyViews.length} {language.code === 'ar' ? 'مشاهدة' : 'viewers'}
                  </p>
                </div>
                <button
                  onClick={() => setShowViews(false)}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded transition-colors flex-shrink-0"
                  title={language.code === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              {isLoadingViews ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin">
                    <Eye className="w-5 h-5 text-white/50" />
                  </div>
                </div>
              ) : storyViews.length === 0 ? (
                <div className="text-white/50 text-xs text-center py-8">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{language.code === 'ar' ? 'لا توجد مشاهدات حتى الآن' : 'No views yet'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {storyViews.map((viewer: any, index: number) => (
                    <div 
                      key={viewer.id} 
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0 ring-1 ring-white/20">
                        <AvatarImage src={viewer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer.id}`} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-white text-xs">
                          {(viewer.username || 'U')?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                          {viewer.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {viewer.viewedAt ? formatTime(viewer.viewedAt) : 'Recently'}
                        </p>
                      </div>
                      {index === 0 && (
                        <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded-full flex-shrink-0">
                          {language.code === 'ar' ? 'أول' : '1st'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-3">
            <input
              type="text"
              placeholder={language.code === 'ar' ? "أرسل رسالة..." : "Send message..."}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSending) {
                  handleSendReply();
                }
              }}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 border-none outline-none"
              onClick={(e) => e.stopPropagation()}
              disabled={isSending}
            />
            <button 
              className="text-white hover:opacity-70 transition-opacity p-2 disabled:opacity-50"
              disabled={isSending}
              onClick={() => {
                if (replyText.trim()) {
                  handleSendReply();
                }
              }}
            >
              {isSending ? (
                <span className="animate-spin inline-block">⏳</span>
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>
          <p className="text-xs text-white/50 mt-2 text-center">
            {language.code === 'ar' ? '📸 ستُرسل ردك كرسالة مع صورة الاستوري' : '📸 Your reply will be sent as a message with the story'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
