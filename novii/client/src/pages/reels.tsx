import Layout from "@/components/layout";
import { ReelCommentsSheet } from "@/components/reel-comments-sheet";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { useInfiniteReels, useToggleReelLike, useToggleFollow, useToggleSaveReel } from "@/hooks/use-data";
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
import { supabase } from "@/lib/supabase";

interface FloatingHeart { id: string; x: number; y: number }

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
  const toggleSaveReel = useToggleSaveReel();

  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [muted, setMuted]                 = useState(false);
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const guestViewCount   = useRef(0);
  const guestPromptShown = useRef(false);

  const followInitVersion = useRef(0);
  useEffect(() => {
    if (!currentUser?.id) return;
    const profileIds = [...new Set(reels.map((r: any) => r.profile?.id).filter(Boolean))];
    if (profileIds.length === 0) return;
    const version = ++followInitVersion.current;
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)
      .in('following_id', profileIds)
      .then(({ data }) => {
        if (data && version === followInitVersion.current) {
          setFollowedUsers(prev => {
            const merged = new Set(prev);
            data.forEach(f => merged.add(f.following_id));
            return merged;
          });
        }
      });
  }, [currentUser?.id, reels]);

  useEffect(() => {
    const load = () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); };
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) load();
    }, { rootMargin: "400px" });
    const els = [mobileSentinelRef.current, desktopSentinelRef.current].filter(Boolean) as Element[];
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const stableRefs = useRef({ toggleReelLike, toggleFollow, toggleSaveReel, currentUser, showPrompt, followedUsers, isRTL });
  stableRefs.current = { toggleReelLike, toggleFollow, toggleSaveReel, currentUser, showPrompt, followedUsers, isRTL };

  const handleLike = useCallback(async (reelId: string): Promise<boolean> => {
    const { currentUser: u, showPrompt: sp, toggleReelLike: trl } = stableRefs.current;
    if (!u) { sp(); return false; }
    try { await trl.mutateAsync(reelId); return true; } catch { return false; }
  }, []);

  const handleFollow = useCallback(async (uid: string) => {
    const { currentUser: u, showPrompt: sp, toggleFollow: tf, followedUsers: fu, isRTL: rtl } = stableRefs.current;
    if (!u) { sp(); return; }
    const wasFollowed = fu.has(uid);
    setFollowedUsers(p => { const n = new Set(p); wasFollowed ? n.delete(uid) : n.add(uid); return n; });
    try {
      await tf.mutateAsync({ targetUserId: uid });
    } catch {
      setFollowedUsers(p => { const n = new Set(p); wasFollowed ? n.add(uid) : n.delete(uid); return n; });
      toast.error(rtl ? "حدث خطأ" : "Something went wrong");
    }
  }, []);

  const handleSave = useCallback(async (id: string) => {
    const { currentUser: u, showPrompt: sp, toggleSaveReel: tsr, isRTL: rtl } = stableRefs.current;
    if (!u) { sp(); return; }
    try {
      const nowSaved = await tsr.mutateAsync(id);
      toast.success(nowSaved ? (rtl ? "تم الحفظ" : "Saved") : (rtl ? "تمت الإزالة" : "Removed"));
    } catch {
      toast.error(rtl ? "حدث خطأ" : "Something went wrong");
    }
  }, []);

  const handleShare = useCallback((reel: any) => {
    const { isRTL: rtl } = stableRefs.current;
    navigator.clipboard.writeText(`${window.location.origin}/reel/${reel.id}`);
    toast.success(rtl ? "تم نسخ الرابط" : "Link copied!");
  }, []);

  const handleComment = useCallback((id: string) => {
    const { currentUser: u, showPrompt: sp } = stableRefs.current;
    if (!u) { sp(); return; }
    setCommentReelId(id);
  }, []);

  const isGuestRef = useRef(isGuest);
  isGuestRef.current = isGuest;

  const onVisible = useCallback(() => {
    if (isGuestRef.current && !guestPromptShown.current) {
      guestViewCount.current += 1;
      if (guestViewCount.current > 2) {
        guestPromptShown.current = true;
        setTimeout(() => stableRefs.current.showPrompt(), 600);
      }
    }
  }, []);

  const sharedProps = (reel: any) => ({
    reel,
    isRTL,
    muted,
    setMuted,
    followed: followedUsers.has(reel.profile?.id),
    saved: !!reel.is_saved,
    currentUserId: currentUser?.id,
    onLike: handleLike,
    onFollow: handleFollow,
    onSave: handleSave,
    onShare: handleShare,
    onComment: handleComment,
    onVisible,
  });

  const wrapContent = (content: React.ReactNode) =>
    isGuest ? content : <Layout>{content}</Layout>;

  if (isLoading) return wrapContent(
    <div className="fixed inset-0 lg:left-20 flex items-center justify-center bg-background">
      <Spinner />
    </div>
  );

  if (!reels?.length) return wrapContent(
    <div className="fixed inset-0 lg:left-20 flex flex-col items-center justify-center bg-background gap-4">
      <div className="text-6xl">🎬</div>
      <h2 className="text-2xl font-bold text-foreground">{isRTL ? "لا توجد ريلز" : "No Reels Yet"}</h2>
      <p className="text-muted-foreground">{isRTL ? "كن أول من ينشر!" : "Be the first to post!"}</p>
    </div>
  );

  return wrapContent(
    <>
      {/* MOBILE */}
      <div
        className={cn(
          "mobile-reels-container fixed inset-x-0 top-0 lg:hidden snap-y snap-mandatory bg-background",
          isGuest ? "bottom-0" : "bottom-16"
        )}
        style={{
          overflowY: "scroll",
          overflowX: "hidden",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          overflowAnchor: "none",
        } as React.CSSProperties}
      >
        {reels.map((reel: any, idx: number) => (
          <MobileReelCard
            key={reel.id}
            idx={idx}
            cardHeight={isGuest ? "100svh" : "calc(100svh - 4rem)"}
            {...sharedProps(reel)}
          />
        ))}
        <div ref={mobileSentinelRef} className="w-full h-2 shrink-0" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center w-full h-16 shrink-0">
            <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div
        className="fixed inset-0 left-20 hidden lg:block overflow-y-scroll snap-y snap-mandatory bg-background"
        style={{ scrollbarWidth: "none", overflowAnchor: "none" } as React.CSSProperties}
      >
        {reels.map((reel: any, idx: number) => (
          <DesktopReelCard
            key={reel.id}
            idx={idx}
            {...sharedProps(reel)}
          />
        ))}
        <div ref={desktopSentinelRef} className="w-full h-2 shrink-0" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center w-full h-16 shrink-0">
            <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}
      </div>

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
    </>
  );
}

