import { Play, Heart, Pin } from "lucide-react";

interface ProfileReelCardProps {
  reel: any;
  onClick: () => void;
}

function fmt(n: number = 0): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function ProfileReelCard({ reel, onClick }: ProfileReelCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative aspect-square group cursor-pointer overflow-hidden bg-black rounded-none md:rounded-xl"
      style={{ transition: "transform .2s, box-shadow .2s" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,0,0,.3)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Video thumbnail */}
      <video
        src={reel.video_url}
        className="w-full h-full object-cover"
        preload="metadata"
        playsInline
      />

      {/* Play icon — always visible */}
      <div className="absolute top-1.5 start-1.5 z-10">
        <Play className="w-4 h-4 text-white fill-white drop-shadow" />
      </div>

      {/* Pin badge */}
      {reel.is_pinned && (
        <div className="absolute top-1.5 end-1.5 z-10 bg-black/60 backdrop-blur-sm rounded-full p-1 shadow">
          <Pin className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-5 text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "rgba(0,0,0,.5)" }}
      >
        <div className="flex items-center gap-1.5 drop-shadow">
          <Heart className="w-5 h-5 fill-white stroke-none" />
          <span>{fmt(reel.likes_count)}</span>
        </div>
      </div>
    </div>
  );
}
