import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Video, X, AlertCircle, CheckCircle2, Clock, Play, Pause, Music2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCreateStory } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { MusicPicker, type MusicTrack } from "@/components/music-picker";

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRTL?: boolean;
}

const MAX_VIDEO_DURATION = 30; // 30 seconds

export function CreateStoryModal({ open, onOpenChange, isRTL }: CreateStoryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isValidDuration, setIsValidDuration] = useState(true);
  const [fileSize, setFileSize] = useState(0);
  const [needsTrimming, setNeedsTrimming] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const createStory = useCreateStory();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert(isRTL ? 'يرجى اختيار صورة أو فيديو فقط' : 'Please select an image or video only');
      return;
    }

    setSelectedFile(file);
    setMediaType(isImage ? 'image' : 'video');
    setFileSize(file.size);
    setVideoDuration(0);
    setIsValidDuration(true);
    setNeedsTrimming(false);
    setTrimStart(0);
    setTrimEnd(0);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Check video duration when it loads
  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      const checkDuration = () => {
        const duration = videoRef.current?.duration || 0;
        setVideoDuration(Math.ceil(duration));
        setTrimEnd(Math.min(MAX_VIDEO_DURATION, Math.ceil(duration)));
        const needsTrim = duration > MAX_VIDEO_DURATION;
        setNeedsTrimming(needsTrim);
        setIsValidDuration(!needsTrim);
      };

      videoRef.current.addEventListener('loadedmetadata', checkDuration);
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', checkDuration);
      };
    }
  }, [mediaType, preview]);

  // Handle video time update
  useEffect(() => {
    if (!videoRef.current) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoRef.current?.currentTime || 0);
    };

    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) return;
    
    if (mediaType === 'video' && needsTrimming && (trimEnd - trimStart > MAX_VIDEO_DURATION)) {
      alert(isRTL ? `يجب أن تكون المدة المختارة ${MAX_VIDEO_DURATION} ثانية أو أقل` : `Selected duration must be ${MAX_VIDEO_DURATION} seconds or less`);
      return;
    }

    setIsUploading(true);
    try {
      const payload: any = {
        mediaUrl: preview,
        mediaType: mediaType,
      };

      // If trimming is needed, send trim info
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

      await createStory.mutateAsync(payload);
      
      setSelectedFile(null);
      setPreview(null);
      setSelectedMusic(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create story:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setVideoDuration(0);
    setIsValidDuration(true);
    setNeedsTrimming(false);
    setTrimStart(0);
    setTrimEnd(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setSelectedMusic(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl w-screen sm:w-full max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isRTL ? '✨ إنشاء استوري جديد' : '✨ Create New Story'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <div className="space-y-4">
              {/* Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/50 hover:border-primary rounded-xl p-6 sm:p-12 text-center cursor-pointer hover:bg-primary/5 transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full">
                    <Upload className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg">
                      {isRTL ? 'اضغط لاختيار صورة أو فيديو' : 'Click to select image or video'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      {isRTL ? 'أو اسحب وضع هنا' : 'or drag and drop here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {isRTL ? `الحد الأقصى للفيديو: ${MAX_VIDEO_DURATION} ثانية (يمكنك قص الفيديو)` : `Max video duration: ${MAX_VIDEO_DURATION} seconds (you can trim)`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => {
                    fileInputRef.current?.setAttribute('accept', 'image/*');
                    fileInputRef.current?.click();
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {isRTL ? 'صورة' : 'Image'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => {
                    fileInputRef.current?.setAttribute('accept', 'video/*');
                    fileInputRef.current?.click();
                  }}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {isRTL ? 'فيديو' : 'Video'}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden border-2 border-border/50">
                {mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={preview}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Story preview"
                    className="w-full h-full object-contain"
                  />
                )}
                
                {mediaType === 'video' && (
                  <button
                    onClick={togglePlayPause}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-4 rounded-full hover:bg-white/30 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 fill-current" />
                    )}
                  </button>
                )}
                
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Music button overlay */}
                <button
                  onClick={() => setMusicPickerOpen(true)}
                  className={cn(
                    "absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all text-sm font-medium",
                    selectedMusic
                      ? "bg-primary text-white"
                      : "bg-black/60 text-white hover:bg-black/80"
                  )}
                >
                  <Music2 className="w-4 h-4" />
                  {selectedMusic ? selectedMusic.title : (isRTL ? 'إضافة موسيقى' : 'Add Music')}
                </button>

                {/* Music artwork overlay on preview */}
                {selectedMusic && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 max-w-[160px]">
                    <img src={selectedMusic.artwork_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    <span className="text-white text-xs truncate">{selectedMusic.artist}</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{isRTL ? 'حجم الملف' : 'File size'}</span>
                  <span className="font-medium">{formatFileSize(fileSize)}</span>
                </div>
                
                {mediaType === 'video' && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-muted-foreground">{isRTL ? 'المدة' : 'Duration'}</span>
                    </div>
                    <span className="font-medium">{formatTime(videoDuration)}</span>
                  </div>
                )}
              </div>

              {/* Video Trimming Interface */}
              {mediaType === 'video' && needsTrimming && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        {isRTL ? 'الفيديو طويل جداً' : 'Video is too long'}
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                        {isRTL ? 'اختر الجزء الذي تريد نشره (حد أقصى 30 ثانية)' : 'Select the part you want to post (maximum 30 seconds)'}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <div className="relative h-12 bg-black/20 rounded-lg overflow-hidden cursor-pointer group">
                      {/* Background progress */}
                      <div className="absolute inset-0 flex items-center">
                        {/* Start marker */}
                        <div
                          className="absolute h-full w-1 bg-green-500 cursor-ew-resize hover:bg-green-400 transition-colors"
                          style={{ left: `${(trimStart / videoDuration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const container = (e.currentTarget.parentElement as HTMLElement);
                            const startDrag = (moveE: MouseEvent) => {
                              const rect = container.getBoundingClientRect();
                              const newStart = Math.max(0, (moveE.clientX - rect.left) / rect.width * videoDuration);
                              setTrimStart(Math.min(newStart, trimEnd - 1));
                              if (videoRef.current) videoRef.current.currentTime = newStart;
                            };
                            const stopDrag = () => {
                              window.removeEventListener('mousemove', startDrag);
                              window.removeEventListener('mouseup', stopDrag);
                            };
                            window.addEventListener('mousemove', startDrag);
                            window.addEventListener('mouseup', stopDrag);
                          }}
                        />

                        {/* Selected range highlight */}
                        <div
                          className="absolute h-full bg-green-500/30"
                          style={{
                            left: `${(trimStart / videoDuration) * 100}%`,
                            right: `${100 - (trimEnd / videoDuration) * 100}%`
                          }}
                        />

                        {/* End marker */}
                        <div
                          className="absolute h-full w-1 bg-red-500 cursor-ew-resize hover:bg-red-400 transition-colors"
                          style={{ left: `${(trimEnd / videoDuration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const container = (e.currentTarget.parentElement as HTMLElement);
                            const startDrag = (moveE: MouseEvent) => {
                              const rect = container.getBoundingClientRect();
                              const newEnd = Math.min(videoDuration, (moveE.clientX - rect.left) / rect.width * videoDuration);
                              setTrimEnd(Math.max(newEnd, trimStart + 1));
                              if (videoRef.current) videoRef.current.currentTime = newEnd;
                            };
                            const stopDrag = () => {
                              window.removeEventListener('mousemove', startDrag);
                              window.removeEventListener('mouseup', stopDrag);
                            };
                            window.addEventListener('mousemove', startDrag);
                            window.addEventListener('mouseup', stopDrag);
                          }}
                        />

                        {/* Current time indicator */}
                        <div
                          className="absolute h-full w-0.5 bg-blue-500"
                          style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Time inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">{isRTL ? 'البداية' : 'Start'}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max={videoDuration}
                            value={trimStart}
                            onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 1))}
                            className="flex-1 h-2 bg-green-500/30 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-mono text-sm font-semibold min-w-12">{formatTime(trimStart)}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">{isRTL ? 'النهاية' : 'End'}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max={videoDuration}
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 1))}
                            className="flex-1 h-2 bg-red-500/30 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-mono text-sm font-semibold min-w-12">{formatTime(trimEnd)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Duration info */}
                    <div className="flex items-center justify-between text-sm bg-black/20 rounded-lg p-2">
                      <span className="text-muted-foreground">{isRTL ? 'المدة المختارة' : 'Selected duration'}</span>
                      <span className={cn(
                        "font-semibold",
                        (trimEnd - trimStart) <= MAX_VIDEO_DURATION ? "text-green-500" : "text-red-500"
                      )}>
                        {formatTime(trimEnd - trimStart)} / {MAX_VIDEO_DURATION}s
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  {isRTL ? (
                    <>
                      ✨ سيظهر الاستوري لمتابعيك لمدة <strong>24 ساعة</strong> فقط
                    </>
                  ) : (
                    <>
                      ✨ Your story will be visible for <strong>24 hours</strong> only
                    </>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 h-12"
                  onClick={handleUpload}
                  disabled={isUploading || (needsTrimming && (trimEnd - trimStart > MAX_VIDEO_DURATION))}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {isRTL ? 'جاري النشر...' : 'Posting...'}
                    </>
                  ) : (
                    <>
                      ✓ {isRTL ? 'نشر الاستوري' : 'Post Story'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <MusicPicker
      open={musicPickerOpen}
      onOpenChange={setMusicPickerOpen}
      onSelect={setSelectedMusic}
      selectedTrack={selectedMusic}
      isRTL={isRTL}
    />
    </>
  );
}