/* ════════════════════════════════════════════════════
   SHARED TYPES
════════════════════════════════════════════════════ */
interface CardProps {
  reel: any; idx: number; isRTL: boolean; muted: boolean;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  followed: boolean; saved: boolean;
  currentUserId?: string;
  cardHeight?: string;
  onLike: (reelId: string) => Promise<boolean>;
  onFollow: (uid: string) => void;
  onSave: (id: string) => void;
  onShare: (reel: any) => void;
  onComment: (id: string) => void;
  onVisible: () => void;
}

/* ════════════════════════════════════════════════════
   ACTION COLUMN
════════════════════════════════════════════════════ */
function ActionColumn({ reel, isRTL, followed, saved, currentUserId, isLiked, likesCount, onLike, onFollow, onSave, onShare, onComment, size = "md" }: {
  reel: any; isRTL: boolean; followed: boolean; saved: boolean;
  currentUserId?: string; size?: "sm" | "md";
  isLiked: boolean; likesCount: number;
  onLike: () => void;
  onFollow: (uid: string) => void;
  onSave: (id: string) => void;
  onShare: (reel: any) => void;
  onComment: (id: string) => void;
}) {
  const ic = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  const nc = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <Link href={`/user?id=${reel.profile?.id}`}>
          <Avatar className={cn("ring-2 ring-white cursor-pointer", size === "sm" ? "w-10 h-10" : "w-12 h-12")}>
            <AvatarImage src={reel.profile?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
              {reel.profile?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        {currentUserId !== reel.profile?.id && !followed && (
          <button
            onClick={() => onFollow(reel.profile.id)}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow transition-all bg-[#ff3b5c]"
          >
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </button>
        )}
      </div>
      <button onClick={onLike} className="flex flex-col items-center gap-1 group">
        <Heart className={cn(ic, "transition-all drop-shadow group-active:scale-125",
          isLiked ? "fill-[#ff3b5c] text-[#ff3b5c] scale-110" : "text-white")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{fmt(likesCount)}</span>
      </button>
      <button onClick={() => onComment(reel.id)} className="flex flex-col items-center gap-1 group">
        <MessageCircle className={cn(ic, "text-white drop-shadow group-active:scale-125 transition-transform")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{fmt(reel.comments_count)}</span>
      </button>
      <button onClick={() => onSave(reel.id)} className="flex flex-col items-center gap-1 group">
        <Bookmark className={cn(ic, "drop-shadow transition-all group-active:scale-125",
          saved ? "fill-yellow-400 text-yellow-400" : "text-white")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{fmt(reel.saves_count || 0)}</span>
      </button>
      <button onClick={() => onShare(reel)} className="flex flex-col items-center gap-1 group">
        <Share2 className={cn(ic, "text-white drop-shadow group-active:scale-125 transition-transform")} />
        <span className={cn(nc, "text-white font-semibold drop-shadow")}>{isRTL ? "مشاركة" : "Share"}</span>
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Hook: visibility-based video playback
════════════════════════════════════════════════════ */
function sendSkipSignal(reelId: string) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.access_token) return;
    fetch("/api/content-signals/skip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": session.user.id,
        "x-user-token": session.access_token,
      },
      body: JSON.stringify({ target_id: reelId, target_type: "reel" }),
    }).catch(() => {});
  });
}

function useVideoPlayback(reel: any, muted: boolean, setMuted: React.Dispatch<React.SetStateAction<boolean>>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const isVisible = useRef(false);
  const userPaused = useRef(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const visibleSince = useRef<number | null>(null);
  const skipSent = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const vid = videoRef.current;
        if (!vid) return;
        isVisible.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          visibleSince.current = Date.now();
          skipSent.current = false;
          userPaused.current = false;
          setPaused(false);
          vid.muted = mutedRef.current;
          const p = vid.play();
          if (p) p.catch(() => {
            vid.muted = true;
            setMuted(true);
            vid.play().catch(() => {});
          });
        } else {
          if (visibleSince.current && !skipSent.current) {
            const viewDuration = (Date.now() - visibleSince.current) / 1000;
            if (viewDuration >= 2 && viewDuration <= 5) {
              sendSkipSignal(reel.id);
              skipSent.current = true;
            }
          }
          visibleSince.current = null;
          vid.pause();
          vid.currentTime = 0;
          setPaused(false);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [setMuted, reel.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid && isVisible.current && !userPaused.current) {
      vid.muted = muted;
    }
  }, [muted]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      userPaused.current = false;
      vid.muted = mutedRef.current;
      const p = vid.play();
      if (p) p.catch(() => { vid.muted = true; setMuted(true); vid.play().catch(() => {}); });
      setPaused(false);
    } else {
      userPaused.current = true;
      vid.pause();
      setPaused(true);
    }
  }, [setMuted]);

  return { videoRef, containerRef, paused, togglePlay };
}

