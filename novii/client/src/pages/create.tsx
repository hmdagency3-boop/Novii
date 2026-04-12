import { useState, useRef, useCallback } from "react";
import {
  X, Zap, ZapOff, Settings2, Type, Infinity, LayoutGrid,
  ChevronDown, ImageIcon, RefreshCw, Check, MapPin
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

type Tab = 'post' | 'story' | 'reel' | 'live';

interface MediaItem {
  file: File;
  url: string;
  isVideo: boolean;
}

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
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [step, setStep] = useState<'camera' | 'post-pick' | 'details'>('camera');

  // For post/reel tab — gallery
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const captureRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const accept =
    tab === 'reel' ? 'video/*' :
    tab === 'story' ? 'image/*,video/*' :
    'image/*';

  /* ── Add to gallery ── */
  const addMedia = useCallback((file: File): MediaItem => {
    const url = URL.createObjectURL(file);
    const item: MediaItem = { file, url, isVideo: file.type.startsWith('video/') };
    return item;
  }, []);

  /* ── Camera capture (story mode) ── */
  const handleCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const item = addMedia(file);
    setCapturedMedia(item);
    setStep('details');
    e.target.value = '';
  }, [addMedia]);

  /* ── Gallery pick (post/reel mode) ── */
  const handleGalleryPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const item = addMedia(file);
    setSelected(item);
    setGallery(prev => {
      const exists = prev.find(i => i.file.name === file.name && i.file.size === file.size);
      if (exists) return prev;
      return [item, ...prev].slice(0, 14);
    });
    e.target.value = '';
  }, [addMedia]);

  /* ── Publish ── */
  const handlePublish = async () => {
    const media = tab === 'story' ? capturedMedia : selected;
    if (!media) return;
    setIsUploading(true);
    try {
      if (tab === 'post') {
        const imageUrl = await api.uploadPostImage(media.file);
        await createPostMutation.mutateAsync({ caption, imageUrl, location: location || undefined });
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

  /* ════════════════════════════════
     DETAILS SCREEN
  ════════════════════════════════ */
  if (step === 'details') {
    const media = tab === 'story' ? capturedMedia : selected;
    if (!media) { setStep('camera'); return null; }

    const pageTitle =
      tab === 'post'  ? (isRTL ? 'منشور جديد' : 'New post')  :
      tab === 'story' ? (isRTL ? 'قصة جديدة'  : 'New story') :
      tab === 'reel'  ? (isRTL ? 'ريلز جديد'  : 'New reel')  :
                        (isRTL ? 'بث مباشر'   : 'Go live');

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
          <button onClick={() => setStep(tab === 'story' ? 'camera' : 'post-pick')} className="p-1">
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">{pageTitle}</span>
          <button
            onClick={handlePublish}
            disabled={isUploading}
            className="text-[#3897f0] font-bold text-sm disabled:opacity-50"
          >
            {isUploading ? (isRTL ? 'جاري...' : 'Sharing...') : (isRTL ? 'مشاركة' : 'Share')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          <div className="aspect-square w-full bg-black">
            {media.isVideo
              ? <video src={media.url} className="w-full h-full object-cover" controls />
              : <img src={media.url} alt="" className="w-full h-full object-cover" />}
          </div>

          {/* Caption */}
          <div className="flex gap-3 p-4 border-b border-border/30">
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary text-white">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">
                {user?.user_metadata?.full_name || user?.email}
              </p>
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

          {/* Location */}
          {(tab === 'post' || tab === 'story') && (
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 border-b border-border/30",
              isRTL && "flex-row-reverse"
            )}>
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder={isRTL ? "إضافة موقع" : "Add location"}
                value={location}
                onChange={e => setLocation(e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
                className={cn(
                  "flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/60",
                  isRTL && "text-right"
                )}
              />
            </div>
          )}
        </div>

        {/* Hidden inputs */}
        <input ref={captureRef} type="file" accept={accept} capture="environment" onChange={handleCapture} className="hidden" />
        <input ref={galleryRef} type="file" accept={accept} onChange={handleGalleryPick} className="hidden" />
      </div>
    );
  }

  /* ════════════════════════════════
     POST / REEL — Gallery picker
  ════════════════════════════════ */
  if (step === 'post-pick') {
    const pageTitle = tab === 'reel' ? (isRTL ? 'ريلز جديد' : 'New reel') : (isRTL ? 'منشور جديد' : 'New post');
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
          <button onClick={() => setStep('camera')} className="p-1">
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">{pageTitle}</span>
          <button
            onClick={() => selected && setStep('details')}
            disabled={!selected}
            className={cn(
              "font-bold text-sm",
              selected ? "text-[#3897f0]" : "text-muted-foreground opacity-40"
            )}
          >
            {isRTL ? 'التالي' : 'Next'}
          </button>
        </div>

        {/* Top split: camera cell + preview */}
        <div className="flex flex-shrink-0" style={{ height: '44vw', maxHeight: 240 }}>
          {/* Camera cell */}
          <button
            onClick={() => captureRef.current?.click()}
            className="flex-none w-1/3 bg-[#111] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white/50" />
              </div>
            </div>
          </button>

          {/* Preview */}
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
        <div className={cn(
          "flex items-center justify-between px-4 py-2.5 border-b border-border/20 flex-shrink-0",
          isRTL && "flex-row-reverse"
        )}>
          <button className={cn("flex items-center gap-1 font-semibold text-sm", isRTL && "flex-row-reverse")}>
            {isRTL ? 'الأخيرة' : 'Recents'} <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className={cn(
              "flex items-center gap-1.5 border border-border/60 rounded-md px-3 py-1 text-xs font-medium",
              isRTL && "flex-row-reverse"
            )}
          >
            <span className="w-3 h-3 border border-current rounded-[2px] inline-block" />
            {isRTL ? 'تحديد' : 'Select'}
          </button>
        </div>

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-[1.5px] bg-border/20">
            {/* Camera tile */}
            <button
              onClick={() => captureRef.current?.click()}
              className="aspect-square bg-[#1a1a1a] flex items-center justify-center"
            >
              <ImageIcon className="w-7 h-7 text-white/30" />
            </button>

            {/* Gallery items */}
            {gallery.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelected(item)}
                className="aspect-square relative overflow-hidden bg-[#111]"
              >
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
                {item.isVideo && (
                  <span className="absolute bottom-1 right-1.5 text-white text-[10px] font-semibold drop-shadow">0:15</span>
                )}
              </button>
            ))}

            {/* Empty tiles */}
            {gallery.length === 0 && Array.from({ length: 11 }).map((_, i) => (
              <div key={`e-${i}`} className="aspect-square bg-[#111]" />
            ))}
          </div>
        </div>

        {/* Bottom tabs */}
        <div className="flex-shrink-0 border-t border-border/30 bg-background pb-safe">
          <div className="flex">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  if (t === 'story') setStep('camera');
                }}
                className={cn(
                  "flex-1 py-3 text-[11px] font-semibold tracking-widest uppercase",
                  tab === t ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
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

        <input ref={captureRef} type="file" accept={accept} capture="environment" onChange={handleCapture} className="hidden" />
        <input ref={galleryRef} type="file" accept={accept} onChange={handleGalleryPick} className="hidden" />
      </div>
    );
  }

  /* ════════════════════════════════
     STORY CAMERA SCREEN (default)
  ════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden">

      {/* Camera "viewfinder" — dark bg simulating camera */}
      <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center overflow-hidden">

        {/* Camera preview bg */}
        {capturedMedia ? (
          capturedMedia.isVideo
            ? <video src={capturedMedia.url} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted />
            : <img src={capturedMedia.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-[#0d0d0d] to-[#1a1a1a]" />
        )}

        {/* ── Top controls ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center">
            <X className="w-7 h-7 text-white drop-shadow" />
          </button>
          <button onClick={() => setFlashOn(f => !f)} className="w-9 h-9 flex items-center justify-center">
            {flashOn
              ? <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow" />
              : <ZapOff className="w-6 h-6 text-white drop-shadow" />}
          </button>
          <button className="w-9 h-9 flex items-center justify-center">
            <Settings2 className="w-6 h-6 text-white drop-shadow" />
          </button>
        </div>

        {/* ── Left tools ── */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
          {[
            { icon: <Type className="w-5 h-5 text-white" />,        label: 'Aa' },
            { icon: <Infinity className="w-5 h-5 text-white" />,    label: '∞' },
            { icon: <LayoutGrid className="w-5 h-5 text-white" />,  label: '' },
            { icon: <ChevronDown className="w-5 h-5 text-white" />, label: '' },
          ].map((item, i) => (
            <button key={i} className="w-9 h-9 flex items-center justify-center drop-shadow-lg">
              {i === 0 ? <span className="text-white font-semibold text-sm drop-shadow">Aa</span> : item.icon}
            </button>
          ))}
        </div>

        {/* ── Bottom controls ── */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-4">
          {/* Effect filter row */}
          <div className="flex items-center gap-3 mb-6 px-4">
            {/* Gallery thumb */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/50 bg-[#222] flex items-center justify-center"
            >
              <ImageIcon className="w-5 h-5 text-white/60" />
            </button>

            {/* Filter dots */}
            {[
              { color: 'bg-red-500',    ring: 'ring-white' },
              { color: 'bg-gray-400',   ring: '' },
              null,
              { color: 'bg-purple-500', ring: '' },
              { color: 'bg-gray-600',   ring: '' },
            ].map((dot, i) =>
              dot === null ? (
                /* Capture button placeholder spacing */
                <div key={i} className="w-18 h-18" style={{ width: 72, height: 72 }} />
              ) : (
                <button
                  key={i}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 border-white/30 overflow-hidden flex items-center justify-center",
                    dot.color,
                    dot.ring && `ring-2 ${dot.ring} ring-offset-1 ring-offset-black`
                  )}
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className={cn("text-xs text-white", dot.color)}>
                      {user?.user_metadata?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              )
            )}

            {/* Flip camera */}
            <button className="w-10 h-10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white drop-shadow" />
            </button>
          </div>

          {/* Capture button row */}
          <div className="flex items-center justify-center relative w-full mb-4">
            <button
              onClick={() => captureRef.current?.click()}
              className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-95 transition-transform shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center w-full">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  if (t !== 'story') setStep('post-pick');
                }}
                className={cn(
                  "flex-1 py-1 text-[11px] font-semibold tracking-widest uppercase transition-all",
                  tab === t ? "text-white" : "text-white/40"
                )}
              >
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

      {/* Hidden inputs */}
      <input ref={captureRef} type="file" accept={accept} capture="environment" onChange={handleCapture} className="hidden" />
      <input ref={galleryRef} type="file" accept={accept} onChange={handleGalleryPick} className="hidden" />
    </div>
  );
}
