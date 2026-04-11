import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, Music2, Smile, Sparkles, Type, ChevronDown, Send, X, Upload, Image as ImageIcon, Video } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCreateStory, useCurrentProfile } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { MusicPicker, type MusicTrack } from "@/components/music-picker";
import { STORY_FILTERS, getFilterById } from "@/lib/story-filters";

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRTL?: boolean;
}

const MAX_VIDEO_DURATION = 30;

export function CreateStoryModal({ open, onOpenChange, isRTL }: CreateStoryModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [showFilters, setShowFilters] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [needsTrimming, setNeedsTrimming] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [fileSize, setFileSize] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const createStory = useCreateStory();
  const { data: currentProfile } = useCurrentProfile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return;
    setMediaType(isImage ? 'image' : 'video');
    setFileSize(file.size);
    setNeedsTrimming(false);
    setTrimStart(0);
    setTrimEnd(0);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      const checkDuration = () => {
        const duration = videoRef.current?.duration || 0;
        setVideoDuration(Math.ceil(duration));
        setTrimEnd(Math.min(MAX_VIDEO_DURATION, Math.ceil(duration)));
        const needsTrim = duration > MAX_VIDEO_DURATION;
        setNeedsTrimming(needsTrim);
        if (needsTrim) setShowTrimmer(true);
      };
      videoRef.current.addEventListener('loadedmetadata', checkDuration);
      return () => videoRef.current?.removeEventListener('loadedmetadata', checkDuration);
    }
  }, [mediaType, preview]);

  useEffect(() => {
    if (!videoRef.current) return;
    const handleTimeUpdate = () => setCurrentTime(videoRef.current?.currentTime || 0);
    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
  }, [preview]);

  const handleUpload = async () => {
    if (!preview) return;
    setIsUploading(true);
    try {
      const payload: any = { mediaUrl: preview, mediaType };
      if (mediaType === 'video' && needsTrimming) {
        payload.trimStart = Math.floor(trimStart);
        payload.trimEnd = Math.floor(trimEnd);
      }
      if (selectedMusic) {
        payload.music = {
          url: selectedMusic.preview_url,
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          artwork_url: selectedMusic.artwork_url,
        };
      }
      if (selectedFilter && selectedFilter !== 'normal') {
        payload.filterName = selectedFilter;
      }
      await createStory.mutateAsync(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to create story:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setCaption("");
    setSelectedMusic(null);
    setSelectedFilter('normal');
    setShowFilters(false);
    setNeedsTrimming(false);
    setShowTrimmer(false);
    setTrimStart(0);
    setTrimEnd(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── Phase 1: No media yet → picker dialog ───────────────────────
  if (!preview) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            className="max-w-xs w-full rounded-2xl p-0 overflow-hidden border-0 bg-[#1a1a1a]"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex flex-col items-center gap-0">
              {/* Header */}
              <div className="w-full px-5 pt-5 pb-3">
                <p className="text-white text-center text-base font-semibold">
                  {isRTL ? 'إنشاء استوري' : 'Create Story'}
                </p>
              </div>

              {/* Big upload zone */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-4 px-6 py-10 bg-[#262626] hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="w-20 h-20 rounded-full bg-[#363636] flex items-center justify-center">
                  <Upload className="w-9 h-9 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">
                    {isRTL ? 'اختر صورة أو فيديو' : 'Select photo or video'}
                  </p>
                  <p className="text-[#999] text-xs mt-1">
                    {isRTL ? 'من مكتبتك' : 'From your library'}
                  </p>
                </div>
              </button>

              {/* Quick buttons */}
              <div className="w-full flex border-t border-[#363636]">
                <button
                  onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-white hover:bg-[#2a2a2a] transition-colors border-r border-[#363636]"
                >
                  <ImageIcon className="w-5 h-5 text-[#999]" />
                  <span className="text-sm">{isRTL ? 'صورة' : 'Photo'}</span>
                </button>
                <button
                  onClick={() => { fileInputRef.current?.setAttribute('accept', 'video/*'); fileInputRef.current?.click(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  <Video className="w-5 h-5 text-[#999]" />
                  <span className="text-sm">{isRTL ? 'فيديو' : 'Video'}</span>
                </button>
              </div>

              {/* Cancel */}
              <button
                onClick={handleClose}
                className="w-full py-4 text-[#999] text-sm hover:text-white transition-colors border-t border-[#363636]"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </DialogContent>
        </Dialog>

        <MusicPicker open={musicPickerOpen} onOpenChange={setMusicPickerOpen} onSelect={setSelectedMusic} selectedTrack={selectedMusic} isRTL={isRTL} />
      </>
    );
  }

  // ─── Phase 2: Full-screen Instagram-style editor ─────────────────
  return (
    <>
      {/* Full-screen fixed overlay */}
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* ── MEDIA BACKGROUND ── */}
        <div className="absolute inset-0">
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={preview}
              className="w-full h-full object-cover"
              style={{ filter: getFilterById(selectedFilter).css }}
              autoPlay
              loop
              playsInline
              muted={!!selectedMusic}
            />
          ) : (
            <img
              src={preview}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: getFilterById(selectedFilter).css }}
            />
          )}
          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
        </div>

        {/* ── TOP BAR ── */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-2">
          {/* Back arrow */}
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Selected music pill (center-top) */}
          {selectedMusic && (
            <button
              onClick={() => setMusicPickerOpen(true)}
              className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 max-w-[200px]"
            >
              <img
                src={selectedMusic.artwork_url}
                alt=""
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-xs font-semibold truncate">{selectedMusic.title}</p>
                <p className="text-white/70 text-[10px] truncate">{selectedMusic.artist}</p>
              </div>
              <X className="w-3.5 h-3.5 text-white/70 flex-shrink-0" onClick={(e) => { e.stopPropagation(); setSelectedMusic(null); }} />
            </button>
          )}

          {/* Spacer when no music */}
          {!selectedMusic && <div />}
        </div>

        {/* ── RIGHT ACTION ICONS ── */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
          {[
            { icon: <Type className="w-5 h-5" />, label: 'text', action: () => {} },
            { icon: <Smile className="w-5 h-5" />, label: 'sticker', action: () => {} },
            {
              icon: <Music2 className="w-5 h-5" />,
              label: 'music',
              action: () => setMusicPickerOpen(true),
              active: !!selectedMusic,
            },
            { icon: <Sparkles className="w-5 h-5" />, label: 'filters', action: () => { setShowFilters(!showFilters); setShowTrimmer(false); }, active: showFilters },
            ...(needsTrimming ? [{ icon: <ChevronDown className="w-5 h-5" />, label: 'trim', action: () => setShowTrimmer(!showTrimmer) }] : []),
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm transition-all",
                (item as any).active
                  ? "bg-white text-black"
                  : "bg-black/40 text-white hover:bg-black/60"
              )}
            >
              {item.icon}
            </button>
          ))}
        </div>

        {/* ── TRIMMER (slides up when needed) ── */}
        {showTrimmer && needsTrimming && (
          <div className="absolute bottom-36 left-4 right-16 z-10 bg-black/70 backdrop-blur-md rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white text-xs font-semibold">{isRTL ? 'قص الفيديو' : 'Trim Video'}</p>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                (trimEnd - trimStart) <= MAX_VIDEO_DURATION ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                {formatTime(trimEnd - trimStart)} / {MAX_VIDEO_DURATION}s
              </span>
            </div>

            {/* Timeline bar */}
            <div className="relative h-8 bg-white/10 rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 bg-white/20 border-x-2 border-white"
                style={{ left: `${(trimStart / videoDuration) * 100}%`, right: `${100 - (trimEnd / videoDuration) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 w-0.5 bg-blue-400"
                style={{ left: `${(currentTime / videoDuration) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-white/60 text-[10px] mb-1">{isRTL ? 'البداية' : 'Start'}</p>
                <input
                  type="range" min="0" max={videoDuration} value={trimStart} step="0.1"
                  onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 1))}
                  className="w-full accent-white"
                />
                <p className="text-white text-xs font-mono text-center">{formatTime(trimStart)}</p>
              </div>
              <div>
                <p className="text-white/60 text-[10px] mb-1">{isRTL ? 'النهاية' : 'End'}</p>
                <input
                  type="range" min="0" max={videoDuration} value={trimEnd} step="0.1"
                  onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 1))}
                  className="w-full accent-white"
                />
                <p className="text-white text-xs font-mono text-center">{formatTime(trimEnd)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── FILTER STRIP ── */}
        {showFilters && (
          <div className="absolute bottom-32 left-0 right-0 z-10">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-4 py-3" style={{ width: 'max-content' }}>
                {STORY_FILTERS.map((filter) => {
                  const isActive = selectedFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    >
                      <div className={cn(
                        "w-16 h-20 rounded-xl overflow-hidden border-2 transition-all",
                        isActive ? "border-white scale-105" : "border-transparent opacity-80"
                      )}>
                        <img
                          src={preview!}
                          alt={filter.name}
                          className="w-full h-full object-cover"
                          style={{ filter: filter.css }}
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium transition-colors",
                        isActive ? "text-white" : "text-white/60"
                      )}>
                        {isRTL ? filter.nameAr : filter.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM AREA ── */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-8 pt-4 space-y-3">
          {/* Caption input */}
          <div className="flex items-center gap-2">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={isRTL ? 'أضف تعليقاً...' : 'Add a caption...'}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm outline-none caret-white"
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20" />

          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            {/* Your Stories */}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 flex items-center gap-2.5 bg-black/50 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 hover:bg-black/70 transition-all disabled:opacity-50"
            >
              {currentProfile?.avatar_url ? (
                <img src={currentProfile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{currentProfile?.username?.[0]?.toUpperCase() || '?'}</span>
                </div>
              )}
              <span className="text-white text-sm font-semibold flex-1 text-left">
                {isUploading
                  ? (isRTL ? 'جاري النشر...' : 'Posting...')
                  : (isRTL ? 'استوريك' : 'Your story')}
              </span>
            </button>

            {/* Post arrow button */}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-lg"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      <MusicPicker open={musicPickerOpen} onOpenChange={setMusicPickerOpen} onSelect={setSelectedMusic} selectedTrack={selectedMusic} isRTL={isRTL} />
    </>
  );
}
