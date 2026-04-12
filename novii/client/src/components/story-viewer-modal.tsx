import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Heart, Send, Pause, Play, Eye, Trash2, Music2, VolumeX, Volume2, MoreHorizontal, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [storyViews, setStoryViews] = useState<(Profile & { viewedAt: string })[]>([]);
  const [showViews, setShowViews] = useState(false);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewsCount, setViewsCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [musicBlocked, setMusicBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showLikeAnim, setShowLikeAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const { language } = useLanguage();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const startFromZeroRef = useRef(true);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory?.user_id === currentUserId;

  /* ─── Auth ─── */
  useEffect(() => {
    const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id || null));
  }, []);

  /* ─── Reset on open / index change ─── */
  useEffect(() => {
    if (!open) return;
    startFromZeroRef.current = true;
    musicRef.current?.pause && (musicRef.current.currentTime = 0);
    setCurrentIndex(initialIndex);
    setProgress(0);
    setIsPaused(false);
    setShowViews(false);
    setReplyText("");
    setStoryViews([]);
    setMediaLoaded(false);
  }, [open, initialIndex]);

  useEffect(() => {
    startFromZeroRef.current = true;
    setMusicBlocked(false);
    setMediaLoaded(false);
    musicRef.current?.pause();
    if (musicRef.current) musicRef.current.currentTime = 0;
  }, [currentIndex]);

  /* ─── Record view ─── */
  useEffect(() => {
    if (!open || !currentStory) return;
    api.addStoryView(currentStory.id).then(setViewsCount).catch(() => {});
  }, [open, currentStory?.id]);

  /* ─── Pause when views open or input focused ─── */
  useEffect(() => {
    if (showViews || inputFocused || showMenu) setIsPaused(true);
    else setIsPaused(false);
  }, [showViews, inputFocused, showMenu]);

  /* ─── Music ─── */
  useEffect(() => {
    if (!open || !currentStory) { musicRef.current?.pause(); return; }
    const musicUrl = (currentStory as any).music_url;
    if (musicUrl) {
      if (!musicRef.current) musicRef.current = new Audio();
      if (musicRef.current.src !== musicUrl) {
        musicRef.current.src = musicUrl;
        musicRef.current.loop = true;
      }
      musicRef.current.muted = isMuted;
      if (!isPaused) {
        musicRef.current.play()
          .then(() => setMusicBlocked(false))
          .catch(() => setMusicBlocked(true));
      } else {
        musicRef.current.pause();
      }
    } else {
      musicRef.current?.pause();
      setMusicBlocked(false);
    }
  }, [open, currentStory?.id, isPaused, isMuted]);

  useEffect(() => () => { musicRef.current?.pause(); }, []);
  useEffect(() => { if (!open) musicRef.current?.pause(); }, [open]);

  /* ─── Video mute sync ─── */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  /* ─── Progress timer ─── */
  useEffect(() => {
    if (!open || !currentStory || !mediaLoaded) return;

    if (currentStory.media_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.play().catch(() => {});
      const handleEnded = () => handleNext();
      video.addEventListener('ended', handleEnded);
      const iv = setInterval(() => {
        if (!isPaused && video.duration) setProgress((video.currentTime / video.duration) * 100);
      }, 100);
      return () => { video.removeEventListener('ended', handleEnded); clearInterval(iv); };
    }

    if (currentStory.media_type === 'image') {
      if (isPaused) return;
      const DURATION = (currentStory as any).music_url ? 30000 : 7000;
      const startProgress = startFromZeroRef.current ? 0 : progress;
      startFromZeroRef.current = false;
      const t0 = Date.now();
      const iv = setInterval(() => {
        const p = Math.min(startProgress + ((Date.now() - t0) / DURATION) * 100, 100);
        setProgress(p);
        if (p >= 100) { clearInterval(iv); handleNext(); }
      }, 50);
      return () => clearInterval(iv);
    }
  }, [currentIndex, open, currentStory?.id, currentStory?.media_type, isPaused, mediaLoaded]);

  /* ─── Handlers ─── */
  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) { setCurrentIndex(i => i + 1); setProgress(0); }
    else onOpenChange(false);
  }, [currentIndex, stories.length, onOpenChange]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) { setCurrentIndex(i => i - 1); setProgress(0); }
  }, [currentIndex]);

  const handlePointerDown = (e: React.PointerEvent, side: 'left' | 'right') => {
    isHoldingRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsPaused(true);
    }, 150);
  };

  const handlePointerUp = (e: React.PointerEvent, side: 'left' | 'right') => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (isHoldingRef.current) { setIsPaused(false); isHoldingRef.current = false; return; }
    // short tap = navigate
    if (isRTL) { side === 'left' ? handleNext() : handlePrevious(); }
    else { side === 'left' ? handlePrevious() : handleNext(); }
  };

  const handleDoubleTap = () => {
    setIsLiked(true);
    setShowLikeAnim(true);
    setTimeout(() => setShowLikeAnim(false), 1000);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory) return;
    setIsSending(true);
    try {
      await api.sendStoryReply(currentStory.id, replyText.trim());
      setReplyText("");
      inputRef.current?.blur();
      toast({ title: language.code === 'ar' ? '✅ تم الإرسال' : '✅ Sent' });
    } catch (error: any) {
      toast({ title: '❌', description: error.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const loadStoryViews = async () => {
    if (!currentStory) return;
    setIsLoadingViews(true);
    try {
      const views = await api.getStoryViews(currentStory.id);
      setStoryViews(views);
    } catch {}
    finally { setIsLoadingViews(false); }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    setShowMenu(false);
    setIsDeleting(true);
    try {
      await api.deleteStory(currentStory.id);
      toast({ title: language.code === 'ar' ? '✅ تم الحذف' : '✅ Deleted' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: '❌', description: error.message, variant: 'destructive' });
    } finally { setIsDeleting(false); }
  };

  const formatTime = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ar }); }
    catch { return d; }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideDefaultClose
        className={cn(
          "p-0 border-0 bg-black shadow-2xl overflow-hidden outline-none focus:outline-none",
          // Mobile: full screen
          "w-screen h-[100dvh] max-w-none rounded-none translate-x-0 translate-y-0 left-0 top-0",
          // Desktop: centered portrait card like Instagram
          "md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-[400px] md:max-w-[400px] md:h-[92vh] md:max-h-[820px] md:rounded-2xl",
        )}
        dir="ltr"
      >
        {/* ── Full-screen story container ── */}
        <div className="group relative w-full h-full bg-black flex items-center justify-center select-none">

          {/* ── Media ── */}
          <div className="absolute inset-0 flex items-center justify-center">
            {currentStory.media_type === 'video' ? (
              <video
                key={currentStory.id}
                ref={videoRef}
                src={currentStory.media_url}
                className="w-full h-full object-cover"
                style={{ filter: getFilterById((currentStory as any).filter_name || 'normal').css }}
                autoPlay
                playsInline
                muted={isMuted}
                onLoadedData={() => setMediaLoaded(true)}
              />
            ) : (
              <img
                key={currentStory.id}
                src={currentStory.media_url}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: getFilterById((currentStory as any).filter_name || 'normal').css }}
                onLoad={() => setMediaLoaded(true)}
                draggable={false}
              />
            )}
          </div>

          {/* ── Top gradient ── */}
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none z-10" />

          {/* ── Bottom gradient ── */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

          {/* ── Double-tap heart animation ── */}
          {showLikeAnim && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <Heart className="w-28 h-28 text-white fill-white drop-shadow-2xl animate-ping" style={{ animationDuration: '0.6s', animationIterationCount: 1 }} />
            </div>
          )}

          {/* ── Tap zones (left / right) ── */}
          <div className="absolute inset-0 z-20 flex" style={{ top: '80px', bottom: '80px' }}>
            <div
              className="w-1/3 h-full cursor-pointer"
              onPointerDown={(e) => handlePointerDown(e, 'left')}
              onPointerUp={(e) => handlePointerUp(e, 'left')}
              onDoubleClick={handleDoubleTap}
            />
            <div
              className="w-1/3 h-full cursor-pointer"
              onPointerDown={(e) => { isHoldingRef.current = false; holdTimerRef.current = setTimeout(() => { isHoldingRef.current = true; setIsPaused(true); }, 150); }}
              onPointerUp={() => { if (holdTimerRef.current) clearTimeout(holdTimerRef.current); if (isHoldingRef.current) { setIsPaused(false); isHoldingRef.current = false; } }}
              onDoubleClick={handleDoubleTap}
            />
            <div
              className="w-1/3 h-full cursor-pointer"
              onPointerDown={(e) => handlePointerDown(e, 'right')}
              onPointerUp={(e) => handlePointerUp(e, 'right')}
              onDoubleClick={handleDoubleTap}
            />
          </div>

          {/* ── Desktop navigation arrows (hidden on mobile) ── */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className={cn(
                "hidden md:flex absolute top-1/2 -translate-y-1/2 z-30",
                "items-center justify-center w-10 h-10 rounded-full",
                "bg-white/20 backdrop-blur-sm border border-white/30 text-white",
                "hover:bg-white/35 transition-all",
                isRTL ? "right-3" : "left-3"
              )}
            >
              {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className={cn(
                "hidden md:flex absolute top-1/2 -translate-y-1/2 z-30",
                "items-center justify-center w-10 h-10 rounded-full",
                "bg-white/20 backdrop-blur-sm border border-white/30 text-white",
                "hover:bg-white/35 transition-all",
                isRTL ? "left-3" : "right-3"
              )}
            >
              {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}

          {/* ══════════ TOP HUD ══════════ */}
          <div className="absolute top-0 left-0 right-0 z-30 px-2 pt-3 space-y-3">
            {/* Progress bars */}
            <div className="flex gap-1">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                      transition: i === currentIndex ? 'none' : undefined,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between px-1">
              {/* Left: avatar + name + time */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-primary flex-shrink-0">
                  <div className="w-full h-full rounded-full border-[1.5px] border-black overflow-hidden">
                    <img
                      src={currentStory.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStory.user_id}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white font-semibold text-[13px] leading-none drop-shadow">
                    {currentStory.profile?.username}
                  </span>
                  <span className="text-white/60 text-[11px]">{formatTime(currentStory.created_at)}</span>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1">
                {/* Mute / unmute (video or music) */}
                {(currentStory.media_type === 'video' || (currentStory as any).music_url) && (
                  <button
                    onClick={() => setIsMuted(m => !m)}
                    className="text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                  >
                    {isMuted
                      ? <VolumeX className="w-5 h-5 drop-shadow" />
                      : <Volume2 className="w-5 h-5 drop-shadow" />
                    }
                  </button>
                )}

                {/* Pause / play */}
                <button
                  onClick={() => setIsPaused(p => !p)}
                  className="text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  {isPaused
                    ? <Play className="w-5 h-5 drop-shadow" />
                    : <Pause className="w-5 h-5 drop-shadow" />
                  }
                </button>

                {/* More menu (own story) */}
                {isOwnStory && (
                  <button
                    onClick={() => setShowMenu(m => !m)}
                    className="text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 drop-shadow" />
                  </button>
                )}

                {/* Close */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 drop-shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Dropdown menu (own story) ── */}
          {showMenu && isOwnStory && (
            <div className="absolute top-20 right-4 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
              <button
                onClick={() => { loadStoryViews(); setShowViews(true); setShowMenu(false); }}
                className="flex items-center gap-3 w-full px-5 py-3.5 text-white text-sm hover:bg-white/10 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{language.code === 'ar' ? 'من شاهد الاستوري' : 'Story viewers'}</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {viewsCount > 0 ? viewsCount : currentStory.views_count || 0}
                </span>
              </button>
              <div className="border-t border-white/10" />
              <button
                onClick={handleDeleteStory}
                disabled={isDeleting}
                className="flex items-center gap-3 w-full px-5 py-3.5 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language.code === 'ar' ? 'حذف الاستوري' : 'Delete story'}</span>
              </button>
            </div>
          )}

          {/* ══════════ MUSIC BAR ══════════ */}
          {(currentStory as any).music_url && !showViews && (
            <div className="absolute z-30 pointer-events-none"
              style={{ bottom: isOwnStory ? '28px' : '90px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              {musicBlocked && (
                <button
                  className="pointer-events-auto flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 animate-pulse"
                  onClick={(e) => { e.stopPropagation(); musicRef.current?.play().then(() => setMusicBlocked(false)).catch(() => {}); }}
                >
                  <VolumeX className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-semibold">{isRTL ? 'اضغط لتشغيل الصوت' : 'Tap to play sound'}</span>
                </button>
              )}
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 max-w-[70%]">
                {(currentStory as any).music_artwork_url ? (
                  <img
                    src={(currentStory as any).music_artwork_url}
                    alt=""
                    className={cn("w-5 h-5 rounded-full object-cover flex-shrink-0", !musicBlocked && !isPaused && "animate-spin")}
                    style={{ animationDuration: '4s' }}
                  />
                ) : (
                  <Music2 className="w-4 h-4 text-white flex-shrink-0" />
                )}
                <p className="text-white text-[11px] font-medium truncate">
                  {(currentStory as any).music_title || ''}{(currentStory as any).music_artist ? ` · ${(currentStory as any).music_artist}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* ══════════ BOTTOM ACTIONS ══════════ */}
          {/* Own story: views count bar */}
          {isOwnStory && !showViews && (
            <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6">
              <button
                onClick={() => { loadStoryViews(); setShowViews(true); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-white/90 hover:text-white transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  {viewsCount > 0 ? viewsCount : currentStory.views_count || 0}
                </span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </button>
            </div>
          )}

          {/* Others' story: reply input */}
          {!isOwnStory && !showViews && (
            <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6">
              <div className={cn(
                "flex items-center gap-3 bg-white/10 backdrop-blur-md border rounded-full px-4 py-2.5 transition-all",
                inputFocused ? "border-white/60 bg-white/15" : "border-white/30"
              )}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={language.code === 'ar' ? `الرد على ${currentStory.profile?.username}...` : `Reply to ${currentStory.profile?.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
                  className="flex-1 bg-transparent text-white placeholder:text-white/50 border-none outline-none text-sm"
                  onClick={(e) => e.stopPropagation()}
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {replyText.trim() ? (
                  <button
                    onClick={handleSendReply}
                    disabled={isSending}
                    className="text-white hover:text-white/70 transition-colors p-1 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsLiked(l => !l); setShowLikeAnim(true); setTimeout(() => setShowLikeAnim(false), 800); }}
                    className="text-white hover:scale-110 transition-transform p-1"
                  >
                    <Heart className={cn("w-5 h-5 transition-colors", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════════ STORY VIEWS PANEL (slides up from bottom) ══════════ */}
          {showViews && isOwnStory && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowViews(false)} />

              {/* Panel */}
              <div className="relative bg-zinc-900/95 backdrop-blur-xl rounded-t-3xl max-h-[65vh] flex flex-col border-t border-white/10 shadow-2xl">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-white/30 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    <span className="text-white font-bold text-[15px]">
                      {language.code === 'ar' ? 'المشاهدون' : 'Viewers'}
                    </span>
                    <span className="bg-white/10 text-white/80 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                      {storyViews.length}
                    </span>
                  </div>
                  <button onClick={() => setShowViews(false)} className="text-white/60 hover:text-white p-1 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
                  {isLoadingViews ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : storyViews.length === 0 ? (
                    <div className="text-center py-12">
                      <Eye className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">{language.code === 'ar' ? 'لا توجد مشاهدات بعد' : 'No views yet'}</p>
                    </div>
                  ) : (
                    storyViews.map((viewer: any) => (
                      <div key={viewer.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                          <img
                            src={viewer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer.id}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[13px] font-semibold truncate">{viewer.username || 'User'}</p>
                          <p className="text-white/40 text-[11px]">{viewer.viewedAt ? formatTime(viewer.viewedAt) : ''}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Safe area bottom spacing */}
                <div className="h-6" />
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
