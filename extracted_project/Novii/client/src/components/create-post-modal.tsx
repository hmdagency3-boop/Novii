import { useState, useRef, useCallback } from "react";
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
import { 
  X, 
  Image as ImageIcon, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ChevronDown,
  Check,
  Sparkles,
  Upload,
  Crop,
  Wand2,
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
  { id: 'none', name: 'Original', nameAr: 'الأصل', icon: '✓', cssClass: '' },
  { id: 'clarendon', name: 'Clarendon', nameAr: 'Clarendon', icon: '◯', cssClass: 'brightness-110 contrast-110' },
  { id: 'gingham', name: 'Gingham', nameAr: 'Gingham', icon: '◭', cssClass: 'hue-rotate-15' },
  { id: 'moon', name: 'Moon', nameAr: 'Moon', icon: '◐', cssClass: 'grayscale brightness-110 contrast-110' },
  { id: 'lark', name: 'Lark', nameAr: 'Lark', icon: '▲', cssClass: 'contrast-90' },
  { id: 'reyes', name: 'Reyes', nameAr: 'Reyes', icon: '▸', cssClass: 'sepia-20 brightness-110 contrast-75 saturate-75' },
  { id: 'juno', name: 'Juno', nameAr: 'Juno', icon: '◆', cssClass: 'sepia-20 brightness-110 contrast-110 saturate-125' },
  { id: 'slumber', name: 'Slumber', nameAr: 'Slumber', icon: '◎', cssClass: 'saturate-75 brightness-110' },
];

