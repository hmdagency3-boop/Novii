import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languages, useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { 
  Search, Check, User, Lock, Star, Bell, Monitor, History, VolumeX, 
  MessageCircle, Heart, Users, Shield, Globe, Accessibility, HelpCircle, 
  Info, ChevronRight, ChevronLeft, Languages, HardDrive, CreditCard,
  LayoutDashboard, UserCog, BadgeCheck, EyeOff, AtSign, Share2,
  Archive, Download, Laptop, ShieldAlert, Smartphone, X,
  ExternalLink, ListTodo, TrendingUp, Clock, Eye, Flame, Activity, Bookmark, LogOut,
  Trash2, UserPlus, UserX, Settings, AlertCircle, CheckCircle,
  Camera, Upload as UploadIcon, ImageIcon, ArrowRight, ArrowLeft, FileCheck, ScanFace
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IdCardScanner } from "@/components/id-card-scanner";
import { FaceScanner } from "@/components/face-scanner";
import { useUserStatistics } from "@/hooks/use-data";
import type { UserSettings, StoredUser } from "@/lib/settings-storage";
import { useSettings } from "@/lib/settings-context";

// Type definition for menu items
type MenuItem = {
  id: string;
  labelKey: string;
  icon: any;
  isMeta?: boolean;
  isLink?: boolean;
  href?: string;
};

type MenuSection = {
  sectionKey: string;
  items: MenuItem[];
};

// Format time from seconds
function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}


