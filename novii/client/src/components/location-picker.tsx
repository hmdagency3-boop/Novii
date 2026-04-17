import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isRTL?: boolean;
  langCode?: string;
}

export function LocationPicker({ value, onChange, placeholder, isRTL, langCode = "en" }: LocationPickerProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function search(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6&accept-language=${langCode}&q=${encodeURIComponent(q)}`;
        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (r.ok) {
          const data: NominatimResult[] = await r.json();
          setResults(data);
          setOpen(true);
        }
      } catch (e) {
        console.error("location search failed", e);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  return (
    <div ref={wrapRef} className={cn("relative flex-1", isRTL && "flex-1")}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            onChange(v);
            search(v);
          }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          dir={isRTL ? "rtl" : "ltr"}
          className={cn(
            "flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 min-w-0",
            isRTL && "text-right"
          )}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />}
        {!loading && query && (
          <button
            type="button"
            onClick={() => { setQuery(""); onChange(""); setResults([]); setOpen(false); }}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label="clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full mt-2 z-50 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg",
            isRTL && "text-right"
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => {
                setQuery(r.display_name);
                onChange(r.display_name);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-start gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors border-b border-border/30 last:border-0",
                isRTL ? "text-right" : "text-left"
              )}
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug break-words">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
