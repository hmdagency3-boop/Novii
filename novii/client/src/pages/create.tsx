import { useState, useRef, useCallback } from "react";
import Layout from "@/components/layout";
import {
  Camera, X, ChevronDown, Check, MapPin, Settings,
  Image as ImageIcon, RefreshCw
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

  const [tab, setTab] = useState<Tab>('post');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'pick' | 'details'>('pick');

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const accept =
    tab === 'reel' ? 'video/*' :
    tab === 'story' ? 'image/*,video/*' :
    'image/*';

  const addToGallery = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const item: MediaItem = { file, url, isVideo: file.type.startsWith('video/') };
    setSelected(item);
    setGallery(prev => {
      const exists = prev.find(i => i.file.name === file.name && i.file.size === file.size);
      if (exists) return prev;
      return [item, ...prev].slice(0, 15);
    });
    return item;
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addToGallery(file);
    e.target.value = '';
  }, [addToGallery]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSelected(null);
    setGallery([]);
    setCaption('');
    setLocation('');
    setStep('pick');
  };

  const handlePublish = async () => {
    if (!selected) return;
    setIsUploading(true);
    try {
      if (tab === 'post') {
        const imageUrl = await api.uploadPostImage(selected.file);
        await createPostMutation.mutateAsync({ caption, imageUrl, location: location || undefined });
        toast({ title: isRTL ? "تم النشر!" : "Posted!" });
      } else if (tab === 'story') {
        const mediaUrl = await api.uploadPostImage(selected.file);
        await supabase.from('stories').insert({
          user_id: user?.id,
          media_url: mediaUrl,
          media_type: selected.isVideo ? 'video' : 'image',
        });
        toast({ title: isRTL ? "تمت إضافة القصة!" : "Story added!" });
      } else if (tab === 'reel') {
        const videoUrl = await api.uploadPostImage(selected.file);
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

  /* ─── Details screen ─── */
  if (step === 'details' && selected) {
    return (
      <Layout>
        <div className="flex flex-col h-[calc(100vh-56px)] bg-background">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
            <button onClick={() => setStep('pick')} className="p-1">
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
            {/* Square preview */}
            <div className="aspect-square w-full bg-black">
              {selected.isVideo
                ? <video src={selected.url} className="w-full h-full object-cover" controls />
                : <img src={selected.url} alt="" className="w-full h-full object-cover" />}
            </div>

            {/* Caption + user */}
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
                    "flex-1 text-sm bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/60",
                    isRTL && "text-right"
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  /* ─── Pick screen ─── */
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-56px)] bg-background overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1">
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">{pageTitle()}</span>
          <button
            onClick={() => selected && setStep('details')}
            disabled={!selected}
            className={cn(
              "font-bold text-sm transition-opacity",
              selected ? "text-[#3897f0]" : "text-muted-foreground opacity-40 cursor-default"
            )}
          >
            {isRTL ? 'التالي' : 'Next'}
          </button>
        </div>

        {/* ── Top split: [camera | preview] ── */}
        <div className="flex-shrink-0 flex" style={{ height: '45vw', maxHeight: 260 }}>
          {/* Camera cell */}
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex-none bg-black flex items-center justify-center"
            style={{ width: '33.333%' }}
          >
            <Camera className="w-10 h-10 text-white/50" />
          </button>

          {/* Preview cell */}
          <div
            className="flex-1 bg-[#1a1a1a] flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => !selected && galleryRef.current?.click()}
          >
            {selected ? (
              <>
                {selected.isVideo
                  ? <video src={selected.url} className="w-full h-full object-cover" />
                  : <img src={selected.url} alt="" className="w-full h-full object-cover" />}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-40">
                <ImageIcon className="w-8 h-8 text-white" />
                <span className="text-xs text-white">{isRTL ? 'اختر صورة' : 'Select'}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Recents header ── */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2 flex-shrink-0 border-b border-border/20",
          isRTL && "flex-row-reverse"
        )}>
          <button className={cn(
            "flex items-center gap-1 font-semibold text-sm",
            isRTL && "flex-row-reverse"
          )}>
            {isRTL ? 'الأخيرة' : 'Recents'}
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className={cn(
              "flex items-center gap-1.5 border border-border rounded-md px-3 py-1 text-xs font-medium",
              isRTL && "flex-row-reverse"
            )}
          >
            <span className="w-3.5 h-3.5 border border-current rounded-sm inline-block" />
            {isRTL ? 'تحديد' : 'Select'}
          </button>
        </div>

        {/* ── Gallery grid ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-[1px] bg-border/20">

            {/* Camera tile */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="aspect-square bg-[#1a1a1a] flex items-center justify-center"
            >
              <Camera className="w-8 h-8 text-white/40" />
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
                {/* Selection indicator */}
                {selected?.url === item.url && (
                  <>
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#3897f0] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </>
                )}
                {item.isVideo && (
                  <div className="absolute bottom-1 right-1.5 text-white text-[10px] font-semibold drop-shadow">
                    0:15
                  </div>
                )}
              </button>
            ))}

            {/* Placeholder tiles when gallery empty */}
            {gallery.length === 0 && Array.from({ length: 11 }).map((_, i) => (
              <button
                key={`ph-${i}`}
                onClick={() => galleryRef.current?.click()}
                className="aspect-square bg-[#111] flex items-center justify-center"
              >
                {i === 0 && (
                  <span className="text-white/20 text-2xl font-light">+</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Bottom tabs ── */}
        <div className="flex-shrink-0 border-t border-border/30 bg-background">
          <div className="flex">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={cn(
                  "flex-1 py-3 text-[11px] font-semibold tracking-widest uppercase transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {tabLabel(t)}
              </button>
            ))}
          </div>
          {/* Active underline */}
          <div className="flex h-[2px]">
            {(['post', 'story', 'reel', 'live'] as Tab[]).map(t => (
              <div key={t} className={cn("flex-1 transition-colors", tab === t ? "bg-foreground" : "")} />
            ))}
          </div>
        </div>

      </div>

      {/* Hidden inputs */}
      <input ref={galleryRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
      <input ref={cameraRef} type="file" accept={accept} capture="environment" onChange={handleFileChange} className="hidden" />
    </Layout>
  );
}
