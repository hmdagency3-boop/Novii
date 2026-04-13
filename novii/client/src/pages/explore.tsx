import Layout from "@/components/layout";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useExplorePosts } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useGuestPrompt } from "@/components/guest-login-prompt";

function ExploreContent() {
  const { data: explorePosts, isLoading } = useExplorePosts(50);
  const { user } = useAuth();
  const { showPrompt } = useGuestPrompt();

  const handlePostClick = () => {
    if (!user) showPrompt();
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Search Header */}
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

      {/* Masonry-style Grid */}
      <div className="p-2 md:p-4 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : explorePosts && explorePosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4 auto-rows-[120px] md:auto-rows-[250px]">
            {explorePosts.map((post, i) => {
              const isLarge = i % 7 === 0;
              const isTall = i % 5 === 0 && !isLarge;
              return (
                <div
                  key={`${post.id}-${i}`}
                  onClick={handlePostClick}
                  className={`
                    relative group cursor-pointer overflow-hidden rounded-md md:rounded-xl bg-muted
                    ${isLarge ? "col-span-2 row-span-2" : ""}
                    ${isTall ? "row-span-2" : ""}
                  `}
                >
                  <img
                    src={post.image_url || "https://via.placeholder.com/400"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt="Explore"
                  />
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
