import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Profile } from "@/lib/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AvatarUploader } from "@/components/avatar-uploader";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { invalidateCacheByPattern } from "@/lib/cache-utils";
import { validateUsernameComplete } from "@/lib/username-validation";
import { supabase } from "@/lib/supabase";

interface EditProfileDialogProps {
  profile: Profile;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  onProfileUpdate?: () => void;
}

const GENDER_OPTIONS = {
  en: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ],
  ar: [
    { value: "male", label: "ذكر" },
    { value: "female", label: "أنثى" },
    { value: "prefer_not_to_say", label: "أفضل عدم الإفصاح" },
  ],
};

export function EditProfileDialog({ profile, trigger, children, onProfileUpdate }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const lang = isRTL ? "ar" : "en";

  const labels = {
    en: {
      title: "Edit Profile",
      username: "Username",
      name: "Name",
      namePlaceholder: "Full name",
      bio: "Bio",
      bioPlaceholder: "Write a bio...",
      website: "Website",
      websitePlaceholder: "https://example.com",
      location: "Location",
      locationPlaceholder: "City, Country",
      gender: "Gender",
      genderPlaceholder: "Select gender",
      cancel: "Cancel",
      save: "Save Changes",
      saving: "Saving...",
      usernameAvailable: "Username is available!",
      successMsg: "Profile updated successfully!",
      errorMsg: "Failed to update profile",
      usernameError: "Please fix username errors before saving",
    },
    ar: {
      title: "تعديل الملف الشخصي",
      username: "اسم المستخدم",
      name: "الاسم",
      namePlaceholder: "الاسم الكامل",
      bio: "السيرة الذاتية",
      bioPlaceholder: "اكتب نبذة عنك...",
      website: "الموقع الإلكتروني",
      websitePlaceholder: "https://example.com",
      location: "الموقع الجغرافي",
      locationPlaceholder: "المدينة، الدولة",
      gender: "الجنس",
      genderPlaceholder: "اختر الجنس",
      cancel: "إلغاء",
      save: "حفظ التغييرات",
      saving: "جاري الحفظ...",
      usernameAvailable: "اسم المستخدم متاح!",
      successMsg: "تم تحديث الملف الشخصي بنجاح!",
      errorMsg: "فشل تحديث الملف الشخصي",
      usernameError: "يرجى إصلاح أخطاء اسم المستخدم أولاً",
    },
  };

  const t = labels[lang];
  const genderOptions = GENDER_OPTIONS[lang];

  const getDefaultForm = () => ({
    username: profile.username || "",
    full_name: profile.full_name || "",
    bio: profile.bio || "",
    website: profile.website || "",
    location: profile.location || "",
    gender: profile.gender || "",
    avatar_url: profile.avatar_url || "",
  });

  const [formData, setFormData] = useState(getDefaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameIsValid, setUsernameIsValid] = useState(true);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setFormData(getDefaultForm());
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
      setUsernameError(null);
      setUsernameIsValid(true);
      setSuggestions([]);
      setShowSuggestions(false);

      // Fetch fresh gender directly from Supabase (bypasses cache)
      supabase
        .from("profiles")
        .select("gender")
        .eq("id", profile.id)
        .single()
        .then(({ data }) => {
          if (data?.gender) {
            setFormData((prev) => ({ ...prev, gender: data.gender }));
          }
        });
    }
  }, [open]);

  useEffect(() => {
    if (!formData.username || formData.username === profile.username) {
      setUsernameError(null);
      setUsernameIsValid(true);
      return;
    }
    setUsernameChecking(true);
    if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      const result = await validateUsernameComplete(formData.username, profile.id);
      setUsernameError(result.error);
      setUsernameIsValid(result.isValid);
      setUsernameChecking(false);
    }, 500);
    return () => { if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current); };
  }, [formData.username, profile.username, profile.id]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const changedFields: Record<string, any> = {};
      let hasChanges = false;

      const textFields = ["username", "full_name", "bio", "website", "location", "gender"] as const;
      for (const field of textFields) {
        if (data[field] !== ((profile as any)[field] || "")) {
          changedFields[field] = data[field];
          hasChanges = true;
        }
      }

      if (selectedFile) {
        const avatarUrl = await api.uploadAvatar(selectedFile, (p) => setUploadProgress(p));
        changedFields.avatar_url = avatarUrl;
        hasChanges = true;
      }

      if (!hasChanges) return profile;
      return await api.updateProfile(changedFields as Partial<Profile>);
    },
    onSuccess: (updatedProfile) => {
      invalidateCacheByPattern("profile");
      if (user?.id) {
        const currentData = queryClient.getQueryData(["profile", user.id]) as Profile | undefined;
        const mergedData = currentData ? { ...currentData, ...updatedProfile } : updatedProfile;
        queryClient.setQueryData(["profile", user.id], mergedData);
      }
      if (onProfileUpdate) onProfileUpdate();
      queryClient.refetchQueries({ queryKey: ["profile", user?.id], type: "active" });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          return ["profile", "feed", "posts", "post", "explore", "comments", "stories",
            "userStories", "followers", "following", "messages", "conversations",
            "notifications", "suggestions", "reels", "userReels", "mentions",
            "saved", "userPosts"].includes(key[0] as string);
        },
      });
      toast.success(t.successMsg);
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t.errorMsg);
      setUploadProgress(0);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username !== profile.username && (!usernameIsValid || !!usernameError)) {
      toast.error(usernameError || t.usernameError);
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error(lang === "ar" ? "يرجى اختيار ملف صورة" : "Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(lang === "ar" ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image size should be less than 5MB"); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => { setSelectedFile(null); setPreviewUrl(""); };

  const fetchSuggestions = async (partial: string) => {
    if (!partial || partial.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const response = await fetch("/api/auth/suggest-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partial }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions && data.suggestions.length > 0);
    } catch {}
  };

  const handleUsernameChange = (value: string) => {
    handleChange("username", value);
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    suggestionTimeoutRef.current = setTimeout(() => {
      if (value && value !== profile.username) fetchSuggestions(value);
      else { setSuggestions([]); setShowSuggestions(false); }
    }, 300);
  };

  const selectSuggestion = (suggestion: string) => {
    handleChange("username", suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <AvatarUploader
            currentAvatar={formData.avatar_url}
            username={profile.username}
            onFileSelect={handleFileSelect}
            onRemove={handleRemovePhoto}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isUploading={updateProfileMutation.isPending}
            uploadProgress={uploadProgress}
            isRTL={isRTL}
            lang={lang}
          />

          <div className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t.username}</label>
              <div className="relative">
                <Input
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t.username}
                  className={`bg-background ${isRTL ? "pr-3 pl-10" : "pl-3 pr-10"} ${
                    formData.username !== profile.username
                      ? usernameIsValid && !usernameError ? "border-green-500" : "border-destructive"
                      : ""
                  }`}
                />
                {formData.username !== profile.username && (
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}>
                    {usernameChecking ? (
                      <Spinner className="w-4 h-4 text-muted-foreground" />
                    ) : usernameIsValid && !usernameError ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50">
                    <div className="max-h-40 overflow-y-auto">
                      {suggestions.map((s) => (
                        <button key={s} type="button" onClick={() => selectSuggestion(s)}
                          className={`w-full ${isRTL ? "text-right" : "text-left"} px-3 py-2 hover:bg-accent transition-colors text-sm`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {formData.username !== profile.username && usernameError && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />{usernameError}
                </p>
              )}
              {formData.username !== profile.username && usernameIsValid && !usernameError && !usernameChecking && (
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" />{t.usernameAvailable}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t.name}</label>
              <Input value={formData.full_name} onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder={t.namePlaceholder} className="bg-background" />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-semibold">{t.bio}</label>
                <span className="text-xs text-muted-foreground">{formData.bio.length} / 150</span>
              </div>
              <Textarea value={formData.bio} onChange={(e) => handleChange("bio", e.target.value)}
                placeholder={t.bioPlaceholder} className="bg-background resize-none" maxLength={150} rows={3} />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t.website}</label>
              <Input value={formData.website} onChange={(e) => handleChange("website", e.target.value)}
                placeholder={t.websitePlaceholder} className="bg-background" />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t.location}</label>
              <Input value={formData.location} onChange={(e) => handleChange("location", e.target.value)}
                placeholder={t.locationPlaceholder} className="bg-background" />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t.gender}</label>
              <Select value={formData.gender || ""} onValueChange={(val) => handleChange("gender", val)}
                disabled={updateProfileMutation.isPending}>
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder={t.genderPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}
              className="flex-1" disabled={updateProfileMutation.isPending}>
              {t.cancel}
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90"
              disabled={
                updateProfileMutation.isPending ||
                (formData.username !== profile.username && (!usernameIsValid || !!usernameError)) ||
                usernameChecking
              }>
              {updateProfileMutation.isPending ? (
                <span className="flex items-center gap-2"><Spinner className="w-4 h-4" />{t.saving}</span>
              ) : t.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
