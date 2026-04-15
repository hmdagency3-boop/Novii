import Layout from "@/components/layout";
import { Search, Play, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useExplorePosts, useExploreReels } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useGuestPrompt } from "@/components/guest-login-prompt";
import { ReelViewerModal } from "@/components/reel-viewer-modal";
import { useState, useMemo } from "react";
import type { Post, Reel } from "@/lib/api";

type ExploreItem = 
  | { kind: 'post'; data: Post }
  | { kind: 'reel'; data: Reel };

function ExploreContent() {
  const { data: explorePosts, isLoading: postsLoading } = useExplorePosts(50);
  const { data: exploreReels, isLoading: reelsLoading } = useExploreReels(20);
  const { user } = useAuth();
  const { showPrompt } = useGuestPrompt();
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  const isLoading = postsLoading || reelsLoading;

  const items: ExploreItem[] = useMemo(() => {
    const posts = (explorePosts || []).map(p => ({ kind: 'post' as const, data: p }));
    const reels = (exploreReels || []).map(r => ({ kind: 'reel' as const, data: r }));

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
            placeholder="Search Novii..."
            className="pl-10 bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all rounded-xl"
            onFocus={!user ? showPrompt : undefined}
            readOnly={!user}
          />
        </div>
      </div>

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
                    {reel.thumbnail_url ? (
                      <img
                        src={reel.thumbnail_url}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt="Reel"
                        loading={isAboveFold ? "eager" : "lazy"}
                        decoding="async"
                      />
                    ) : reel.video_url ? (
                      <video
                        src={isAboveFold ? reel.video_url : undefined}
                        data-src={!isAboveFold ? reel.video_url : undefined}
                        className="w-full h-full object-cover"
                        muted
                        preload="none"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Play className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
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