// Statistics Component
function TimeSpentStats() {
  const { data: stats, isLoading } = useUserStatistics();
  const { direction } = useLanguage();
  const isRtl = direction === 'rtl';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const seconds = stats?.time_spent_seconds ?? 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const dailyAvgMin = Math.round((seconds / 7) / 60);

  let activityLabel = isRtl ? 'منخفض' : 'Low';
  let activityTone = 'text-emerald-500';
  let activityDot = 'bg-emerald-500';
  if (seconds > 3600) { activityLabel = isRtl ? 'مرتفع جدًا' : 'Very High'; activityTone = 'text-rose-500'; activityDot = 'bg-rose-500'; }
  else if (seconds > 1800) { activityLabel = isRtl ? 'مرتفع' : 'High'; activityTone = 'text-amber-500'; activityDot = 'bg-amber-500'; }
  else if (seconds > 600) { activityLabel = isRtl ? 'متوسط' : 'Moderate'; activityTone = 'text-sky-500'; activityDot = 'bg-sky-500'; }

  const statItems = stats ? [
    { icon: Heart, label: isRtl ? 'إعجابات' : 'Likes', value: stats.likes_given, href: '/my-activity/likes' },
    { icon: MessageCircle, label: isRtl ? 'تعليقات' : 'Comments', value: stats.comments_created, href: '/my-activity/comments' },
    { icon: TrendingUp, label: isRtl ? 'منشورات' : 'Posts', value: stats.posts_created },
    { icon: Bookmark, label: isRtl ? 'محفوظ' : 'Saved', value: stats.posts_saved },
  ] : [];

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">{isRtl ? 'الوقت المستغرق' : 'Time Spent'}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRtl ? 'نظرة عامة على نشاطك خلال آخر 7 أيام' : 'Overview of your activity over the last 7 days'}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 md:p-10 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            {isRtl ? 'إجمالي الوقت' : 'Total time'}
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/50">
            <span className={cn("w-1.5 h-1.5 rounded-full", activityDot)} />
            <span className={cn("text-xs font-semibold", activityTone)}>{activityLabel}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          {hours > 0 && (
            <>
              <span className="text-6xl md:text-7xl font-bold tabular-nums tracking-tight">{hours}</span>
              <span className="text-2xl text-muted-foreground font-medium">h</span>
            </>
          )}
          <span className="text-6xl md:text-7xl font-bold tabular-nums tracking-tight">{String(minutes).padStart(hours > 0 ? 2 : 1, '0')}</span>
          <span className="text-2xl text-muted-foreground font-medium">m</span>
          {hours === 0 && (
            <>
              <span className="text-6xl md:text-7xl font-bold tabular-nums tracking-tight text-muted-foreground/60">{String(secs).padStart(2, '0')}</span>
              <span className="text-2xl text-muted-foreground font-medium">s</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border/60">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'المتوسط اليومي' : 'Daily average'}</p>
            <p className="text-base font-semibold tabular-nums">{dailyAvgMin} <span className="text-sm font-normal text-muted-foreground">{isRtl ? 'دقيقة' : 'min'}</span></p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'الجلسات' : 'Sessions'}</p>
            <p className="text-base font-semibold tabular-nums">{Math.max(1, Math.round(seconds / 300))}</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'إجمالي الأنشطة' : 'Activities'}</p>
            <p className="text-base font-semibold tabular-nums">{stats ? (stats.likes_given + stats.comments_created + stats.posts_created + stats.posts_saved).toLocaleString() : 0}</p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{isRtl ? 'تفاصيل النشاط' : 'Activity breakdown'}</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-muted/60">
                  <Icon className="w-4 h-4 text-foreground/70" />
                </div>
                {item.href && (
                  <ChevronRight className={cn("w-4 h-4 text-muted-foreground/60", isRtl && "rotate-180")} />
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums tracking-tight mb-0.5">
                {item.value.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {item.label}
              </p>
            </>
          );
          const baseClass = "rounded-xl border border-border bg-card p-5 transition-colors block";
          return item.href ? (
            <Link
              key={idx}
              href={item.href}
              className={cn(baseClass, "hover:border-foreground/30 hover:bg-muted/20 cursor-pointer")}
            >
              {inner}
            </Link>
          ) : (
            <div key={idx} className={cn(baseClass, "hover:border-foreground/20")}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const settingsMenuStructure: MenuSection[] = [
  {
    sectionKey: "your_account",
    items: [
      { id: "accounts_center", labelKey: "accounts_center", icon: UserCog, isMeta: true },
    ]
  },
  {
    sectionKey: "how_you_use",
    items: [
      { id: "edit_profile", labelKey: "edit_profile", icon: User },
      { id: "notifications", labelKey: "notifications", icon: Bell },
      { id: "time_spent", labelKey: "time_spent", icon: History },
      { id: "mentions", labelKey: "mentions", icon: AtSign, isLink: true, href: "/mentions" },
    ]
  },
  {
    sectionKey: "who_can_see",
    items: [
      { id: "close_friends", labelKey: "close_friends", icon: Star },
      { id: "blocked", labelKey: "blocked", icon: Shield },
      { id: "hide_story", labelKey: "hide_story", icon: EyeOff },
    ]
  },
  {
    sectionKey: "how_others_interact",
    items: [
      { id: "messages", labelKey: "messages_replies", icon: MessageCircle },
      { id: "tags", labelKey: "tags", icon: AtSign },
      { id: "comments", labelKey: "comments", icon: MessageCircle },
      { id: "sharing", labelKey: "sharing", icon: Share2 },
      { id: "restricted", labelKey: "restricted", icon: ShieldAlert },
      { id: "hidden_words", labelKey: "hidden_words", icon: MessageCircle },
    ]
  },
  {
    sectionKey: "what_you_see",
    items: [
      { id: "favorites", labelKey: "favorites", icon: Star },
      { id: "muted", labelKey: "muted", icon: VolumeX },
      { id: "content_pref", labelKey: "content_pref", icon: LayoutDashboard },
      { id: "like_counts", labelKey: "like_counts", icon: Heart },
    ]
  },
  {
    sectionKey: "app_and_media",
    items: [
      { id: "install_app", labelKey: "install_app", icon: Download },
      { id: "archiving", labelKey: "archiving", icon: Download },
      { id: "accessibility", labelKey: "accessibility", icon: Accessibility },
      { id: "language", labelKey: "language", icon: Languages },
      { id: "website_permissions", labelKey: "website_permissions", icon: Laptop },
    ]
  },
  {
    sectionKey: "for_professionals",
    items: [
      { id: "account_type", labelKey: "account_type", icon: LayoutDashboard },
      { id: "verified", labelKey: "verified", icon: BadgeCheck },
    ]
  },
  {
    sectionKey: "more_info",
    items: [
      { id: "help", labelKey: "help", icon: HelpCircle },
      { id: "privacy_center", labelKey: "privacy_center", icon: Lock },
      { id: "about", labelKey: "about", icon: Info },
    ]
  },
  {
    sectionKey: "account",
    items: [
      { id: "logout", labelKey: "logout", icon: LogOut },
    ]
  }
];

function VerificationSection({ profile, direction }: { profile: any; direction: string }) {
  const isRTL = direction === 'rtl';
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('personal');
  const [fullName, setFullName] = useState('');
  const [socialLinks, setSocialLinks] = useState({ website: '', twitter: '', instagram: '' });
  const [idCardUrl, setIdCardUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [idCardPreview, setIdCardPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [scanningIdCard, setScanningIdCard] = useState(false);
  const [scanningSelfie, setScanningSelfie] = useState(false);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const { data: existingRequest, refetch } = useQuery({
    queryKey: ['verification-status'],
    queryFn: () => api.getVerificationStatus(),
  });

  const steps = [
    { icon: FileCheck, label: isRTL ? 'البطاقة' : 'ID Card' },
    { icon: ScanFace, label: isRTL ? 'السيلفي' : 'Selfie' },
    { icon: User, label: isRTL ? 'البيانات' : 'Details' },
    { icon: BadgeCheck, label: isRTL ? 'المراجعة' : 'Review' },
  ];

  const handleFileUpload = async (file: File, type: 'id_card' | 'selfie') => {
    if (!file.type.startsWith('image/')) {
      toast.error(isRTL ? 'يرجى اختيار صورة' : 'Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الصورة كبير جداً (الحد الأقصى 10 ميجا)' : 'Image too large (max 10MB)');
      return;
    }

    const preview = URL.createObjectURL(file);
    if (type === 'id_card') setIdCardPreview(preview);
    else setSelfiePreview(preview);

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await api._uploadToCloudinary(file, 'verification', (p: number) => setUploadProgress(p));
      if (type === 'id_card') setIdCardUrl(url);
      else setSelfieUrl(url);
      toast.success(isRTL ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'فشل رفع الصورة' : 'Upload failed'));
      if (type === 'id_card') { setIdCardPreview(''); setIdCardUrl(''); }
      else { setSelfiePreview(''); setSelfieUrl(''); }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!idCardUrl || !selfieUrl || !reason.trim()) return;
    setSubmitting(true);
    try {
      await api.submitVerificationRequest({
        full_name: fullName || profile?.full_name || profile?.username || '',
        reason,
        category,
        social_links: Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v.trim())),
        id_card_url: idCardUrl,
        selfie_url: selfieUrl,
      });
      toast.success(isRTL ? 'تم إرسال طلب التوثيق بنجاح! سيتم مراجعته قريباً.' : 'Verification request submitted!');
      refetch();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'فشل إرسال الطلب' : 'Failed to submit'));
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!idCardUrl;
    if (step === 1) return !!selfieUrl;
    if (step === 2) return !!reason.trim();
    return true;
  };

  return (
    <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-2xl font-bold mb-4">{isRTL ? 'التحقق من الهوية' : 'Identity Verification'}</h2>

      {profile?.is_verified ? (
        <div className="text-center py-12 border border-green-500/30 rounded-2xl bg-green-500/5">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{isRTL ? 'حسابك موثّق' : 'Your Account is Verified'}</h3>
          <p className="text-sm text-muted-foreground">{isRTL ? 'تم توثيق حسابك بنجاح' : 'Your account has been verified successfully'}</p>
        </div>
      ) : existingRequest?.status === 'pending' ? (
        <div className="text-center py-12 border border-yellow-500/30 rounded-2xl bg-yellow-500/5">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{isRTL ? 'طلبك قيد المراجعة' : 'Request Under Review'}</h3>
          <p className="text-sm text-muted-foreground">{isRTL ? 'تم إرسال طلبك ومستنداتك وسيتم مراجعتها قريباً' : 'Your request and documents have been submitted for review'}</p>
          <p className="text-xs text-muted-foreground mt-2">{isRTL ? 'تاريخ الإرسال:' : 'Submitted:'} {new Date(existingRequest.created_at).toLocaleDateString()}</p>
        </div>
      ) : existingRequest?.status === 'rejected' ? (
        <div className="space-y-6">
          <div className="text-center py-8 border border-red-500/30 rounded-2xl bg-red-500/5">
            <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">{isRTL ? 'تم رفض طلبك السابق' : 'Previous Request Rejected'}</h3>
            {existingRequest.admin_note && <p className="text-sm text-muted-foreground px-6">{isRTL ? 'السبب:' : 'Reason:'} {existingRequest.admin_note}</p>}
            <p className="text-xs text-muted-foreground mt-3">{isRTL ? 'يمكنك تقديم طلب جديد أدناه' : 'You can submit a new request below'}</p>
          </div>
          {renderMultiStepForm()}
        </div>
      ) : (
        <div className="space-y-6">{renderMultiStepForm()}</div>
      )}
    </div>
  );

  function renderMultiStepForm() {
    return (
      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step || (i === 0 && !!idCardUrl) && step > 0 || (i === 1 && !!selfieUrl) && step > 1;
            return (
              <button key={i} onClick={() => { if (i < step) setStep(i); }} className={cn("flex flex-col items-center gap-1 flex-1 py-1.5 rounded-lg transition-all", isActive ? "text-primary" : isDone ? "text-green-500" : "text-muted-foreground")}>
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", isActive ? "bg-primary/10 ring-2 ring-primary" : isDone ? "bg-green-500/10" : "bg-muted/50")}>
                  {isDone && i < step ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {step === 0 && renderIdCardStep()}
          {step === 1 && renderSelfieStep()}
          {step === 2 && renderDetailsStep()}
          {step === 3 && renderReviewStep()}
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              {isRTL ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {isRTL ? 'السابق' : 'Back'}
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed() || uploading} className="flex-1">
              {isRTL ? 'التالي' : 'Next'}
              {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !idCardUrl || !selfieUrl || !reason.trim()} className="flex-1 bg-green-600 hover:bg-green-700">
              {submitting ? <Spinner className="w-4 h-4" /> : (
                <>{isRTL ? 'إرسال طلب التحقق' : 'Submit Verification'}<BadgeCheck className="w-4 h-4 mr-2 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  function renderIdCardStep() {
    if (scanningIdCard) {
      return (
        <IdCardScanner
          isRTL={isRTL}
          onCapture={async (file) => {
            setScanningIdCard(false);
            const preview = URL.createObjectURL(file);
            setIdCardPreview(preview);
            setUploading(true);
            try {
              const url = await api._uploadToCloudinary(file, 'verification', (p: number) => setUploadProgress(p));
              setIdCardUrl(url);
              toast.success(isRTL ? 'تم مسح البطاقة بنجاح' : 'ID card scanned successfully');
            } catch (err: any) {
              toast.error(err.message || (isRTL ? 'فشل رفع الصورة' : 'Upload failed'));
              setIdCardPreview(''); setIdCardUrl('');
            } finally { setUploading(false); setUploadProgress(0); }
          }}
          onCancel={() => setScanningIdCard(false)}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <FileCheck className="w-10 h-10 text-primary mx-auto mb-2" />
          <h3 className="font-bold text-lg">{isRTL ? 'مسح البطاقة الشخصية' : 'Scan ID Card'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'صوّر البطاقة بالكاميرا مباشرة أو ارفع صورة' : 'Scan your ID card with the camera or upload a photo'}</p>
        </div>

        <input ref={idCardInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'id_card'); e.target.value = ''; }} />

        {idCardPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
            <img src={idCardPreview} alt="ID Card" className="w-full h-48 object-contain bg-black/5" />
            <div className="absolute top-2 left-2 right-2 flex justify-between">
              {idCardUrl && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {isRTL ? 'تم المسح' : 'Scanned'}</span>}
              <button onClick={() => { setIdCardPreview(''); setIdCardUrl(''); }} className="bg-red-500 text-white p-1 rounded-full"><X className="w-3.5 h-3.5" /></button>
            </div>
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setScanningIdCard(true)} disabled={uploading} className="w-full h-40 border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all bg-primary/5">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-primary">{isRTL ? 'مسح بالكاميرا' : 'Scan with Camera'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{isRTL ? 'موصى به - أسرع وأدق' : 'Recommended - faster & more accurate'}</p>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{isRTL ? 'أو' : 'or'}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button onClick={() => idCardInputRef.current?.click()} disabled={uploading} className="w-full py-3 border border-border rounded-xl flex items-center justify-center gap-2 hover:bg-muted/50 transition-all text-sm text-muted-foreground">
              <UploadIcon className="w-4 h-4" />
              {isRTL ? 'رفع صورة من الجهاز' : 'Upload from device'}
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderSelfieStep() {
    if (scanningSelfie) {
      return (
        <FaceScanner
          isRTL={isRTL}
          onCapture={async (file) => {
            setScanningSelfie(false);
            const preview = URL.createObjectURL(file);
            setSelfiePreview(preview);
            setUploading(true);
            try {
              const url = await api._uploadToCloudinary(file, 'verification', (p: number) => setUploadProgress(p));
              setSelfieUrl(url);
              toast.success(isRTL ? 'تم مسح الوجه بنجاح' : 'Face scanned successfully');
            } catch (err: any) {
              toast.error(err.message || (isRTL ? 'فشل رفع الصورة' : 'Upload failed'));
              setSelfiePreview(''); setSelfieUrl('');
            } finally { setUploading(false); setUploadProgress(0); }
          }}
          onCancel={() => setScanningSelfie(false)}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <ScanFace className="w-10 h-10 text-primary mx-auto mb-2" />
          <h3 className="font-bold text-lg">{isRTL ? 'مسح الوجه للتحقق' : 'Face Verification Scan'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'صوّر وجهك بالكاميرا مباشرة للمقارنة مع البطاقة' : 'Scan your face with the camera to compare with your ID'}</p>
        </div>

        <input ref={selfieInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'selfie'); e.target.value = ''; }} />

        {selfiePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
            <img src={selfiePreview} alt="Selfie" className="w-full h-48 object-contain bg-black/5" />
            <div className="absolute top-2 left-2 right-2 flex justify-between">
              {selfieUrl && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {isRTL ? 'تم المسح' : 'Scanned'}</span>}
              <button onClick={() => { setSelfiePreview(''); setSelfieUrl(''); }} className="bg-red-500 text-white p-1 rounded-full"><X className="w-3.5 h-3.5" /></button>
            </div>
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setScanningSelfie(true)} disabled={uploading} className="w-full h-40 border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all bg-primary/5">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanFace className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-primary">{isRTL ? 'مسح الوجه بالكاميرا' : 'Scan Face with Camera'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{isRTL ? 'موصى به - أسرع وأدق' : 'Recommended - faster & more accurate'}</p>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{isRTL ? 'أو' : 'or'}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button onClick={() => selfieInputRef.current?.click()} disabled={uploading} className="w-full py-3 border border-border rounded-xl flex items-center justify-center gap-2 hover:bg-muted/50 transition-all text-sm text-muted-foreground">
              <UploadIcon className="w-4 h-4" />
              {isRTL ? 'رفع صورة من الجهاز' : 'Upload from device'}
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderDetailsStep() {
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <User className="w-10 h-10 text-primary mx-auto mb-2" />
          <h3 className="font-bold text-lg">{isRTL ? 'البيانات الشخصية' : 'Personal Details'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'أكمل بياناتك وسبب طلب التوثيق' : 'Complete your details and reason for verification'}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{isRTL ? 'الاسم الكامل (كما في البطاقة)' : 'Full Name (as on ID)'}</label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={profile?.full_name || profile?.username || ''} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{isRTL ? 'الفئة' : 'Category'}</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">{isRTL ? 'شخصي' : 'Personal'}</SelectItem>
                <SelectItem value="creator">{isRTL ? 'صانع محتوى' : 'Content Creator'}</SelectItem>
                <SelectItem value="business">{isRTL ? 'نشاط تجاري' : 'Business'}</SelectItem>
                <SelectItem value="public_figure">{isRTL ? 'شخصية عامة' : 'Public Figure'}</SelectItem>
                <SelectItem value="organization">{isRTL ? 'مؤسسة / منظمة' : 'Organization'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{isRTL ? 'لماذا تستحق التوثيق؟' : 'Why should you be verified?'} <span className="text-red-500">*</span></label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder={isRTL ? 'اشرح لماذا تريد التوثيق...' : 'Explain why you want verification...'} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{isRTL ? 'روابط حسابات أخرى (اختياري)' : 'Social Links (optional)'}</label>
            <div className="space-y-2">
              <Input value={socialLinks.website} onChange={e => setSocialLinks(p => ({ ...p, website: e.target.value }))} placeholder={isRTL ? 'الموقع الإلكتروني' : 'Website URL'} />
              <Input value={socialLinks.twitter} onChange={e => setSocialLinks(p => ({ ...p, twitter: e.target.value }))} placeholder="Twitter / X" />
              <Input value={socialLinks.instagram} onChange={e => setSocialLinks(p => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderReviewStep() {
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <BadgeCheck className="w-10 h-10 text-primary mx-auto mb-2" />
          <h3 className="font-bold text-lg">{isRTL ? 'مراجعة الطلب' : 'Review Your Request'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'راجع بياناتك قبل الإرسال' : 'Review your information before submitting'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl overflow-hidden border border-border">
            <p className="text-xs font-medium text-center py-1.5 bg-muted/30 border-b border-border">{isRTL ? 'البطاقة الشخصية' : 'ID Card'}</p>
            {idCardPreview ? (
              <img src={idCardPreview} alt="ID" className="w-full h-28 object-contain bg-black/5" />
            ) : (
              <div className="w-full h-28 flex items-center justify-center text-muted-foreground"><X className="w-6 h-6" /></div>
            )}
          </div>
          <div className="rounded-xl overflow-hidden border border-border">
            <p className="text-xs font-medium text-center py-1.5 bg-muted/30 border-b border-border">{isRTL ? 'صورة السيلفي' : 'Selfie'}</p>
            {selfiePreview ? (
              <img src={selfiePreview} alt="Selfie" className="w-full h-28 object-contain bg-black/5" />
            ) : (
              <div className="w-full h-28 flex items-center justify-center text-muted-foreground"><X className="w-6 h-6" /></div>
            )}
          </div>
        </div>

        <div className="space-y-2 bg-muted/20 rounded-xl p-4">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRTL ? 'الاسم:' : 'Name:'}</span><span className="font-medium">{fullName || profile?.full_name || profile?.username || '-'}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRTL ? 'الفئة:' : 'Category:'}</span><span className="font-medium">{{ personal: isRTL ? 'شخصي' : 'Personal', creator: isRTL ? 'صانع محتوى' : 'Creator', business: isRTL ? 'نشاط تجاري' : 'Business', public_figure: isRTL ? 'شخصية عامة' : 'Public Figure', organization: isRTL ? 'مؤسسة' : 'Organization' }[category]}</span></div>
          <div className="text-sm"><span className="text-muted-foreground">{isRTL ? 'السبب:' : 'Reason:'}</span><p className="mt-1 text-sm">{reason || '-'}</p></div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
          <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>{isRTL ? 'بياناتك ومستنداتك محمية ولن تتم مشاركتها. سيتم استخدامها فقط للتحقق من هويتك.' : 'Your data and documents are protected and will not be shared. They will only be used to verify your identity.'}</p>
        </div>
      </div>
    );
  }
}

export default function SettingsPage() {
  const { language, setLanguage, direction } = useLanguage();
  const t = getTranslation(language.code).settings;
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch current user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.getCurrentProfile(),
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
    website: "",
    location: "",
    avatar_url: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);

  const {
    settings, settingsLoaded,
    blockedList, friendsList, mutedList, restrictedList, favsList,
    updateSettings, updateNestedSettings,
    unblockUser, unmuteUser, removeCloseFriend, unrestrictUser, removeFavorite,
    refetchLists,
  } = useSettings();


  const [newHiddenWord, setNewHiddenWord] = useState('');

  // PWA Installation state
  const deferredPromptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  // Handle PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPromptRef.current) {
      toast.error(direction === 'rtl' ? 'التطبيق مثبت بالفعل' : 'App is already installed');
      return;
    }

    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    if (outcome === 'accepted') {
      toast.success(direction === 'rtl' ? 'تم تثبيت التطبيق بنجاح!' : 'App installed successfully!');
    }
    deferredPromptRef.current = null;
    setCanInstall(false);
  };

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        website: profile.website || "",
        location: profile.location || "",
        avatar_url: profile.avatar_url || "",
      });
      setIsPrivate(profile.is_private || false);
    }
  }, [profile]);


  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (selectedFile) {
        const avatarUrl = await api.uploadAvatar(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
        data.avatar_url = avatarUrl;
      }
      const result = await api.updateProfile({ ...data, is_private: isPrivate });
      return result;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', user?.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Profile updated successfully!");
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
      setUploadProgress(0);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };
  
  const filteredLanguages = languages.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  const Chevron = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const renderContent = () => {
    const needsSettings = ["notifications", "messages_replies", "comments", "hide_story", "tags", "sharing", "blocked", "close_friends", "restricted", "hidden_words", "favorites", "muted", "content_pref", "like_counts", "archiving", "accessibility", "account_type"];
    if (needsSettings.includes(activeTab || '') && !settingsLoaded) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8" />
        </div>
      );
    }

    switch (activeTab) {
      case "edit_profile":
        if (profileLoading) {
          return (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-8 h-8" />
            </div>
          );
        }

        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{t.edit_profile_title}</h2>
            
            <div className="mb-8">
              <AvatarUploader
                currentAvatar={formData.avatar_url}
                username={profile?.username}
                onFileSelect={handleFileSelect}
                onRemove={handleRemovePhoto}
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                isUploading={updateProfileMutation.isPending}
                uploadProgress={uploadProgress}
                isRTL={direction === "rtl"}
                lang={direction === "rtl" ? "ar" : "en"}
              />
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Username</h3>
                    <Input 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Username" 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Full Name</h3>
                    <Input 
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Full name" 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg">{t.website}</h3>
                    <Input 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder={t.website} 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Location</h3>
                    <Input 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="City, Country" 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <h3 className="font-bold text-lg">{t.bio}</h3>
                        <span className="text-xs text-muted-foreground">{formData.bio.length} / 150</span>
                    </div>
                    <Textarea 
                        value={formData.bio} 
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="bg-card border-border min-h-[100px]"
                        maxLength={150}
                    />
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-bold rounded-xl"
                >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Spinner className="w-5 h-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      t.submit
                    )}
                </Button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{t.notifications}</h2>
            <div className="space-y-4">
              {(Object.entries(settings.notifications) as [string, boolean][]).map(([key, value]) => (
                <div key={key} className="border border-border rounded-xl p-5 bg-card hover:border-primary/50 transition-colors flex items-center justify-between">
                  <h3 className="font-bold text-sm flex-1">
                    {direction === 'rtl'
                      ? key === 'email_notifications' ? 'إشعارات البريد الإلكتروني' :
                        key === 'push_notifications' ? 'إشعارات الدفع' :
                        key === 'message_notifications' ? 'إشعارات الرسائل' :
                        key === 'like_notifications' ? 'إشعارات الإعجابات' :
                        key === 'comment_notifications' ? 'إشعارات التعليقات' : 'إشعارات المتابعة'
                      : key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                  </h3>
                  <ToggleSwitch checked={value} onCheckedChange={(checked) => updateNestedSettings('notifications', { [key]: checked })} />
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "messages":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'إعدادات الرسائل' : 'Message Settings'}</h2>
            <div className="space-y-3">
              {(['everyone', 'followers', 'approved'] as const).map(opt => (
                <button key={opt} onClick={() => updateNestedSettings('messages', { who_can_message: opt })}
                  className={cn("w-full border rounded-xl p-5 bg-card flex items-center justify-between transition-colors", settings.messages.who_can_message === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                  <div className="flex-1 text-start">
                    <h3 className="font-bold text-sm">{direction === 'rtl' ? (opt === 'everyone' ? 'الجميع' : opt === 'followers' ? 'المتابعون فقط' : 'المتابعون المعتمدون فقط') : (opt === 'everyone' ? 'Everyone' : opt === 'followers' ? 'Followers only' : 'Approved followers only')}</h3>
                  </div>
                  {settings.messages.who_can_message === opt && <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "comments":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'إعدادات التعليقات' : 'Comments Settings'}</h2>
            <div className="space-y-3">
              {(['everyone', 'followers', 'none'] as const).map(opt => (
                <button key={opt} onClick={() => updateNestedSettings('comments', { who_can_comment: opt })}
                  className={cn("w-full border rounded-xl p-5 bg-card flex items-center justify-between transition-colors", settings.comments.who_can_comment === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                  <h3 className="font-bold text-sm">{direction === 'rtl' ? (opt === 'everyone' ? 'الجميع' : opt === 'followers' ? 'المتابعون فقط' : 'إيقاف التعليقات') : (opt === 'everyone' ? 'Everyone' : opt === 'followers' ? 'Followers only' : 'Disable comments')}</h3>
                  {settings.comments.who_can_comment === opt && <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "blocked": {
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'المستخدمون المحظورون' : 'Blocked Users'}</h2>
            {blockedList.length > 0 ? (
              <div className="space-y-3">
                {blockedList.map(u => (
                  <div key={u.id} className="border border-border rounded-xl p-4 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url} /><AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <div><p className="font-bold text-sm">{u.username}</p>{u.full_name && <p className="text-xs text-muted-foreground">{u.full_name}</p>}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => { try { await unblockUser(u.id); toast.success(direction === 'rtl' ? 'تم إلغاء الحظر' : 'Unblocked'); } catch { toast.error(direction === 'rtl' ? 'خطأ في إلغاء الحظر' : 'Failed to unblock'); } }}>
                      {direction === 'rtl' ? 'إلغاء الحظر' : 'Unblock'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
                <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{direction === 'rtl' ? 'لم تقم بحظر أي مستخدمين' : 'You haven\'t blocked any users yet'}</p>
                <p className="text-xs text-muted-foreground mt-2">{direction === 'rtl' ? 'قم بزيارة ملف تعريفي واضغط على قائمة الخيارات لحظره' : 'Visit a profile and use the options menu to block'}</p>
              </div>
            )}
          </div>
        );
      }

      case "close_friends": {
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'الأصدقاء المقربون' : 'Close Friends'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'الأصدقاء المقربون يمكنهم رؤية قصصك الخاصة ومحتوى حصري' : 'Close friends can see your private stories and exclusive content'}</p>
            {friendsList.length > 0 ? (
              <div className="space-y-3">
                {friendsList.map(u => (
                  <div key={u.id} className="border border-border rounded-xl p-4 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url} /><AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <div><p className="font-bold text-sm">{u.username}</p>{u.full_name && <p className="text-xs text-muted-foreground">{u.full_name}</p>}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => { try { await removeCloseFriend(u.id); toast.success(direction === 'rtl' ? 'تم الإزالة' : 'Removed'); } catch { toast.error(direction === 'rtl' ? 'خطأ في الإزالة' : 'Failed to remove'); } }}>
                      {direction === 'rtl' ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{direction === 'rtl' ? 'لم تضف أي أصدقاء مقربين بعد' : 'No close friends yet'}</p>
                <p className="text-xs text-muted-foreground mt-2">{direction === 'rtl' ? 'أضف متابعين من بروفايلهم' : 'Add followers from their profile'}</p>
              </div>
            )}
          </div>
        );
      }

      case "hide_story":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'إخفاء القصة' : 'Hide Story'}</h2>
            <div className="space-y-6">
              <div className="border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{direction === 'rtl' ? 'إخفاء قصتي من الجميع' : 'Hide My Story From Everyone'}</h3>
                    <p className="text-sm text-muted-foreground">{direction === 'rtl' ? 'لن يتمكن أي شخص من رؤية قصتك' : 'No one will be able to see your story'}</p>
                  </div>
                  <ToggleSwitch checked={settings.story.hide_story_from_all} onCheckedChange={(checked) => updateNestedSettings('story', { hide_story_from_all: checked })} />
                </div>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "tags":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'إعدادات الإشارات' : 'Tags Settings'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'التحكم في من يمكنه الإشارة إليك في المنشورات' : 'Control who can tag you in posts'}</p>
            <div className="space-y-3">
              {(['everyone', 'followers', 'none'] as const).map(opt => (
                <button key={opt} onClick={() => updateNestedSettings('tags', { who_can_tag: opt })}
                  className={cn("w-full border rounded-xl p-5 bg-card flex items-center justify-between transition-colors", settings.tags.who_can_tag === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                  <h3 className="font-bold text-sm">{direction === 'rtl' ? (opt === 'everyone' ? 'الجميع' : opt === 'followers' ? 'المتابعون فقط' : 'لا أحد') : (opt === 'everyone' ? 'Everyone' : opt === 'followers' ? 'Followers only' : 'No one')}</h3>
                  {settings.tags.who_can_tag === opt && <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "sharing":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'إعدادات المشاركة' : 'Sharing Settings'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'التحكم في من يمكنه مشاركة منشوراتك' : 'Control who can share your posts'}</p>
            <div className="space-y-3">
              {(['everyone', 'followers', 'none'] as const).map(opt => (
                <button key={opt} onClick={() => updateNestedSettings('sharing', { who_can_share: opt })}
                  className={cn("w-full border rounded-xl p-5 bg-card flex items-center justify-between transition-colors", settings.sharing.who_can_share === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                  <h3 className="font-bold text-sm">{direction === 'rtl' ? (opt === 'everyone' ? 'الجميع' : opt === 'followers' ? 'المتابعون فقط' : 'لا أحد') : (opt === 'everyone' ? 'Everyone' : opt === 'followers' ? 'Followers only' : 'No one')}</h3>
                  {settings.sharing.who_can_share === opt && <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "restricted": {
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'الحسابات المقيّدة' : 'Restricted Accounts'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'الحسابات المقيدة لن تعرف أنك قيّدتها. تعليقاتهم تكون مرئية لهم فقط.' : 'Restricted accounts won\'t know they\'re restricted. Their comments are only visible to them.'}</p>
            {restrictedList.length > 0 ? (
              <div className="space-y-3">
                {restrictedList.map(u => (
                  <div key={u.id} className="border border-border rounded-xl p-4 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url} /><AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <p className="font-bold text-sm">{u.username}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => { try { await unrestrictUser(u.id); toast.success(direction === 'rtl' ? 'تم إلغاء التقييد' : 'Unrestricted'); } catch { toast.error(direction === 'rtl' ? 'خطأ في إلغاء التقييد' : 'Failed to unrestrict'); } }}>
                      {direction === 'rtl' ? 'إلغاء التقييد' : 'Unrestrict'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
                <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{direction === 'rtl' ? 'لا توجد حسابات مقيّدة' : 'No restricted accounts'}</p>
              </div>
            )}
          </div>
        );
      }

      case "hidden_words":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'الكلمات المخفية' : 'Hidden Words'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'أخفِ التعليقات التي تحتوي على كلمات معينة' : 'Hide comments containing specific words'}</p>
            <div className="border border-border rounded-2xl p-6 bg-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{direction === 'rtl' ? 'تفعيل فلتر الكلمات' : 'Enable Word Filter'}</h3>
                <ToggleSwitch checked={settings.hidden_words.enabled} onCheckedChange={(checked) => updateNestedSettings('hidden_words', { enabled: checked })} />
              </div>
              <div className="flex gap-2 mb-4">
                <Input value={newHiddenWord} onChange={(e) => setNewHiddenWord(e.target.value)} placeholder={direction === 'rtl' ? 'أضف كلمة...' : 'Add a word...'} className="bg-background" onKeyDown={(e) => { if (e.key === 'Enter' && newHiddenWord.trim()) { updateNestedSettings('hidden_words', { custom_words: [...settings.hidden_words.custom_words, newHiddenWord.trim()] }); setNewHiddenWord(''); }}} />
                <Button onClick={() => { if (newHiddenWord.trim()) { updateNestedSettings('hidden_words', { custom_words: [...settings.hidden_words.custom_words, newHiddenWord.trim()] }); setNewHiddenWord(''); }}} disabled={!newHiddenWord.trim()}>
                  {direction === 'rtl' ? 'إضافة' : 'Add'}
                </Button>
              </div>
              {settings.hidden_words.custom_words.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.hidden_words.custom_words.map((word, i) => (
                    <span key={i} className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {word}
                      <button onClick={() => updateNestedSettings('hidden_words', { custom_words: settings.hidden_words.custom_words.filter((_, idx) => idx !== i) })} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "favorites": {
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'المفضّلون' : 'Favorites'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'المفضلون يظهرون أولاً في الفيد الخاص بك' : 'Favorites appear first in your feed'}</p>
            {favsList.length > 0 ? (
              <div className="space-y-3">
                {favsList.map(u => (
                  <div key={u.id} className="border border-border rounded-xl p-4 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url} /><AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <p className="font-bold text-sm">{u.username}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => { try { await removeFavorite(u.id); toast.success(direction === 'rtl' ? 'تم الإزالة' : 'Removed'); } catch { toast.error(direction === 'rtl' ? 'خطأ في الإزالة' : 'Failed to remove'); } }}>
                      {direction === 'rtl' ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{direction === 'rtl' ? 'لم تضف أي حسابات مفضلة' : 'No favorites yet'}</p>
              </div>
            )}
          </div>
        );
      }

      case "muted": {
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'الحسابات المكتومة' : 'Muted Accounts'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'لن ترى منشوراتهم في الفيد لكنك تبقى متابعاً لهم' : 'You won\'t see their posts in your feed but you\'ll still follow them'}</p>
            {mutedList.length > 0 ? (
              <div className="space-y-3">
                {mutedList.map(u => (
                  <div key={u.id} className="border border-border rounded-xl p-4 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url} /><AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <p className="font-bold text-sm">{u.username}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => { try { await unmuteUser(u.id); toast.success(direction === 'rtl' ? 'تم إلغاء الكتم' : 'Unmuted'); } catch { toast.error(direction === 'rtl' ? 'خطأ في إلغاء الكتم' : 'Failed to unmute'); } }}>
                      {direction === 'rtl' ? 'إلغاء الكتم' : 'Unmute'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
                <VolumeX className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{direction === 'rtl' ? 'لا توجد حسابات مكتومة' : 'No muted accounts'}</p>
              </div>
            )}
          </div>
        );
      }

      case "content_pref":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'تفضيلات المحتوى' : 'Content Preferences'}</h2>
            <div className="space-y-4">
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'عرض المحتوى المقترح' : 'Show Suggested Content'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'اقتراحات بناءً على اهتماماتك' : 'Suggestions based on your interests'}</p></div>
                <ToggleSwitch checked={settings.content.show_suggested} onCheckedChange={(checked) => updateNestedSettings('content', { show_suggested: checked })} />
              </div>
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'عرض المحتوى الرائج' : 'Show Trending Content'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'المنشورات الأكثر شيوعاً' : 'Most popular posts'}</p></div>
                <ToggleSwitch checked={settings.content.show_trending} onCheckedChange={(checked) => updateNestedSettings('content', { show_trending: checked })} />
              </div>
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'المحتوى الحساس' : 'Sensitive Content'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'عرض المحتوى الذي قد يكون حساساً' : 'Show content that may be sensitive'}</p></div>
                <ToggleSwitch checked={settings.content.sensitive_content} onCheckedChange={(checked) => updateNestedSettings('content', { sensitive_content: checked })} />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "like_counts":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'عدد الإعجابات' : 'Like Counts'}</h2>
            <div className="space-y-4">
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'إخفاء عدد الإعجابات على منشوراتك' : 'Hide like counts on your posts'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'الآخرون لن يرون عدد الإعجابات' : 'Others won\'t see the like count'}</p></div>
                <ToggleSwitch checked={settings.likes.hide_like_counts_own} onCheckedChange={(checked) => updateNestedSettings('likes', { hide_like_counts_own: checked })} />
              </div>
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'إخفاء عدد الإعجابات على منشورات الآخرين' : 'Hide like counts on others\' posts'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'لن ترى عدد الإعجابات على المنشورات' : 'You won\'t see like counts on posts'}</p></div>
                <ToggleSwitch checked={settings.likes.hide_like_counts_others} onCheckedChange={(checked) => updateNestedSettings('likes', { hide_like_counts_others: checked })} />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "archiving":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'الأرشفة' : 'Archiving'}</h2>
            <div className="space-y-4">
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'أرشفة القصص تلقائياً' : 'Auto-archive Stories'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'حفظ القصص المنتهية في الأرشيف تلقائياً' : 'Save expired stories to archive automatically'}</p></div>
                <ToggleSwitch checked={settings.archiving.auto_archive_stories} onCheckedChange={(checked) => updateNestedSettings('archiving', { auto_archive_stories: checked })} />
              </div>
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'أرشفة الريلز تلقائياً' : 'Auto-archive Reels'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'حفظ الريلز المحذوفة في الأرشيف' : 'Save deleted reels to archive'}</p></div>
                <ToggleSwitch checked={settings.archiving.auto_archive_reels} onCheckedChange={(checked) => updateNestedSettings('archiving', { auto_archive_reels: checked })} />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "accessibility":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'إمكانية الوصول' : 'Accessibility'}</h2>
            <div className="space-y-6">
              <div className="border border-border rounded-2xl p-6 bg-card">
                <h3 className="font-bold text-lg mb-4">{direction === 'rtl' ? 'حجم الخط' : 'Font Size'}</h3>
                <div className="space-y-3">
                  {(['small', 'medium', 'large', 'xlarge'] as const).map(size => (
                    <button key={size} onClick={() => updateNestedSettings('accessibility', { font_size: size })}
                      className={cn("w-full border rounded-xl p-4 bg-card flex items-center justify-between transition-colors", settings.accessibility.font_size === size ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                      <span className={cn("font-bold", size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : size === 'large' ? 'text-base' : 'text-lg')}>
                        {direction === 'rtl' ? (size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : 'كبير جداً') : (size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : size === 'large' ? 'Large' : 'Extra Large')}
                      </span>
                      {settings.accessibility.font_size === size && <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'تباين عالي' : 'High Contrast'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'زيادة تباين الألوان لسهولة القراءة' : 'Increase color contrast for readability'}</p></div>
                <ToggleSwitch checked={settings.accessibility.high_contrast} onCheckedChange={(checked) => updateNestedSettings('accessibility', { high_contrast: checked })} />
              </div>
              <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                <div className="flex-1"><h3 className="font-bold text-sm">{direction === 'rtl' ? 'تقليل الحركة' : 'Reduce Motion'}</h3><p className="text-xs text-muted-foreground mt-1">{direction === 'rtl' ? 'تقليل الرسوم المتحركة' : 'Reduce animations throughout the app'}</p></div>
                <ToggleSwitch checked={settings.accessibility.reduce_motion} onCheckedChange={(checked) => updateNestedSettings('accessibility', { reduce_motion: checked })} />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "website_permissions":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'أذونات الموقع' : 'Website Permissions'}</h2>
            <div className="space-y-4">
              {[
                { icon: '📷', name: direction === 'rtl' ? 'الكاميرا' : 'Camera', perm: 'camera' as PermissionName },
                { icon: '🎤', name: direction === 'rtl' ? 'الميكروفون' : 'Microphone', perm: 'microphone' as PermissionName },
                { icon: '📍', name: direction === 'rtl' ? 'الموقع الجغرافي' : 'Location', perm: 'geolocation' as PermissionName },
              ].map(item => (
                <div key={item.perm} className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3"><span className="text-2xl">{item.icon}</span><h3 className="font-bold text-sm">{item.name}</h3></div>
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      if (item.perm === 'camera' as any) { await navigator.mediaDevices.getUserMedia({ video: true }); }
                      else if (item.perm === 'microphone' as any) { await navigator.mediaDevices.getUserMedia({ audio: true }); }
                      else { navigator.geolocation.getCurrentPosition(() => {}, () => {}); }
                      toast.success(direction === 'rtl' ? 'تم طلب الإذن' : 'Permission requested');
                    } catch { toast.error(direction === 'rtl' ? 'تم رفض الإذن' : 'Permission denied'); }
                  }}>
                    {direction === 'rtl' ? 'طلب إذن' : 'Request'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case "account_type":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'نوع الحساب' : 'Account Type'}</h2>
            <p className="text-sm text-muted-foreground mb-8">{direction === 'rtl' ? 'اختر نوع حسابك للحصول على ميزات مخصصة' : 'Choose your account type for customized features'}</p>
            <div className="space-y-3">
              {([
                { type: 'personal' as const, icon: '👤', label: direction === 'rtl' ? 'شخصي' : 'Personal', desc: direction === 'rtl' ? 'حساب شخصي عادي' : 'Standard personal account' },
                { type: 'business' as const, icon: '🏢', label: direction === 'rtl' ? 'أعمال' : 'Business', desc: direction === 'rtl' ? 'للشركات والمتاجر' : 'For companies and stores' },
                { type: 'creator' as const, icon: '🎨', label: direction === 'rtl' ? 'صانع محتوى' : 'Creator', desc: direction === 'rtl' ? 'لصناع المحتوى والمؤثرين' : 'For content creators and influencers' },
              ]).map(item => (
                <button key={item.type} onClick={() => updateSettings({ account_type: item.type })}
                  className={cn("w-full border rounded-xl p-5 bg-card flex items-center gap-4 transition-colors text-start", settings.account_type === item.type ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex-1"><h3 className="font-bold">{item.label}</h3><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  {settings.account_type === item.type && <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-4 text-center">{direction === 'rtl' ? 'يتم الحفظ تلقائياً' : 'Auto-saved'}</p>
          </div>
        );

      case "verified":
        return <VerificationSection profile={profile} direction={direction} />;

      case "help":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300 pb-20">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
              <HelpCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {direction === 'rtl' ? 'مركز المساعدة' : 'Help Center'}
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              {direction === 'rtl'
                ? 'تصفح الأسئلة الشائعة واحصل على إجابات لجميع استفساراتك'
                : 'Browse FAQs and get answers to all your questions'}
            </p>
            <Link href="/help">
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                {direction === 'rtl' ? 'فتح مركز المساعدة' : 'Open Help Center'}
              </button>
            </Link>
          </div>
        );
      case "privacy_center":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300 pb-20">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {direction === 'rtl' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              {direction === 'rtl'
                ? 'اطلع على كيفية حماية بياناتك وما نجمعه منها'
                : 'Learn how we protect your data and what we collect'}
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Link href="/privacy">
                <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                  {direction === 'rtl' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </button>
              </Link>
              <Link href="/terms">
                <button className="border border-border px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-colors">
                  {direction === 'rtl' ? 'الشروط والأحكام' : 'Terms of Service'}
                </button>
              </Link>
            </div>
          </div>
        );
      case "about":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300 pb-20">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
              <Info className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {direction === 'rtl' ? 'حول نوفيي' : 'About Novii'}
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              {direction === 'rtl'
                ? 'تعرف على قصتنا ورؤيتنا وكل ما يتعلق بمنصة نوفيي'
                : 'Learn about our story, vision, and everything about Novii'}
            </p>
            <Link href="/about">
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                {direction === 'rtl' ? 'اعرف أكثر' : 'Learn More'}
              </button>
            </Link>
          </div>
        );

      case "time_spent":
        return <TimeSpentStats />;

      case "install_app":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'تنزيل التطبيق' : 'Install App'}</h2>
            
            <div className="border border-border rounded-2xl p-8 bg-card hover:border-primary/50 transition-colors text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary/30">
                <Download className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-xl font-bold mb-3">
                {direction === 'rtl' ? 'ثبّت Novii على جهازك' : 'Install Novii on your device'}
              </h3>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {direction === 'rtl' 
                  ? 'ثبّت التطبيق على شاشتك الرئيسية للوصول السريع. يمكنك استخدام التطبيق بدون انترنت!' 
                  : 'Install the app on your home screen for quick access. Use it without internet!'}
              </p>

              <Button
                onClick={handleInstallApp}
                disabled={!canInstall}
                className={cn(
                  "w-full py-6 text-lg font-bold rounded-xl",
                  canInstall 
                    ? "bg-primary hover:bg-primary/90 text-white" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {!canInstall 
                  ? (direction === 'rtl' ? 'التطبيق متوفر فقط على الموبايل' : 'Available on mobile only') 
                  : (direction === 'rtl' ? 'تنزيل الآن' : 'Download Now')}
              </Button>

              <div className="mt-8 p-4 bg-background/50 rounded-lg border border-border">
                <h4 className="font-bold mb-3 text-sm">{direction === 'rtl' ? 'المميزات:' : 'Features:'}</h4>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{direction === 'rtl' ? 'تطبيق سريع وخفيف الوزن' : 'Fast and lightweight app'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{direction === 'rtl' ? 'يعمل بدون انترنت (Offline Mode)' : 'Works offline (Offline Mode)'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{direction === 'rtl' ? 'وصول سريع من الشاشة الرئيسية' : 'Quick access from home screen'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{direction === 'rtl' ? 'بدون إعلانات' : 'No ads'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">
                  {direction === 'rtl' 
                    ? '💡 اضغط على زر التنزيل لبدء التثبيت، أو استخدم قائمة المتصفح' 
                    : '💡 Tap the download button to start installation, or use your browser menu'}
                </p>
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{t.language}</h2>
            <div className="relative mb-6">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4", direction === 'rtl' ? "right-3" : "left-3")} />
              <Input 
                placeholder="Search" 
                className={cn("bg-card border-border", direction === 'rtl' ? "pr-10" : "pl-10")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                    language.code === lang.code 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-accent"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </div>
                  {language.code === lang.code && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      
      case "logout":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300 pb-20">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <LogOut className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'تسجيل الخروج' : 'Sign Out'}</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              {direction === 'rtl' 
                ? 'هل تريد تسجيل الخروج من حسابك؟ سيتم حذف جميع بيانات الجلسة.' 
                : 'Are you sure you want to sign out? All session data will be cleared.'}
            </p>
            <Button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-lg font-bold transition-all"
            >
              {direction === 'rtl' ? 'تسجيل الخروج' : 'Sign Out'}
            </Button>
          </div>
        );
    
      default:
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300 pb-20">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-6">
                    <SettingsIconForTab id={activeTab} className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
                <p className="text-muted-foreground max-w-md">
                    {direction === 'rtl' ? 'اختر عنصراً من القائمة لعرض الإعدادات' : 'Select an option from the menu'}
                </p>
            </div>
        );
    }
  };

  const SettingsIconForTab = ({ id, className }: { id: string | null, className?: string }) => {
      if (!id) return <LayoutDashboard className={className} />;
      
      for (const section of settingsMenuStructure) {
          const item = section.items.find(i => i.id === id);
          if (item) {
              const Icon = item.icon;
              return <Icon className={className} />;
          }
      }
      return <LayoutDashboard className={className} />;
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-screen bg-background overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className={cn(
            "w-full md:w-[320px] lg:w-[380px] flex flex-col border-e border-border bg-card/30 h-full",
            activeTab ? "hidden md:flex" : "flex"
        )}>
            <div className="p-6 pb-2">
                <h1 className="text-2xl font-bold">{t.title}</h1>
            </div>
            
            <ScrollArea className="flex-1 px-4">
                <div onClick={() => { navigate('/accounts-center'); }} className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-4 mb-6 mt-2 shadow-sm cursor-pointer hover:bg-primary/20 transition-all duration-300 group">
                    <div className="flex items-center gap-2 mb-3 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        <Monitor className="w-5 h-5 text-primary" />
                        <span className="font-bold text-sm">Novii</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{t.accounts_center}</h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                        {direction === 'rtl' ? 'إدارة حسابك وإعداداتك' : 'Manage your account and settings'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <User className="w-4 h-4" />
                        <span>{t.personal_details}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Shield className="w-4 h-4" />
                        <span>{t.password_security}</span>
                    </div>
                    <div className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent text-sm font-semibold mt-2 group-hover:underline cursor-pointer">
                        {direction === 'rtl' ? 'عرض المزيد' : 'See more'}
                    </div>
                </div>

                <div className="pb-32 space-y-6">
                    {settingsMenuStructure.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                                {(t as any)[section.sectionKey]}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    if (item.isLink && item.href) {
                                        return (
                                            <Link href={item.href} key={item.id}>
                                                <a className="w-full flex items-center gap-4 p-3 rounded-lg text-sm font-medium transition-colors text-left hover:bg-accent text-muted-foreground hover:text-foreground">
                                                    <item.icon className="w-5 h-5" />
                                                    <span className="flex-1">{(t as any)[item.labelKey]}</span>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground/50" />
                                                </a>
                                            </Link>
                                        )
                                    }
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-lg text-sm font-medium transition-colors text-left",
                                                activeTab === item.id 
                                                    ? "bg-secondary text-foreground" 
                                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="flex-1">{(t as any)[item.labelKey]}</span>
                                            {item.id === "language" && (
                                                <span className="text-xs text-muted-foreground mx-2 truncate max-w-[80px]">
                                                    {languages.find(l => l.code === language.code)?.nativeName}
                                                </span>
                                            )}
                                            <Chevron className="w-4 h-4 text-muted-foreground/50" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* Content Area */}
        <div className={cn(
            "flex-1 flex flex-col h-full overflow-y-auto bg-background",
            activeTab ? "flex" : "hidden md:flex"
        )}>
            <div className="p-4 sm:p-6 md:p-8 pb-20">
                {/* Mobile Header */}
                {activeTab && (
                  <div className="md:hidden mb-6 flex items-center gap-3">
                      <button
                          onClick={() => setActiveTab(null)}
                          className="hover:bg-accent rounded-lg p-2 transition-colors"
                      >
                          <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h1 className="text-xl font-bold">{t.title}</h1>
                  </div>
                )}
                
                {activeTab ? renderContent() : (
                  <div className="hidden md:flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-6">
                      <LayoutDashboard className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
                    <p className="text-muted-foreground">{direction === 'rtl' ? 'اختر عنصراً من القائمة لعرض الإعدادات' : 'Select an option from the menu'}</p>
                  </div>
                )}
            </div>
            
            <footer className="mt-auto py-6 sm:py-8 text-center text-xs text-muted-foreground border-t border-border mx-4 sm:mx-8">
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-2">
                    <span>Novii</span>
                    <span>{direction === 'rtl' ? 'حول' : 'About'}</span>
                    <span>{direction === 'rtl' ? 'المدونة' : 'Blog'}</span>
                    <span>{direction === 'rtl' ? 'الوظائف' : 'Jobs'}</span>
                    <span>{direction === 'rtl' ? 'المساعدة' : 'Help'}</span>
                    <span>API</span>
                    <span>{direction === 'rtl' ? 'الخصوصية' : 'Privacy'}</span>
                    <span>{direction === 'rtl' ? 'الشروط' : 'Terms'}</span>
                </div>
                <p>© 2025 NOVII</p>
            </footer>
        </div>

      </div>
    </Layout>
  );
}