/* ════════════════════════════════════════════════════
   MOBILE CARD
════════════════════════════════════════════════════ */
const MobileReelCard = React.memo(function MobileReelCard({
  reel, idx, isRTL, muted, setMuted, followed, saved,
  currentUserId, cardHeight = "100svh",
  onLike, onFollow, onSave, onShare, onComment, onVisible,
}: CardProps) {
  const { videoRef, containerRef, paused, togglePlay } = useVideoPlayback(reel, muted, setMuted);
  const hasNav = cardHeight !== "100svh";
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const lastTapTime = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [holdActive, setHoldActive] = useState(false);
  const [localHearts, setLocalHearts] = useState<FloatingHeart[]>([]);
  const visibilityCalled = useRef(false);
  const [localLiked, setLocalLiked] = useState(reel.is_liked);
  const [localLikeCount, setLocalLikeCount] = useState(reel.likes_count);

  const localLikedRef = useRef(localLiked);
  localLikedRef.current = localLiked;

  const doLike = useCallback(async () => {
    const wasLiked = localLikedRef.current;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((prev: number) => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    const ok = await onLike(reel.id);
    if (!ok) {
      setLocalLiked(wasLiked);
      setLocalLikeCount((prev: number) => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  }, [reel.id, onLike]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visibilityCalled.current) {
        visibilityCalled.current = true;
        onVisible();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible, containerRef]);

  const cancelLongPress = (resume = false) => {
    clearTimeout(longPressTimer.current ?? undefined);
    if (isLongPress.current) {
      isLongPress.current = false;
      setHoldActive(false);
      if (resume) {
        const vid = videoRef.current;
        if (vid) vid.play().catch(() => {});
      }
    }
    pointerStart.current = null;
  };

  const spawnHeart = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = Math.random().toString(36).slice(2);
    setLocalHearts(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setLocalHearts(p => p.filter(h => h.id !== id)), 900);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isLongPress.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setHoldActive(true);
      const vid = videoRef.current;
      if (vid) vid.pause();
    }, 600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    if (dx > 8 || dy > 8) cancelLongPress(false);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const wasLong = isLongPress.current;
    cancelLongPress(true);
    if (wasLong) return;

    const now = Date.now();
    if (now - lastTapTime.current < 350) {
      clearTimeout(singleTapTimer.current ?? undefined);
      lastTapTime.current = 0;
      if (!localLikedRef.current) doLike();
      spawnHeart(e);
    } else {
      lastTapTime.current = now;
      singleTapTimer.current = setTimeout(() => {
        togglePlay();
      }, 350);
    }
  };

  const handlePointerCancel = () => cancelLongPress(false);
  const handlePointerLeave = () => cancelLongPress(true);

  return (
    <div
      ref={containerRef}
      data-id={reel.id} data-index={idx}
      className="reel-item relative w-full overflow-hidden bg-black flex-shrink-0"
      style={{ height: cardHeight, scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop playsInline
        preload="auto"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        onContextMenu={e => e.preventDefault()}
        style={{ userSelect: "none", WebkitUserSelect: "none" } as React.CSSProperties}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80 pointer-events-none" />

      {localHearts.map(h => (
        <div key={h.id} className="absolute pointer-events-none z-50"
          style={{ left: h.x - 32, top: h.y - 32, animation: "floatHeart .9s ease-out forwards" }}>
          <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,.8)]" />
        </div>
      ))}

      {holdActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/50 rounded-full p-5 backdrop-blur-sm">
            <Pause className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}

      {paused && !holdActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/40 rounded-full p-5 backdrop-blur-sm">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}

      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-4 right-4 z-30 bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/20 active:scale-90 transition-transform"
      >
        {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      <div className={cn("absolute z-30", hasNav ? "bottom-8" : "bottom-24", isRTL ? "left-3" : "right-3")}>
        <ActionColumn reel={reel} isRTL={isRTL} followed={followed} saved={saved}
          currentUserId={currentUserId} isLiked={localLiked} likesCount={localLikeCount}
          onLike={doLike} onFollow={onFollow}
          onSave={onSave} onShare={onShare} onComment={onComment} size="sm" />
      </div>

      <div className={cn("absolute bottom-0 z-20 px-4 w-full", hasNav ? "pb-4" : "pb-20",
        isRTL ? "text-right pr-4 pl-16" : "pl-4 pr-16")}>
        <Link href={`/user?id=${reel.profile?.id}`}>
          <p className="text-white font-bold text-base mb-1 cursor-pointer hover:opacity-80 transition-opacity drop-shadow">
            {reel.profile?.full_name || reel.profile?.username}
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
});

/* ════════════════════════════════════════════════════
   DESKTOP CARD
════════════════════════════════════════════════════ */
const DesktopReelCard = React.memo(function DesktopReelCard({
  reel, idx, isRTL, muted, setMuted, followed, saved,
  currentUserId,
  onLike, onFollow, onSave, onShare, onComment, onVisible,
}: CardProps) {
  const { videoRef, containerRef, paused, togglePlay } = useVideoPlayback(reel, muted, setMuted);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount = useRef(0);
  const visibilityCalled = useRef(false);
  const [localLiked, setLocalLiked] = useState(reel.is_liked);
  const [localLikeCount, setLocalLikeCount] = useState(reel.likes_count);

  const localLikedRef = useRef(localLiked);
  localLikedRef.current = localLiked;

  const doLike = useCallback(async () => {
    const wasLiked = localLikedRef.current;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((prev: number) => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    const ok = await onLike(reel.id);
    if (!ok) {
      setLocalLiked(wasLiked);
      setLocalLikeCount((prev: number) => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  }, [reel.id, onLike]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visibilityCalled.current) {
        visibilityCalled.current = true;
        onVisible();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible, containerRef]);

  const spawnHeart = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).closest(".reel-item")!.getBoundingClientRect();
    const id = Math.random().toString(36).slice(2);
    setFloatingHearts(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setFloatingHearts(p => p.filter(h => h.id !== id)), 900);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    clickCount.current += 1;
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
        togglePlay();
      }, 300);
    } else if (clickCount.current >= 2) {
      clearTimeout(clickTimer.current!);
      clickCount.current = 0;
      if (!localLikedRef.current) doLike();
      spawnHeart(e);
    }
  }, [togglePlay, doLike, spawnHeart]);

  return (
    <div
      ref={containerRef}
      data-id={reel.id} data-index={idx}
      className="reel-item w-full snap-start flex-shrink-0 flex items-center justify-center bg-black relative overflow-hidden"
      style={{ height: "100svh" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {reel.thumbnail_url ? (
          <img src={reel.thumbnail_url} className="w-full h-full object-cover scale-110 blur-2xl opacity-25" alt="" />
        ) : (
          <video src={reel.video_url} className="w-full h-full object-cover scale-110 blur-2xl opacity-25" muted preload="metadata" />
        )}
      </div>

      <div className="relative z-10 flex items-end gap-6">
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl bg-black cursor-pointer select-none"
          style={{ height: "min(calc(100vh - 40px), 860px)", aspectRatio: "9/16" }}
          onClick={handleClick}
        >
          <video
            ref={videoRef}
            src={reel.video_url}
            className="w-full h-full object-cover"
            loop playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 pointer-events-none" />

          {floatingHearts.map(h => (
            <div key={h.id} className="absolute pointer-events-none z-50"
              style={{ left: h.x - 32, top: h.y - 32, animation: "floatHeart .9s ease-out forwards" }}>
              <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,.8)]" />
            </div>
          ))}

          {paused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-black/40 rounded-full p-6 backdrop-blur-sm">
                <Play className="w-14 h-14 text-white fill-white" />
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
            <Link href={`/user?id=${reel.profile?.id}`}>
              <p className="text-white font-bold text-base mb-1 cursor-pointer hover:opacity-80 transition-opacity drop-shadow">
                {reel.profile?.full_name || reel.profile?.username}
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

        <div className="flex-shrink-0 pb-5">
          <ActionColumn reel={reel} isRTL={isRTL} followed={followed} saved={saved}
            currentUserId={currentUserId} isLiked={localLiked} likesCount={localLikeCount}
            onLike={doLike} onFollow={onFollow}
            onSave={onSave} onShare={onShare} onComment={onComment} size="md" />
        </div>
      </div>
    </div>
  );
});

function fmt(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
