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
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { invalidateCacheByPattern } from "@/lib/cache-utils";
import { validateUsernameComplete } from "@/lib/username-validation";
import { supabase } from "@/lib/supabase";

// ─── Policy cooldowns ───────────────────────────────────────────────────────
const COOLDOWNS = {
  username: 14,   // days
  full_name: 14,  // days
  gender: 30,     // days
};

function getCooldown(lastChangedAt: string | null | undefined, cooldownDays: number) {
  if (!lastChangedAt) return { canChange: true, daysLeft: 0 };
  const next = new Date(new Date(lastChangedAt).getTime() + cooldownDays * 86400_000);
  const now = new Date();
  if (now >= next) return { canChange: true, daysLeft: 0 };
  return {
    canChange: false,
    daysLeft: Math.ceil((next.getTime() - now.getTime()) / 86400_000),
    nextDate: next,
  };
}

// ─── Static label maps ───────────────────────────────────────────────────────
interface Labels {
  title: string; username: string; name: string; namePlaceholder: string;
  bio: string; bioPlaceholder: string; website: string; websitePlaceholder: string;
  location: string; locationPlaceholder: string; gender: string; genderPlaceholder: string;
  cancel: string; save: string; saving: string;
  usernameAvailable: string; successMsg: string; errorMsg: string; usernameError: string;
  cooldownMsg: (days: number, field: string) => string;
}

const LABELS: Record<"en" | "ar", Labels> = {
  en: {
    title: "Edit Profile",
    username: "Username", name: "Name", namePlaceholder: "Full name",
    bio: "Bio", bioPlaceholder: "Write a bio...",
    website: "Website", websitePlaceholder: "https://example.com",
    location: "Location", locationPlaceholder: "City, Country",
    gender: "Gender", genderPlaceholder: "Select gender",
    cancel: "Cancel", save: "Save Changes", saving: "Saving...",
    usernameAvailable: "Username is available!",
    successMsg: "Profile updated successfully!",
    errorMsg: "Failed to update profile",
    usernameError: "Please fix username errors before saving",
    cooldownMsg: (days, field) => `You can change your ${field} again in ${days} day${days === 1 ? "" : "s"}.`,
  },
  ar: {
    title: "تعديل الملف الشخصي",
    username: "اسم المستخدم", name: "الاسم", namePlaceholder: "الاسم الكامل",
    bio: "السيرة الذاتية", bioPlaceholder: "اكتب نبذة عنك...",
    website: "الموقع الإلكتروني", websitePlaceholder: "https://example.com",
    location: "الموقع الجغرافي", locationPlaceholder: "المدينة، الدولة",
    gender: "الجنس", genderPlaceholder: "اختر الجنس",
    cancel: "إلغاء", save: "حفظ التغييرات", saving: "جاري الحفظ...",
    usernameAvailable: "اسم المستخدم متاح!",
    successMsg: "تم تحديث الملف الشخصي بنجاح!",
    errorMsg: "فشل تحديث الملف الشخصي",
    usernameError: "يرجى إصلاح أخطاء اسم المستخدم أولاً",
    cooldownMsg: (days, field) => `يمكنك تغيير ${field} مرة أخرى خلال ${days} يوم${days === 1 ? "" : "اً"}.`,
  },
};

const GENDER_OPTIONS = {
  en: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "prefer_not_to_say", label: "Prefer not to say" }],
  ar: [{ value: "male", label: "ذكر" }, { value: "female", label: "أنثى" }, { value: "prefer_not_to_say", label: "أفضل عدم الإفصاح" }],
};

const FIELD_NAMES = {
  en: { username: "username", full_name: "name", gender: "gender" },
  ar: { username: "اسم المستخدم", full_name: "الاسم", gender: "الجنس" },
};

// ─── Component ───────────────────────────────────────────────────────────────
interface EditProfileDialogProps {
  profile: Profile;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  onProfileUpdate?: () => void;
}

