import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { api, accountApi, type UserDevice } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useUserDevices, useRemoveDevice, useTrustDevice, useRevokeAllDevices } from "@/hooks/use-data";
import { useSettings } from "@/lib/settings-context";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  User as UserIcon,
  Lock,
  Shield,
  Database,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Download,
  LogOut,
  Trash2,
  PauseCircle,
  Smartphone,
  ChevronRight,
  Monitor,
  Laptop,
  Globe,
  Clock,
  Activity,
  X,
} from "lucide-react";
import { Link } from "wouter";

type SectionId = "personal" | "security" | "data" | "ownership" | null;

export default function AccountsCenter() {
  const { user, signOut } = useAuth();
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<SectionId>(null);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["my-profile-center", user?.id],
    queryFn: async () => (user?.id ? await api.getProfileById(user.id) : null),
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Refetch profile whenever user opens any section (so new external edits show up)
  useEffect(() => {
    if (activeSection) {
      refetchProfile();
    }
  }, [activeSection, refetchProfile]);

  const sections = [
    {
      id: "personal" as const,
      icon: UserIcon,
      title: isRTL ? "التفاصيل الشخصية" : "Personal Details",
      description: isRTL ? "الاسم، البريد، الهاتف، تاريخ الميلاد" : "Name, email, phone, date of birth",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "security" as const,
      icon: Shield,
      title: isRTL ? "كلمة المرور والأمان" : "Password & Security",
      description: isRTL ? "كلمة المرور، الأجهزة المتصلة، تاريخ الدخول" : "Password, connected devices, login history",
      color: "from-violet-500 to-purple-500",
    },
    {
      id: "data" as const,
      icon: Database,
      title: isRTL ? "معلوماتك وأذوناتك" : "Your Information & Permissions",
      description: isRTL ? "تنزيل بياناتك، سجل النشاط" : "Download your data, activity log",
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "ownership" as const,
      icon: AlertTriangle,
      title: isRTL ? "ملكية الحساب والتحكم" : "Account Ownership & Control",
      description: isRTL ? "تعطيل مؤقت أو حذف نهائي للحساب" : "Deactivate temporarily or delete permanently",
      color: "from-orange-500 to-red-500",
    },
  ];

  const renderHero = () => (
    <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16 ring-2 ring-primary/40 ring-offset-2 ring-offset-background">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
            {profile?.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{profile?.full_name || profile?.username}</h2>
          <p className="text-sm text-muted-foreground truncate">@{profile?.username}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "w-full md:w-[340px] lg:w-[400px] flex flex-col border-e border-border bg-card/30 h-full overflow-y-auto",
            activeSection ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-6 pb-3">
            <button
              onClick={() => setLocation("/settings")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              {isRTL ? "عودة للإعدادات" : "Back to Settings"}
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Novii</span>
            </div>
            <h1 className="text-2xl font-bold">{isRTL ? "مركز الحسابات" : "Accounts Center"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? "إدارة حسابك وإعداداتك في مكان واحد" : "Manage your account and settings in one place"}
            </p>
          </div>

          <div className="px-4 pb-6">
            {profileLoading ? (
              <div className="flex justify-center py-8"><Spinner className="w-6 h-6" /></div>
            ) : (
              renderHero()
            )}

            <div className="space-y-2">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl text-start transition-all border",
                      isActive
                        ? "bg-secondary border-primary/30"
                        : "border-transparent hover:bg-accent hover:border-border"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", s.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{s.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground/50 shrink-0", isRTL && "rotate-180")} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full overflow-y-auto",
            activeSection ? "flex" : "hidden md:flex"
          )}
        >
          {activeSection && (
            <div className="md:hidden px-4 pt-4">
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                {isRTL ? "عودة" : "Back"}
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6 md:p-10 pb-20 max-w-3xl w-full mx-auto">
            {!activeSection && (
              <div className="hidden md:flex flex-col items-center justify-center h-full text-center pt-20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 border border-primary/30">
                  <Monitor className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  {isRTL ? "اختر قسم لإدارته" : "Choose a section to manage"}
                </h2>
                <p className="text-muted-foreground max-w-md">
                  {isRTL
                    ? "هنا تقدر تتحكم في كل بيانات حسابك وأمانه من مكان واحد"
                    : "Here you can manage all your account info and security from one place"}
                </p>
              </div>
            )}

            {activeSection === "personal" && <PersonalDetailsSection profile={profile} user={user} isRTL={isRTL} />}
            {activeSection === "security" && <SecuritySection user={user} isRTL={isRTL} />}
            {activeSection === "data" && <DataSection isRTL={isRTL} />}
            {activeSection === "ownership" && <OwnershipSection user={user} isRTL={isRTL} signOut={signOut} />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ============ PERSONAL DETAILS ============
function PersonalDetailsSection({ profile, user, isRTL }: { profile: any; user: any; isRTL: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    website: "",
    location: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        website: profile.website || "",
        location: profile.location || "",
        phone_number: profile.phone_number || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        full_name: formData.full_name.trim() || null,
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        website: formData.website.trim() || null,
        location: formData.location.trim() || null,
        phone_number: formData.phone_number.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
      };
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["my-profile-center"] });
      toast({ title: isRTL ? "✅ تم الحفظ" : "✅ Saved", description: isRTL ? "تم تحديث بياناتك بنجاح" : "Your info was updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
    }
    setSaving(false);
  };

  if (!profile) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-2">{isRTL ? "التفاصيل الشخصية" : "Personal Details"}</h2>
      <p className="text-sm text-muted-foreground mb-8">
        {isRTL ? "قم بإدارة معلومات حسابك الشخصية" : "Manage your personal account information"}
      </p>

      <div className="space-y-6">
        <Field label={isRTL ? "اسم المستخدم" : "Username"} icon={UserIcon}>
          <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} dir="ltr" />
        </Field>

        <Field label={isRTL ? "الاسم الكامل" : "Full Name"} icon={UserIcon}>
          <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
        </Field>

        <Field label={isRTL ? "البريد الإلكتروني" : "Email"} icon={Mail} hint={isRTL ? "لتغيير البريد، انتقل لقسم الأمان" : "To change email, go to Security section"}>
          <Input value={user?.email || ""} disabled dir="ltr" className="opacity-70" />
        </Field>

        <Field label={isRTL ? "رقم الهاتف" : "Phone Number"} icon={Phone}>
          <Input
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            placeholder="+966 5X XXX XXXX"
            dir="ltr"
          />
        </Field>

        <Field label={isRTL ? "تاريخ الميلاد" : "Date of Birth"} icon={Calendar}>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            max={new Date().toISOString().split("T")[0]}
          />
        </Field>

        <Field label={isRTL ? "الجنس" : "Gender"} icon={UserIcon}>
          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
            <SelectTrigger><SelectValue placeholder={isRTL ? "اختر الجنس" : "Select gender"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{isRTL ? "ذكر" : "Male"}</SelectItem>
              <SelectItem value="female">{isRTL ? "أنثى" : "Female"}</SelectItem>
              <SelectItem value="other">{isRTL ? "آخر" : "Other"}</SelectItem>
              <SelectItem value="prefer_not_to_say">{isRTL ? "أفضل عدم القول" : "Prefer not to say"}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label={isRTL ? "الموقع الإلكتروني" : "Website"}>
          <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://" dir="ltr" />
        </Field>

        <Field label={isRTL ? "الموقع الجغرافي" : "Location"}>
          <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder={isRTL ? "المدينة، الدولة" : "City, Country"} />
        </Field>

        <Field label={isRTL ? "نبذة" : "Bio"} hint={`${formData.bio.length} / 150`}>
          <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 150) })} rows={3} maxLength={150} />
        </Field>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-bold rounded-xl">
          {saving ? <><Spinner className="w-5 h-5 mr-2" />{isRTL ? "جاري الحفظ..." : "Saving..."}</> : (isRTL ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>
    </div>
  );
}

