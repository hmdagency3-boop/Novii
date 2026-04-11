import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Play, Pause, Check, Music2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  preview_url: string;
  artwork_url: string;
  album: string;
  duration: number;
}

interface MusicPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (track: MusicTrack | null) => void;
  selectedTrack?: MusicTrack | null;
  isRTL?: boolean;
}

export function MusicPicker({ open, onOpenChange, onSelect, selectedTrack, isRTL }: MusicPickerProps) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchMusic = useCallback(async (q: string) => {
    if (!q.trim()) { setTracks([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setTracks(data || []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchMusic(query), 500);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [query, searchMusic]);

  const togglePreview = (track: MusicTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = track.preview_url;
        audioRef.current.play().catch(() => {});
      }
      setPlayingId(track.id);
    }
  };

  useEffect(() => {
    if (!open) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
  }, [open]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', () => setPlayingId(null));
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const handleSelect = (track: MusicTrack) => {
    audioRef.current?.pause();
    setPlayingId(null);
    onSelect(track);
    onOpenChange(false);
  };

  const handleRemove = () => {
    audioRef.current?.pause();
    setPlayingId(null);
    onSelect(null);
    onOpenChange(false);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0" dir={isRTL ? "rtl" : "ltr"}>
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Music2 className="w-5 h-5 text-primary" />
            {isRTL ? "اختر أغنية" : "Choose a Song"}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={isRTL ? "ابحث عن أغنية أو فنان..." : "Search for a song or artist..."}
              className={cn("bg-secondary/50 border-0 focus-visible:ring-1", isRTL ? "pr-10" : "pl-10")}
              autoFocus
            />
          </div>
        </div>

        {selectedTrack && (
          <div className="px-4 py-2 bg-primary/5 border-b border-border flex items-center gap-3">
            <img src={selectedTrack.artwork_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-primary">{selectedTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedTrack.artist}</p>
            </div>
            <span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded-full">
              {isRTL ? "محددة" : "Selected"}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleRemove}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 h-[calc(85vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">{isRTL ? "جاري البحث..." : "Searching..."}</p>
              </div>
            </div>
          ) : tracks.length === 0 && query ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Music2 className="w-12 h-12 opacity-30" />
              <p className="text-sm">{isRTL ? "لا توجد نتائج" : "No results found"}</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Music2 className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">{isRTL ? "ابحث عن أغنيتك المفضلة" : "Search for your favorite song"}</p>
              <p className="text-xs text-center max-w-[200px]">
                {isRTL ? "اكتب اسم الأغنية أو الفنان" : "Type a song name or artist"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {tracks.map(track => {
                const isPlaying = playingId === track.id;
                const isSelected = selectedTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => handleSelect(track)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={track.artwork_url}
                        alt={track.album}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                          <div className="flex gap-0.5 items-end h-4">
                            {[1,2,3].map(i => (
                              <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${8 + i * 4}px` }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist} · {track.album}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(track.duration)}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/10"
                        onClick={e => { e.stopPropagation(); togglePreview(track); }}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4" />}
                      </Button>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
