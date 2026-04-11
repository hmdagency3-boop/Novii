import Layout from "@/components/layout";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/language-context";
import { useReels, useToggleReelLike, useToggleFollow } from "@/hooks/use-data";
import { Spinner } from "@/components/ui/spinner";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play, Plus, Music2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-data";
import { toast } from "sonner";
import { Link } from "wouter";

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
}

export default function Reels() {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const { data: reels, isLoading } = useReels(20);
  const { data: currentUser } = useCurrentUser();
  const toggleReelLike = useToggleReelLike();
  const toggleFollow = useToggleFollow();
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(true);
  const [pausedReels, setPausedReels] = useState<Set<string>>(new Set());
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const lastTapRef = useRef<number>(0);

  // IntersectionObserver: auto-play/pause
  useEffect(() => {
    if (!reels || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute("data-id");
          const idx = Number(entry.target.getAttribute("data-index"));
          const video = videoRefs.current[videoId || ""];
          if (video) {
            if (entry.isIntersecting) {
              video.muted = muted;
              video.play().catch(() => {});
              setCurrentReelIndex(idx);
            } else {
              video.pause();
              video.currentTime = 0;
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const elements = document.querySelectorAll(".reel-item");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels, muted]);

  // Sync mute state to all videos
  useEffect(() => {
    Object.values(videoRefs.current).forEach((v) => { v.muted = muted; });
  }, [muted]);

  const handleLike = useCallback(async (reel: any, e?: React.MouseEvent) => {
    if (!currentUser) { toast.error(isRTL ? "سجّل دخولك أولاً" : "Please login first"); return; }
    try {
      await toggleReelLike.mutateAsync(reel.id);
      if (e) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const id = Math.random().toString(36).slice(2);
        setFloatingHearts(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== id)), 900);
      }
    } catch {}
  }, [currentUser, isRTL, toggleReelLike]);

  const handleDoubleTap = useCallback((reel: any, e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      if (!reel.is_liked) handleLike(reel, e);
      const id = Math.random().toString(36).slice(2);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setFloatingHearts(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== id)), 900);
    }
    lastTapRef.current = now;
  }, [handleLike]);

  const handleTap = useCallback((reelId: string) => {
    const video = videoRefs.current[reelId];
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPausedReels(prev => { const n = new Set(prev); n.delete(reelId); return n; });
    } else {
      video.pause();
      setPausedReels(prev => new Set([...prev, reelId]));
    }
  }, []);

  const handleShare = useCallback((reel: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/reel/${reel.id}`);
    toast.success(isRTL ? "تم نسخ الرابط" : "Link copied!");
  }, [isRTL]);

  const handleFollow = useCallback((userId: string) => {
    if (!currentUser) { toast.error(isRTL ? "سجّل دخولك أولاً" : "Please login first"); return; }
    toggleFollow.mutate(userId);
    setFollowedUsers(prev => {
      const n = new Set(prev);
      n.has(userId) ? n.delete(userId) : n.add(userId);
      return n;
    });
  }, [currentUser, isRTL, toggleFollow]);

  const handleSave = useCallback((reelId: string) => {
    setSavedReels(prev => {
      const n = new Set(prev);
      n.has(reelId) ? n.delete(reelId) : n.add(reelId);
      return n;
    });
    toast.success(savedReels.has(reelId)
      ? (isRTL ? "تمت الإزالة" : "Removed")
      : (isRTL ? "تم الحفظ" : "Saved"));
  }, [isRTL, savedReels]);

  if (isLoading) {
    return (
      <Layout>
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <Layout>
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-4">
          <div className="text-6xl">🎬</div>
          <h2 className="text-2xl font-bold text-white">
            {isRTL ? "لا توجد ريلز حالياً" : "No Reels Yet"}
          </h2>
          <p className="text-white/60">
            {isRTL ? "كن أول من ينشر ريلز!" : "Be the first to post a reel!"}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Full-screen TikTok-style container */}
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory bg-black"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reels.map((reel: any, idx: number) => (
          <div
            key={reel.id}
            data-id={reel.id}
            data-index={idx}
            className="reel-item relative w-full h-screen snap-start overflow-hidden bg-black flex items-center justify-center"
          >
            {/* ── Video ── */}
            <video
              ref={(el) => { if (el) videoRefs.current[reel.id] = el; }}
              src={reel.video_url}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              playsInline
              muted={muted}
              onClick={() => handleTap(reel.id)}
              onDoubleClick={(e) => handleDoubleTap(reel, e)}
            />

            {/* ── Gradient overlays ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-50% to-black/80 pointer-events-none" />

            {/* ── Floating Hearts ── */}
            {floatingHearts.map(h => (
              <div
                key={h.id}
                className="absolute pointer-events-none z-50"
                style={{
                  left: h.x - 32,
                  top: h.y - 32,
                  animation: "floatHeart 0.9s ease-out forwards",
                }}
              >
                <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              </div>
            ))}

            {/* ── Play icon when paused ── */}
            {pausedReels.has(reel.id) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="bg-black/40 rounded-full p-5 backdrop-blur-sm">
                  <Play className="w-12 h-12 text-white fill-white" />
                </div>
              </div>
            )}

            {/* ── Top bar: Mute ── */}
            <div className="absolute top-4 right-4 z-30 flex gap-3">
              <button
                onClick={() => setMuted(m => !m)}
                className="bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/20"
              >
                {muted
                  ? <VolumeX className="w-5 h-5 text-white" />
                  : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>

            {/* ── Right action buttons (TikTok style) ── */}
            <div className={cn(
              "absolute bottom-24 md:bottom-20 flex flex-col items-center gap-5 z-30",
              isRTL ? "left-3" : "right-3"
            )}>
              {/* Avatar + Follow */}
              <div className="relative mb-2">
                <Link href={`/user?id=${reel.profile?.id}`}>
                  <Avatar className="w-12 h-12 ring-2 ring-white cursor-pointer">
                    <AvatarImage src={reel.profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                      {reel.profile?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                {currentUser?.id !== reel.profile?.id && (
                  <button
                    onClick={() => handleFollow(reel.profile.id)}
                    className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                      followedUsers.has(reel.profile?.id)
                        ? "bg-white/30"
                        : "bg-[#ff3b5c]"
                    )}
                  >
                    <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                  </button>
                )}
              </div>

              {/* Like */}
              <button
                onClick={(e) => handleLike(reel, e)}
                className="flex flex-col items-center gap-1 group"
              >
                <Heart className={cn(
                  "w-8 h-8 transition-all drop-shadow group-active:scale-125",
                  reel.is_liked ? "fill-[#ff3b5c] text-[#ff3b5c] scale-110" : "text-white"
                )} />
                <span className="text-white text-xs font-semibold drop-shadow">
                  {formatCount(reel.likes_count)}
                </span>
              </button>

              {/* Comment */}
              <button className="flex flex-col items-center gap-1 group">
                <MessageCircle className="w-8 h-8 text-white drop-shadow group-active:scale-125 transition-transform fill-white/10" />
                <span className="text-white text-xs font-semibold drop-shadow">
                  {formatCount(reel.comments_count)}
                </span>
              </button>

              {/* Bookmark */}
              <button
                onClick={() => handleSave(reel.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <Bookmark className={cn(
                  "w-8 h-8 drop-shadow transition-all group-active:scale-125",
                  savedReels.has(reel.id) ? "fill-yellow-400 text-yellow-400" : "text-white"
                )} />
                <span className="text-white text-xs font-semibold drop-shadow">
                  {savedReels.has(reel.id) ? formatCount((reel.saves_count || 0) + 1) : formatCount(reel.saves_count || 0)}
                </span>
              </button>

              {/* Share */}
              <button
                onClick={() => handleShare(reel)}
                className="flex flex-col items-center gap-1 group"
              >
                <Share2 className="w-8 h-8 text-white drop-shadow group-active:scale-125 transition-transform" />
                <span className="text-white text-xs font-semibold drop-shadow">
                  {isRTL ? "مشاركة" : "Share"}
                </span>
              </button>

              {/* Spinning music disc */}
              <div className="mt-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-600 border-4 border-neutral-700 flex items-center justify-center animate-spin-slow">
                  <Music2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* ── Bottom: user info + caption ── */}
            <div className={cn(
              "absolute bottom-0 z-20 pb-6 px-4 w-full",
              isRTL ? "text-right" : "text-left",
              isRTL ? "pr-4 pl-20" : "pl-4 pr-20"
            )}>
              {/* Username */}
              <Link href={`/user?id=${reel.profile?.id}`}>
                <p className="text-white font-bold text-base mb-1 cursor-pointer hover:opacity-80 transition-opacity">
                  @{reel.profile?.username}
                </p>
              </Link>

              {/* Caption */}
              {reel.caption && (
                <p className="text-white/90 text-sm leading-relaxed line-clamp-2 mb-2">
                  {reel.caption}
                </p>
              )}

              {/* Music bar */}
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Music2 className="w-3 h-3 text-white/70" />
                <div className="overflow-hidden flex-1 max-w-[180px]">
                  <p className="text-white/70 text-xs whitespace-nowrap animate-marquee">
                    {reel.profile?.username} · {isRTL ? "صوت أصلي" : "Original Sound"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatHeart {
          0%   { opacity: 1; transform: scale(1) translateY(0); }
          50%  { opacity: 0.8; transform: scale(1.3) translateY(-30px); }
          100% { opacity: 0; transform: scale(0.8) translateY(-80px); }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee { animation: marquee 6s linear infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reel-item::-webkit-scrollbar { display: none; }
      `}</style>
    </Layout>
  );
}

function formatCount(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
