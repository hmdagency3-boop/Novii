import { useState, useRef, useCallback } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Upload,
  MapPin,
  MoreHorizontal,
  Check,
  ArrowLeft,
  Zap
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { useCreatePost } from "@/hooks/use-data";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

type ContentType = 'post' | 'story' | 'reel' | null;

export default function CreatePage() {
  const { direction } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const createPostMutation = useCreatePost();
  
  const isRTL = direction === "rtl";
  const t = direction === 'rtl';

  // State
  const [contentType, setContentType] = useState<ContentType>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (contentType && e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [contentType, handleFileSelect]);

  // Publish content
  const handlePublish = async () => {
    if (!selectedFile || !contentType) return;

    setIsUploading(true);
    try {
      if (contentType === 'post') {
        const imageUrl = await api.uploadPostImage(selectedFile);
        await createPostMutation.mutateAsync({
          caption,
          imageUrl,
          location: location || undefined,
        });

        toast({
          title: t ? "تم النشر!" : "Posted!",
          description: t ? "تم نشر المنشور بنجاح" : "Your post has been published",
        });
      } else if (contentType === 'story') {
        const mediaUrl = await api.uploadPostImage(selectedFile);
        await supabase.from('stories').insert({
          user_id: user?.id,
          media_url: mediaUrl,
          media_type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
        });

        toast({
          title: t ? "تم النشر!" : "Posted!",
          description: t ? "تم نشر القصة بنجاح" : "Your story has been published",
        });
      } else if (contentType === 'reel') {
        const videoUrl = await api.uploadPostImage(selectedFile);
        await supabase.from('reels').insert({
          user_id: user?.id,
          video_url: videoUrl,
          caption,
        });

        toast({
          title: t ? "تم النشر!" : "Posted!",
          description: t ? "تم نشر الريلز بنجاح" : "Your reel has been published",
        });
      }

      // Reset and navigate back
      setContentType(null);
      setSelectedFile(null);
      setPreview(null);
      setCaption("");
      setLocation("");
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t ? "خطأ" : "Error",
        description: error.message || (t ? "فشل النشر" : "Failed to publish"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Content Type Selection Screen
  if (!contentType) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-3xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-3xl mb-6 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">
                {t ? "ماذا تريد أن تشارك?" : "What do you want to share?"}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t ? "اختر نوع المحتوى الذي تريد نشره" : "Choose the type of content you want to create"}
              </p>
            </div>

            {/* Content Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Post Card */}
              <button
                onClick={() => setContentType('post')}
                className="group relative rounded-2xl border-2 border-border/50 hover:border-primary/50 bg-card/30 p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-7 h-7 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t ? "منشور" : "Post"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t ? "شارك صورة مع أصدقائك" : "Share a photo with friends"}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>📸 {t ? "صورة واحدة" : "Single photo"}</p>
                    <p>✨ {t ? "مع تعليق" : "With caption"}</p>
                  </div>
                </div>
              </button>

              {/* Story Card */}
              <button
                onClick={() => setContentType('story')}
                className="group relative rounded-2xl border-2 border-border/50 hover:border-purple-500/50 bg-card/30 p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t ? "قصة" : "Story"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t ? "شارك لحظة تختفي بعد 24 ساعة" : "Share a moment that disappears after 24h"}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>⏰ {t ? "تختفي بعد يوم واحد" : "Disappears in 24h"}</p>
                    <p>🎬 {t ? "صورة أو فيديو" : "Photo or video"}</p>
                  </div>
                </div>
              </button>

              {/* Reel Card */}
              <button
                onClick={() => setContentType('reel')}
                className="group relative rounded-2xl border-2 border-border/50 hover:border-pink-500/50 bg-card/30 p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500/30 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Video className="w-7 h-7 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t ? "ريلز" : "Reel"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t ? "شارك فيديو قصير وممتع" : "Share a short and fun video"}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>🎥 {t ? "فيديو عالي الجودة" : "High-quality video"}</p>
                    <p>⚡ {t ? "حتى 60 ثانية" : "Up to 60 seconds"}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Create Content Screen
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setContentType(null)}
              className="p-2 hover:bg-muted rounded-full transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">
              {contentType === 'post' && (t ? "إنشاء منشور" : "Create Post")}
              {contentType === 'story' && (t ? "إنشاء قصة" : "Create Story")}
              {contentType === 'reel' && (t ? "إنشاء ريلز" : "Create Reel")}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Area */}
            <div className="flex flex-col">
              {!preview ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 flex-1 flex flex-col items-center justify-center",
                    isDragging
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-border/60 hover:border-primary/50 bg-muted/30"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    {contentType === 'post' && <ImageIcon className="w-8 h-8 text-primary" />}
                    {contentType === 'story' && <Zap className="w-8 h-8 text-primary" />}
                    {contentType === 'reel' && <Video className="w-8 h-8 text-primary" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t ? "اسحب الملفات هنا" : "Drag files here"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t ? "أو انقر للاختيار" : "or click to select"}
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="default"
                    className="rounded-lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t ? "اختر ملف" : "Choose File"}
                  </Button>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-square flex items-center justify-center">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={preview}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={
                  contentType === 'post' ? "image/*" :
                  contentType === 'story' ? "image/*,video/*" :
                  "video/*"
                }
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Details Area */}
            <div className="flex flex-col gap-6">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-6 border-b border-border/30">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.user_metadata?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{t ? "حسابك العام" : "Your Account"}</p>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  {contentType === 'post' && (t ? "التعليق" : "Caption")}
                  {contentType === 'story' && (t ? "نص القصة (اختياري)" : "Story Text (optional)")}
                  {contentType === 'reel' && (t ? "وصف الريلز" : "Reel Description")}
                </label>
                <Textarea
                  placeholder={t ? "اكتب ما تريد..." : "Write something..."}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="resize-none h-24 rounded-lg"
                />
              </div>

              {/* Location (for posts) */}
              {contentType === 'post' && (
                <div>
                  <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t ? "الموقع (اختياري)" : "Location (optional)"}
                  </label>
                  <input
                    type="text"
                    placeholder={t ? "أضف الموقع..." : "Add location..."}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border/50 focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              {/* Publish Button */}
              <div className="flex gap-3 mt-auto pt-6 border-t border-border/30">
                <Button
                  variant="outline"
                  onClick={() => setContentType(null)}
                  className="flex-1 rounded-lg"
                >
                  {t ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 rounded-lg"
                >
                  {isUploading ? (
                    <>{t ? "جاري النشر..." : "Publishing..."}</>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {t ? "نشر" : "Publish"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
