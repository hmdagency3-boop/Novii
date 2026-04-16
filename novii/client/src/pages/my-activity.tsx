import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { ArrowLeft, ArrowRight, Heart, MessageCircle, ImageIcon } from "lucide-react";
import Layout from "@/components/layout";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, type Post } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

function timeAgo(iso: string, isRtl: boolean): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return isRtl ? "الآن" : "now";
  if (m < 60) return isRtl ? `${m} د` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return isRtl ? `${h} س` : `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return isRtl ? `${d} ي` : `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return isRtl ? `${w} أ` : `${w}w`;
  return new Date(iso).toLocaleDateString();
}

export default function MyActivity() {
  const [, params] = useRoute("/my-activity/:type");
  const [, navigate] = useLocation();
  const { direction } = useLanguage();
  const isRtl = direction === "rtl";
  const type = (params?.type === "comments" ? "comments" : "likes") as "likes" | "comments";

  const { data: posts, isLoading } = useQuery({
    queryKey: ["my-activity", type],
    queryFn: () => (type === "likes" ? api.getMyLikedPosts() : api.getMyCommentedPosts()),
  });

  const title =
    type === "likes"
      ? isRtl
        ? "البوستات اللي عملت عليها لايك"
        : "Posts You've Liked"
      : isRtl
        ? "البوستات اللي علقت عليها"
        : "Posts You've Commented On"; 

  const Icon = type === "likes" ? Heart : MessageCircle;
  const iconTint = type === "likes" ? "text-rose-500" : "text-sky-500";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <Layout>
      <div className="flex flex-col h-full" dir={isRtl ? "rtl" : "ltr"}>
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              aria-label="back"
            >
              <BackIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Icon className={cn("w-4 h-4", iconTint)} />
              <h1 className="text-base font-semibold">{title}</h1>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto w-full px-4 py-2 pb-24">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner className="w-8 h-8" />
              </div>
            ) : !posts || posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
                  <Icon className={cn("w-7 h-7", iconTint)} />
                </div>
                <p className="text-base font-semibold mb-1">
                  {isRtl ? "لا يوجد شيء هنا بعد" : "Nothing here yet"}
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {type === "likes"
                    ? isRtl
                      ? "البوستات اللي تعمل عليها لايك هتظهر هنا"
                      : "Posts you like will show up here."
                    : isRtl
                      ? "البوستات اللي تعلق عليها هتظهر هنا"
                      : "Posts you comment on will show up here."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {posts.map((post: Post) => (
                  <li key={post.id}>
                    <Link
                      href={`/post/${post.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors rounded-xl px-2 -mx-2"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold truncate">
                            @{post.profile?.username || "unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {timeAgo(post.created_at, isRtl)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                          {post.caption?.trim() ||
                            (isRtl ? "بدون وصف" : "No caption")}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likes_count.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}
