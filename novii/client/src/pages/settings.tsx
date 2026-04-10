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
import { useUserStatistics, useUserDevices, useRemoveDevice } from "@/hooks/use-data";
import type { UserDevice } from "@/lib/api";

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

// Connected Devices Component
function ConnectedDevicesSection({ direction, user }: { direction: string; user?: any }) {
  const { data: devices, isLoading } = useUserDevices(user?.id);
  const removeDevice = useRemoveDevice();

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeDevice.mutateAsync(deviceId);
      toast.success(direction === 'rtl' ? 'تم حذف الجهاز' : 'Device removed');
    } catch (error) {
      toast.error(direction === 'rtl' ? 'خطأ في حذف الجهاز' : 'Failed to remove device');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-2xl font-bold mb-2">{direction === 'rtl' ? 'الأجهزة المتصلة' : 'Connected Devices'}</h2>
      <p className="text-muted-foreground mb-8">
        {direction === 'rtl' 
          ? 'جميع الأجهزة التي تستخدمها لتسجيل الدخول إلى حسابك'
          : 'All devices where you are logged in to your account'}
      </p>

      {devices && devices.length > 0 ? (
        <div className="space-y-4">
          {devices.map((device: UserDevice) => (
            <div
              key={device.id}
              className="border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{device.device_name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>🌐 {device.browser} {device.browser_version}</p>
                      <p>💻 {device.os_name} {device.os_version}</p>
                      <p>📍 {device.city}, {device.country}</p>
                      <p>🔗 {device.ip_address}</p>
                      <p className="text-xs mt-2">
                        {direction === 'rtl' ? 'آخر نشاط:' : 'Last active:'} {new Date(device.last_active_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDevice(device.id)}
                  disabled={removeDevice.isPending}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
  const [gender, setGender] = useState("male");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [hideOnlineStatus, setHideOnlineStatus] = useState(false);

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    like_notifications: true,
    comment_notifications: true,
    follow_notifications: true,
  });

  const [messageSettings, setMessageSettings] = useState({
    everyone_can_message: false,
    followers_only: false,
    approved_followers_only: true,
  });

  const [commentSettings, setCommentSettings] = useState({
    everyone_can_comment: true,
    followers_only: false,
    no_comments: false,
  });

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
              <div className="space-y-4 border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{direction === 'rtl' ? 'حساب خاص' : 'Private Account'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {direction === 'rtl' 
                        ? 'عند تفعيل هذا الخيار، يمكنك التحكم في من يمكنه رؤية منشوراتك. سيتمكن المتابعون المقبولون فقط من رؤية محتواك والمتابعين الخاصين بك.' 
                        : 'When enabled, only approved followers can see your posts and followers.'}
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={isPrivate}
                    onCheckedChange={(checked) => {
                      setIsPrivate(checked);
                      if (checked) {
                        toast.success(direction === 'rtl' ? 'سيتم تفعيل الحساب الخاص' : 'Your account will be private');
                      } else {
                        toast.success(direction === 'rtl' ? 'سيتم جعل الحساب عام' : 'Your account will be public');
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4 border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{direction === 'rtl' ? 'إخفاء حالة الاتصال' : 'Hide Online Status'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {direction === 'rtl' 
                        ? 'أخف حالة الاتصال الخاصة بك من المستخدمين الآخرين' 
                        : 'Hide your online status from other users'}
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={hideOnlineStatus}
                    onCheckedChange={(checked) => {
                      setHideOnlineStatus(checked);
                      if (checked) {
                        toast.success(direction === 'rtl' ? 'سيتم إخفاء حالة الاتصال' : 'Your online status is hidden');
                      }
                    }}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-bold rounded-xl"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2" />
                    {direction === 'rtl' ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  direction === 'rtl' ? 'حفظ التغييرات' : 'Save Changes'
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
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="border border-border rounded-xl p-5 bg-card hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">
                      {direction === 'rtl' 
                        ? key === 'email_notifications' ? 'إشعارات البريد الإلكتروني' :
                          key === 'push_notifications' ? 'إشعارات الدفع' :
                          key === 'message_notifications' ? 'إشعارات الرسائل' :
                          key === 'like_notifications' ? 'إشعارات الإعجابات' :
                          key === 'comment_notifications' ? 'إشعارات التعليقات' :
                          'إشعارات المتابعة'
                        : key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}
                    </h3>
                  </div>
                  <ToggleSwitch 
                    checked={value}
                    onCheckedChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, [key]: checked }));
                    }}
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={() => {
                toast.success(direction === 'rtl' ? 'تم حفظ الإعدادات' : 'Settings saved');
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white py-6 mt-6 text-lg font-bold rounded-xl"
            >
              {direction === 'rtl' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        );

      case "messages":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'إعدادات الرسائل' : 'Message Settings'}</h2>
            
            <div className="space-y-4">
              {Object.entries(messageSettings).map(([key, value]) => (
                <div key={key} className="border border-border rounded-xl p-5 bg-card hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">
                      {direction === 'rtl' 
                        ? key === 'everyone_can_message' ? 'يمكن للجميع إرسال رسائل' :
                          key === 'followers_only' ? 'المتابعون فقط' :
                          'المتابعون المعتمدون فقط'
                        : key === 'everyone_can_message' ? 'Everyone can message' :
                          key === 'followers_only' ? 'Followers only' :
                          'Approved followers only'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {direction === 'rtl' ? 'التحكم في من يمكنه إرسال رسائل' : 'Control who can send you messages'}
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={value}
                    onCheckedChange={(checked) => {
                      setMessageSettings(prev => ({ 
                        ...prev, 
                        everyone_can_message: key === 'everyone_can_message' ? checked : false,
                        followers_only: key === 'followers_only' ? checked : false,
                        approved_followers_only: key === 'approved_followers_only' ? checked : prev.approved_followers_only
                      }));
                    }}
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={() => toast.success(direction === 'rtl' ? 'تم حفظ الإعدادات' : 'Settings saved')}
              className="w-full bg-primary hover:bg-primary/90 text-white py-6 mt-6 text-lg font-bold rounded-xl"
            >
              {direction === 'rtl' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        );

      case "comments":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'إعدادات التعليقات' : 'Comments Settings'}</h2>
            
            <div className="space-y-4">
              {Object.entries(commentSettings).map(([key, value]) => (
                <div key={key} className="border border-border rounded-xl p-5 bg-card hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">
                      {direction === 'rtl' 
                        ? key === 'everyone_can_comment' ? 'الجميع يمكنهم التعليق' :
                          key === 'followers_only' ? 'المتابعون فقط' :
                          'لا تعليقات'
                        : key === 'everyone_can_comment' ? 'Everyone can comment' :
                          key === 'followers_only' ? 'Followers only' :
                          'Disable comments'}
                    </h3>
                  </div>
                  <ToggleSwitch 
                    checked={value}
                    onCheckedChange={(checked) => {
                      setCommentSettings(prev => ({ 
                        ...prev, 
                        everyone_can_comment: key === 'everyone_can_comment' ? checked : false,
                        followers_only: key === 'followers_only' ? checked : false,
                        no_comments: key === 'no_comments' ? checked : false
                      }));
                    }}
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={() => toast.success(direction === 'rtl' ? 'تم حفظ الإعدادات' : 'Settings saved')}
              className="w-full bg-primary hover:bg-primary/90 text-white py-6 mt-6 text-lg font-bold rounded-xl"
            >
              {direction === 'rtl' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        );

      case "blocked":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'المستخدمون المحظورون' : 'Blocked Users'}</h2>
            
            <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
              <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {direction === 'rtl' ? 'لم تقم بحظر أي مستخدمين' : 'You haven\'t blocked any users yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {direction === 'rtl' ? 'قم بزيارة ملف تعريفي وأضفه إلى قائمة الحظر' : 'Visit a profile and add them to your blocked list'}
              </p>
            </div>
          </div>
        );

      case "close_friends":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'الأصدقاء المقربون' : 'Close Friends'}</h2>
            
            <div className="text-center py-12 border border-border rounded-2xl bg-card/50">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {direction === 'rtl' ? 'لم تضف أي أصدقاء مقربين بعد' : 'You haven\'t added any close friends yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {direction === 'rtl' ? 'أضف متابعين إلى قائمة أصدقائك المقربين' : 'Add followers to your close friends list'}
              </p>
            </div>
          </div>
        );

      case "hide_story":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{direction === 'rtl' ? 'إخفاء القصة' : 'Hide Story'}</h2>
            
            <div className="space-y-6">
              <div className="border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{direction === 'rtl' ? 'إخفاء قصتي' : 'Hide My Story'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {direction === 'rtl' 
                        ? 'أخف قصتك من جميع المستخدمين' 
                        : 'Hide your story from all users'}
                    </p>
                  </div>
                  <ToggleSwitch />
                </div>
              </div>

              <div className="border border-border rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{direction === 'rtl' ? 'إخفاء القصة من أشخاص معينين' : 'Hide Story From Specific People'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {direction === 'rtl' 
                        ? 'اختر من يمكنه رؤية قصتك' 
                        : 'Choose who can see your story'}
                    </p>
                  </div>
                  <ToggleSwitch />
                </div>
              </div>
            </div>
          </div>
        );

      case "tags":
      case "sharing":
      case "restricted":
      case "hidden_words":
      case "favorites":
      case "muted":
      case "content_pref":
      case "like_counts":
      case "archiving":
      case "accessibility":
      case "website_permissions":
      case "account_type":
      case "verified":
      case "help":
      case "privacy_center":
      case "about":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300 pb-20">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
              <Settings className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {direction === 'rtl' ? 'قيد التطوير' : 'Coming Soon'}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {direction === 'rtl' 
                ? 'هذا القسم سيتم تطويره قريباً. شكراً لصبرك!'
                : 'This section will be available soon. Thank you for your patience!'}
            </p>
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
