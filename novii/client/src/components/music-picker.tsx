import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Play, Pause, Check, Music2, X, ChevronLeft, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_DURATION = 30;
const WINDOW_DURATION = 15;
const MAX_START = PREVIEW_DURATION - WINDOW_DURATION;

export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  preview_url: string;
  artwork_url: string;
  album: string;
  duration: number;
  start_time?: number;
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

  const [trimTrack, setTrimTrack] = useState<MusicTrack | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimPlaying, setTrimPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trimAudioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

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
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setPlayingId(track.id);
    }
  };

  useEffect(() => {
    if (!open) {
      audioRef.current?.pause();
      trimAudioRef.current?.pause();
      setPlayingId(null);
      setTrimTrack(null);
      setTrimStart(0);
      setTrimPlaying(false);
    }
  }, [open]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', () => setPlayingId(null));

    trimAudioRef.current = new Audio();
    trimAudioRef.current.addEventListener('ended', () => setTrimPlaying(false));

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      trimAudioRef.current?.pause();
      trimAudioRef.current = null;
    };
  }, []);

  const openTrimmer = (track: MusicTrack) => {
    audioRef.current?.pause();
    setPlayingId(null);
    setTrimTrack(track);
    setTrimStart(0);
    setTrimPlaying(false);

    if (trimAudioRef.current) {
      trimAudioRef.current.src = track.preview_url;
      trimAudioRef.current.currentTime = 0;
    }
  };

  const toggleTrimPlay = () => {
    if (!trimAudioRef.current || !trimTrack) return;
    if (trimPlaying) {
      trimAudioRef.current.pause();
      setTrimPlaying(false);
    } else {
      trimAudioRef.current.src = trimTrack.preview_url;
      trimAudioRef.current.currentTime = trimStart;
      trimAudioRef.current.play().catch(() => {});
      setTrimPlaying(true);

      const stopAt = trimStart + WINDOW_DURATION;
      const checkEnd = setInterval(() => {
        if (!trimAudioRef.current || trimAudioRef.current.currentTime >= stopAt) {
          trimAudioRef.current?.pause();
          setTrimPlaying(false);
          clearInterval(checkEnd);
        }
      }, 250);
    }
  };

  const updateTrimFromPointer = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = fraction * PREVIEW_DURATION - WINDOW_DURATION / 2;
    const clamped = Math.max(0, Math.min(MAX_START, raw));
    setTrimStart(Math.round(clamped));
  };

  const handleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateTrimFromPointer(e.clientX);
    if (trimPlaying) {
      trimAudioRef.current?.pause();
      setTrimPlaying(false);
    }
  };

  const handleBarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    updateTrimFromPointer(e.clientX);
  };

  const handleBarPointerUp = () => {
    isDragging.current = false;
  };

  const windowLeftPct = (trimStart / MAX_START) * (100 - (WINDOW_DURATION / PREVIEW_DURATION) * 100);

  const handleUseClip = () => {
    if (!trimTrack) return;
    trimAudioRef.current?.pause();
    setTrimPlaying(false);
    onSelect({ ...trimTrack, start_time: trimStart });
    onOpenChange(false);
    setTrimTrack(null);
    setTrimStart(0);
  };

  const handleRemove = () => {
    audioRef.current?.pause();
    trimAudioRef.current?.pause();
    setPlayingId(null);
    setTrimPlaying(false);
    onSelect(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── TRIM SCREEN ── */}
        {trimTrack ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
              <button
                onClick={() => { trimAudioRef.current?.pause(); setTrimPlaying(false); setTrimTrack(null); }}
                className="p-1.5 rounded-full hover:bg-accent transition-colors"
              >
                <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Scissors className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold">
                  {isRTL ? "اختر الجزء المناسب" : "Choose clip"}
                </span>
              </div>
            </div>

            <div className="flex flex-col flex-1 px-4 py-6 gap-6">
              <div className="flex items-center gap-4">
                <img src={trimTrack.artwork_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-base">{trimTrack.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{trimTrack.artist}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRTL
                      ? `مقطع ${formatTime(WINDOW_DURATION)} من أصل ${formatTime(PREVIEW_DURATION)}`
                      : `${formatTime(WINDOW_DURATION)} clip of ${formatTime(PREVIEW_DURATION)}`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0:00</span>
                  <span className="text-primary font-medium">
                    {isRTL ? `يبدأ من ${formatTime(trimStart)}` : `Starts at ${formatTime(trimStart)}`}
                  </span>
                  <span>{formatTime(PREVIEW_DURATION)}</span>
                </div>

                <div
                  ref={barRef}
                  className="relative h-14 rounded-xl overflow-hidden cursor-pointer select-none touch-none"
                  style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e, #0f3460)' }}
                  onPointerDown={handleBarPointerDown}
                  onPointerMove={handleBarPointerMove}
                  onPointerUp={handleBarPointerUp}
                  onPointerCancel={handleBarPointerUp}
                >
                  {/* Dim overlay outside window */}
                  <div className="absolute inset-0 bg-black/50" />

                  {/* Waveform bars (decorative) */}
                  <div className="absolute inset-0 flex items-center gap-px px-1">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const h = 20 + Math.sin(i * 0.8) * 15 + Math.sin(i * 2.1) * 10 + Math.sin(i * 3.7) * 8;
                      const inWindow = (i / 60) * PREVIEW_DURATION >= trimStart && (i / 60) * PREVIEW_DURATION < trimStart + WINDOW_DURATION;
                      return (
                        <div
                          key={i}
                          className={cn("flex-1 rounded-full transition-colors", inWindow ? "bg-primary" : "bg-white/20")}
                          style={{ height: `${Math.max(4, h)}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Window highlight */}
                  <div
                    className="absolute top-0 bottom-0 border-2 border-primary rounded-lg pointer-events-none"
                    style={{
                      left: `${windowLeftPct}%`,
                      width: `${(WINDOW_DURATION / PREVIEW_DURATION) * 100}%`,
                      background: 'rgba(var(--primary-rgb, 99,102,241), 0.1)',
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary rounded-full" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary rounded-full" />
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  {isRTL ? "اسحب لاختيار الجزء المناسب" : "Drag to choose your clip"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleTrimPlay}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent hover:bg-accent/80 transition-colors font-medium text-sm"
                >
                  {trimPlaying
                    ? <><Pause className="w-4 h-4" />{isRTL ? "إيقاف" : "Stop"}</>
                    : <><Play className="w-4 h-4" />{isRTL ? "استمع للمقطع" : "Preview clip"}</>
                  }
                </button>
              </div>
            </div>

            <div className="px-4 pb-8 pt-2">
              <Button
                onClick={handleUseClip}
                className="w-full h-12 rounded-full text-base font-semibold"
              >
                {isRTL ? `استخدم هذا المقطع` : "Use this clip"}
              </Button>
            </div>
          </div>
        ) : (
          /* ── SEARCH SCREEN ── */
          <>
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
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedTrack.artist}
                    {selectedTrack.start_time !== undefined && selectedTrack.start_time > 0
                      ? ` · ${isRTL ? 'يبدأ من' : 'from'} ${formatTime(selectedTrack.start_time)}`
                      : ''}
                  </p>
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
                        onClick={() => openTrimmer(track)}
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
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${8 + i * 4}px` }} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist} · {track.album}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatTime(track.duration)}</p>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
