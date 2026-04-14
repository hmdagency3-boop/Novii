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
  Trash2, UserPlus, UserX, Settings, AlertCircle, CheckCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStatistics, useUserDevices, useRemoveDevice, useTrustDevice, useRevokeAllDevices, useDeviceHeartbeat } from "@/hooks/use-data";
import type { UserDevice } from "@/lib/api";
import { changePassword, type UserSettings, type StoredUser } from "@/lib/settings-storage";
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

function getDeviceIcon(deviceType: string, osName: string) {
  if (deviceType === 'mobile') return Smartphone;
  if (deviceType === 'tablet') return Smartphone;
  return Monitor;
}

function getTimeAgo(date: string, direction: string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (direction === 'rtl') {
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return d.toLocaleDateString('ar');
  }
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en');
}

function ConnectedDevicesSection({ direction, user }: { direction: string; user?: any }) {
  const { data: devices, isLoading } = useUserDevices(user?.id);
  const removeDevice = useRemoveDevice();
  const trustDevice = useTrustDevice();
  const revokeAll = useRevokeAllDevices();

  const currentSessionToken = (() => {
    try { return sessionStorage.getItem('novii_device_session'); } catch (_) { return null; }
  })();

  const isCurrentDevice = (device: UserDevice) =>
    currentSessionToken && device.session_token === currentSessionToken;

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeDevice.mutateAsync(deviceId);
      toast.success(direction === 'rtl' ? 'تم إزالة الجهاز بنجاح' : 'Device removed');
    } catch (error) {
      toast.error(direction === 'rtl' ? 'خطأ في إزالة الجهاز' : 'Failed to remove device');
    }
  };

  const handleTrustToggle = async (device: UserDevice) => {
    try {
      await trustDevice.mutateAsync({ deviceId: device.id, trusted: !device.is_trusted });
      toast.success(
        direction === 'rtl'
          ? (device.is_trusted ? 'تم إلغاء الثقة بالجهاز' : 'تم تأمين الجهاز كموثوق')
          : (device.is_trusted ? 'Device untrusted' : 'Device trusted')
      );
    } catch (error) {
      toast.error(direction === 'rtl' ? 'خطأ في تحديث حالة الجهاز' : 'Failed to update device');
    }
  };

  const handleRevokeAll = async () => {
    if (!user?.id) return;
    const currentDevice = devices?.find(d => isCurrentDevice(d));
    try {
      await revokeAll.mutateAsync({ userId: user.id, exceptDeviceId: currentDevice?.id });
      toast.success(direction === 'rtl' ? 'تم تسجيل الخروج من جميع الأجهزة الأخرى' : 'Logged out from all other devices');
    } catch (error) {
      toast.error(direction === 'rtl' ? 'خطأ في تسجيل الخروج' : 'Failed to log out devices');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const currentDevice = devices?.find(d => isCurrentDevice(d));
  const otherDevices = devices?.filter(d => !isCurrentDevice(d)) || [];

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">{direction === 'rtl' ? 'الأجهزة المتصلة' : 'Connected Devices'}</h2>
        {devices && devices.length > 1 && (
          <button
            onClick={handleRevokeAll}
            disabled={revokeAll.isPending}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
          >
            {direction === 'rtl' ? 'تسجيل خروج الكل' : 'Log out all'}
          </button>
        )}
      </div>
      <p className="text-muted-foreground mb-6 text-sm">
        {direction === 'rtl'
          ? `الأجهزة النشطة على حسابك (${devices?.length || 0}/10)`
          : `Active devices on your account (${devices?.length || 0}/10)`}
      </p>

      {currentDevice && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {direction === 'rtl' ? 'هذا الجهاز' : 'This Device'}
          </p>
          <DeviceCard
            device={currentDevice}
            direction={direction}
            isCurrent={true}
            onRemove={handleRemoveDevice}
            onTrustToggle={handleTrustToggle}
            removeIsPending={removeDevice.isPending}
            trustIsPending={trustDevice.isPending}
          />
        </div>
      )}

      {otherDevices.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {direction === 'rtl' ? 'أجهزة أخرى' : 'Other Devices'}
          </p>
          <div className="space-y-3">
            {otherDevices.map((device: UserDevice) => (
              <DeviceCard
                key={device.id}
                device={device}
                direction={direction}
                isCurrent={false}
                onRemove={handleRemoveDevice}
                onTrustToggle={handleTrustToggle}
                removeIsPending={removeDevice.isPending}
                trustIsPending={trustDevice.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {(!devices || devices.length === 0) && (
        <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
          <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {direction === 'rtl' ? 'لا توجد أجهزة متصلة' : 'No devices connected'}
          </p>
        </div>
      )}
    </div>
  );
}

function DeviceCard({
  device,
  direction,
  isCurrent,
  onRemove,
  onTrustToggle,
  removeIsPending,
  trustIsPending,
}: {
  device: UserDevice;
  direction: string;
  isCurrent: boolean;
  onRemove: (id: string) => void;
  onTrustToggle: (d: UserDevice) => void;
  removeIsPending: boolean;
  trustIsPending: boolean;
}) {
  const Icon = getDeviceIcon(device.device_type, device.os_name);
  const lastActive = getTimeAgo(device.last_active_at, direction);
  const firstLogin = device.first_login_at ? new Date(device.first_login_at).toLocaleDateString(direction === 'rtl' ? 'ar' : 'en') : '';

  return (
    <div className={cn(
      "border rounded-2xl p-5 bg-card transition-all duration-200",
      isCurrent ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30",
      device.is_trusted && "border-green-500/30"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-xl flex-shrink-0",
          isCurrent ? "bg-primary/15" : "bg-muted"
        )}>
          <Icon className={cn("w-6 h-6", isCurrent ? "text-primary" : "text-muted-foreground")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-base truncate">{device.device_name}</h3>
            {isCurrent && (
              <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                {direction === 'rtl' ? 'هذا الجهاز' : 'THIS DEVICE'}
              </span>
            )}
            {device.is_trusted && (
              <span className="text-[10px] font-bold bg-green-500/15 text-green-600 px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                <Shield className="w-3 h-3" />
                {direction === 'rtl' ? 'موثوق' : 'TRUSTED'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-2">
            <p className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{device.browser} {device.browser_version}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Laptop className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{device.os_name} {device.os_version}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{device.city}, {device.country}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lastActive}</span>
            </p>
          </div>

          {(device.login_count > 1 || device.screen_resolution || device.timezone) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {device.login_count > 1 && (
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {direction === 'rtl' ? `${device.login_count} تسجيل دخول` : `${device.login_count} logins`}
                </span>
              )}
              {device.screen_resolution && (
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {device.screen_resolution}
                </span>
              )}
              {device.timezone && (
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {device.timezone}
                </span>
              )}
              {firstLogin && (
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {direction === 'rtl' ? `أول دخول: ${firstLogin}` : `First: ${firstLogin}`}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => onTrustToggle(device)}
            disabled={trustIsPending}
            title={direction === 'rtl' ? (device.is_trusted ? 'إلغاء الثقة' : 'تعيين كموثوق') : (device.is_trusted ? 'Untrust' : 'Trust')}
            className={cn(
              "p-2 rounded-lg transition-colors disabled:opacity-50",
              device.is_trusted
                ? "bg-green-500/10 hover:bg-green-500/20 text-green-600"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            <Shield className="w-4 h-4" />
          </button>
          {!isCurrent && (
            <button
              onClick={() => onRemove(device.id)}
              disabled={removeIsPending}
              title={direction === 'rtl' ? 'إزالة الجهاز' : 'Remove device'}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Statistics Component
function TimeSpentStats() {
  const { data: stats, isLoading } = useUserStatistics();
  const { direction } = useLanguage();
  const t = getTranslation(direction === 'rtl' ? 'ar' : 'en').settings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const totalEngagement = stats ? stats.likes_given + stats.comments_created : 0;
  const totalPosts = stats ? stats.posts_created + stats.posts_saved : 0;
  const totalActivity = stats ? stats.likes_given + stats.comments_created + stats.posts_created : 0;
  
  const engagementRatio = totalPosts > 0 ? (totalEngagement / totalPosts).toFixed(1) : '0';
  
  const isHyperActive = stats && stats.time_spent_seconds > 3600;
  const isVeryActive = stats && stats.time_spent_seconds > 1800;
  const isActive = stats && stats.time_spent_seconds > 600;
  
  const statItems = stats ? [
    { icon: Heart, label: direction === 'rtl' ? 'إعجابات' : 'Likes', value: stats.likes_given, color: 'from-red-500 to-red-600', bgColor: 'from-red-500/10 to-red-500/5', icon_color: 'text-red-500', accent: 'bg-red-500/20' },
    { icon: MessageCircle, label: direction === 'rtl' ? 'تعليقات' : 'Comments', value: stats.comments_created, color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-500/10 to-blue-500/5', icon_color: 'text-blue-500', accent: 'bg-blue-500/20' },
    { icon: TrendingUp, label: direction === 'rtl' ? 'منشورات' : 'Posts', value: stats.posts_created, color: 'from-purple-500 to-purple-600', bgColor: 'from-purple-500/10 to-purple-500/5', icon_color: 'text-purple-500', accent: 'bg-purple-500/20' },
    { icon: Bookmark, label: direction === 'rtl' ? 'محفوظ' : 'Saved', value: stats.posts_saved, color: 'from-amber-500 to-amber-600', bgColor: 'from-amber-500/10 to-amber-500/5', icon_color: 'text-amber-500', accent: 'bg-amber-500/20' },
  ] : [];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="relative mb-12 overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary via-purple-500 to-transparent opacity-30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500 via-red-500 to-transparent opacity-20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative p-8 md:p-16 text-center backdrop-blur-sm">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{direction === 'rtl' ? 'لوحة التحليلات' : 'Analytics Dashboard'}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 leading-tight">
            {direction === 'rtl' ? 'إحصائياتك الشاملة' : 'Your Analytics'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          const percentage = idx === 0 ? (stats!.likes_given / Math.max(totalEngagement, 1)) * 100 : 
                            idx === 1 ? (stats!.comments_created / Math.max(totalEngagement, 1)) * 100 :
                            idx === 2 ? (stats!.posts_created / Math.max(totalPosts, 1)) * 100 :
                            (stats!.posts_saved / Math.max(totalPosts, 1)) * 100;

          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-border/50 backdrop-blur-xl hover:border-primary/60 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", item.bgColor)} />
              
              <div className="relative p-7 md:p-9">
                <div className="flex items-start justify-between mb-8">
                  <div className={cn("p-4 rounded-2xl bg-background/40 backdrop-blur-lg border border-border/50 group-hover:scale-125 group-hover:shadow-lg transition-all duration-500 shadow-lg")}>
                    <Icon className={cn("w-7 h-7", item.icon_color)} />
                  </div>
                </div>
                
                <p className={cn("text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r", item.color, "bg-clip-text text-transparent leading-tight")}>
                  {item.value.toLocaleString()}
                </p>
                
                <p className="text-sm md:text-base font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </p>
              </div>
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
      { id: "account_privacy", labelKey: "account_privacy", icon: Lock },
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
    sectionKey: "security",
    items: [
      { id: "password", labelKey: "password", icon: Lock },
      { id: "connected_devices", labelKey: "connected_devices", icon: Smartphone },
    ]
  },
  {
    sectionKey: "account",
    items: [
      { id: "logout", labelKey: "logout", icon: LogOut },
    ]
  }
];

export default function SettingsPage() {
  const { language, setLanguage, direction } = useLanguage();
  const t = getTranslation(language.code).settings;
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { user, signOut } = useAuth();
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

  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

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

      case "account_privacy":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{t.account_privacy}</h2>
            <div className="space-y-6">
              <div className="border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{direction === 'rtl' ? 'حساب خاص' : 'Private Account'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {direction === 'rtl' ? 'فقط المتابعون المقبولون يمكنهم رؤية محتواك' : 'Only approved followers can see your posts and followers.'}
                    </p>
                  </div>
                  <ToggleSwitch checked={isPrivate} onCheckedChange={(checked) => { setIsPrivate(checked); }} />
                </div>
              </div>
              <div className="border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{direction === 'rtl' ? 'إخفاء حالة الاتصال' : 'Hide Online Status'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {direction === 'rtl' ? 'أخف حالة الاتصال من المستخدمين الآخرين' : 'Hide your online status from other users'}
                    </p>
                  </div>
                  <ToggleSwitch checked={settings.hide_online_status} onCheckedChange={(checked) => { updateSettings({ hide_online_status: checked }); }} />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-bold rounded-xl">
                {updateProfileMutation.isPending ? <><Spinner className="w-5 h-5 mr-2" />{direction === 'rtl' ? 'جاري الحفظ...' : 'Saving...'}</> : (direction === 'rtl' ? 'حفظ التغييرات' : 'Save Changes')}
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
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{direction === 'rtl' ? 'التوثيق' : 'Verification'}</h2>
            {profile?.is_verified ? (
              <div className="text-center py-12 border border-green-500/30 rounded-2xl bg-green-500/5">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{direction === 'rtl' ? 'حسابك موثّق' : 'Your Account is Verified'}</h3>
                <p className="text-sm text-muted-foreground">{direction === 'rtl' ? 'تم توثيق حسابك بنجاح' : 'Your account has been verified successfully'}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border border-border rounded-2xl p-6 bg-card">
                  <div className="flex items-center gap-3 mb-4"><BadgeCheck className="w-8 h-8 text-primary" /><h3 className="font-bold text-lg">{direction === 'rtl' ? 'طلب التوثيق' : 'Request Verification'}</h3></div>
                  <p className="text-sm text-muted-foreground mb-6">{direction === 'rtl' ? 'التوثيق متاح للحسابات التي تستوفي شروط معينة مثل عدد المتابعين والنشاط' : 'Verification is available for accounts that meet specific criteria like follower count and activity'}</p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm"><CheckCircle className={cn("w-4 h-4", (profile?.followers_count || 0) >= 100 ? "text-green-500" : "text-muted-foreground")} /><span>{direction === 'rtl' ? '100+ متابع' : '100+ followers'}</span></div>
                    <div className="flex items-center gap-2 text-sm"><CheckCircle className={cn("w-4 h-4", profile?.bio ? "text-green-500" : "text-muted-foreground")} /><span>{direction === 'rtl' ? 'بايو مكتمل' : 'Complete bio'}</span></div>
                    <div className="flex items-center gap-2 text-sm"><CheckCircle className={cn("w-4 h-4", profile?.avatar_url ? "text-green-500" : "text-muted-foreground")} /><span>{direction === 'rtl' ? 'صورة شخصية' : 'Profile photo'}</span></div>
                  </div>
                  <Button className="w-full" onClick={() => toast.success(direction === 'rtl' ? 'تم إرسال طلب التوثيق! سنراجعه قريباً' : 'Verification request sent! We\'ll review it soon')}>
                    {direction === 'rtl' ? 'إرسال طلب التوثيق' : 'Submit Verification Request'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case "password":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold">{direction === 'rtl' ? 'كلمة المرور الجديدة' : 'New Password'}</h3>
                <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData(p => ({...p, newPassword: e.target.value}))} placeholder={direction === 'rtl' ? 'أدخل كلمة مرور جديدة' : 'Enter new password'} className="bg-card border-border" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold">{direction === 'rtl' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</h3>
                <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(p => ({...p, confirmPassword: e.target.value}))} placeholder={direction === 'rtl' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'} className="bg-card border-border" />
              </div>
              {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                <p className="text-xs text-red-500">{direction === 'rtl' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'}</p>
              )}
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-500">{direction === 'rtl' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</p>
              )}
              <Button onClick={async () => {
                if (passwordData.newPassword.length < 6) { toast.error(direction === 'rtl' ? 'كلمة المرور قصيرة جداً' : 'Password too short'); return; }
                if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error(direction === 'rtl' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }
                setChangingPassword(true);
                try {
                  await changePassword(passwordData.newPassword);
                  toast.success(direction === 'rtl' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!');
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                } catch (err: any) { toast.error(err.message || (direction === 'rtl' ? 'فشل تغيير كلمة المرور' : 'Failed to change password')); }
                setChangingPassword(false);
              }} disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 6}
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-bold rounded-xl">
                {changingPassword ? <><Spinner className="w-5 h-5 mr-2" />{direction === 'rtl' ? 'جاري التغيير...' : 'Changing...'}</> : (direction === 'rtl' ? 'تغيير كلمة المرور' : 'Change Password')}
              </Button>
            </div>
          </div>
        );
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
      
      case "connected_devices":
        return <ConnectedDevicesSection direction={direction} user={user} />;

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
                <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-4 mb-6 mt-2 shadow-sm cursor-pointer hover:bg-primary/20 transition-all duration-300 group">
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
                <p>© 2025 NOVII FROM REPLIT</p>
            </footer>
        </div>

      </div>
    </Layout>
  );
}