// ============ SECURITY ============
function SecuritySection({ user, isRTL }: { user: any; isRTL: boolean }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"password" | "email" | "devices">("password");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwData, setPwData] = useState({ current: "", new: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const [emailData, setEmailData] = useState({ newEmail: "", password: "" });
  const [emailSaving, setEmailSaving] = useState(false);

  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-muted" };
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    if (s <= 2) return { score: s, label: isRTL ? "ضعيفة" : "Weak", color: "bg-red-500" };
    if (s <= 3) return { score: s, label: isRTL ? "متوسطة" : "Medium", color: "bg-yellow-500" };
    if (s <= 4) return { score: s, label: isRTL ? "جيدة" : "Good", color: "bg-blue-500" };
    return { score: s, label: isRTL ? "قوية جداً" : "Very Strong", color: "bg-green-500" };
  };
  const strength = getStrength(pwData.new);

  const handleChangePassword = async () => {
    if (!pwData.current || !pwData.new) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: isRTL ? "املأ كل الحقول" : "Fill all fields" });
      return;
    }
    if (pwData.new.length < 8) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: isRTL ? "كلمة المرور 8 أحرف على الأقل" : "Password must be at least 8 chars" });
      return;
    }
    if (pwData.new !== pwData.confirm) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords don't match" });
      return;
    }
    setPwSaving(true);
    try {
      await accountApi.changePassword(pwData.current, pwData.new);
      toast({ title: isRTL ? "✅ تم التغيير" : "✅ Changed", description: isRTL ? "تم تغيير كلمة المرور وإلغاء جلسات الأجهزة الأخرى" : "Password changed and other device sessions revoked" });
      setPwData({ current: "", new: "", confirm: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
    }
    setPwSaving(false);
  };

  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.password) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: isRTL ? "املأ كل الحقول" : "Fill all fields" });
      return;
    }
    setEmailSaving(true);
    try {
      await accountApi.changeEmail(emailData.newEmail, emailData.password);
      toast({ title: isRTL ? "✅ تم الإرسال" : "✅ Sent", description: isRTL ? "تحقق من بريدك الجديد لتأكيد التغيير" : "Check your new inbox to confirm" });
      setEmailData({ newEmail: "", password: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
    }
    setEmailSaving(false);
  };

  const tabs = [
    { id: "password" as const, label: isRTL ? "كلمة المرور" : "Password", icon: Lock },
    { id: "email" as const, label: isRTL ? "البريد الإلكتروني" : "Email", icon: Mail },
    { id: "devices" as const, label: isRTL ? "الأجهزة" : "Devices", icon: Smartphone },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-2">{isRTL ? "كلمة المرور والأمان" : "Password & Security"}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {isRTL ? "حماية حسابك وإدارة الجلسات" : "Protect your account and manage sessions"}
      </p>

      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "password" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold">{isRTL ? "كلمة المرور الحالية" : "Current Password"}</label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={pwData.current} onChange={(e) => setPwData({ ...pwData, current: e.target.value })} dir="ltr" className="pr-10" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">{isRTL ? "كلمة المرور الجديدة" : "New Password"}</label>
            <div className="relative">
              <Input type={showNew ? "text" : "password"} value={pwData.new} onChange={(e) => setPwData({ ...pwData, new: e.target.value })} dir="ltr" className="pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwData.new && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= strength.score ? strength.color : "bg-muted")} />
                  ))}
                </div>
                <p className={cn("text-xs font-medium", strength.score <= 2 ? "text-red-500" : strength.score <= 3 ? "text-yellow-500" : strength.score <= 4 ? "text-blue-500" : "text-green-500")}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">{isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
            <Input type="password" value={pwData.confirm} onChange={(e) => setPwData({ ...pwData, confirm: e.target.value })} dir="ltr" />
            {pwData.confirm && pwData.new !== pwData.confirm && (
              <p className="text-xs text-red-500">{isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords don't match"}</p>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-600 dark:text-blue-400">
            {isRTL
              ? "💡 لأمانك، سيتم تسجيل الخروج من جميع الأجهزة الأخرى بعد تغيير كلمة المرور"
              : "💡 For your security, all other devices will be signed out after changing password"}
          </div>

          <Button onClick={handleChangePassword} disabled={pwSaving} className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-bold rounded-xl">
            {pwSaving ? <><Spinner className="w-5 h-5 mr-2" />{isRTL ? "جاري التغيير..." : "Changing..."}</> : (isRTL ? "تغيير كلمة المرور" : "Change Password")}
          </Button>
        </div>
      )}

      {tab === "email" && (
        <div className="space-y-5">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{isRTL ? "البريد الحالي" : "Current Email"}</p>
            <p className="font-bold" dir="ltr">{user?.email}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">{isRTL ? "البريد الإلكتروني الجديد" : "New Email"}</label>
            <Input type="email" value={emailData.newEmail} onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })} placeholder="new@example.com" dir="ltr" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">{isRTL ? "كلمة المرور الحالية" : "Current Password"}</label>
            <Input type="password" value={emailData.password} onChange={(e) => setEmailData({ ...emailData, password: e.target.value })} dir="ltr" />
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-700 dark:text-yellow-400">
            {isRTL
              ? "⚠️ سيتم إرسال رابط تأكيد إلى البريد الجديد. لن يتم التغيير حتى تؤكد"
              : "⚠️ A confirmation link will be sent to your new email. Change won't take effect until confirmed"}
          </div>

          <Button onClick={handleChangeEmail} disabled={emailSaving} className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-bold rounded-xl">
            {emailSaving ? <><Spinner className="w-5 h-5 mr-2" />{isRTL ? "جاري الإرسال..." : "Sending..."}</> : (isRTL ? "تغيير البريد" : "Change Email")}
          </Button>
        </div>
      )}

      {tab === "devices" && <DevicesPanel user={user} isRTL={isRTL} />}
    </div>
  );
}

