import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, BarChart3, AlertCircle, Trash2, Shield, Ban, LogOut, CheckCircle, Star, 
  Edit2, Lock, Unlock, TrendingUp, Activity, Award, Zap, FileText, Settings, 
  Database, Clock, Flag, Eye, Crown, Trash, History, Search, Filter, Plus, X, Mail,
  Image, MessageCircle, UserPlus, Globe
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { useLocation } from "wouter";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type AdminTab = 'dashboard' | 'users' | 'badges' | 'content' | 'admins' | 'reports' | 'settings' | 'logs';

async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const authHeaders: Record<string, string> = {};
  if (session?.user?.id) authHeaders['x-user-id'] = session.user.id;
  if (session?.access_token) authHeaders['x-user-token'] = session.access_token;
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders, ...(options.headers as Record<string, string> || {}) },
  });
}

const translations = {
  en: {
    adminPanel: 'Admin Control Panel',
    dashboard: 'Dashboard',
    users: 'Users',
    badges: 'Badges',
    content: 'Content',
    admins: 'Admins',
    reports: 'Reports',
    settings: 'Settings',
    logs: 'Activity Logs',
    statistics: 'Platform Statistics',
    totalUsers: 'Total Users',
    totalPosts: 'Total Posts',
    activeUsers: 'Active Users',
    bannedUsers: 'Banned Users',
    userManagement: 'User Management',
    username: 'Username',
    fullName: 'Full Name',
    email: 'Email',
    bio: 'Bio',
    status: 'Status',
    actions: 'Actions',
    ban: 'Ban',
    unban: 'Unban',
    delete: 'Delete',
    active: 'Active',
    banned: 'Banned',
    noAccess: 'Access Denied',
    adminOnly: 'Only administrators can access this page',
    loading: 'Loading...',
    confirmBan: 'Ban User?',
    confirmDelete: 'Delete User?',
    areYouSure: 'Are you sure? This action cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    reason: 'Reason (optional)',
    verified: 'Verified',
    official: 'Official',
    creator: 'Creator',
    premium: 'Premium',
    popular: 'Popular',
    editUser: 'Edit User',
    selectBadges: 'Select Badges',
    save: 'Save',
    selectUser: 'Select a user to manage',
    updatedSuccessfully: 'Updated successfully!',
    errorUpdating: 'Error updating',
    location: 'Location',
    website: 'Website',
    makeAdmin: 'Make Admin',
    removeAdmin: 'Remove Admin',
    viewPosts: 'View Posts',
    flagPost: 'Flag Post',
    deletePost: 'Delete Post',
    reportedPosts: 'Reported Posts',
    adminsList: 'Active Admins',
    systemSettings: 'System Settings',
    recentActivity: 'Recent Activity',
    search: 'Search',
    filter: 'Filter',
    action: 'Action',
    timestamp: 'Timestamp',
    moderationLevel: 'Moderation Level',
    autoMod: 'Auto Moderation',
    enableAutoMod: 'Enable Auto Moderation',
    maintenanceMode: 'Maintenance Mode',
    enableMaintenance: 'Enable Maintenance',
    apiUsage: 'API Usage',
    databaseStatus: 'Database Status',
    healthy: 'Healthy',
    noPosts: 'No posts to moderate',
    noReports: 'No reports',
    noActivity: 'No recent activity',
    managePermissions: 'Manage Admin Permissions',
    adminRole: 'Admin Role',
    superAdmin: 'Super Admin',
    moderator: 'Moderator',
    manageUsers: 'Manage Users',
    manageContent: 'Manage Content',
    manageReports: 'Manage Reports',
    viewAnalytics: 'View Analytics',
    isActive: 'Is Active',
    editAdmin: 'Edit Admin',
    totalReports: 'Total Reports',
    totalCommunities: 'Communities',
    newUsersThisWeek: 'New This Week',
    contentModeration: 'Content Moderation',
    caption: 'Caption',
    postedBy: 'Posted by',
    date: 'Date',
    noPermission: 'You do not have permission for this action',
  },
  ar: {
    adminPanel: 'لوحة التحكم الإدارية',
    dashboard: 'لوحة التحكم',
    users: 'المستخدمين',
    badges: 'الشارات',
    content: 'المحتوى',
    admins: 'المسؤولين',
    reports: 'التقارير',
    settings: 'الإعدادات',
    logs: 'سجل النشاط',
    statistics: 'إحصائيات المنصة',
    totalUsers: 'إجمالي المستخدمين',
    totalPosts: 'إجمالي المنشورات',
    activeUsers: 'المستخدمين النشطين',
    bannedUsers: 'المستخدمين المحظورين',
    userManagement: 'إدارة المستخدمين',
    username: 'اسم المستخدم',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    bio: 'السيرة الذاتية',
    status: 'الحالة',
    actions: 'الإجراءات',
    ban: 'حظر',
    unban: 'إلغاء الحظر',
    delete: 'حذف',
    active: 'نشط',
    banned: 'محظور',
    noAccess: 'تم رفض الدخول',
    adminOnly: 'فقط المسؤولون يمكنهم الوصول لهذه الصفحة',
    loading: 'جاري التحميل...',
    confirmBan: 'حظر المستخدم؟',
    confirmDelete: 'حذف المستخدم؟',
    areYouSure: 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    reason: 'السبب (اختياري)',
    verified: 'موثق',
    official: 'رسمي',
    creator: 'منشئ محتوى',
    premium: 'بريميوم',
    popular: 'مشهور',
    editUser: 'تعديل المستخدم',
    selectBadges: 'اختر الشارات',
    save: 'حفظ',
    selectUser: 'اختر مستخدماً',
    updatedSuccessfully: 'تم التحديث بنجاح!',
    errorUpdating: 'خطأ في التحديث',
    location: 'الموقع',
    website: 'الموقع الشخصي',
    makeAdmin: 'جعل مسؤول',
    removeAdmin: 'إزالة من المسؤولين',
    viewPosts: 'عرض المنشورات',
    flagPost: 'وضع علامة على المنشور',
    deletePost: 'حذف المنشور',
    reportedPosts: 'المنشورات المبلغ عنها',
    adminsList: 'المسؤولين النشطين',
    systemSettings: 'إعدادات النظام',
    recentActivity: 'النشاط الأخير',
    search: 'بحث',
    filter: 'تصفية',
    action: 'الإجراء',
    timestamp: 'الوقت',
    moderationLevel: 'مستوى الرقابة',
    autoMod: 'الرقابة الآلية',
    enableAutoMod: 'تفعيل الرقابة الآلية',
    maintenanceMode: 'وضع الصيانة',
    enableMaintenance: 'تفعيل وضع الصيانة',
    apiUsage: 'استخدام API',
    databaseStatus: 'حالة قاعدة البيانات',
    healthy: 'سليمة',
    noPosts: 'لا توجد منشورات للرقابة عليها',
    noReports: 'لا توجد تقارير',
    noActivity: 'لا يوجد نشاط مؤخراً',
    managePermissions: 'إدارة صلاحيات المسؤول',
    adminRole: 'دور المسؤول',
    superAdmin: 'مسؤول أعلى',
    moderator: 'مراقب',
    manageUsers: 'إدارة المستخدمين',
    manageContent: 'إدارة المحتوى',
    manageReports: 'إدارة التقارير',
    viewAnalytics: 'عرض التحليلات',
    isActive: 'نشط',
    editAdmin: 'تعديل المسؤول',
    totalReports: 'إجمالي البلاغات',
    totalCommunities: 'المجتمعات',
    newUsersThisWeek: 'جدد هذا الأسبوع',
    contentModeration: 'إدارة المحتوى',
    caption: 'التعليق',
    postedBy: 'نشر بواسطة',
    date: 'التاريخ',
    noPermission: 'ليس لديك صلاحية لهذا الإجراء',
  }
};

