import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Hash, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import PostCard from "@/components/post-card";
import Layout from "@/components/layout";
import { api } from "@/lib/api";

interface HashtagData {
  id: string;
  name: string;
  posts_count: number;
  is_pinned: boolean;
}

export default function HashtagPage() {
  const params = useParams<{ tag: string }>();
  const tag = params.tag || "";
  const [, navigate] = useLocation();
  const { isArabic } = useLanguage();
  const [trendingTags, setTrendingTags] = useState<HashtagData[]>([]);
  const [hashtag, setHashtag] = useState<HashtagData | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['hashtag-posts', tag],
    queryFn: () => api.getHashtagPosts(tag),
    enabled: !!tag,
  });

  useEffect(() => {
    if (!tag) return;
    fetch(`/api/hashtags/${encodeURIComponent(tag)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setHashtag(data); });
    fetch("/api/hashtags/trending")
      .then(r => r.ok ? r.json() : [])
      .then(data => setTrendingTags(data.filter((t: HashtagData) => t.name !== tag.toLowerCase())))
      .catch(() => {});
  }, [tag]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-accent">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">#{tag}</h1>
                {hashtag && (
                  <p className="text-xs text-muted-foreground">
                    {hashtag.posts_count.toLocaleString()} {isArabic ? "منشور" : "posts"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {trendingTags.length > 0 && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold">{isArabic ? "هاشتاقات رائجة" : "Trending"}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {trendingTags.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/hashtag/${t.name}`)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-accent text-sm hover:bg-accent/80 transition-colors"
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Hash className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-semibold">{isArabic ? "لا توجد منشورات" : "No posts yet"}</p>
            <p className="text-sm">{isArabic ? "كن أول من ينشر بهذا الهاشتاق" : "Be the first to post with this hashtag"}</p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
