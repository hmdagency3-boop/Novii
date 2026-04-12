import { useState, useRef, useCallback, useEffect } from "react";
import Layout from "@/components/layout";
import { Camera, X, ChevronDown, Grid3x3, RotateCcw, Check } from "lucide-react";
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
import { MapPin } from "lucide-react";

type Tab = 'post' | 'story' | 'reel';

export default function CreatePage() {
  const { direction } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const createPostMutation = useCreatePost();
  const isRTL = direction === "rtl";

  const [tab, setTab] = useState<Tab>('post');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<{ file: File; url: string }[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'pick' | 'details'>('pick');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const accept = tab === 'reel' ? 'video/*' : tab === 'story' ? 'image/*,video/*' : 'image/*';

  const handleFileChosen = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreview(url);
    setRecentFiles(prev => {
      const already = prev.find(f => f.file.name === file.name && f.file.size === file.size);
      if (already) return prev;
      return [{ file, url }, ...prev].slice(0, 12);
    });
  }, []);

  const handleGalleryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChosen(file);
    e.target.value = '';
  }, [handleFileChosen]);

  const handlePublish = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      if (tab === 'post') {
        const imageUrl = await api.uploadPostImage(selectedFile);
        await createPostMutation.mutateAsync({ caption, imageUrl, location: location || undefined });
        toast({ title: isRTL ? "تم النشر!" : "Posted!", description: isRTL ? "تم نشر المنشور" : "Post published" });
      } else if (tab === 'story') {
        const mediaUrl = await api.uploadPostImage(selectedFile);
        await supabase.from('stories').insert({
          user_id: user?.id,
          media_url: mediaUrl,
          media_type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
        });
        toast({ title: isRTL ? "تم النشر!" : "Posted!", description: isRTL ? "تم نشر القصة" : "Story published" });
      } else {
        const videoUrl = await api.uploadPostImage(selectedFile);
        await supabase.from('reels').insert({ user_id: user?.id, video_url: videoUrl, caption });
        toast({ title: isRTL ? "تم النشر!" : "Posted!", description: isRTL ? "تم نشر الريلز" : "Reel published" });
      }
      navigate("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: isRTL ? "خطأ" : "Error", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Details screen
  if (step === 'details' && preview && selectedFile) {
    return (
      <Layout>
        <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-background">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <button onClick={() => setStep('pick')} className="p-1">
              <X className="w-5 h-5" />
            </button>
            <span className="font-semibold text-sm">
              {tab === 'post' ? (isRTL ? 'منشور جديد' : 'New post')
                : tab === 'story' ? (isRTL ? 'قصة جديدة' : 'New story')
                : (isRTL ? 'ريلز جديد' : 'New reel')}
            </span>
            <button
              onClick={handlePublish}
              disabled={isUploading}
              className="text-primary font-bold text-sm disabled:opacity-50"
            >
              {isUploading ? (isRTL ? 'جاري النشر...' : 'Sharing...') : (isRTL ? 'مشاركة' : 'Share')}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Preview */}
            <div className="aspect-square w-full bg-black">
              {selectedFile.type.startsWith('video/') ? (
                <video src={preview} className="w-full h-full object-cover" controls />
              ) : (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* User + Caption */}
              <div className="flex gap-3">
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
                    onChange={(e) => setCaption(e.target.value)}
                    className={cn(
                      "resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0 min-h-[80px] bg-transparent",
                      isRTL && "text-right"
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>

              <div className="border-t border-border/30" />

              {/* Location */}
              {tab === 'post' && (
                <div className={cn("flex items-center gap-3 py-1", isRTL && "flex-row-reverse")}>
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={isRTL ? "إضافة موقع" : "Add location"}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    dir={isRTL ? "rtl" : "ltr"}
                    className={cn(
                      "flex-1 text-sm bg-transparent border-0 outline-none text-muted-foreground placeholder:text-muted-foreground/60",
                      isRTL && "text-right"
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Step 1: Pick media (Instagram style)
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-background overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1">
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">
            {tab === 'post' ? (isRTL ? 'منشور جديد' : 'New post')
              : tab === 'story' ? (isRTL ? 'قصة جديدة' : 'New story')
              : (isRTL ? 'ريلز جديد' : 'New reel')}
          </span>
          <button
            onClick={() => preview && setStep('details')}
            disabled={!preview}
            className={cn(
              "font-bold text-sm transition-opacity",
              preview ? "text-primary" : "text-muted-foreground opacity-50"
            )}
          >
            {isRTL ? 'التالي' : 'Next'}
          </button>
        </div>

        {/* Preview area */}
        <div className="w-full aspect-square bg-black flex-shrink-0 relative">
          {preview ? (
            <>
              {selectedFile?.type.startsWith('video/') ? (
                <video src={preview} className="w-full h-full object-cover" />
              ) : (
                <img src={preview} alt="selected" className="w-full h-full object-cover" />
              )}
              {/* Top-right controls */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Camera className="w-14 h-14 text-white/30" />
              <p className="text-white/40 text-sm">{isRTL ? 'اختر صورة أو فيديو' : 'Select a photo or video'}</p>
            </div>
          )}
        </div>

        {/* Gallery header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2.5 flex-shrink-0",
          isRTL && "flex-row-reverse"
        )}>
          <button className={cn("flex items-center gap-1 font-semibold text-sm", isRTL && "flex-row-reverse")}>
            {isRTL ? 'الأخيرة' : 'Recents'}
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-accent/60 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              {isRTL ? 'اختيار' : 'Select'}
            </button>
          </div>
        </div>

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-0.5">
            {/* Camera button — first cell */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="aspect-square bg-muted/40 flex items-center justify-center"
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
            </button>

            {/* Recent selected files */}
            {recentFiles.map(({ file, url }, i) => (
              <button
                key={i}
                onClick={() => { setSelectedFile(file); setPreview(url); }}
                className={cn(
                  "aspect-square relative overflow-hidden",
                  preview === url && "ring-2 ring-primary ring-inset"
                )}
              >
                {file.type.startsWith('video/') ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                {preview === url && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}

            {/* Empty cells with "+" to add more */}
            {recentFiles.length === 0 && Array.from({ length: 8 }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square bg-muted/20 flex items-center justify-center"
              >
                {i === 0 && <span className="text-2xl text-muted-foreground/40">+</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom tabs */}
        <div className="flex-shrink-0 border-t border-border/40">
          <div className="flex items-center justify-center gap-0 bg-background">
            {(['post', 'story', 'reel'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setPreview(null); setSelectedFile(null); }}
                className={cn(
                  "flex-1 py-3 text-xs font-semibold tracking-wide uppercase transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t === 'post' ? (isRTL ? 'منشور' : 'POST')
                  : t === 'story' ? (isRTL ? 'قصة' : 'STORY')
                  : (isRTL ? 'ريلز' : 'REEL')}
              </button>
            ))}
          </div>
          <div className="flex">
            {(['post', 'story', 'reel'] as Tab[]).map((t) => (
              <div key={t} className={cn(
                "flex-1 h-0.5 transition-colors",
                tab === t ? "bg-foreground" : "bg-transparent"
              )} />
            ))}
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={galleryInputRef}
          type="file"
          accept={accept}
          onChange={handleGalleryChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={accept}
          capture="environment"
          onChange={handleGalleryChange}
          className="hidden"
        />
      </div>
    </Layout>
  );
}
