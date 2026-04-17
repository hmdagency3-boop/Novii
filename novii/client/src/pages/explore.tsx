import Layout from "@/components/layout";
import { Search, Play, Eye, Hash, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useExplorePosts, useExploreReels } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useGuestPrompt } from "@/components/guest-login-prompt";
import { ReelViewerModal } from "@/components/reel-viewer-modal";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import type { Post, Reel } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { getExploreTranslation } from "@/lib/explore-translations";

interface TrendingHashtag {
  id: string;
  name: string;
  posts_count: number;
  is_pinned: boolean;
}

type ExploreItem = 
  | { kind: 'post'; data: Post }
  | { kind: 'reel'; data: Reel };

// Cloudinary can generate a JPG poster from any uploaded video by swapping
// the file extension and adding a `so_0` (start-offset 0s) transform. This
// gives reels a real preview frame instead of an empty grey video tag.
function cloudinaryVideoThumb(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  if (!videoUrl.includes("res.cloudinary.com") || !videoUrl.includes("/video/upload/")) {
    return null;
  }
  const withTransform = videoUrl.replace(
    "/video/upload/",
    "/video/upload/so_0,q_auto,f_jpg/"
  );
  return withTransform.replace(/\.(mp4|mov|webm|m4v|avi|mkv)(\?.*)?$/i, ".jpg$2");
}

function ExploreContent() {
  const { data: explorePosts, isLoading: postsLoading } = useExplorePosts(50);
  const { data: exploreReels, isLoading: reelsLoading } = useExploreReels(20);
  const { user } = useAuth();
  const { showPrompt } = useGuestPrompt();
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [trendingTags, setTrendingTags] = useState<TrendingHashtag[]>([]);
  const [, navigate] = useLocation();
  const { language, direction } = useLanguage();
  const exploreT = getExploreTranslation(language.code);

  useEffect(() => {
    fetch("/api/hashtags/trending")
      .then(r => r.ok ? r.json() : [])
      .then(data => setTrendingTags(data || []))
      .catch(() => {});
  }, []);

  const isLoading = postsLoading || reelsLoading;

  const items: ExploreItem[] = useMemo(() => {
    // Explore is a visual grid — drop anything that has no media to render,
    // otherwise it shows up as an empty `bg-muted` (brown/dark) tile.
    const posts = (explorePosts || [])
      .filter(p => !!p.image_url)
      .map(p => ({ kind: 'post' as const, data: p }));
    const reels = (exploreReels || [])
      .filter(r => !!r.thumbnail_url || !!r.video_url)
      .map(r => ({ kind: 'reel' as const, data: r }));

    if (reels.length === 0) return posts;
    if (posts.length === 0) return reels;

    const mixed: ExploreItem[] = [];
    let pi = 0, ri = 0;
    let idx = 0;
    while (pi < posts.length || ri < reels.length) {
      if (ri < reels.length && (idx % 5 === 2 || pi >= posts.length)) {
        mixed.push(reels[ri++]);
      } else if (pi < posts.length) {
        mixed.push(posts[pi++]);
      }
      idx++;
    }
    return mixed;
  }, [explorePosts, exploreReels]);

  const handlePostClick = () => {
    if (!user) showPrompt();
  };

  const handleReelClick = (reel: Reel) => {
    if (!user) {
      showPrompt();
      return;
    }
    setSelectedReel(reel);
  };

  const allReels = useMemo(() => 
    items.filter(i => i.kind === 'reel').map(i => i.data as Reel),
    [items]
  );

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md p-4 border-b border-border">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={exploreT.searchPlaceholder}
            className="pl-10 bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all rounded-xl"
            onFocus={!user ? showPrompt : undefined}
            readOnly={!user}
          />
        </div>
      </div>

      {trendingTags.length > 0 && (
        <div className="px-4 py-3 border-b border-border" dir={direction}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold">{exploreT.trendingHashtags}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" dir={direction}>
            {trendingTags.slice(0, 10).map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/hashtag/${t.name}`)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent hover:bg-accent/80 transition-colors"
              >
                <Hash className="w-3 h-3 text-purple-500" />
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-[11px] text-muted-foreground">{t.posts_count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 md:p-4 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4 auto-rows-[120px] md:auto-rows-[250px]">
            {items.map((item, i) => {
              const isLarge = i % 7 === 0;
              const isTall = i % 5 === 0 && !isLarge;
              const isAboveFold = i < 6;

              if (item.kind === 'reel') {
                const reel = item.data;
                return (
                  <div
                    key={`reel-${reel.id}-${i}`}
                    onClick={() => handleReelClick(reel)}
                    className={`
                      relative group cursor-pointer overflow-hidden rounded-md md:rounded-xl bg-muted
                      ${isLarge ? "col-span-2 row-span-2" : ""}
                      ${isTall ? "row-span-2" : ""}
                    `}
                  >
                    {(() => {
                      const thumb = reel.thumbnail_url || cloudinaryVideoThumb(reel.video_url);
                      if (thumb) {
                        return (
                          <img
                            src={thumb}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt="Reel"
                            loading={isAboveFold ? "eager" : "lazy"}
                            decoding="async"
                          />
                        );
                      }
                      if (reel.video_url) {
                        return (
                          <video
                            src={isAboveFold ? reel.video_url : undefined}
                            data-src={!isAboveFold ? reel.video_url : undefined}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            playsInline
                          />
                        );
                      }
                      return (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Play className="w-10 h-10 text-primary/40" />
                        </div>
                      );
                    })()}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                      <Play className="w-2.5 h-2.5 fill-white" />
                    </div>
                    {reel.views_count != null && reel.views_count > 0 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] font-medium">
                        <Eye className="w-3 h-3" />
                        {reel.views_count > 999 ? `${(reel.views_count / 1000).toFixed(1)}K` : reel.views_count}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white font-bold text-sm truncate">{reel.caption}</p>
                    </div>
                  </div>
                );
              }

              const post = item.data;
              return (
                <div
                  key={`post-${post.id}-${i}`}
                  onClick={handlePostClick}
                  className={`
                    relative group cursor-pointer overflow-hidden rounded-md md:rounded-xl bg-muted
                    ${isLarge ? "col-span-2 row-span-2" : ""}
                    ${isTall ? "row-span-2" : ""}
                  `}
                >
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt="Explore"
                      loading={isAboveFold ? "eager" : "lazy"}
                      decoding="async"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white font-bold text-sm truncate">{post.caption}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>لا توجد منشورات للاستكشاف حالياً</p>
          </div>
        )}
      </div>

      {selectedReel && (
        <ReelViewerModal
          reel={selectedReel}
          open={!!selectedReel}
          onOpenChange={(open) => !open && setSelectedReel(null)}
          allReels={allReels}
          onNavigate={(reel) => setSelectedReel(reel)}
        />
      )}
    </div>
  );
}

export default function Explore() {
  const { user } = useAuth();

  if (!user) {
    return <ExploreContent />;
  }

  return (
    <Layout>
      <ExploreContent />
    </Layout>
  );
}