// ============ DEVICES PANEL ============
function DevicesPanel({ user, isRTL }: { user: any; isRTL: boolean }) {
  const { toast } = useToast();
  const { data: devices, isLoading } = useUserDevices(user?.id);
  const removeDevice = useRemoveDevice();
  const trustDevice = useTrustDevice();
  const revokeAll = useRevokeAllDevices();

  const currentSessionToken = (() => {
    try { return sessionStorage.getItem('novii_device_session'); } catch { return null; }
  })();
  const isCurrentDevice = (d: UserDevice) =>
    !!currentSessionToken && d.session_token === currentSessionToken;

  const handleRemove = async (id: string) => {
    try {
      await removeDevice.mutateAsync(id);
      toast({ title: isRTL ? "✅ تم الإزالة" : "✅ Removed", description: isRTL ? "تم إزالة الجهاز" : "Device removed" });
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e?.message });
    }
  };

  const handleTrust = async (d: UserDevice) => {
    try {
      await trustDevice.mutateAsync({ deviceId: d.id, trusted: !d.is_trusted });
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e?.message });
    }
  };

  const handleRevokeAll = async () => {
    if (!user?.id) return;
    const current = devices?.find(d => isCurrentDevice(d));
    try {
      await revokeAll.mutateAsync({ userId: user.id, exceptDeviceId: current?.id });
      toast({ title: isRTL ? "✅ تم تسجيل الخروج" : "✅ Signed out", description: isRTL ? "من جميع الأجهزة الأخرى" : "From all other devices" });
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e?.message });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;
  }

  const current = devices?.find(d => isCurrentDevice(d));
  const others = devices?.filter(d => !isCurrentDevice(d)) || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isRTL ? `الأجهزة النشطة (${devices?.length || 0}/10)` : `Active devices (${devices?.length || 0}/10)`}
        </p>
        {others.length > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={revokeAll.isPending}
            className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            {isRTL ? "تسجيل خروج الكل" : "Log out all"}
          </button>
        )}
      </div>

      {current && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {isRTL ? "هذا الجهاز" : "This Device"}
          </p>
          <DeviceRow device={current} isCurrent isRTL={isRTL} onRemove={handleRemove} onTrust={handleTrust} busy={removeDevice.isPending || trustDevice.isPending} />
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {isRTL ? "أجهزة أخرى" : "Other Devices"}
          </p>
          <div className="space-y-3">
            {others.map(d => (
              <DeviceRow key={d.id} device={d} isCurrent={false} isRTL={isRTL} onRemove={handleRemove} onTrust={handleTrust} busy={removeDevice.isPending || trustDevice.isPending} />
            ))}
          </div>
        </div>
      )}

      {(!devices || devices.length === 0) && (
        <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
          <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{isRTL ? "لا توجد أجهزة متصلة" : "No devices connected"}</p>
        </div>
      )}
    </div>
  );
}

