import { Heart, MessageCircle, Pin, FileText } from "lucide-react";
import type { Post } from "@/lib/api";

interface ProfilePostCardProps {
  post: Post;
  onClick: () => void;
}

function fmt(n: number = 0): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function ProfilePostCard({ post, onClick }: ProfilePostCardProps) {
  const hasImage = !!post.image_url;

  return (
    <div
      onClick={onClick}
      className="relative aspect-square group cursor-pointer overflow-hidden bg-muted rounded-none md:rounded-xl"
      style={{ transition: "transform .2s, box-shadow .2s" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,0,0,.2)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Content */}
      {hasImage ? (
        <img
          src={post.image_url!}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt="Post"
          loading="lazy"
        />
      ) : (
        /* Text-only post */
        <div
          className="w-full h-full flex flex-col items-center justify-center p-3 gap-2"
          style={{ background: "linear-gradient(135deg,#a855f720,#ec489920)" }}
        >
          <FileText
            className="w-6 h-6 flex-shrink-0"
            style={{ color: "#a855f7" }}
          />
          {post.caption && (
            <p className="text-foreground text-[0.65rem] leading-tight text-center line-clamp-4 font-medium">
              {post.caption}
            </p>
          )}
        </div>
      )}

      {/* Pin badge */}
      {post.is_pinned && (
        <div className="absolute top-1.5 end-1.5 z-10 bg-black/60 backdrop-blur-sm rounded-full p-1 shadow">
          <Pin className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Hover overlay — stats */}
      <div className="absolute inset-0 flex items-center justify-center gap-5 text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
           style={{ background: "rgba(0,0,0,.45)" }}>
        <div className="flex items-center gap-1.5 drop-shadow">
          <Heart className="w-5 h-5 fill-white stroke-none" />
          <span>{fmt(post.likes_count)}</span>
        </div>
        <div className="flex items-center gap-1.5 drop-shadow">
          <MessageCircle className="w-5 h-5 fill-white stroke-none" />
          <span>{fmt(post.comments_count)}</span>
        </div>
      </div>
    </div>
  );
}
