import { useState, useRef, useCallback, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/image-cropper";
import { AVATAR_ASPECT_RATIO, getCroppedImg } from "@/lib/crop-utils";
import type { Area } from "react-easy-crop";

interface AvatarUploaderProps {
  currentAvatar?: string;
  username?: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  selectedFile?: File | null;
  previewUrl?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  isRTL?: boolean;
  lang?: "ar" | "en";
  onCroppingChange?: (isCropping: boolean) => void;
}

export function AvatarUploader({
  currentAvatar,
  username = "User",
  onFileSelect,
  onRemove,
  selectedFile,
  previewUrl,
  isUploading = false,
  uploadProgress = 0,
  isRTL = false,
  lang = "en",
  onCroppingChange,
}: AvatarUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onCroppingChange?.(isCropping);
  }, [isCropping, onCroppingChange]);

  const txt = {
    en: {
      hint: "Square image, cropped to 500×500px",
      clickUpload: "Click to upload",
      orDrop: " or drag and drop",
      drop: "Drop your image here",
      formats: "PNG, JPG up to 5MB",
      uploading: "Uploading...",
      crop: "Crop & Save",
      cancel: "Cancel",
    },
    ar: {
      hint: "صورة مربعة، تُقص إلى 500×500 بكسل",
      clickUpload: "انقر للرفع",
      orDrop: " أو اسحب وأفلت",
      drop: "أفلت صورتك هنا",
      formats: "PNG، JPG حتى 5 ميجابايت",
      uploading: "جاري الرفع...",
      crop: "قص وحفظ",
      cancel: "إلغاء",
    },
  }[lang];

  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const url = URL.createObjectURL(files[0]);
      setRawImageUrl(url);
      setIsCropping(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const url = URL.createObjectURL(files[0]);
      setRawImageUrl(url);
      setIsCropping(true);
    }
  };

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!rawImageUrl) return;
    try {
      // Fallback: if user clicks confirm before react-easy-crop emitted onCropComplete,
      // derive a centered square crop from the source image so we never silently no-op.
      let pixels = croppedAreaPixels;
      if (!pixels) {
        const img = new Image();
        img.src = rawImageUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
        });
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        pixels = {
          x: Math.round((img.naturalWidth - side) / 2),
          y: Math.round((img.naturalHeight - side) / 2),
          width: side,
          height: side,
        };
      }
      const croppedFile = await getCroppedImg(
        rawImageUrl,
        pixels,
        AVATAR_ASPECT_RATIO.outputWidth,
        AVATAR_ASPECT_RATIO.outputHeight
      );
      onFileSelect(croppedFile);
      setIsCropping(false);
      URL.revokeObjectURL(rawImageUrl);
      setRawImageUrl(null);
    } catch (err) {
      console.error("Crop error:", err);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    if (rawImageUrl) {
      URL.revokeObjectURL(rawImageUrl);
      setRawImageUrl(null);
    }
  };

  const displayAvatar = previewUrl || currentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  if (isCropping && rawImageUrl) {
    return (
      <div className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
        <div className="relative w-full h-80 rounded-xl overflow-hidden border border-border">
          <ImageCropper
            imageSrc={rawImageUrl}
            aspectRatio={1}
            onCropComplete={handleCropComplete}
            cropShape="round"
            isRTL={isRTL}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCropCancel}>
            {txt.cancel}
          </Button>
          <Button className="flex-1" onClick={handleCropConfirm}>
            {txt.crop}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`flex items-center gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="relative flex-shrink-0">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={displayAvatar} className="object-cover" />
            <AvatarFallback className="text-2xl">{username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {selectedFile && !isUploading && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-lg">{username}</h3>
          <p className="text-sm text-muted-foreground">{txt.hint}</p>
        </div>
      </div>

      <Card
        className={cn(
          "relative border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden",
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-accent/50",
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <div className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
              isDragging ? "bg-primary/20 scale-110" : "bg-muted"
            )}>
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
              ) : (
                <ImageIcon className={cn("w-8 h-8 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            {isUploading ? (
              <>
                <p className="text-sm font-medium">{txt.uploading}</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragging ? (
                    <span className="text-primary">{txt.drop}</span>
                  ) : (
                    <>
                      <span className="text-primary hover:underline">{txt.clickUpload}</span>
                      {txt.orDrop}
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{txt.formats}</p>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </Card>

      {selectedFile && (
        <Card className="p-4 bg-muted/50 border border-border animate-in slide-in-from-top-2 duration-200">
          <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex-shrink-0 w-12 h-12 bg-background rounded-lg flex items-center justify-center border">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="uppercase">{selectedFile.type.split("/")[1]}</span>
                <span>•</span>
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              disabled={isUploading}
              className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
