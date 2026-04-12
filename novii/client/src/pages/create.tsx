import { useState, useRef, useCallback, useEffect } from "react";
import {
  X, Zap, ZapOff, Settings2, Type, Infinity, LayoutGrid,
  ChevronDown, ImageIcon, RefreshCw, Check, MapPin, Camera
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { useCreatePost } from "@/hooks/use-data";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CreateStoryModal } from "@/components/create-story-modal";

type Tab = 'post' | 'story' | 'reel' | 'live';
type FacingMode = 'environment' | 'user';

interface MediaItem {
  file: File;
  url: string;
  isVideo: boolean;
}

/* ─────────────────────────────────────────
   iPhone-style image processing via Canvas
───────────────────────────────────────── */
function applyIPhoneProcessing(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;

  // ── 1. Pixel-level: tone curve + warmth + saturation ──
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Precompute tone-curve LUT: lift blacks, boost midtones, compress highlights
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const n = i / 255;
    // Lift blacks by ~18pts and gently compress highlights
    const lifted = n * 0.90 + 0.07;
    // Soft midtone brightness push (sine bump)
    const boosted = lifted + 0.025 * Math.sin(Math.PI * lifted);
    lut[i] = Math.min(255, Math.max(0, Math.round(boosted * 255)));
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = lut[data[i]];
    let g = lut[data[i + 1]];
    let b = lut[data[i + 2]];

    // Warm color grade (iPhone's signature orange warmth)
    r = Math.min(255, r + 9);
    g = Math.min(255, g + 3);
    b = Math.max(0,   b - 11);

    // Saturation boost (+14%) using luminance pivot
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = 1.14;
    r = Math.min(255, Math.max(0, Math.round(lum + sat * (r - lum))));
    g = Math.min(255, Math.max(0, Math.round(lum + sat * (g - lum))));
    b = Math.min(255, Math.max(0, Math.round(lum + sat * (b - lum))));

    data[i]     = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  ctx.putImageData(imageData, 0, 0);

  // ── 2. Subtle vignette (iPhone edge darkening) ──
  const cx = width / 2, cy = height / 2;
  const innerR = Math.min(width, height) * 0.38;
  const outerR = Math.max(width, height) * 0.75;
  const vignette = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // ── 3. Sharpening via unsharp-mask (lightweight single-pass approx) ──
  const sharp = ctx.getImageData(0, 0, width, height);
  const blurred = ctx.getImageData(0, 0, width, height);
  // Simple box-blur approximation: average 3×1 horizontal neighbours
  const bd = blurred.data;
  const sd = sharp.data;
  const amount = 0.4; // sharpening strength
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = (y * width + x) * 4;
      const l = p - 4, r2 = p + 4;
      for (let c = 0; c < 3; c++) {
        const blurVal = (bd[l + c] + bd[p + c] + bd[r2 + c]) / 3;
        sd[p + c] = Math.min(255, Math.max(0,
          Math.round(bd[p + c] + amount * (bd[p + c] - blurVal))
        ));
      }
    }
  }
  ctx.putImageData(sharp, 0, 0);
}

