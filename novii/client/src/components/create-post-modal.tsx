import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useCreatePost } from "@/hooks/use-data";
import { useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  Image as ImageIcon, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ChevronDown,
  Check,
  Upload,
  Share2,
  Plus,
  Trash2,
  Settings,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMediaType?: MediaType;
}

interface ImagePreview {
  url: string;
  file: File;
  filter?: string;
}

interface ReelPreview {
  url: string;
  file: File;
  duration?: number;
}

type MediaType = 'post' | 'reel';
type PostStep = 'select' | 'edit' | 'details';

const FILTERS = [
  { id: 'none', name: 'Original', nameAr: 'الأصل', cssClass: '' },
  { id: 'clarendon', name: 'Clarendon', nameAr: 'Clarendon', cssClass: 'brightness-110 contrast-110' },
  { id: 'gingham', name: 'Gingham', nameAr: 'Gingham', cssClass: 'hue-rotate-15' },
  { id: 'moon', name: 'Moon', nameAr: 'Moon', cssClass: 'grayscale brightness-110 contrast-110' },
  { id: 'lark', name: 'Lark', nameAr: 'Lark', cssClass: 'contrast-90' },
  { id: 'reyes', name: 'Reyes', nameAr: 'Reyes', cssClass: 'sepia-20 brightness-110 contrast-75 saturate-75' },
  { id: 'juno', name: 'Juno', nameAr: 'Juno', cssClass: 'sepia-20 brightness-110 contrast-110 saturate-125' },
  { id: 'slumber', name: 'Slumber', nameAr: 'Slumber', cssClass: 'saturate-75 brightness-110' },
];

