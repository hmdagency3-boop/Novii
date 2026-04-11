import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

export const GIF_PREFIX = "__GIF__:";

interface GifItem {
  id: string;
  title: string;
  images: {
    original: { url: string };
    preview?: { url: string };
  };
}

interface GifPickerProps {
  onSelect: (url: string) => void;
  isRTL: boolean;
  height?: number;
}

export function GifPicker({ onSelect, isRTL, height = 260 }: GifPickerProps) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["gifs", debouncedQ],
    queryFn: async () => {
      const res = await fetch(`/api/gifs/search?q=${encodeURIComponent(debouncedQ)}`);
      const json = await res.json();
      return json.data as GifItem[];
    },
  });

  return (
    <div
      className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl"
      style={{ height }}
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-700">
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={isRTL ? "ابحث عن GIF..." : "Search GIFs..."}
          className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-muted-foreground"
          dir={isRTL ? "rtl" : "ltr"}
        />
      </div>

      {/* Grid */}
      <div className="overflow-y-auto" style={{ height: height - 45, scrollbarWidth: "none" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs gap-2">
            <span className="animate-spin inline-block">⌛</span>
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : !data?.length ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            {isRTL ? "لا توجد نتائج" : "No results"}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-2">
            {data.map(gif => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.original.url)}
                className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-pink-500 transition-all"
              >
                <img
                  src={gif.images.preview?.url || gif.images.original.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
