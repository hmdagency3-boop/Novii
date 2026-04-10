import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image as ImageIcon, Search, Loader } from "lucide-react";

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  disabled?: boolean;
}

export function GifPicker({ onGifSelect, disabled }: GifPickerProps) {
  const [open, setOpen] = useState(false);
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageErrors, setImageErrors] = useState<string[]>([]);

  const searchGifs = async (query: string) => {
    setLoading(true);
    setImageErrors([]);
    try {
      // Use backend API to search GIFs from Tenor
      const response = await fetch(`/api/gifs/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Error searching GIFs:", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (gifId: string) => {
    setImageErrors(prev => [...prev, gifId]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchGifs(searchQuery);
    } else {
      // If empty, load trending
      searchGifs('trending');
    }
  };

  // Load trending GIFs when dialog opens
  const handleDialogOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && gifs.length === 0) {
      searchGifs('trending');
    }
  };

  const handleGifClick = (gifUrl: string) => {
    onGifSelect(gifUrl);
    setOpen(false);
    setSearchQuery("");
    setGifs([]);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => handleDialogOpen(true)}
        title="Add GIF"
        className="hover:bg-secondary"
      >
        <ImageIcon className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select a GIF</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search GIFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </form>

          {loading && <div className="text-center py-8 flex flex-col items-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading GIFs...</span>
          </div>}

          {gifs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {gifs.map((gif) => {
                const hasError = imageErrors.includes(gif.id);
                const imageUrl = gif.images?.preview_gif?.url || gif.images?.original?.url;
                
                return (
                  <button
                    key={gif.id}
                    onClick={() => handleGifClick(gif.images.original.url)}
                    className="relative group cursor-pointer overflow-hidden rounded-lg h-32 bg-muted flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  >
                    {imageUrl && !hasError ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={gif.title || "GIF"}
                          className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                          onError={() => handleImageError(gif.id)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <span className="text-white text-xs font-bold bg-black/70 px-3 py-1 rounded">Select</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center px-2">
                        <div className="text-2xl">🎬</div>
                        <span className="text-xs font-semibold line-clamp-2">{gif.title || 'GIF'}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && gifs.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              No GIFs found for "{searchQuery}"
            </div>
          )}

          {!loading && gifs.length === 0 && !searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              Search for GIFs to get started
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