function DeviceRow({ device, isCurrent, isRTL, onRemove, onTrust, busy }: {
  device: UserDevice; isCurrent: boolean; isRTL: boolean;
  onRemove: (id: string) => void; onTrust: (d: UserDevice) => void; busy: boolean;
}) {
  const Icon = device.device_type === 'mobile' || device.device_type === 'tablet' ? Smartphone : Monitor;
  const last = (() => {
    const diff = Math.floor((Date.now() - new Date(device.last_active_at).getTime()) / 60000);
    if (isRTL) {
      if (diff < 1) return "الآن";
      if (diff < 60) return `منذ ${diff} د`;
      if (diff < 1440) return `منذ ${Math.floor(diff / 60)} س`;
      return `منذ ${Math.floor(diff / 1440)} يوم`;
    }
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  })();

  return (
    <div className={cn(
      "border rounded-xl p-4 bg-card transition-colors",
      isCurrent ? "border-primary/40 bg-primary/5" : "border-border",
      device.is_trusted && !isCurrent && "border-green-500/30"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2.5 rounded-lg shrink-0", isCurrent ? "bg-primary/15" : "bg-muted")}>
          <Icon className={cn("w-5 h-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-bold text-sm truncate">{device.device_name}</h4>
            {isCurrent && (
              <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {isRTL ? "هذا الجهاز" : "THIS DEVICE"}
              </span>
            )}
            {device.is_trusted && (
              <span className="text-[9px] font-bold bg-green-500/15 text-green-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                {isRTL ? "موثوق" : "TRUSTED"}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 truncate"><Globe className="w-3 h-3 shrink-0" />{device.browser}</span>
            <span className="flex items-center gap-1 truncate"><Laptop className="w-3 h-3 shrink-0" />{device.os_name}</span>
            <span className="flex items-center gap-1 truncate"><Activity className="w-3 h-3 shrink-0" />{device.city || '—'}, {device.country || '—'}</span>
            <span className="flex items-center gap-1 truncate"><Clock className="w-3 h-3 shrink-0" />{last}</span>
          </div>
          {device.login_count > 1 && (
            <span className="inline-block mt-2 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {isRTL ? `${device.login_count} تسجيل دخول` : `${device.login_count} logins`}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => onTrust(device)}
            disabled={busy}
            title={isRTL ? (device.is_trusted ? "إلغاء الثقة" : "موثوق") : (device.is_trusted ? "Untrust" : "Trust")}
            className={cn(
              "p-1.5 rounded-md transition-colors disabled:opacity-50",
              device.is_trusted ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
          {!isCurrent && (
            <button
              onClick={() => onRemove(device.id)}
              disabled={busy}
              title={isRTL ? "إزالة" : "Remove"}
              className="bg-red-500/10 text-red-600 hover:bg-red-500/20 p-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ DATA & PERMISSIONS ============
function DataSection({ isRTL }: { isRTL: boolean }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const { settings, updateSettings } = useSettings();

  const { data: privacyProfile } = useQuery({
    queryKey: ["my-profile-privacy", user?.id],
    queryFn: async () => (user?.id ? await api.getProfileById(user.id) : null),
    enabled: !!user?.id,
  });

  const [isPrivate, setIsPrivate] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    if (privacyProfile) setIsPrivate(!!privacyProfile.is_private);
  }, [privacyProfile]);

  const togglePrivate = async (checked: boolean) => {
    setIsPrivate(checked);
    setSavingPrivacy(true);
    try {
      const { error } = await supabase.from("profiles").update({ is_private: checked }).eq("id", user!.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["my-profile-privacy"] });
      await queryClient.invalidateQueries({ queryKey: ["my-profile-center"] });
      toast({ title: isRTL ? "✅ تم الحفظ" : "✅ Saved" });
    } catch (e: any) {
      setIsPrivate(!checked);
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
    }
    setSavingPrivacy(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await accountApi.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `novii-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: isRTL ? "✅ تم التنزيل" : "✅ Downloaded", description: isRTL ? "تم تنزيل بياناتك بنجاح" : "Your data has been downloaded" });
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
    }
    setDownloading(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-2">{isRTL ? "معلوماتك وأذوناتك" : "Your Information & Permissions"}</h2>
      <p className="text-sm text-muted-foreground mb-8">
        {isRTL ? "تحكم في بياناتك ومن يصل إليها" : "Control your data and who can access it"}
      </p>

      <div className="space-y-4">
        <div className="border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{isRTL ? "تنزيل بياناتك" : "Download Your Data"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL
                  ? "احصل على نسخة من جميع بياناتك في Novii بصيغة JSON (الملف الشخصي، المنشورات، التعليقات، الإعجابات، المتابعون)"
                  : "Get a copy of all your Novii data as JSON (profile, posts, comments, likes, followers)"}
              </p>
              <Button onClick={handleDownload} disabled={downloading} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {downloading ? <><Spinner className="w-4 h-4 mr-2" />{isRTL ? "جاري التحضير..." : "Preparing..."}</> : (
                  <><Download className="w-4 h-4 mr-2" />{isRTL ? "تنزيل البيانات" : "Download Data"}</>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-card">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-violet-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{isRTL ? "خصوصية الحساب" : "Account Privacy"}</h3>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "إدارة من يقدر يشوف محتواك ومن يقدر يتفاعل معاك" : "Manage who can see your content and interact with you"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background/50">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-0.5">{isRTL ? "حساب خاص" : "Private Account"}</h4>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? "فقط المتابعون المقبولون يقدروا يشوفوا منشوراتك" : "Only approved followers can see your posts"}
                </p>
              </div>
              <ToggleSwitch checked={isPrivate} onCheckedChange={togglePrivate} disabled={savingPrivacy} />
            </div>

            {settings && updateSettings && (
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background/50">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-0.5">{isRTL ? "إخفاء حالة الاتصال" : "Hide Online Status"}</h4>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "أخفِ متى آخر مرة كنت متصل" : "Hide when you were last online"}
                  </p>
                </div>
                <ToggleSwitch
                  checked={!!settings.hide_online_status}
                  onCheckedChange={(v) => updateSettings({ hide_online_status: v })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ACCOUNT OWNERSHIP ============
function OwnershipSection({ user, isRTL, signOut }: { user: any; isRTL: boolean; signOut: () => Promise<void> }) {
  const { toast } = useToast();
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: async () => await accountApi.getStatus(),
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await accountApi.deactivate();
      toast({ title: isRTL ? "✅ تم تعطيل الحساب" : "✅ Account Deactivated" });
      setTimeout(() => signOut(), 1500);
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
      setDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: isRTL ? 'اكتب DELETE للتأكيد' : 'Type DELETE to confirm' });
      return;
    }
    if (!deletePw) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: isRTL ? "أدخل كلمة المرور" : "Enter password" });
      return;
    }
    setDeleting(true);
    try {
      const result = await accountApi.deleteAccount(deletePw, deleteConfirm);
      toast({
        title: isRTL ? "🕒 تم جدولة الحذف" : "🕒 Deletion Scheduled",
        description: isRTL
          ? `سيتم حذف الحساب نهائياً بعد ${result.days_remaining} يوم. يمكنك التراجع بتسجيل الدخول مرة أخرى خلال هذه الفترة.`
          : `Your account will be permanently deleted in ${result.days_remaining} days. You can cancel by signing in again before then.`,
      });
      setTimeout(() => signOut(), 2500);
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      await accountApi.cancelDeletion();
      toast({ title: isRTL ? "✅ تم إلغاء الحذف" : "✅ Deletion Cancelled", description: isRTL ? "حسابك آمن الآن" : "Your account is safe now" });
      await refetchStatus();
    } catch (e: any) {
      toast({ variant: "destructive", title: isRTL ? "❌ خطأ" : "❌ Error", description: e.message });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-2">{isRTL ? "ملكية الحساب والتحكم" : "Account Ownership & Control"}</h2>
      <p className="text-sm text-muted-foreground mb-8">
        {isRTL ? "خيارات لإدارة دورة حياة حسابك" : "Options to manage your account lifecycle"}
      </p>

      <div className="space-y-4">
        {/* Pending Deletion Banner */}
        {status?.pending_deletion && (
          <div className="border-2 border-red-500/50 rounded-2xl p-6 bg-red-500/10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1 text-red-700 dark:text-red-400">
                  {isRTL ? "حسابك مجدول للحذف" : "Your account is scheduled for deletion"}
                </h3>
                <p className="text-sm text-foreground/80 mb-1">
                  {isRTL
                    ? `سيتم الحذف النهائي خلال ${status.days_remaining} ${status.days_remaining === 1 ? 'يوم' : 'يوم'}`
                    : `Permanent deletion in ${status.days_remaining} day${status.days_remaining === 1 ? '' : 's'}`}
                </p>
                {status.scheduled_deletion_at && (
                  <p className="text-xs text-muted-foreground mb-4">
                    {isRTL ? "تاريخ الحذف:" : "Deletion date:"}{" "}
                    {new Date(status.scheduled_deletion_at).toLocaleDateString(isRTL ? 'ar' : 'en', { dateStyle: 'long' })}
                  </p>
                )}
                <Button
                  onClick={handleCancelDeletion}
                  disabled={cancelling}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {cancelling
                    ? <><Spinner className="w-4 h-4 mr-2" />{isRTL ? "جاري الإلغاء..." : "Cancelling..."}</>
                    : (isRTL ? "إلغاء الحذف واستعادة الحساب" : "Cancel deletion & restore account")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivate */}
        <div className="border border-yellow-500/30 rounded-2xl p-6 bg-yellow-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
              <PauseCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{isRTL ? "تعطيل الحساب مؤقتاً" : "Deactivate Account"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL
                  ? "ملفك الشخصي ومنشوراتك ستختفي حتى ترجع وتسجل الدخول مرة تانية. ممكن ترجع وقت ما تحب"
                  : "Your profile and posts will be hidden until you log back in. You can come back anytime."}
              </p>
              {!showDeactivate ? (
                <Button variant="outline" onClick={() => setShowDeactivate(true)} className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10">
                  {isRTL ? "تعطيل الحساب" : "Deactivate Account"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleDeactivate} disabled={deactivating} className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    {deactivating ? <><Spinner className="w-4 h-4 mr-2" />{isRTL ? "..." : "..."}</> : (isRTL ? "تأكيد التعطيل" : "Confirm Deactivate")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeactivate(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="border border-border rounded-2xl p-6 bg-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <LogOut className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{isRTL ? "تسجيل الخروج" : "Sign Out"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL ? "تسجيل الخروج من هذا الجهاز فقط" : "Sign out from this device only"}
              </p>
              <Button variant="outline" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                {isRTL ? "تسجيل الخروج" : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>

        {/* Delete */}
        <div className="border-2 border-red-500/30 rounded-2xl p-6 bg-red-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 text-red-700 dark:text-red-400">{isRTL ? "حذف الحساب" : "Delete Account"}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {isRTL
                  ? "⏳ هتكون عندك مهلة 30 يوم تقدر فيها تتراجع وترجع لحسابك. خلال المهلة دي:"
                  : "⏳ You'll have a 30-day grace period to change your mind. During this period:"}
              </p>
              <ul className="text-sm text-muted-foreground mb-4 space-y-1 list-disc ms-5">
                <li>{isRTL ? "حسابك هيختفي من الناس فوراً" : "Your account is hidden from everyone immediately"}</li>
                <li>{isRTL ? "تقدر ترجعه بأي وقت بتسجيل الدخول وإلغاء الحذف" : "You can restore it anytime by signing back in and cancelling"}</li>
                <li>{isRTL ? "بعد 30 يوم بيتم حذف كل بياناتك (المنشورات، التعليقات، المتابعين) نهائياً ولا يمكن استرجاعها" : "After 30 days, all your data (posts, comments, followers) is permanently deleted and cannot be recovered"}</li>
              </ul>

              {!showDelete ? (
                <Button variant="outline" onClick={() => setShowDelete(true)} className="border-red-500/50 text-red-700 dark:text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isRTL ? "حذف حسابي" : "Delete My Account"}
                </Button>
              ) : (
                <div className="space-y-4 bg-background/50 border border-red-500/30 rounded-xl p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">{isRTL ? "كلمة المرور" : "Password"}</label>
                    <Input type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">{isRTL ? 'اكتب DELETE للتأكيد' : 'Type DELETE to confirm'}</label>
                    <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" dir="ltr" className="font-mono" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleDelete} disabled={deleting || deleteConfirm !== "DELETE" || !deletePw} className="bg-red-500 hover:bg-red-600 text-white flex-1">
                      {deleting ? <><Spinner className="w-4 h-4 mr-2" />{isRTL ? "جاري الحذف..." : "Deleting..."}</> : (isRTL ? "حذف نهائي" : "Delete Forever")}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowDelete(false); setDeletePw(""); setDeleteConfirm(""); }}>
                      {isRTL ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ FIELD HELPER ============
function Field({ label, icon: Icon, hint, children }: { label: string; icon?: any; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          {label}
        </label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
