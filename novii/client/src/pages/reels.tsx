import Layout from "@/components/layout";
import { ReelCommentsSheet } from "@/components/reel-comments-sheet";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { useInfiniteReels, useToggleReelLike, useToggleFollow } from "@/hooks/use-data";
import { Spinner } from "@/components/ui/spinner";
import {
  Heart, MessageCircle, Share2, Bookmark,
  Volume2, VolumeX, Play, Pause, Plus, Music2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth-context";
import { useGuestPrompt } from "@/components/guest-login-prompt";
import { toast } from "sonner";
import { Link } from "wouter";

interface FloatingHeart { id: string; x: number; y: number }
type VideoRefMap = React.MutableRefObject<{ [k: string]: HTMLVideoElement }>;

export default function Reels() {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const {
    data: infiniteReelsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteReels();
  const reels = useMemo(() => infiniteReelsData?.pages.flat() ?? [], [infiniteReelsData]);
  const mobileSentinelRef  = useRef<HTMLDivElement>(null);
  const desktopSentinelRef = useRef<HTMLDivElement>(null);
  const { data: currentUser } = useCurrentUser();
  const { user } = useAuth();
  const isGuest = !user;
  const { showPrompt } = useGuestPrompt();
  const toggleReelLike = useToggleReelLike();
  const toggleFollow   = useToggleFollow();

  const [followedUsers, setFollowedUsers]   = useState<Set<string>>(new Set());
  const [savedReels,    setSavedReels]      = useState<Set<string>>(new Set());
  const [muted,         setMuted]           = useState(true);
  const [pausedReels,   setPausedReels]     = useState<Set<string>>(new Set());
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [commentReelId, setCommentReelId]   = useState<string | null>(null);
  const lastTapRef       = useRef<number>(0);
  const guestViewCount   = useRef<number>(0);
  const guestPromptShown = useRef<boolean>(false);

  /* ── SEPARATE ref maps so mobile & desktop don't overwrite each other ── */
  const mobileRefs  = useRef<{ [k: string]: HTMLVideoElement }>({});
  const desktopRefs = useRef<{ [k: string]: HTMLVideoElement }>({});

  /* ── Container refs for scroll-based index tracking ── */
  const mobileContainerRef  = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);

  /* ── Currently visible reel index per container ── */
  const [activeMobileIdx,  setActiveMobileIdx]  = useState(0);
  const [activeDesktopIdx, setActiveDesktopIdx] = useState(0);

  /* ── Stable refs so effects always see latest values ── */
  const mutedRef        = useRef(muted);
  const isGuestRef      = useRef(isGuest);
  const showPromptRef   = useRef(showPrompt);
  const reelsRef        = useRef(reels);
  mutedRef.current      = muted;
  isGuestRef.current    = isGuest;
  showPromptRef.current = showPrompt;
  reelsRef.current      = reels;

  /* ── Stable scroll handlers (use reelsRef to avoid stale closure) ── */
  const handleMobileScroll = useCallback(() => {
    const c = mobileContainerRef.current;
    if (!c) return;
    const idx = Math.round(c.scrollTop / c.clientHeight);
    setActiveMobileIdx(Math.max(0, Math.min(idx, reelsRef.current.length - 1)));
  }, []);

  const handleDesktopScroll = useCallback(() => {
    const c = desktopContainerRef.current;
    if (!c) return;
    const idx = Math.round(c.scrollTop / c.clientHeight);
    setActiveDesktopIdx(Math.max(0, Math.min(idx, reelsRef.current.length - 1)));
  }, []);

  /* ── Attach scroll listeners once ── */
  useEffect(() => {
    const c = mobileContainerRef.current;
    if (!c) return;
    c.addEventListener("scroll", handleMobileScroll, { passive: true });
    return () => c.removeEventListener("scroll", handleMobileScroll);
  }, [handleMobileScroll]);

  useEffect(() => {
    const c = desktopContainerRef.current;
    if (!c) return;
    c.addEventListener("scroll", handleDesktopScroll, { passive: true });
    return () => c.removeEventListener("scroll", handleDesktopScroll);
  }, [handleDesktopScroll]);

  /* ── Play active reel, pause all others — MOBILE ── */
  useEffect(() => {
    if (!reels.length) return;
    reels.forEach((reel: any, idx: number) => {
      const vid = mobileRefs.current[reel.id];
      if (!vid) return;
      if (idx === activeMobileIdx) {
        vid.muted = mutedRef.current;
        vid.play().catch(() => {});
        if (isGuestRef.current && !guestPromptShown.current) {
          guestViewCount.current += 1;
          if (guestViewCount.current > 2) {
            guestPromptShown.current = true;
            setTimeout(() => showPromptRef.current(), 600);
          }
        }
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeMobileIdx, reels]);

  /* ── Play active reel, pause all others — DESKTOP ── */
  useEffect(() => {
    if (!reels.length) return;
    reels.forEach((reel: any, idx: number) => {
      const vid = desktopRefs.current[reel.id];
      if (!vid) return;
      if (idx === activeDesktopIdx) {
        vid.muted = mutedRef.current;
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeDesktopIdx, reels]);

  /* ── Sync mute change only to the currently active videos ── */
  useEffect(() => {
    const mr = reels[activeMobileIdx];
    const dr = reels[activeDesktopIdx];
    if (mr) { const v = mobileRefs.current[mr.id]; if (v) v.muted = muted; }
    if (dr) { const v = desktopRefs.current[dr.id]; if (v) v.muted = muted; }
  }, [muted, activeMobileIdx, activeDesktopIdx, reels]);

  /* ── Load next page when sentinel is visible ── */
  useEffect(() => {
    const load = () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); };
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) load();
    }, { rootMargin: "400px" });
    const els = [mobileSentinelRef.current, desktopSentinelRef.current].filter(Boolean) as Element[];
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  /* ── spawn floating heart at tap position ── */
  const spawnHeart = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).closest(".reel-item")!.getBoundingClientRect();
    const id   = Math.random().toString(36).slice(2);
    setFloatingHearts(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setFloatingHearts(p => p.filter(h => h.id !== id)), 900);
  }, []);

  const handleLike = useCallback(async (reel: any, e?: React.MouseEvent) => {
    if (!currentUser) { showPrompt(); return; }
    try { await toggleReelLike.mutateAsync(reel.id); if (e) spawnHeart(e); } catch {}
  }, [currentUser, showPrompt, toggleReelLike, spawnHeart]);

  const handleDoubleTap = useCallback((reel: any, e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      if (!reel.is_liked) handleLike(reel, e); else spawnHeart(e);
    }
    lastTapRef.current = now;
  }, [handleLike, spawnHeart]);

  const handleTap = useCallback((id: string, refs: VideoRefMap) => {
    const v = refs.current[id];
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPausedReels(p => { const n = new Set(p); n.delete(id); return n; }); }
    else          { v.pause();                 setPausedReels(p => new Set([...Array.from(p), id])); }
  }, []);

  const handleShare = useCallback((reel: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/reel/${reel.id}`);
    toast.success(isRTL ? "تم نسخ الرابط" : "Link copied!");
  }, [isRTL]);

  const handleFollow = useCallback((uid: string) => {
    if (!currentUser) { showPrompt(); return; }
    toggleFollow.mutate({ targetUserId: uid });
    setFollowedUsers(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  }, [currentUser, showPrompt, toggleFollow]);

  const handleSave = useCallback((id: string) => {
    if (!currentUser) { showPrompt(); return; }
    setSavedReels(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    toast.success(savedReels.has(id) ? (isRTL ? "تمت الإزالة" : "Removed") : (isRTL ? "تم الحفظ" : "Saved"));
  }, [currentUser, showPrompt, isRTL, savedReels]);

  const handleComment = useCallback((id: string) => {
    if (!currentUser) { showPrompt(); return; }
    setCommentReelId(id);
  }, [currentUser, showPrompt]);

  /* ── shared card props builder ── */
  const cardProps = (reel: any) => ({
    reel,
    isRTL,
    muted,
    setMuted,
    paused:   pausedReels.has(reel.id),
    followed: followedUsers.has(reel.profile?.id),
    saved:    savedReels.has(reel.id),
    floatingHearts,
    currentUserId: currentUser?.id,
    onDoubleTap: handleDoubleTap,
    onLike:   handleLike,
    onFollow: handleFollow,
    onSave:    handleSave,
    onShare:   handleShare,
    onComment: handleComment,
  });

  /* ── helper wrapper ── */
  const Wrap = ({ children }: { children: React.ReactNode }) =>
    isGuest ? <>{children}</> : <Layout>{children}</Layout>;

  /* ── loading / empty ── */
  if (isLoading) return (
    <Wrap>
      <div className="fixed inset-0 lg:left-20 flex items-center justify-center bg-background">
        <Spinner />
      </div>
    </Wrap>
  );

  if (!reels?.length) return (
    <Wrap>
      <div className="fixed inset-0 lg:left-20 flex flex-col items-center justify-center bg-background gap-4">
        <div className="text-6xl">🎬</div>
        <h2 className="text-2xl font-bold text-foreground">{isRTL ? "لا توجد ريلز" : "No Reels Yet"}</h2>
        <p className="text-muted-foreground">{isRTL ? "كن أول من ينشر!" : "Be the first to post!"}</p>
      </div>
    </Wrap>
  );

  return (
    <Wrap>

      {/* ══════════════════════════════════════════
          MOBILE  — fullscreen snap scroll
      ══════════════════════════════════════════ */}
      <div
        ref={mobileContainerRef}
        className={cn(
          "mobile-reels-container fixed inset-x-0 top-0 lg:hidden snap-y snap-mandatory bg-background",
          isGuest ? "bottom-0" : "bottom-16"
        )}
        style={{
          overflowY: "scroll",
          overflowX: "hidden",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {reels.map((reel: any, idx: number) => (
          <MobileReelCard
            key={reel.id}
            idx={idx}
            videoRefs={mobileRefs}
            cardHeight={isGuest ? "100svh" : "calc(100svh - 4rem)"}
            onTap={(id) => handleTap(id, mobileRefs)}
            {...cardProps(reel)}
          />
        ))}
        {/* Mobile sentinel */}
        <div ref={mobileSentinelRef} className="w-full h-2 shrink-0 snap-start" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center w-full h-16 shrink-0">
            <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP — centered 9:16 + side actions
      ══════════════════════════════════════════ */}
      <div
        ref={desktopContainerRef}
        className="fixed inset-0 left-20 hidden lg:block overflow-y-scroll snap-y snap-mandatory bg-background"
        style={{ scrollbarWidth: "none" }}
      >
        {reels.map((reel: any, idx: number) => (
          <DesktopReelCard
            key={reel.id}
            idx={idx}
            videoRefs={desktopRefs}
            onTap={(id) => handleTap(id, desktopRefs)}
            {...cardProps(reel)}
          />
        ))}
        {/* Desktop sentinel */}
        <div ref={desktopSentinelRef} className="w-full h-2 shrink-0 snap-start" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center w-full h-16 shrink-0">
            <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Comments Sheet */}
      {commentReelId && (
        <ReelCommentsSheet
          reelId={commentReelId}
          open={!!commentReelId}
          onClose={() => setCommentReelId(null)}
        />
      )}

      <style>{`
        @keyframes floatHeart {
          0%   { opacity:1; transform:scale(1) translateY(0); }
          50%  { opacity:.8; transform:scale(1.4) translateY(-40px); }
          100% { opacity:0; transform:scale(.7) translateY(-100px); }
        }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes spinSlow { to { transform:rotate(360deg); } }
        .animate-marquee   { display:flex; width:max-content; animation: marquee 7s linear infinite; }
        .animate-spin-slow { animation: spinSlow 4s linear infinite; }
      `}</style>
    </Wrap>
  );
}

/* ════════════════════════════════════════════════════
   SHARED TYPES
════════════════════════════════════════════════════ */
interface CardProps {
  reel: any; idx: number; isRTL: boolean; muted: boolean;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  paused: boolean; followed: boolean; saved: boolean;
  floatingHearts: FloatingHeart[]; currentUserId?: string;
  videoRefs: VideoRefMap;
  cardHeight?: string;
  onTap: (id: string) => void;
  onDoubleTap: (reel: any, e: React.MouseEvent) => void;
  onLike:   (reel: any, e?: React.MouseEvent) => void;
  onFollow: (uid: string) => void;
  onSave:    (id: string) => void;
  onShare:   (reel: any) => void;
  onComment: (id: string) => void;
}

/* ════════════════════════════════════════════════════
   ACTION COLUMN
════════════════════════════════════════════════════ */
interface ActionProps {
  reel: any; isRTL: boolean; followed: boolean; saved: boolean;
  currentUserId?: string; size?: "sm" | "md";
  onLike:    (reel: any, e?: React.MouseEvent) => void;
  onFollow:  (uid: string) => void;
  onSave:    (id: string) => void;
  onShare:   (reel: any) => void;
  onComment: (id: string) => void;
}

function ActionColumn({ reel, isRTL, followed, saved, currentUserId, onLike, onFollow, onSave, onShare, onComment, size = "md" }: ActionProps) {
  const ic = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  const nc = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Avatar + follow */}
      <div className="relative">
        <Link href={`/user?id=${reel.profile?.id}`}>
          <Avatar className={cn("ring-2 ring-white cursor-pointer", size === "sm" ? "w-10 h-10" : "w-12 h-12")}>
            <AvatarImage src={reel.profile?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
              {reel.profile?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        {currentUserId !== reel.profile?.id && (
          <button
            onClick={() => onFollow(reel.profile.id)}
            className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow transition-all",
              followed ? "bg-white/30" : "bg-[#ff3b5c]"
            )}
          >
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Like */}
      <button onClick={(e) => onLike(reel, e)} className="flex flex-col items-center gap-1 group">
        <Heart className={cn(ic, "transition-all drop-shadow group-active:scale-125",
          reel.is_liked ? "fill-[#ff3b5c] text-[#ff3b5c] scale-110" : "text-white")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{fmt(reel.likes_count)}</span>
      </button>

      {/* Comment */}
      <button onClick={() => onComment(reel.id)} className="flex flex-col items-center gap-1 group">
        <MessageCircle className={cn(ic, "text-white drop-shadow group-active:scale-125 transition-transform")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{fmt(reel.comments_count)}</span>
      </button>

      {/* Bookmark */}
      <button onClick={() => onSave(reel.id)} className="flex flex-col items-center gap-1 group">
        <Bookmark className={cn(ic, "drop-shadow transition-all group-active:scale-125",
          saved ? "fill-yellow-400 text-yellow-400" : "text-white")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{fmt(reel.saves_count || 0)}</span>
      </button>

      {/* Share */}
      <button onClick={() => onShare(reel)} className="flex flex-col items-center gap-1 group">
        <Share2 className={cn(ic, "text-white drop-shadow group-active:scale-125 transition-transform")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{isRTL ? "مشاركة" : "Share"}</span>
      </button>

    </div>
  );
}

/* ════════════════════════════════════════════════════
   MOBILE CARD
════════════════════════════════════════════════════ */
function MobileReelCard({
  reel, idx, isRTL, muted, setMuted, followed, saved,
  currentUserId, videoRefs, cardHeight = "100svh",
  onLike, onFollow, onSave, onShare, onComment,
}: CardProps) {
  /* When the card is shorter (nav bar present), reduce bottom offsets so
     content stays at the same visual position relative to the screen bottom. */
  const hasNav = cardHeight !== "100svh";
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress     = useRef(false);
  const lastTapTime     = useRef(0);
  const singleTapTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holdActive, setHoldActive] = useState(false);
  const [localFloatingHearts, setLocalFloatingHearts] = useState<FloatingHeart[]>([]);

  const spawnHeart = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id   = Math.random().toString(36).slice(2);
    setLocalFloatingHearts(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setLocalFloatingHearts(p => p.filter(h => h.id !== id)), 900);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setHoldActive(true);
      const vid = videoRefs.current[reel.id];
      if (vid) vid.pause();
    }, 300);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearTimeout(longPressTimer.current ?? undefined);
    if (isLongPress.current) {
      isLongPress.current = false;
      setHoldActive(false);
      const vid = videoRefs.current[reel.id];
      if (vid) vid.play().catch(() => {});
      return;
    }
    const now = Date.now();
    if (now - lastTapTime.current < 350) {
      clearTimeout(singleTapTimer.current ?? undefined);
      lastTapTime.current = 0;
      onLike(reel, e as any);
      spawnHeart(e);
    } else {
      lastTapTime.current = now;
      singleTapTimer.current = setTimeout(() => {
        setMuted(m => !m);
      }, 350);
    }
  };

  const handlePointerLeave = () => {
    clearTimeout(longPressTimer.current ?? undefined);
    if (isLongPress.current) {
      isLongPress.current = false;
      setHoldActive(false);
      const vid = videoRefs.current[reel.id];
      if (vid) vid.play().catch(() => {});
    }
  };

  return (
    <div
      data-id={reel.id} data-index={idx}
      className="reel-item relative w-full overflow-hidden bg-black flex-shrink-0"
      style={{ height: cardHeight, scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      {/* Video */}
      <video
        ref={el => { if (el) videoRefs.current[reel.id] = el; }}
        src={reel.video_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop playsInline muted={muted}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        onContextMenu={e => e.preventDefault()}
        style={{ userSelect: "none", WebkitUserSelect: "none" } as React.CSSProperties}
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80 pointer-events-none" />

      {/* Floating hearts */}
      {localFloatingHearts.map(h => (
        <div key={h.id} className="absolute pointer-events-none z-50"
          style={{ left: h.x - 32, top: h.y - 32, animation: "floatHeart .9s ease-out forwards" }}>
          <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,.8)]" />
        </div>
      ))}

      {/* Hold overlay */}
      {holdActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/50 rounded-full p-5 backdrop-blur-sm">
            <Pause className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Mute indicator — top right */}
      <div className="absolute top-4 right-4 z-30 bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/20 pointer-events-none">
        {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </div>

      {/* Action buttons — bottom-8 when nav present (32px above nav top = same visual spot) */}
      <div className={cn("absolute z-30", hasNav ? "bottom-8" : "bottom-24", isRTL ? "left-3" : "right-3")}>
        <ActionColumn reel={reel} isRTL={isRTL} followed={followed} saved={saved}
          currentUserId={currentUserId} onLike={onLike} onFollow={onFollow}
          onSave={onSave} onShare={onShare} onComment={onComment} size="sm" />
      </div>

      {/* Bottom info — pb-4 when nav present (16px above nav top = same visual spot) */}
      <div className={cn("absolute bottom-0 z-20 px-4 w-full", hasNav ? "pb-4" : "pb-20",
        isRTL ? "text-right pr-4 pl-16" : "pl-4 pr-16")}>
        <Link href={`/user?id=${reel.profile?.id}`}>
          <p className="text-white font-bold text-base mb-1 cursor-pointer hover:opacity-80 transition-opacity drop-shadow">
            @{reel.profile?.username}
          </p>
        </Link>
        {reel.caption && (
          <p className="text-white/90 text-sm leading-relaxed line-clamp-2 mb-2 drop-shadow">{reel.caption}</p>
        )}
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Music2 className="w-3 h-3 text-white/60 flex-shrink-0" />
          <div className="overflow-hidden flex-1 max-w-[200px]">
            <div className="animate-marquee">
              <span className="text-white/60 text-xs whitespace-nowrap pr-10">{reel.profile?.username} · {isRTL ? "صوت أصلي" : "Original Sound"}</span>
              <span className="text-white/60 text-xs whitespace-nowrap pr-10">{reel.profile?.username} · {isRTL ? "صوت أصلي" : "Original Sound"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   DESKTOP CARD
════════════════════════════════════════════════════ */
function DesktopReelCard({
  reel, idx, isRTL, muted, setMuted, paused, followed, saved,
  floatingHearts, currentUserId, videoRefs,
  onTap, onDoubleTap, onLike, onFollow, onSave, onShare, onComment,
}: CardProps) {
  return (
    <div
      data-id={reel.id} data-index={idx}
      className="reel-item w-full snap-start flex-shrink-0 flex items-center justify-center bg-black relative overflow-hidden"
      style={{ height: "100svh" }}
    >
      {/* Blurred bg */}
      <div className="absolute inset-0 pointer-events-none">
        <video src={reel.video_url} className="w-full h-full object-cover scale-110 blur-2xl opacity-25" muted loop playsInline />
      </div>

      {/* Card + actions */}
      <div className="relative z-10 flex items-end gap-6">

        {/* 9:16 video card */}
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl bg-black cursor-pointer select-none"
          style={{ height: "min(calc(100vh - 40px), 860px)", aspectRatio: "9/16" }}
          onClick={() => onTap(reel.id)}
          onDoubleClick={e => onDoubleTap(reel, e)}
        >
          <video
            ref={el => { if (el) videoRefs.current[reel.id] = el; }}
            src={reel.video_url}
            className="w-full h-full object-cover"
            loop playsInline muted={muted}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 pointer-events-none" />

          {/* Floating hearts */}
          {floatingHearts.map(h => (
            <div key={h.id} className="absolute pointer-events-none z-50"
              style={{ left: h.x - 32, top: h.y - 32, animation: "floatHeart .9s ease-out forwards" }}>
              <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,.8)]" />
            </div>
          ))}

          {/* Paused */}
          {paused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-black/40 rounded-full p-6 backdrop-blur-sm">
                <Play className="w-14 h-14 text-white fill-white" />
              </div>
            </div>
          )}


          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
            <Link href={`/user?id=${reel.profile?.id}`}>
              <p className="text-white font-bold text-base mb-1 cursor-pointer hover:opacity-80 transition-opacity drop-shadow">
                @{reel.profile?.username}
              </p>
            </Link>
            {reel.caption && (
              <p className="text-white/90 text-sm leading-relaxed line-clamp-3 mb-2 drop-shadow">{reel.caption}</p>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-600 border-2 border-neutral-700 flex items-center justify-center animate-spin-slow">
                <Music2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="overflow-hidden flex-1 max-w-[180px]">
                <div className="animate-marquee">
                  <span className="text-white/60 text-xs whitespace-nowrap pr-10">{reel.profile?.username} · {isRTL ? "صوت أصلي" : "Original Sound"}</span>
                  <span className="text-white/60 text-xs whitespace-nowrap pr-10">{reel.profile?.username} · {isRTL ? "صوت أصلي" : "Original Sound"}</span>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
                className="flex-shrink-0 bg-black/40 backdrop-blur-sm rounded-full p-1 border border-white/20 hover:bg-black/60 transition"
              >
                {muted
                  ? <VolumeX className="w-3.5 h-3.5 text-white" />
                  : <Volume2 className="w-3.5 h-3.5 text-white" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Action column */}
        <div className="flex-shrink-0 pb-5">
          <ActionColumn reel={reel} isRTL={isRTL} followed={followed} saved={saved}
            currentUserId={currentUserId} onLike={onLike} onFollow={onFollow}
            onSave={onSave} onShare={onShare} onComment={onComment} size="md" />
        </div>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
