import Layout from "@/components/layout";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useReels, useToggleReelLike } from "@/hooks/use-data";
import { Spinner } from "@/components/ui/spinner";
import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-data";
import { toast } from "sonner";

export default function Reels() {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const { data: reels, isLoading } = useReels(20);
  const { data: currentUser } = useCurrentUser();
  const toggleReelLike = useToggleReelLike();
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: string; left: number; top: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  // Intersection Observer to play/pause videos
  useEffect(() => {
    if (!reels || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute("data-id");
          const video = videoRefs.current[videoId || ""];
          
          if (video) {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const elements = document.querySelectorAll(".reel-container");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels]);

  const handleLike = async (reel: any) => {
    if (!currentUser) {
      toast.error(isRTL ? "يجب تسجيل الدخول أولاً" : "Please login first");
      return;
    }

    try {
      await toggleReelLike.mutateAsync(reel.id);
      
      // Add floating heart animation
      const id = Math.random().toString();
      setFloatingHearts(prev => [...prev, {
        id,
        left: Math.random() * 60 + 20,
        top: Math.random() * 40 + 30,
      }]);

      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== id));
      }, 1200);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = (reel: any) => {
    const reelUrl = `${window.location.origin}/reel/${reel.id}`;
    navigator.clipboard.writeText(reelUrl);
    toast.success(isRTL ? "تم نسخ الرابط" : "Link copied!");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] md:h-screen w-full flex items-center justify-center bg-background">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] md:h-screen w-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎬</div>
            <h2 className="text-2xl font-bold text-foreground">
              {isRTL ? "لا توجد ريلز حالياً" : "No Reels Yet"}
            </h2>
            <p className="text-muted-foreground">
              {isRTL 
                ? "ستتمكن من مشاهدة ريلز هنا قريباً" 
                : "Reels will appear here soon"}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        ref={containerRef}
        className="fixed inset-0 top-16 md:top-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
      >
        {reels.map((reel: any) => (
          <div 
            key={reel.id}
            data-id={reel.id}
            className="reel-container relative w-full h-[calc(100vh-4rem)] md:h-screen snap-start flex items-center justify-center bg-black"
          >
            {/* Video */}
            <video
              ref={(el) => {
                if (el) videoRefs.current[reel.id] = el;
              }}
              src={reel.video_url}
              className="w-full h-full object-contain"
              loop
              playsInline
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

            {/* Floating Hearts */}
            {floatingHearts.map(heart => (
              <div
                key={heart.id}
                className="absolute pointer-events-none animate-pulse"
                style={{
                  left: `${heart.left}%`,
                  top: `${heart.top}%`,
                  animation: 'float 1.2s ease-out forwards'
                }}
              >
                <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-lg" />
              </div>
            ))}

            {/* Side Action Buttons - Mobile */}
            <div className={cn(
              "absolute bottom-24 flex flex-col gap-6 md:hidden z-30",
              isRTL ? "left-4" : "right-4"
            )}>
              <button
                onClick={() => handleLike(reel)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={cn(
                  "bg-black/30 group-hover:bg-pink-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20",
                  reel.is_liked && "bg-pink-500/40"
                )}>
                  <Heart className={cn(
                    "w-6 h-6 transition-colors",
                    reel.is_liked ? "fill-pink-500 text-pink-500" : "text-white"
                  )} />
                </div>
                <span className="text-white text-xs font-semibold">{reel.likes_count}</span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="bg-black/30 group-hover:bg-blue-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">{reel.comments_count}</span>
              </button>

              <button 
                onClick={() => handleShare(reel)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="bg-black/30 group-hover:bg-green-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="bg-black/30 group-hover:bg-purple-500/40 p-3 rounded-full transition-all backdrop-blur-sm border border-white/20">
                  <MoreVertical className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>

            {/* User Info & Caption - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 space-y-3 z-20">
              <div className={cn("flex items-center gap-3 cursor-pointer group", isRTL && "flex-row-reverse")}>
                <Avatar className="w-10 h-10 ring-2 ring-pink-500/30 group-hover:ring-pink-500/60 transition-all">
                  <AvatarImage src={reel.profile?.avatar_url} />
                  <AvatarFallback>{reel.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{reel.profile?.username}</p>
                  <p className="text-xs text-white/60">{new Date(reel.created_at).toLocaleDateString()}</p>
                </div>
                <button className="px-3 py-1 rounded-full border border-white/40 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-colors">
                  {isRTL ? "متابعة" : "Follow"}
                </button>
              </div>

              {reel.caption && (
                <p className="text-sm text-white/90 leading-relaxed break-words line-clamp-3">{reel.caption}</p>
              )}

              {/* Stats */}
              <div className={cn("flex gap-4 text-xs text-white/70", isRTL && "flex-row-reverse")}>
                <span>❤️ {reel.likes_count.toLocaleString()}</span>
                <span>💬 {reel.comments_count.toLocaleString()}</span>
              </div>
            </div>

            {/* Desktop Action Buttons - Right Side */}
            <div className="absolute bottom-20 right-4 hidden md:flex flex-col gap-6 z-30">
              <button
                onClick={() => handleLike(reel)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "bg-white/10 group-hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-sm",
                  reel.is_liked && "bg-pink-500/30"
                )}>
                  <Heart className={cn(
                    "w-6 h-6 transition-colors",
                    reel.is_liked ? "fill-pink-500 text-pink-500" : "text-white"
                  )} />
                </div>
                <span className="text-white text-xs">{reel.likes_count}</span>
              </button>

              <button className="flex flex-col items-center gap-2 group">
                <div className="bg-white/10 group-hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-sm">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">{reel.comments_count}</span>
              </button>

              <button 
                onClick={() => handleShare(reel)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="bg-white/10 group-hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-sm">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
