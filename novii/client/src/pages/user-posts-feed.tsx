import Layout from "@/components/layout";
import PostCard from "@/components/post-card";
import { Spinner } from "@/components/ui/spinner";
import { useUserPosts } from "@/hooks/use-data";
import { useParams } from "wouter";
import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/lib/language-context";

export default function UserPostsFeed() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || "";
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";

  const startPostId = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return search.get("start") || null;
  }, []);

  const { data: posts = [], isLoading } = useUserPosts(userId);

  const orderedPosts = useMemo(() => {
    if (!startPostId || posts.length === 0) return posts;
    const idx = posts.findIndex((p: any) => p.id === startPostId);
    if (idx <= 0) return posts;
    return [...posts.slice(idx), ...posts.slice(0, idx)];
  }, [posts, startPostId]);

  const anchorRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);

  useEffect(() => {
    if (didScrollRef.current) return;
    if (!startPostId || orderedPosts.length === 0) return;
    requestAnimationFrame(() => {
      anchorRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      didScrollRef.current = true;
    });
  }, [orderedPosts, startPostId]);

  return (
    <Layout>
      <div className="flex flex-col gap-0 sm:gap-4 lg:gap-6 lg:pt-6 w-full px-0 sm:px-2 max-w-full lg:max-w-[630px] mx-auto pb-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8" />
          </div>
        ) : orderedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">
              {isRTL ? "لا توجد منشورات" : "No posts yet"}
            </p>
          </div>
        ) : (
          orderedPosts.map((post: any, idx: number) => {
            const isAnchor = idx === 0 && !!startPostId;
            return (
              <div key={post.id} ref={isAnchor ? anchorRef : undefined}>
                <PostCard post={post} />
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