export function EditProfileDialog({ profile, trigger, children, onProfileUpdate }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const lang: "en" | "ar" = isRTL ? "ar" : "en";
  const t = LABELS[lang];
  const genderOptions = GENDER_OPTIONS[lang];
  const fieldNames = FIELD_NAMES[lang];

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
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCropping, setIsCropping] = useState(false);

  // Cooldown state
  const [cooldowns, setCooldowns] = useState<{
    username: ReturnType<typeof getCooldown>;
    full_name: ReturnType<typeof getCooldown>;
    gender: ReturnType<typeof getCooldown>;
  }>({
    username: { canChange: true, daysLeft: 0 },
    full_name: { canChange: true, daysLeft: 0 },
    gender: { canChange: true, daysLeft: 0 },
  });

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameIsValid, setUsernameIsValid] = useState(true);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Reset + fetch fresh policy data when dialog opens
  useEffect(() => {
    if (!open) return;

    setFormData(getDefaultForm());
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setIsCropping(false);
    setUsernameError(null);
    setUsernameIsValid(true);
    setSuggestions([]);
    setShowSuggestions(false);

    // Fetch gender + policy timestamps directly from Supabase (bypasses cache)
    supabase
      .from("profiles")
      .select("gender, username_changed_at, full_name_changed_at, gender_changed_at")
      .eq("id", profile.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.gender) {
          setFormData((prev) => ({ ...prev, gender: data.gender }));
        }
        setCooldowns({
          username: getCooldown(data.username_changed_at, COOLDOWNS.username),
          full_name: getCooldown(data.full_name_changed_at, COOLDOWNS.full_name),
          gender: getCooldown(data.gender_changed_at, COOLDOWNS.gender),
        });
      });
  }, [open]);

  // Real-time username validation
  useEffect(() => {
    if (!formData.username || formData.username === profile.username) {
      setUsernameError(null); setUsernameIsValid(true); return;
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

      // Only include fields that changed AND are allowed by cooldown
      if (data.username !== profile.username && cooldowns.username.canChange) {
        changedFields.username = data.username; hasChanges = true;
      }
      if (data.full_name !== (profile.full_name || "") && cooldowns.full_name.canChange) {
        changedFields.full_name = data.full_name; hasChanges = true;
      }
      if (data.gender !== (profile.gender || "") && cooldowns.gender.canChange) {
        changedFields.gender = data.gender; hasChanges = true;
      }
      // Fields without cooldown
      for (const field of ["bio", "website", "location"] as const) {
        if (data[field] !== (profile[field] || "")) {
          changedFields[field] = data[field]; hasChanges = true;
        }
      }
      if (selectedFile) {
        const avatarUrl = await api.uploadAvatar(selectedFile, (p) => setUploadProgress(p));
        changedFields.avatar_url = avatarUrl; hasChanges = true;
      }
      if (!hasChanges) return profile;
      return await api.updateProfile(changedFields as Partial<Profile>);
    },
    onSuccess: (updatedProfile) => {
      invalidateCacheByPattern("profile");
      if (user?.id) {
        const current = queryClient.getQueryData(["profile", user.id]) as Profile | undefined;
        queryClient.setQueryData(["profile", user.id], current ? { ...current, ...updatedProfile } : updatedProfile);
      }
      if (onProfileUpdate) onProfileUpdate();
      queryClient.refetchQueries({ queryKey: ["profile", user?.id], type: "active" });
      queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return Array.isArray(k) && ["profile", "feed", "posts", "post", "explore", "comments",
            "stories", "userStories", "followers", "following", "messages", "conversations",
            "notifications", "suggestions", "reels", "userReels", "mentions", "saved", "userPosts"].includes(k[0] as string);
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
    if (isCropping) {
      toast.error(lang === "ar" ? "اضغطي على \"قص وحفظ\" أولاً قبل حفظ التعديلات" : "Please confirm the crop before saving");
      return;
    }
    if (formData.username !== profile.username) {
      if (!cooldowns.username.canChange) {
        toast.error(t.cooldownMsg(cooldowns.username.daysLeft, fieldNames.username));
        return;
      }
      if (!usernameIsValid || !!usernameError) {
        toast.error(usernameError || t.usernameError);
        return;
      }
    }
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => setFormData((p) => ({ ...p, [field]: value }));

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error(lang === "ar" ? "يرجى اختيار ملف صورة" : "Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(lang === "ar" ? "حجم الصورة أكبر من 5 ميجابايت" : "Image size should be less than 5MB"); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUsernameChange = (value: string) => {
    handleChange("username", value);
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    suggestionTimeoutRef.current = setTimeout(async () => {
      if (!value || value === profile.username) { setSuggestions([]); setShowSuggestions(false); return; }
      try {
        const r = await fetch("/api/auth/suggest-username", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partial: value }) });
        if (!r.ok) return;
        const d = await r.json();
        setSuggestions(d.suggestions || []);
        setShowSuggestions(d.suggestions?.length > 0);
      } catch {}
    }, 300);
  };

  // ─── Cooldown notice ───────────────────────────────────────────────────────
  const CooldownBadge = ({ field, fieldLabel }: { field: keyof typeof cooldowns; fieldLabel: string }) => {
    const cd = cooldowns[field];
    if (cd.canChange) return null;
    return (
      <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
        <Clock className="w-3 h-3 flex-shrink-0" />
        {t.cooldownMsg(cd.daysLeft, fieldLabel)}
      </p>
    );
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
            onRemove={() => { setSelectedFile(null); setPreviewUrl(""); }}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isUploading={updateProfileMutation.isPending}
            uploadProgress={uploadProgress}
            isRTL={isRTL}
            lang={lang}
            onCroppingChange={setIsCropping}
          />

          <div className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t.username}</label>
              <div className="relative">
                <Input
                  value={formData.username}
                  onChange={(e) => !cooldowns.username.canChange ? undefined : handleUsernameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t.username}
                  disabled={!cooldowns.username.canChange || updateProfileMutation.isPending}
                  className={`bg-background ${isRTL ? "pr-3 pl-10" : "pl-3 pr-10"} ${
                    formData.username !== profile.username
                      ? usernameIsValid && !usernameError ? "border-green-500" : "border-destructive"
                      : ""
                  } disabled:opacity-60`}
                />
                {formData.username !== profile.username && cooldowns.username.canChange && (
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}>
                    {usernameChecking ? <Spinner className="w-4 h-4 text-muted-foreground" />
                      : usernameIsValid && !usernameError ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <AlertCircle className="w-4 h-4 text-destructive" />}
                  </div>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50">
                    <div className="max-h-40 overflow-y-auto">
                      {suggestions.map((s) => (
                        <button key={s} type="button"
                          onClick={() => { handleChange("username", s); setShowSuggestions(false); setSuggestions([]); }}
                          className={`w-full ${isRTL ? "text-right" : "text-left"} px-3 py-2 hover:bg-accent text-sm`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {formData.username !== profile.username && cooldowns.username.canChange && usernameError && (
                <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{usernameError}</p>
              )}
              {formData.username !== profile.username && cooldowns.username.canChange && usernameIsValid && !usernameError && !usernameChecking && (
                <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{t.usernameAvailable}</p>
              )}
              <CooldownBadge field="username" fieldLabel={fieldNames.username} />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t.name}</label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder={t.namePlaceholder}
                disabled={!cooldowns.full_name.canChange || updateProfileMutation.isPending}
                className="bg-background disabled:opacity-60"
              />
              <CooldownBadge field="full_name" fieldLabel={fieldNames.full_name} />
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
              <Select
                value={formData.gender || ""}
                onValueChange={(v) => handleChange("gender", v)}
                disabled={!cooldowns.gender.canChange || updateProfileMutation.isPending}
              >
                <SelectTrigger className="bg-background w-full disabled:opacity-60">
                  <SelectValue placeholder={t.genderPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <CooldownBadge field="gender" fieldLabel={fieldNames.gender} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}
              className="flex-1" disabled={updateProfileMutation.isPending}>
              {t.cancel}
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90"
              disabled={updateProfileMutation.isPending || usernameChecking ||
                (formData.username !== profile.username && cooldowns.username.canChange && (!usernameIsValid || !!usernameError))}>
              {updateProfileMutation.isPending
                ? <span className="flex items-center gap-2"><Spinner className="w-4 h-4" />{t.saving}</span>
                : t.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