const STEPS: { id: PostStep; label: string; labelAr: string }[] = [
  { id: 'select', label: 'Upload', labelAr: 'الرفع' },
  { id: 'edit', label: 'Edit', labelAr: 'التعديل' },
  { id: 'details', label: 'Share', labelAr: 'المشاركة' },
];

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const { direction, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const createPostMutation = useCreatePost();
  
  const [currentStep, setCurrentStep] = useState<PostStep>('select');
  const [mediaType, setMediaType] = useState<MediaType>('post');
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

  return (
    <>
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

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          hideDefaultClose={true}
          className="max-w-full sm:max-w-2xl lg:max-w-5xl p-0 gap-0 overflow-hidden rounded-none sm:rounded-3xl border-0 shadow-2xl bg-background h-screen sm:h-auto max-h-screen sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-b border-border/50 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {t ? "إنشاء منشور" : "Create Post"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t ? "شارك لحظاتك الرائعة" : "Share your amazing moments"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-muted rounded-full transition-all hover:scale-110 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/30 flex gap-2 flex-shrink-0">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <button
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-all duration-300",
                    currentStep === step.id
                      ? "bg-primary shadow-lg"
                      : STEPS.findIndex(s => s.id === currentStep) > index
                      ? "bg-primary/40"
                      : "bg-border/40"
                  )}
                />
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
            {/* Step 1: Select Media */}
            {currentStep === 'select' && (
              <div className="w-full flex flex-col items-center justify-center p-6 sm:p-10 animate-in fade-in duration-300">
                <div className="w-full max-w-md text-center">
                  {/* Icon */}
                  <div className="mb-8 flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-3xl flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full"></div>
                    </div>
                  </div>

                  {/* Text */}
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    {t ? "اختر الوسائط" : "Choose your media"}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-8">
                    {t ? "قم برفع صور أو فيديو لمشاركتها مع أصدقائك" : "Upload photos or videos to share with your friends"}
                  </p>

                  {/* Drag & Drop Area */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-300 mb-8",
                      isDragging
                        ? "border-primary bg-primary/10 scale-105"
                        : "border-border/60 hover:border-primary/50 bg-muted/30"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <ImageIcon className={cn(
                      "w-12 h-12 mx-auto mb-3 transition-all duration-300",
                      isDragging ? "text-primary scale-125" : "text-muted-foreground"
                    )} />
                    <p className="text-sm font-medium text-foreground mb-1">
                      {t ? "اسحب الملفات هنا" : "Drag files here"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t ? "أو انقر للبحث" : "or click to browse"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 w-full">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-xl py-3 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {t ? "اختر صور" : "Select Photos"}
                    </Button>
                    <Button
                      onClick={() => reelInputRef.current?.click()}
                      className="w-full rounded-xl py-3 text-base font-semibold bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Film className="w-5 h-5 mr-2" />
                      {t ? "رفع فيديو" : "Upload Video"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Edit Images */}
            {currentStep === 'edit' && selectedImages.length > 0 && (
              <div className="w-full flex flex-col sm:flex-row animate-in fade-in duration-300 overflow-hidden">
                {/* Image Preview - Left side on desktop, top on mobile */}
                <div className="flex-1 bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-auto min-h-[300px] sm:min-h-auto border-b sm:border-b-0 sm:border-r border-border/50">
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={selectedImages[currentImageIndex].url}
                      alt="Preview"
                      className={cn(
                        "max-w-full max-h-full object-contain rounded-2xl transition-all duration-300",
                        FILTERS.find(f => f.id === selectedFilter)?.cssClass
                      )}
                    />

                    {/* Navigation Arrows */}
                    {selectedImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((p) => (p - 1 + selectedImages.length) % selectedImages.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-3 transition-all hover:shadow-xl hover:scale-110 z-10"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((p) => (p + 1) % selectedImages.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-3 transition-all hover:shadow-xl hover:scale-110 z-10"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Filters & Thumbnails - Right sidebar on desktop, bottom on mobile */}
                <div className="w-full sm:w-80 border-t sm:border-t-0 bg-gradient-to-b from-background via-background to-muted/20 overflow-y-auto flex flex-col">
                  {/* Filters Section */}
                  <div className="p-4 sm:p-6 space-y-3 max-h-[35vh] overflow-y-auto">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      ✨ {t ? "فلاتر" : "Filters"}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 group relative",
                            selectedFilter === filter.id
                              ? "border-primary ring-2 ring-primary/50 shadow-lg"
                              : "border-border/50 hover:border-primary/50"
                          )}
                        >
                          <img
                            src={selectedImages[currentImageIndex].url}
                            alt={filter.name}
                            className={cn("w-full h-full object-cover", filter.cssClass)}
                          />
                          {selectedFilter === filter.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnails Section */}
                  {selectedImages.length > 1 && (
                    <div className="p-4 sm:p-6 border-t border-border/50">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        📸 {t ? "صورك" : "Your photos"}
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedImages.map((img, idx) => (
                          <button
                            key={idx}
                            className={cn(
                              "relative rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 w-20 h-20 group",
                              currentImageIndex === idx ? "border-primary ring-2 ring-primary/50" : "border-border/50"
                            )}
                            onClick={() => setCurrentImageIndex(idx)}
                          >
                            <img src={img.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                              className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </button>
                        ))}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center hover:border-primary/50 transition-all"
                        >
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Navigation */}
                <div className="border-t border-border/50 bg-gradient-to-t from-background to-transparent p-4 sm:p-6 flex justify-end gap-3 mt-auto">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('select')}
                    className="rounded-xl"
                  >
                    {t ? "رجوع" : "Back"}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('details')}
                    className="rounded-xl px-6 font-semibold bg-primary hover:bg-primary/90"
                  >
                    {t ? "التالي" : "Next"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Details & Share */}
            {currentStep === 'details' && (selectedImages.length > 0 || selectedReel) && (
              <div className="w-full flex flex-col sm:flex-row gap-0 sm:gap-6 animate-in fade-in duration-300 overflow-hidden">
                {/* Image Preview - Hidden on mobile */}
                <div className="hidden sm:flex flex-col w-1/3 bg-black/95 items-center justify-center p-6 flex-shrink-0">
                  {selectedReel ? (
                    <div className="relative w-full aspect-video bg-black/50 rounded-2xl flex items-center justify-center">
                      <Film className="w-16 h-16 text-primary/50" />
                      <div className="absolute bottom-4 left-4 right-4 bg-black/70 px-3 py-2 rounded-lg text-xs text-white">
                        Video Ready
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedImages[currentImageIndex].url}
                      alt="Preview"
                      className={cn(
                        "max-w-full max-h-full object-contain rounded-2xl",
                        FILTERS.find(f => f.id === selectedImages[currentImageIndex].filter)?.cssClass
                      )}
                    />
                  )}
                </div>

                {/* Form Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* User Info */}
                  <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-2xl border border-primary/20">
                    <Avatar className="w-14 h-14 border-2 border-primary/30 shadow-lg">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="font-bold bg-primary text-primary-foreground">
                        {user?.user_metadata?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-base">{user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{t ? "حسابك الشخصي" : "Your account"}</p>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  {/* Caption */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                      📝 {t ? "التعليق" : "Caption"}
                    </label>
                    <Textarea
                      placeholder={t ? "شارك أفكارك وعواطفك..." : "Share your thoughts and feelings..."}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-28 resize-none bg-muted/50 border border-border/50 text-sm rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                      dir={direction}
                      maxLength={2200}
                    />
                    <div className="text-xs text-muted-foreground mt-2 text-right">
                      {caption.length} / 2,200
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <button
                      onClick={() => setLocation(location ? "" : "Location")}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium",
                        location
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-muted/50 text-foreground hover:bg-muted/80 border border-border/30"
                      )}
                    >
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                      <span>{location || (t ? "📍 إضافة موقع" : "📍 Add location")}</span>
                    </button>
                    {location && (
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full mt-2 bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={t ? "اسم الموقع" : "Location name"}
                        dir={direction}
                      />
                    )}
                  </div>

                  {/* Advanced Settings */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      <span className="font-medium text-sm">{t ? "⚙️ إعدادات إضافية" : "⚙️ More options"}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", showAdvanced && "rotate-180")} />
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 bg-muted/40 rounded-2xl border border-border/50 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium cursor-pointer">
                          {t ? "إخفاء الإعجابات" : "Hide likes"}
                        </Label>
                        <Switch checked={hidelikeCount} onCheckedChange={setHideLikeCount} />
                      </div>
                      <Separator className="opacity-30" />
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium cursor-pointer">
                          {t ? "إيقاف التعليقات" : "Disable comments"}
                        </Label>
                        <Switch checked={hideComments} onCheckedChange={setHideComments} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions - Only for details step */}
          {currentStep === 'details' && (
            <div className="border-t border-border/50 bg-gradient-to-t from-background to-muted/20 p-4 sm:p-6 flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('edit')}
                className="rounded-xl"
                disabled={isLoading}
              >
                {t ? "رجوع" : "Back"}
              </Button>
              <Button
                onClick={handlePost}
                disabled={isLoading}
                className="flex-1 rounded-xl py-3 text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 mr-2" />
                    {t ? "مشاركة الآن" : "Share Now"}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