export function CreatePostModal({ open, onOpenChange, initialMediaType }: CreatePostModalProps) {
  const { direction, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const createPostMutation = useCreatePost();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<PostStep>('select');
  const [mediaType, setMediaType] = useState<MediaType>(initialMediaType || 'post');
  const [caption, setCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedReel, setSelectedReel] = useState<ReelPreview | null>(null);
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hidelikeCount, setHideLikeCount] = useState(false);
  const [hideComments, setHideComments] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);
  const isRTL = direction === "rtl";
  const t = language.code === 'ar';

  useEffect(() => {
    if (open) {
      setMediaType(initialMediaType || 'post');
      setCurrentStep('select');
      setSelectedImages([]);
      setSelectedReel(null);
      setCaption("");
      setLocation("");
      setSelectedFilter('none');
      setCurrentImageIndex(0);
      setShowAdvanced(false);
    }
  }, [open, initialMediaType]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
        filter: 'none'
      }));
      setSelectedImages(newImages);
      setCurrentStep('edit');
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
        filter: 'none'
      }));
      setSelectedImages(newImages);
      setCurrentStep('edit');
    }
  };

  const handleReelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedReel({
        url: URL.createObjectURL(file),
        file: file,
      });
      setMediaType('reel');
      setCurrentStep('details');
    } else {
      toast({
        variant: "destructive",
        title: t ? "خطأ" : "Error",
        description: t ? "الرجاء اختيار ملف فيديو" : "Please select a video file",
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
    if (newImages.length === 0) {
      setCurrentStep('select');
    }
  };

  const handlePost = async () => {
    if (mediaType === 'reel') {
      if (!selectedReel) {
        toast({
          variant: "destructive",
          title: t ? "خطأ" : "Error",
          description: t ? "يرجى اختيار ريلز" : "Please select a reel",
        });
        return;
      }

      setIsLoading(true);
      try {
        const videoUrl = await api.uploadPostImage(
          selectedReel.file,
          (progress) => setUploadProgress(progress)
        );

        await supabase
          .from('reels')
          .insert({
            user_id: user?.id,
            video_url: videoUrl,
            caption,
          });

        queryClient.invalidateQueries({ queryKey: ['reels'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });

        if (selectedReel) URL.revokeObjectURL(selectedReel.url);
        setCaption("");
        setSelectedReel(null);
        setMediaType('post');
        setLocation("");
        setUploadProgress(0);
        setCurrentStep('select');
        onOpenChange(false);

        toast({
          title: t ? "تم النشر!" : "Posted!",
          description: t ? "تم نشر الريلز بنجاح" : "Your reel has been published successfully",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t ? "خطأ" : "Error",
          description: error.message || (t ? "فشل نشر الريلز" : "Failed to upload reel"),
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (selectedImages.length === 0) {
        toast({
          variant: "destructive",
          title: t ? "خطأ" : "Error",
          description: t ? "يرجى إضافة صورة واحدة على الأقل" : "Please add at least one image",
        });
        return;
      }

      setIsLoading(true);
      try {
        const imageUrl = await api.uploadPostImage(
          selectedImages[0].file,
          (progress) => setUploadProgress(progress)
        );

        await createPostMutation.mutateAsync({
          caption,
          imageUrl,
          location: location || undefined,
        });

        selectedImages.forEach(img => URL.revokeObjectURL(img.url));
        setCaption("");
        setSelectedImages([]);
        setLocation("");
        setCurrentImageIndex(0);
        setUploadProgress(0);
        setCurrentStep('select');
        setSelectedFilter('none');
        onOpenChange(false);

        toast({
          title: t ? "تم النشر!" : "Posted!",
          description: t ? "تم نشر المنشور بنجاح" : "Your post has been published successfully",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t ? "خطأ" : "Error",
          description: error.message || (t ? "فشل نشر المنشور" : "Failed to create post"),
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const stepTitle = currentStep === 'select'
    ? (t ? "إنشاء منشور جديد" : "Create new post")
    : currentStep === 'edit'
    ? (t ? "تعديل الصور" : "Edit")
    : (t ? "مشاركة" : "Share");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideDefaultClose={true}
        className={cn(
          "p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-background",
          "max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl",
          "rounded-2xl",
          "h-[90vh] sm:h-auto sm:max-h-[85vh]",
          "flex flex-col"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
        />
        <input
          type="file"
          ref={reelInputRef}
          className="hidden"
          accept="video/*"
          onChange={handleReelSelect}
        />

        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          {currentStep !== 'select' ? (
            <button
              onClick={() => setCurrentStep(currentStep === 'details' ? 'edit' : 'select')}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}
          <h2 className="text-base font-semibold">{stepTitle}</h2>
          {currentStep === 'edit' ? (
            <button
              onClick={() => setCurrentStep('details')}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1"
            >
              {t ? "التالي" : "Next"}
            </button>
          ) : currentStep === 'details' ? (
            <button
              onClick={handlePost}
              disabled={isLoading}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t ? "مشاركة" : "Share"
              )}
            </button>
          ) : (
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isLoading && (
          <div className="w-full h-1 bg-muted flex-shrink-0">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-r"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {currentStep === 'select' && (
            <div
              className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={cn(
                "w-full max-w-sm text-center transition-all duration-300",
                isDragging && "scale-105"
              )}>
                <div className="mb-6 flex justify-center">
                  <div className={cn(
                    "w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300",
                    isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                  )}>
                    <Upload className={cn(
                      "w-8 h-8 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-1">
                  {t ? "اسحب الصور والفيديو هنا" : "Drag photos and videos here"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t ? "أو اختر من جهازك" : "or select from your device"}
                </p>

                <div className="space-y-2.5">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-lg h-10 text-sm font-semibold"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {t ? "اختر صور" : "Select Photos"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => reelInputRef.current?.click()}
                    className="w-full rounded-lg h-10 text-sm font-semibold"
                  >
                    <Film className="w-4 h-4 mr-2" />
                    {t ? "رفع فيديو" : "Upload Video"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'edit' && selectedImages.length > 0 && (
            <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[250px] sm:min-h-0">
                <img
                  src={selectedImages[currentImageIndex].url}
                  alt="Preview"
                  className={cn(
                    "max-w-full max-h-full object-contain",
                    FILTERS.find(f => f.id === selectedFilter)?.cssClass
                  )}
                />

                {selectedImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((p) => (p - 1 + selectedImages.length) % selectedImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((p) => (p + 1) % selectedImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                      {selectedImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all",
                            idx === currentImageIndex ? "bg-white" : "bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="w-full sm:w-72 border-t sm:border-t-0 sm:border-l border-border overflow-y-auto flex-shrink-0">
                <div className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {t ? "الفلاتر" : "Filters"}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => {
                          setSelectedFilter(filter.id);
                          const newImages = [...selectedImages];
                          newImages[currentImageIndex] = {
                            ...newImages[currentImageIndex],
                            filter: filter.id
                          };
                          setSelectedImages(newImages);
                        }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className={cn(
                          "aspect-square w-full rounded-md overflow-hidden border-2 transition-all",
                          selectedFilter === filter.id
                            ? "border-primary"
                            : "border-transparent hover:border-muted-foreground/30"
                        )}>
                          <img
                            src={selectedImages[currentImageIndex].url}
                            alt={filter.name}
                            className={cn("w-full h-full object-cover", filter.cssClass)}
                          />
                        </div>
                        <span className={cn(
                          "text-[10px]",
                          selectedFilter === filter.id ? "text-primary font-semibold" : "text-muted-foreground"
                        )}>
                          {t ? filter.nameAr : filter.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedImages.length > 0 && (
                  <div className="p-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {t ? "الصور" : "Photos"} ({selectedImages.length})
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {selectedImages.map((img, idx) => (
                        <button
                          key={idx}
                          className={cn(
                            "relative rounded-md overflow-hidden border-2 transition-all flex-shrink-0 w-14 h-14 group",
                            currentImageIndex === idx ? "border-primary" : "border-transparent"
                          )}
                          onClick={() => setCurrentImageIndex(idx)}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                            className="absolute top-0 right-0 bg-black/70 rounded-bl-md p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-14 h-14 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-all"
                      >
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'details' && (selectedImages.length > 0 || selectedReel) && (
            <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              <div className="hidden sm:flex flex-1 bg-black items-center justify-center">
                {selectedReel ? (
                  <div className="flex flex-col items-center gap-3 text-white/60">
                    <Film className="w-16 h-16" />
                    <span className="text-sm">{t ? "الفيديو جاهز" : "Video ready"}</span>
                  </div>
                ) : (
                  <img
                    src={selectedImages[currentImageIndex].url}
                    alt="Preview"
                    className={cn(
                      "max-w-full max-h-full object-contain",
                      FILTERS.find(f => f.id === selectedImages[currentImageIndex]?.filter)?.cssClass
                    )}
                  />
                )}
              </div>

              <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-border overflow-y-auto flex-shrink-0">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                        {user?.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">
                      {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>

                  <Textarea
                    placeholder={t ? "اكتب تعليقاً..." : "Write a caption..."}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-32 resize-none border-0 bg-transparent text-sm p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60"
                    dir={direction}
                    maxLength={2200}
                  />
                  <div className="text-[11px] text-muted-foreground text-right">
                    {caption.length}/2,200
                  </div>

                  <Separator />

                  <button
                    onClick={() => setLocation(location ? "" : "Location")}
                    className="w-full flex items-center justify-between py-2 text-sm hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{location || (t ? "إضافة موقع" : "Add location")}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {location && (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={t ? "اسم الموقع" : "Location name"}
                      dir={direction}
                    />
                  )}

                  <Separator />

                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>{t ? "إعدادات متقدمة" : "Advanced settings"}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm cursor-pointer">
                          {t ? "إخفاء الإعجابات" : "Hide like count"}
                        </Label>
                        <Switch checked={hidelikeCount} onCheckedChange={setHideLikeCount} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm cursor-pointer">
                          {t ? "إيقاف التعليقات" : "Turn off commenting"}
                        </Label>
                        <Switch checked={hideComments} onCheckedChange={setHideComments} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