const actionLabels: Record<string, { en: string; ar: string }> = {
  ban_user: { en: 'Banned user', ar: 'حظر مستخدم' },
  unban_user: { en: 'Unbanned user', ar: 'إلغاء حظر مستخدم' },
  delete_user: { en: 'Deleted user', ar: 'حذف مستخدم' },
  edit_user: { en: 'Edited user', ar: 'تعديل مستخدم' },
  add_admin: { en: 'Added admin', ar: 'إضافة مسؤول' },
  remove_admin: { en: 'Removed admin', ar: 'إزالة مسؤول' },
  edit_admin: { en: 'Edited admin', ar: 'تعديل مسؤول' },
  delete_post: { en: 'Deleted post', ar: 'حذف منشور' },
  update_setting: { en: 'Updated setting', ar: 'تحديث إعداد' },
};

export default function Admin() {
  const { user } = useAuth();
  const { language, direction } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const lang = language.code === 'ar' ? 'ar' : 'en';
  const t = translations[lang as keyof typeof translations];
  const isRTL = direction === "rtl";
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMakeAdminDialog, setShowMakeAdminDialog] = useState(false);
  const [showAdminPermissionsDialog, setShowAdminPermissionsDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("1h");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editData, setEditData] = useState({
    fullName: '',
    bio: '',
    website: '',
    location: '',
    isVerified: false,
    isOfficial: false,
    isCreator: false,
    isPremium: false,
    isPopular: false,
  });

  const [adminPermissions, setAdminPermissions] = useState({
    role: 'moderator',
    is_active: true,
    can_manage_users: false,
    can_manage_content: false,
    can_manage_admins: false,
    can_manage_reports: false,
    can_view_analytics: false,
    can_manage_settings: false,
  });

  const { data: adminCheck, isLoading: adminLoading } = useQuery({
    queryKey: ['admin/check', user?.id],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/check');
      return res.json();
    },
    enabled: !!user?.id,
  });

  const isAdmin = adminCheck?.isAdmin || false;
  const myAdminData = adminCheck?.admin;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin/stats'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/stats');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin/users'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/users');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: adminUsers = [], refetch: refetchAdmins } = useQuery({
    queryKey: ['admin/admins'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/admins');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['admin/content'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/content');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin && activeTab === 'content',
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['admin/reports'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/reports');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin && activeTab === 'reports',
  });

  const { data: adminLogs = [] } = useQuery({
    queryKey: ['admin/logs'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/logs');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin && activeTab === 'logs',
  });

  const { data: platformSettings = {} } = useQuery({
    queryKey: ['admin/settings'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/settings');
      if (!res.ok) return {};
      return res.json();
    },
    enabled: isAdmin && activeTab === 'settings',
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, ban, reason, duration }: { userId: string; ban: boolean; reason?: string; duration?: string }) => {
      const res = await adminFetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ ban, reason, duration }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      setShowBanDialog(false);
      setBanReason("");
      setBanDuration("1h");
      setSelectedUser(null);
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const editUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const res = await adminFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      setShowEditDialog(false);
      setSelectedUser(null);
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const addAdminMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      setShowMakeAdminDialog(false);
      setShowAdminPermissionsDialog(false);
      setSelectedUser(null);
      resetAdminPermissions();
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const editAdminMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const res = await adminFetch(`/api/admin/admins/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      setShowAdminPermissionsDialog(false);
      setSelectedAdmin(null);
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await adminFetch(`/api/admin/admins/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      setShowMakeAdminDialog(false);
      setSelectedUser(null);
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await adminFetch(`/api/admin/content/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/content'] });
      queryClient.invalidateQueries({ queryKey: ['admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin/logs'] });
      toast.success(t.updatedSuccessfully);
    },
    onError: () => toast.error(t.errorUpdating),
  });

  const filteredUsers = allUsers.filter((u: any) => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function resetAdminPermissions() {
    setAdminPermissions({
      role: 'moderator',
      is_active: true,
      can_manage_users: false,
      can_manage_content: false,
      can_manage_admins: false,
      can_manage_reports: false,
      can_view_analytics: false,
      can_manage_settings: false,
    });
  }

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditData({
      fullName: user.full_name || '',
      bio: user.bio || '',
      website: user.website || '',
      location: user.location || '',
      isVerified: user.is_verified || false,
      isOfficial: user.is_official || false,
      isCreator: user.is_creator || false,
      isPremium: user.is_premium || false,
      isPopular: user.is_popular || false,
    });
    setShowEditDialog(true);
  };

  const openAdminPermissionsDialog = (admin: any, isNew: boolean = false) => {
    setSelectedAdmin(isNew ? null : admin);
    if (isNew) {
      resetAdminPermissions();
    } else {
      setAdminPermissions({
        role: admin.role || 'moderator',
        is_active: admin.is_active ?? true,
        can_manage_users: admin.can_manage_users ?? false,
        can_manage_content: admin.can_manage_content ?? false,
        can_manage_admins: admin.can_manage_admins ?? false,
        can_manage_reports: admin.can_manage_reports ?? false,
        can_view_analytics: admin.can_view_analytics ?? false,
        can_manage_settings: admin.can_manage_settings ?? false,
      });
    }
    setShowAdminPermissionsDialog(true);
  };

  function formatDate(d: string) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  if (adminLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-8 h-8" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">{t.noAccess}</h1>
            <p className="text-muted-foreground mb-4">{t.adminOnly}</p>
            <Button onClick={() => setLocation('/')} variant="outline">
              {t.cancel}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/50">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">{t.adminPanel}</h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {myAdminData?.role === 'super_admin' ? (lang === 'ar' ? 'مسؤول أعلى' : 'Super Admin') : myAdminData?.role === 'admin' ? 'Admin' : (lang === 'ar' ? 'مراقب' : 'Moderator')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-gray-300"
              >
                <X className="w-4 h-4 mr-2" />
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg backdrop-blur border border-slate-700/50 overflow-x-auto">
              {(['dashboard', 'users', 'badges', 'content', 'admins', 'reports', 'settings', 'logs'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md font-semibold transition-all duration-300 whitespace-nowrap text-sm ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t[tab as keyof typeof t]}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                  <div className="col-span-4 flex justify-center py-8"><Spinner className="w-8 h-8" /></div>
                ) : (
                  <>
                    {[
                      { label: t.totalUsers, value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
                      { label: t.totalPosts, value: stats?.totalPosts || 0, icon: TrendingUp, color: 'green' },
                      { label: t.activeUsers, value: stats?.activeUsers || 0, icon: Activity, color: 'yellow' },
                      { label: t.bannedUsers, value: stats?.bannedUsers || 0, icon: Ban, color: 'red' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <Card key={label} className={`p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-${color}-500/50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400 font-medium">{label}</p>
                            <p className={`text-3xl font-bold bg-gradient-to-r from-${color}-400 to-${color}-400 bg-clip-text text-transparent mt-2`}>{value}</p>
                          </div>
                          <Icon className={`w-8 h-8 text-${color}-400 opacity-50`} />
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: t.adminsList, value: stats?.totalAdmins || 0, icon: Crown, color: 'purple' },
                  { label: t.totalReports, value: stats?.totalReports || 0, icon: Flag, color: 'orange' },
                  { label: t.totalCommunities, value: stats?.totalCommunities || 0, icon: Globe, color: 'cyan' },
                  { label: t.newUsersThisWeek, value: stats?.newUsersThisWeek || 0, icon: UserPlus, color: 'emerald' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label} className="p-6 bg-slate-800/50 border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-${color}-500/20 rounded-lg`}>
                        <Icon className={`w-6 h-6 text-${color}-400`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{label}</p>
                        <p className="text-2xl font-bold text-white">{value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Users Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-white">{t.userManagement}</h2>
                <div className="relative">
                  <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                  <Input 
                    placeholder={t.search} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} bg-slate-800 border-slate-700 text-white w-48`}
                  />
                </div>
              </div>

              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden backdrop-blur">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-slate-700">
                        <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.username}</th>
                        <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.fullName}</th>
                        <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.status}</th>
                        <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center">
                            <Spinner className="w-6 h-6 mx-auto" />
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u: any, idx: number) => (
                          <tr key={u.id} className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/20'}`}>
                            <td className="px-6 py-4 text-sm font-medium text-white">
                              <div className="flex items-center gap-2">
                                {adminUsers.some((a: any) => a.user_id === u.id) && (
                                  <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                )}
                                <span>{u.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{u.full_name || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${
                                u.is_banned
                                  ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                                  : 'bg-green-500/30 text-green-300 border border-green-500/50'
                              }`}>
                                {u.is_banned ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                {u.is_banned ? t.banned : t.active}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-1 flex-wrap">
                                <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); openAdminPermissionsDialog(u, true); setShowMakeAdminDialog(true); }} className="text-xs" title={adminUsers.some((a: any) => a.user_id === u.id) ? t.removeAdmin : t.makeAdmin}>
                                  <Crown className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant={u.is_banned ? "outline" : "destructive"} onClick={() => { setSelectedUser(u); setShowBanDialog(true); }} className="text-xs">
                                  <Ban className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(u)} className="text-xs">
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(u); setShowDeleteDialog(true); }} className="text-xs">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white">{t.selectBadges}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {selectedUser ? (
                  <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                    <div className="space-y-4">
                      <p className="text-lg font-bold text-white mb-4">{selectedUser.username}</p>
                      <div className="space-y-3">
                        {[
                          { key: 'isVerified', label: t.verified, icon: CheckCircle },
                          { key: 'isOfficial', label: t.official, icon: Shield },
                          { key: 'isCreator', label: t.creator, icon: Star },
                          { key: 'isPremium', label: t.premium, icon: Lock },
                          { key: 'isPopular', label: t.popular, icon: Award },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition">
                            <Checkbox
                              checked={(editData as any)[key]}
                              onCheckedChange={(checked) => setEditData({ ...editData, [key]: !!checked })}
                            />
                            <span className="text-sm font-medium text-white">{label}</span>
                          </label>
                        ))}
                      </div>
                      <Button
                        className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        onClick={() => editUserMutation.mutate({
                          userId: selectedUser.id,
                          data: {
                            full_name: editData.fullName || null,
                            bio: editData.bio || null,
                            website: editData.website || null,
                            location: editData.location || null,
                            is_verified: editData.isVerified,
                            is_official: editData.isOfficial,
                            is_creator: editData.isCreator,
                            is_premium: editData.isPremium,
                            is_popular: editData.isPopular,
                          }
                        })}
                        disabled={editUserMutation.isPending}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {t.save}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="lg:col-span-1 p-6 bg-slate-800/50 border-slate-700 text-center">
                    <p className="text-gray-400">{t.selectUser}</p>
                  </Card>
                )}
                
                <div className="lg:col-span-2">
                  <Card className="p-6 bg-slate-800/50 border-slate-700 h-full max-h-96 overflow-y-auto">
                    <h3 className="font-bold text-white mb-4">{t.userManagement}</h3>
                    <div className="space-y-2">
                      {filteredUsers.slice(0, 20).map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setEditData({
                              fullName: u.full_name || '', bio: u.bio || '', website: u.website || '', location: u.location || '',
                              isVerified: u.is_verified || false, isOfficial: u.is_official || false, isCreator: u.is_creator || false,
                              isPremium: u.is_premium || false, isPopular: u.is_popular || false,
                            });
                          }}
                          className={`w-full p-3 rounded-lg ${isRTL ? 'text-right' : 'text-left'} transition-all ${
                            selectedUser?.id === u.id ? 'border-2 border-purple-500 bg-purple-500/20' : 'border border-slate-700 bg-slate-700/20 hover:bg-slate-700/40'
                          }`}
                        >
                          <p className="font-medium text-white">{u.username}</p>
                          <p className="text-xs text-gray-400">{u.full_name || '-'}</p>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Content Moderation Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white">{t.contentModeration}</h2>
              {posts.length === 0 ? (
                <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-center">
                  <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">{t.noPosts}</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post: any) => (
                    <Card key={post.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                      {post.image_url && (
                        <div className="h-48 bg-slate-700">
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {(post.profiles?.username || '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{post.profiles?.username || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
                          </div>
                        </div>
                        {post.caption && (
                          <p className="text-sm text-gray-300 line-clamp-3">{post.caption}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">❤️ {post.likes_count || 0}</span>
                          <span className="flex items-center gap-1">💬 {post.comments_count || 0}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full text-xs"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          disabled={deletePostMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {t.deletePost}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin Management Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white">{t.adminsList}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminUsers.map((admin: any) => {
                  const adminProfile = allUsers.find((u: any) => u.id === admin.user_id);
                  return (
                    <Card key={admin.user_id} className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Crown className="w-5 h-5 text-yellow-400" />
                              <p className="font-bold text-white">{adminProfile?.username || 'Unknown'}</p>
                            </div>
                            <p className="text-sm text-gray-400">{adminProfile?.full_name || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                          <span className="text-xs font-medium text-gray-300">{t.adminRole}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            admin.role === 'super_admin' ? 'bg-red-500/30 text-red-300' : admin.role === 'admin' ? 'bg-purple-500/30 text-purple-300' : 'bg-blue-500/30 text-blue-300'
                          }`}>
                            {admin.role === 'super_admin' ? t.superAdmin : admin.role === 'admin' ? 'Admin' : t.moderator}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                          <span className="text-xs font-medium text-gray-300">{t.status}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            admin.is_active ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                          }`}>
                            {admin.is_active ? t.active : 'Inactive'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-400">
                          {admin.can_manage_users && <p>✓ {t.manageUsers}</p>}
                          {admin.can_manage_content && <p>✓ {t.manageContent}</p>}
                          {admin.can_manage_admins && <p>✓ {lang === 'ar' ? 'إدارة المسؤولين' : 'Manage Admins'}</p>}
                          {admin.can_manage_reports && <p>✓ {t.manageReports}</p>}
                          {admin.can_view_analytics && <p>✓ {t.viewAnalytics}</p>}
                          {admin.can_manage_settings && <p>✓ {lang === 'ar' ? 'إدارة الإعدادات' : 'Manage Settings'}</p>}
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-700">
                          <Button size="sm" variant="outline" onClick={() => openAdminPermissionsDialog(admin, false)} className="flex-1 text-xs">
                            <Edit2 className="w-3 h-3 mr-1" />
                            {t.editAdmin}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(adminProfile); removeAdminMutation.mutate(admin.user_id); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white">{t.reportedPosts}</h2>
              {reports.length === 0 ? (
                <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-center">
                  <Flag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">{t.noReports}</p>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-slate-700">
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>ID</th>
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.reason}</th>
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.status}</th>
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.date}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((r: any, idx: number) => (
                          <tr key={r.id} className={`border-b border-slate-700/50 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/20'}`}>
                            <td className="px-6 py-4 text-sm text-gray-300 font-mono">{r.id?.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{r.reason || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                r.status === 'resolved' ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'
                              }`}>{r.status || 'pending'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white">{t.systemSettings}</h2>
              <Card className="p-6 bg-slate-800/50 border-slate-700 space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="font-semibold text-white">{t.autoMod}</p>
                      <p className="text-xs text-gray-400">{t.enableAutoMod}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={platformSettings?.auto_moderation === 'true'}
                    onCheckedChange={(checked) => updateSettingMutation.mutate({ key: 'auto_moderation', value: String(!!checked) })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-semibold text-white">{t.maintenanceMode}</p>
                      <p className="text-xs text-gray-400">{t.enableMaintenance}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={platformSettings?.maintenance_mode === 'true'}
                    onCheckedChange={(checked) => updateSettingMutation.mutate({ key: 'maintenance_mode', value: String(!!checked) })}
                  />
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-gray-400 mb-1">{t.totalUsers}</p>
                      <p className="text-lg font-bold text-blue-400">{stats?.totalUsers || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-gray-400 mb-1">{t.totalPosts}</p>
                      <p className="text-lg font-bold text-green-400">{stats?.totalPosts || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-gray-400 mb-1">{t.databaseStatus}</p>
                      <p className="text-lg font-bold text-green-400">{t.healthy}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white">{t.recentActivity}</h2>
              {adminLogs.length === 0 ? (
                <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-center">
                  <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">{t.noActivity}</p>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-slate-700">
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{lang === 'ar' ? 'المسؤول' : 'Admin'}</th>
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.action}</th>
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
                          <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-300`}>{t.timestamp}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminLogs.map((log: any, idx: number) => (
                          <tr key={log.id} className={`border-b border-slate-700/50 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/20'}`}>
                            <td className="px-6 py-4 text-sm text-white font-medium">{log.profiles?.username || log.admin_user_id?.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className="px-2 py-1 rounded bg-slate-700/50 text-gray-300 text-xs font-medium">
                                {actionLabels[log.action]?.[lang] || log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{log.details || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(log.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Dialogs */}
        {/* Ban Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t.confirmBan}</DialogTitle>
              <DialogDescription className="text-gray-400">{selectedUser?.username} — {t.areYouSure}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input type="text" placeholder={t.reason} value={banReason} onChange={(e) => setBanReason(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              {!selectedUser?.is_banned && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{lang === 'ar' ? 'مدة الحظر' : 'Ban Duration'}</label>
                  <Select value={banDuration} onValueChange={setBanDuration}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="1h">{lang === 'ar' ? '1 ساعة' : '1 Hour'}</SelectItem>
                      <SelectItem value="3h">{lang === 'ar' ? '3 ساعات' : '3 Hours'}</SelectItem>
                      <SelectItem value="24h">{lang === 'ar' ? '1 يوم' : '1 Day'}</SelectItem>
                      <SelectItem value="7d">{lang === 'ar' ? '7 أيام' : '7 Days'}</SelectItem>
                      <SelectItem value="30d">{lang === 'ar' ? '30 يوم' : '30 Days'}</SelectItem>
                      <SelectItem value="1m">{lang === 'ar' ? 'شهر واحد' : '1 Month'}</SelectItem>
                      <SelectItem value="3m">{lang === 'ar' ? '3 أشهر' : '3 Months'}</SelectItem>
                      <SelectItem value="1y">{lang === 'ar' ? 'سنة واحدة' : '1 Year'}</SelectItem>
                      <SelectItem value="permanent">{lang === 'ar' ? 'دائم' : 'Permanent'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowBanDialog(false)}>{t.cancel}</Button>
                <Button variant="destructive" onClick={() => { if (selectedUser) banMutation.mutate({ userId: selectedUser.id, ban: !selectedUser.is_banned, reason: banReason, duration: banDuration }); }} disabled={banMutation.isPending}>
                  {banMutation.isPending ? <Spinner className="w-4 h-4" /> : t.confirm}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t.confirmDelete}</DialogTitle>
              <DialogDescription className="text-gray-400">{selectedUser?.username} — {t.areYouSure}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t.cancel}</Button>
              <Button variant="destructive" onClick={() => { if (selectedUser) deleteUserMutation.mutate(selectedUser.id); }} disabled={deleteUserMutation.isPending}>
                {deleteUserMutation.isPending ? <Spinner className="w-4 h-4" /> : t.confirm}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Make Admin Dialog */}
        <Dialog open={showMakeAdminDialog} onOpenChange={setShowMakeAdminDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {adminUsers.some((a: any) => a.user_id === selectedUser?.id) ? t.removeAdmin : t.makeAdmin}
              </DialogTitle>
              <DialogDescription className="text-gray-400">{selectedUser?.username}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMakeAdminDialog(false)}>{t.cancel}</Button>
              <Button
                className={`${adminUsers.some((a: any) => a.user_id === selectedUser?.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                onClick={() => {
                  if (adminUsers.some((a: any) => a.user_id === selectedUser?.id)) {
                    removeAdminMutation.mutate(selectedUser.id);
                  } else {
                    setShowAdminPermissionsDialog(true);
                  }
                }}
              >
                {t.confirm}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin Permissions Dialog */}
        <Dialog open={showAdminPermissionsDialog} onOpenChange={setShowAdminPermissionsDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{t.managePermissions}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">{t.adminRole}</label>
                <Select value={adminPermissions.role} onValueChange={(value) => setAdminPermissions({ ...adminPermissions, role: value })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="moderator">{t.moderator}</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">{t.superAdmin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition">
                <Checkbox checked={adminPermissions.is_active} onCheckedChange={(checked) => setAdminPermissions({ ...adminPermissions, is_active: !!checked })} />
                <span className="text-sm font-medium text-white">{t.isActive}</span>
              </label>

              <div className="space-y-3 pt-2 border-t border-slate-700">
                <p className="text-xs font-semibold text-gray-400 uppercase">{lang === 'ar' ? 'الصلاحيات' : 'Permissions'}</p>
                {[
                  { key: 'can_manage_users', label: t.manageUsers },
                  { key: 'can_manage_content', label: t.manageContent },
                  { key: 'can_manage_admins', label: lang === 'ar' ? 'إدارة المسؤولين' : 'Manage Admins' },
                  { key: 'can_manage_reports', label: t.manageReports },
                  { key: 'can_view_analytics', label: t.viewAnalytics },
                  { key: 'can_manage_settings', label: lang === 'ar' ? 'إدارة الإعدادات' : 'Manage Settings' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition">
                    <Checkbox checked={(adminPermissions as any)[key]} onCheckedChange={(checked) => setAdminPermissions({ ...adminPermissions, [key]: !!checked })} />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
                <Button variant="outline" onClick={() => setShowAdminPermissionsDialog(false)}>{t.cancel}</Button>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => {
                    if (selectedAdmin) {
                      editAdminMutation.mutate({ userId: selectedAdmin.user_id, data: adminPermissions });
                    } else if (selectedUser) {
                      addAdminMutation.mutate({ user_id: selectedUser.id, ...adminPermissions });
                    }
                  }}
                  disabled={addAdminMutation.isPending || editAdminMutation.isPending}
                >
                  {(addAdminMutation.isPending || editAdminMutation.isPending) ? <Spinner className="w-4 h-4" /> : t.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{t.editUser} — {selectedUser?.username}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t.fullName} value={editData.fullName} onChange={(e) => setEditData({ ...editData, fullName: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              <Input placeholder={t.bio} value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              <Input placeholder={t.website} value={editData.website} onChange={(e) => setEditData({ ...editData, website: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              <Input placeholder={t.location} value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>{t.cancel}</Button>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => {
                    if (selectedUser) editUserMutation.mutate({
                      userId: selectedUser.id,
                      data: {
                        full_name: editData.fullName || null, bio: editData.bio || null,
                        website: editData.website || null, location: editData.location || null,
                        is_verified: editData.isVerified, is_official: editData.isOfficial,
                        is_creator: editData.isCreator, is_premium: editData.isPremium, is_popular: editData.isPopular,
                      }
                    });
                  }}
                  disabled={editUserMutation.isPending}
                >
                  {editUserMutation.isPending ? <Spinner className="w-4 h-4" /> : t.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