/* ─────────────────────────────────────────
   Camera hook — live stream via getUserMedia
───────────────────────────────────────── */
function useLiveCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<FacingMode>('environment');
  const [hasCamera, setHasCamera] = useState(true);
  const [ready, setReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const startCamera = useCallback(async (mode: FacingMode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
    setTorchSupported(false);
    setTorchOn(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
      setHasCamera(true);
      // Check torch support on back camera only
      if (mode === 'environment') {
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as any;
        if (caps?.torch) setTorchSupported(true);
      }
    } catch {
      setHasCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // Make sure torch is off before stopping
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try { (track.applyConstraints as any)({ advanced: [{ torch: false }] }); } catch {}
      }
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
    setTorchOn(false);
  }, []);

  const flipCamera = useCallback(() => {
    const next: FacingMode = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    startCamera(next);
  }, [facing, startCamera]);

  // Toggle torch (physical flashlight)
  const toggleTorch = useCallback(async (on: boolean) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track.applyConstraints as any)({ advanced: [{ torch: on }] });
      setTorchOn(on);
    } catch {
      // torch not supported silently
    }
  }, []);

  // Capture photo from stream → File (with iPhone-style processing)
  const capturePhoto = useCallback((): File | null => {
    const video = videoRef.current;
    if (!video || !ready) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    // Apply iPhone-style processing
    applyIPhoneProcessing(canvas);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], `photo_${Date.now()}.jpg`, { type: mime });
  }, [ready, facing]);

  useEffect(() => {
    if (active) startCamera(facing);
    else stopCamera();
    return stopCamera;
  }, [active]);

  // Live Photo: record 3-second video clip from the stream
  const [isCapturingLive, setIsCapturingLive] = useState(false);

  const captureLivePhoto = useCallback((): Promise<{ still: File; video: File } | null> => {
    if (!streamRef.current || !ready) return Promise.resolve(null);

    // Capture still immediately
    const still = capturePhoto();
    if (!still) return Promise.resolve(null);

    setIsCapturingLive(true);

    // Pick best supported MIME type
    const mimeType =
      MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' :
      MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' :
      'video/mp4';

    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(streamRef.current!, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        setIsCapturingLive(false);
        const blob = new Blob(chunks, { type: mimeType });
        const ext  = mimeType.includes('webm') ? 'webm' : 'mp4';
        const videoFile = new File([blob], `live_${Date.now()}.${ext}`, { type: mimeType });
        resolve({ still, video: videoFile });
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 3000); // 3-second live clip
    });
  }, [ready, capturePhoto]);

  return { videoRef, hasCamera, ready, facing, flipCamera, capturePhoto, torchSupported, torchOn, toggleTorch, isCapturingLive, captureLivePhoto };
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
export default function CreatePage() {
  const { direction } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const createPostMutation = useCreatePost();
  const isRTL = direction === "rtl";

  const [tab, setTab] = useState<Tab>('story');
  const [capturedMedia, setCapturedMedia] = useState<MediaItem | null>(null);
  const [caption, setCaption] = useState("");
  const [locationText, setLocationText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [screenFlash, setScreenFlash] = useState(false);
  const [step, setStep] = useState<'camera' | 'post-pick' | 'details'>('camera');
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyPreview, setStoryPreview] = useState<string | undefined>(undefined);
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video'>('image');
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [shutterAnim, setShutterAnim] = useState(false);
  const lastTapRef = useRef<number>(0);

  const galleryRef = useRef<HTMLInputElement>(null);

  // Camera only active on 'camera' step
  const [livePhotoActive, setLivePhotoActive] = useState(false);
  // Reset live photo mode when switching away from story tab
  useEffect(() => { if (tab !== 'story') setLivePhotoActive(false); }, [tab]);
  const { videoRef, hasCamera, ready, facing, flipCamera, capturePhoto, torchSupported, torchOn, toggleTorch, isCapturingLive, captureLivePhoto } = useLiveCamera(step === 'camera');

  const accept =
    tab === 'reel'  ? 'video/*' :
    tab === 'story' ? 'image/*,video/*' :
    'image/*';

  /* ── File → data URL (needed by CreateStoryModal) ── */
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  /* ── Add file to gallery ── */
  const addMedia = useCallback((file: File): MediaItem => {
    const url = URL.createObjectURL(file);
    return { file, url, isVideo: file.type.startsWith('video/') };
  }, []);

  /* ── Open story editor modal ── */
  const openStoryEditor = useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const mtype: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
    setStoryPreview(dataUrl);
    setStoryMediaType(mtype);
    setStoryModalOpen(true);
  }, []);

  /* ── Flash mode cycle: off → on → auto ── */
  const handleFlashToggle = useCallback(async () => {
    if (torchSupported) {
      // Physical torch: toggle on/off
      const next = !torchOn;
      await toggleTorch(next);
      setFlashMode(next ? 'on' : 'off');
    } else {
      // Screen flash only: toggle off/on
      setFlashMode(m => m === 'off' ? 'on' : 'off');
    }
  }, [torchSupported, torchOn, toggleTorch]);

  /* ── Shutter: capture from live camera ── */
  const handleShutter = useCallback(async () => {
    if (isCapturingLive) return; // prevent double-tap during live recording

    const shouldFlash = flashMode === 'on' || flashMode === 'auto';

    if (shouldFlash && !torchSupported) {
      setScreenFlash(true);
      await new Promise(r => setTimeout(r, 80));
    }

    if (tab === 'story' && livePhotoActive) {
      // ── Live Photo mode: record 3-second video clip ──
      if (shouldFlash && !torchSupported) setTimeout(() => setScreenFlash(false), 200);
      setShutterAnim(true);
      setTimeout(() => setShutterAnim(false), 200);
      const result = await captureLivePhoto();
      if (!result) return;
      // Open story editor with the VIDEO (live photo = short looping video)
      await openStoryEditor(result.video);
    } else {
      // ── Normal photo capture ──
      const file = capturePhoto();
      if (shouldFlash && !torchSupported) setTimeout(() => setScreenFlash(false), 200);
      if (!file) return;
      setShutterAnim(true);
      setTimeout(() => setShutterAnim(false), 200);
      await openStoryEditor(file);
    }
  }, [capturePhoto, captureLivePhoto, openStoryEditor, flashMode, torchSupported, tab, livePhotoActive, isCapturingLive]);

  /* ── Gallery pick ── */
  const handleGalleryPick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (tab === 'story') {
      await openStoryEditor(file);
    } else {
      const item = addMedia(file);
      setSelected(item);
      setGallery(prev => {
        const dup = prev.find(i => i.file.name === file.name && i.file.size === file.size);
        if (dup) return prev;
        return [item, ...prev].slice(0, 14);
      });
    }
    e.target.value = '';
  }, [addMedia, tab, openStoryEditor]);

  /* ── Publish ── */
  const handlePublish = async () => {
    const media = tab === 'story' ? capturedMedia : selected;
    if (!media) return;
    setIsUploading(true);
    try {
      if (tab === 'post') {
        const imageUrl = await api.uploadPostImage(media.file);
        await createPostMutation.mutateAsync({ caption, imageUrl, location: locationText || undefined });
        toast({ title: isRTL ? "تم النشر!" : "Posted!" });
      } else if (tab === 'story') {
        const mediaUrl = await api.uploadPostImage(media.file);
        await supabase.from('stories').insert({
          user_id: user?.id,
          media_url: mediaUrl,
          media_type: media.isVideo ? 'video' : 'image',
        });
        toast({ title: isRTL ? "تمت إضافة القصة!" : "Story added!" });
      } else if (tab === 'reel') {
        const videoUrl = await api.uploadPostImage(media.file);
        await supabase.from('reels').insert({ user_id: user?.id, video_url: videoUrl, caption });
        toast({ title: isRTL ? "تم نشر الريلز!" : "Reel posted!" });
      }
      navigate("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: isRTL ? "خطأ" : "Error", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const tabLabel = (t: Tab) => {
    if (t === 'post')  return isRTL ? 'منشور' : 'POST';
    if (t === 'story') return isRTL ? 'قصة'   : 'STORY';
    if (t === 'reel')  return isRTL ? 'ريلز'  : 'REEL';
    return isRTL ? 'مباشر' : 'LIVE';
  };

  const pageTitle = () => {
    if (tab === 'post')  return isRTL ? 'منشور جديد' : 'New post';
    if (tab === 'story') return isRTL ? 'قصة جديدة'  : 'New story';
    if (tab === 'reel')  return isRTL ? 'ريلز جديد'  : 'New reel';
    return isRTL ? 'بث مباشر' : 'Go live';
  };

  /* ════════════════════════════════
     DETAILS SCREEN
  ════════════════════════════════ */
  if (step === 'details') {
    const media = tab === 'story' ? capturedMedia : selected;
    if (!media) { setStep('camera'); return null; }

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
          <button onClick={() => setStep(tab === 'story' ? 'camera' : 'post-pick')} className="p-1">
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">{pageTitle()}</span>
          <button
            onClick={handlePublish}
            disabled={isUploading}
            className="text-[#3897f0] font-bold text-sm disabled:opacity-50"
          >
            {isUploading ? (isRTL ? 'جاري...' : 'Sharing...') : (isRTL ? 'مشاركة' : 'Share')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="aspect-square w-full bg-black">
            {media.isVideo
              ? <video src={media.url} className="w-full h-full object-cover" controls />
              : <img src={media.url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="flex gap-3 p-4 border-b border-border/30">
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary text-white">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">{user?.user_metadata?.full_name || user?.email}</p>
              <Textarea
                placeholder={isRTL ? "اكتب تعليقاً..." : "Write a caption..."}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
                className={cn(
                  "resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0 min-h-[72px] bg-transparent",
                  isRTL && "text-right"
                )}
              />
            </div>
          </div>
          {(tab === 'post' || tab === 'story') && (
            <div className={cn("flex items-center gap-3 px-4 py-3 border-b border-border/30", isRTL && "flex-row-reverse")}>
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder={isRTL ? "إضافة موقع" : "Add location"}
                value={locationText}
                onChange={e => setLocationText(e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
                className={cn("flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/60", isRTL && "text-right")}
              />
            </div>
          )}
        </div>
        <input ref={galleryRef} type="file" accept={accept} onChange={handleGalleryPick} className="hidden" />
      </div>
    );
  }

  /* ════════════════════════════════
     POST/REEL — Gallery picker
  ════════════════════════════════ */
  if (step === 'post-pick') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
          <button onClick={() => setStep('camera')} className="p-1"><X className="w-5 h-5" /></button>
          <span className="font-semibold text-sm">{pageTitle()}</span>
          <button
            onClick={() => selected && setStep('details')}
            disabled={!selected}
            className={cn("font-bold text-sm", selected ? "text-[#3897f0]" : "text-muted-foreground opacity-40")}
          >
            {isRTL ? 'التالي' : 'Next'}
          </button>
        </div>

        {/* Top split */}
        <div className="flex flex-shrink-0" style={{ height: '44vw', maxHeight: 240 }}>
          <button
            onClick={() => { setStep('camera'); }}
            className="flex-none w-1/3 bg-[#111] flex items-center justify-center"
          >
            <Camera className="w-9 h-9 text-white/40" />
          </button>
          <div
            className="flex-1 bg-[#1a1a1a] overflow-hidden cursor-pointer"
            onClick={() => !selected && galleryRef.current?.click()}
          >
            {selected ? (
              selected.isVideo
                ? <video src={selected.url} className="w-full h-full object-cover" />
                : <img src={selected.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
                <ImageIcon className="w-8 h-8 text-white" />
                <span className="text-white text-xs">{isRTL ? 'اختر صورة' : 'Select'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recents bar */}
        <div className={cn("flex items-center justify-between px-4 py-2.5 border-b border-border/20 flex-shrink-0", isRTL && "flex-row-reverse")}>
          <button className={cn("flex items-center gap-1 font-semibold text-sm", isRTL && "flex-row-reverse")}>
            {isRTL ? 'الأخيرة' : 'Recents'} <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className={cn("flex items-center gap-1.5 border border-border/60 rounded-md px-3 py-1 text-xs font-medium", isRTL && "flex-row-reverse")}
          >
            <span className="w-3 h-3 border border-current rounded-[2px] inline-block" />
            {isRTL ? 'تحديد' : 'Select'}
          </button>
        </div>

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-[1.5px] bg-border/20">
            <button
              onClick={() => galleryRef.current?.click()}
              className="aspect-square bg-[#1a1a1a] flex items-center justify-center"
            >
              <ImageIcon className="w-7 h-7 text-white/30" />
            </button>
            {gallery.map((item, i) => (
              <button key={i} onClick={() => setSelected(item)} className="aspect-square relative overflow-hidden bg-[#111]">
                {item.isVideo
                  ? <video src={item.url} className="w-full h-full object-cover" />
                  : <img src={item.url} alt="" className="w-full h-full object-cover" />}
                {selected?.url === item.url && (
                  <>
                    <div className="absolute inset-0 bg-black/25" />
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#3897f0] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </>
                )}
              </button>
            ))}
            {gallery.length === 0 && Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="aspect-square bg-[#111]" />
            ))}
          </div>
        </div>

        {/* Bottom tabs */}
        <div className="flex-shrink-0 border-t border-border/30 bg-background">
          <div className="flex">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); if (t === 'story') setStep('camera'); }}
                className={cn("flex-1 py-3 text-[11px] font-semibold tracking-widest uppercase", tab === t ? "text-foreground" : "text-muted-foreground/50")}>
                {tabLabel(t)}
              </button>
            ))}
          </div>
          <div className="flex h-[2px]">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <div key={t} className={cn("flex-1", tab === t ? "bg-foreground" : "")} />
            ))}
          </div>
        </div>

        <input ref={galleryRef} type="file" accept={accept} onChange={handleGalleryPick} className="hidden" />
      </div>
    );
  }

  /* ════════════════════════════════
     CAMERA SCREEN
  ════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden">

      {/* Screen flash overlay */}
      {screenFlash && <div className="absolute inset-0 bg-white z-50 pointer-events-none" style={{ opacity: 0.95 }} />}

      {/* Shutter animation */}
      {shutterAnim && <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-ping" style={{ animationDuration: '150ms', animationIterationCount: 1 }} />}

      {/* Live camera feed */}
      <div
        className="flex-1 relative overflow-hidden"
        onDoubleClick={flipCamera}
        onTouchEnd={(e) => {
          const now = Date.now();
          if (now - lastTapRef.current < 300) {
            e.preventDefault();
            flipCamera();
          }
          lastTapRef.current = now;
        }}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            ready ? "opacity-100" : "opacity-0"
          )}
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* No camera fallback */}
        {!hasCamera && (
          <div className="absolute inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center gap-3">
            <Camera className="w-16 h-16 text-white/20" />
            <p className="text-white/40 text-sm text-center px-8">
              {isRTL ? 'لم يتم السماح بالوصول للكاميرا' : 'Camera access denied'}
            </p>
            <button
              onClick={() => galleryRef.current?.click()}
              className="mt-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm"
            >
              {isRTL ? 'اختر من المعرض' : 'Choose from gallery'}
            </button>
          </div>
        )}

        {/* Loading */}
        {hasCamera && !ready && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* ── Top controls ── */}
        <div className="absolute top-0 left-0 right-0 flex flex-col items-center px-4 pt-10 pb-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between w-full">
            <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center">
              <X className="w-7 h-7 text-white drop-shadow-lg" />
            </button>
            <button onClick={handleFlashToggle} className="w-10 h-10 flex items-center justify-center">
              {flashMode === 'on'
                ? <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                : flashMode === 'auto'
                ? <Zap className="w-6 h-6 text-yellow-200 drop-shadow-lg" />
                : <ZapOff className="w-6 h-6 text-white drop-shadow-lg" />}
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-white drop-shadow-lg" />
            </button>
          </div>

          {/* LIVE PHOTO button — only shown in STORY tab */}
          {tab === 'story' && (
            <button
              onClick={() => setLivePhotoActive(v => !v)}
              className={cn(
                "mt-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider border transition-all",
                livePhotoActive
                  ? "bg-yellow-400 border-yellow-400 text-black"
                  : "bg-black/30 border-white/40 text-white"
              )}
            >
              LIVE
            </button>
          )}

          {/* Recording indicator during live capture */}
          {isCapturingLive && (
            <div className="mt-2 flex items-center gap-1.5 bg-red-600/90 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-bold">جاري تسجيل اللايف...</span>
            </div>
          )}
        </div>

        {/* ── Left tools ── */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-5">
          <button className="w-9 h-9 flex items-center justify-center drop-shadow-lg">
            <span className="text-white font-semibold text-sm drop-shadow">Aa</span>
          </button>
          <button className="w-9 h-9 flex items-center justify-center drop-shadow-lg">
            <Infinity className="w-5 h-5 text-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center drop-shadow-lg">
            <LayoutGrid className="w-5 h-5 text-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center drop-shadow-lg">
            <ChevronDown className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── Bottom area (gradient + controls) ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-10 pb-2">

          {/* Effect row — avatar circles */}
          <div className="flex items-center justify-center gap-4 mb-5 px-4">
            {/* Gallery thumb */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/50 bg-black/40 flex items-center justify-center flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5 text-white/60" />
            </button>

            {/* Dummy effect dots */}
            {[true, false, false, false].map((active, i) => (
              <button key={i} className={cn(
                "w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0",
                active ? "border-white ring-2 ring-white/50 ring-offset-1 ring-offset-black" : "border-white/30"
              )}>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-[10px] bg-gray-700 text-white">
                    {user?.user_metadata?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </button>
            ))}

            {/* Flip camera */}
            <button onClick={flipCamera} className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-white drop-shadow-lg" />
            </button>
          </div>

          {/* Capture button */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={handleShutter}
              disabled={!ready && hasCamera}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex w-full">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <button key={t}
                onClick={() => { setTab(t); if (t !== 'story') setStep('post-pick'); }}
                className={cn("flex-1 py-1.5 text-[11px] font-semibold tracking-widest uppercase", tab === t ? "text-white" : "text-white/40")}>
                {tabLabel(t)}
              </button>
            ))}
          </div>
          <div className="flex w-full mt-0.5">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <div key={t} className={cn("flex-1 h-[2px]", tab === t ? "bg-white" : "")} />
            ))}
          </div>
        </div>
      </div>

      <input ref={galleryRef} type="file" accept={accept} onChange={handleGalleryPick} className="hidden" />

      {/* Story editor modal — opens after capture or gallery pick */}
      <CreateStoryModal
        open={storyModalOpen}
        onOpenChange={(open) => {
          setStoryModalOpen(open);
          if (!open) {
            // Reset preview so next capture starts fresh
            setStoryPreview(undefined);
          }
        }}
        isRTL={isRTL}
        initialPreview={storyPreview}
        initialMediaType={storyMediaType}
      />
    </div>
  );
}
