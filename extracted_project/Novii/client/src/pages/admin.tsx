import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, BarChart3, AlertCircle, Trash2, Shield, Ban, LogOut, CheckCircle, Star, 
  Edit2, Lock, Unlock, TrendingUp, Activity, Award, Zap, FileText, Settings, 
  Database, Clock, Flag, Eye, Crown, Trash, History, Search, Filter, Plus, X, Mail
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type AdminTab = 'dashboard' | 'users' | 'badges' | 'content' | 'admins' | 'reports' | 'settings' | 'logs';

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
    errorUpdating: 'Error updating user',
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
  }
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
  const [autoMod, setAutoMod] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  
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

  // Check if user is admin
  const { data: isAdmin = false, isLoading: adminLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        return !!data;
      } catch (err) {
        console.error('❌ Admin query error:', err);
        return false;
      }
    },
    enabled: !!user?.id,
  });

  const profileLoading = adminLoading;

  const { data: allUsers = [], isLoading: usersLoading, refetch } = useQuery({
    queryKey: ['admin/users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*');
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: adminUsers = [], refetch: refetchAdmins } = useQuery({
    queryKey: ['admin/admins'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admins')
        .select('*');
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin/stats'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('posts_count, is_banned');
      
      if (!profiles) return { totalUsers: 0, totalPosts: 0, activeUsers: 0, bannedUsers: 0 };
      
      return {
        totalUsers: profiles.length,
        totalPosts: profiles.reduce((sum: number, p: any) => sum + (p.posts_count || 0), 0),
        activeUsers: profiles.filter((p: any) => !p.is_banned).length,
        bannedUsers: profiles.filter((p: any) => p.is_banned).length,
      };
    },
    enabled: isAdmin,
  });

  const filteredUsers = allUsers.filter((u: any) => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (profileLoading) {
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

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      let banUntil = null;
      
      if (!selectedUser.is_banned) {
        if (banDuration !== 'permanent') {
          const now = new Date();
          const durationStr = banDuration;
          const duration = parseInt(durationStr);
          const unit = durationStr.slice(-1);
          
          switch (unit) {
            case 'h': 
              now.setHours(now.getHours() + duration);
              break;
            case 'd': 
              now.setDate(now.getDate() + duration);
              break;
            case 'm': 
              now.setMonth(now.getMonth() + duration);
              break;
            case 'y': 
              now.setFullYear(now.getFullYear() + duration);
              break;
          }
          banUntil = now.toISOString();
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: !selectedUser.is_banned,
          banned_reason: !selectedUser.is_banned ? (banReason || null) : null,
          ban_until: !selectedUser.is_banned ? banUntil : null,
        })
        .eq('id', selectedUser.id);
      
      if (error) {
        console.error('❌ Ban error:', error);
        toast.error(`${t.errorUpdating}: ${error.message}`);
        return;
      }

      console.log('✅ User banned/unbanned successfully');
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.invalidateQueries({ queryKey: ['admin/users'] });
      await refetch();
      
      setShowBanDialog(false);
      setBanReason("");
      setBanDuration("1h");
      setSelectedUser(null);
      toast.success(t.updatedSuccessfully);
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(t.errorUpdating);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
      
      if (error) {
        console.error('❌ Delete error:', error);
        toast.error(`${t.errorUpdating}: ${error.message}`);
        return;
      }

      console.log('✅ User deleted successfully');
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.invalidateQueries({ queryKey: ['admin/users'] });
      await refetch();
      
      setShowDeleteDialog(false);
      setSelectedUser(null);
      toast.success(t.updatedSuccessfully);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t.errorUpdating);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      console.log('🔄 Updating user:', selectedUser.id, editData);
      
      const { error, data } = await supabase
        .from('profiles')
        .update({
          full_name: editData.fullName || null,
          bio: editData.bio || null,
          website: editData.website || null,
          location: editData.location || null,
          is_verified: editData.isVerified,
          is_official: editData.isOfficial,
          is_creator: editData.isCreator,
          is_premium: editData.isPremium,
          is_popular: editData.isPopular,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id)
        .select();

      console.log('📊 Update response - Data:', data, 'Error:', error);

      if (error) {
        console.error('❌ Update error:', error);
        toast.error(`${t.errorUpdating}: ${error.message}`);
        return;
      }

      console.log('✅ User updated successfully');
      
      // Wait and refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.invalidateQueries({ queryKey: ['admin/users'] });
      await refetch();
      
      setShowEditDialog(false);
      setSelectedUser(null);
      setEditData({
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
      
      toast.success(t.updatedSuccessfully);
    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast.error(t.errorUpdating);
    }
  };

  const handleMakeAdmin = async () => {
    if (!selectedUser) return;
    try {
      const isCurrentlyAdmin = adminUsers.some((a: any) => a.user_id === selectedUser.id);
      
      console.log('👤 User:', selectedUser.username, 'Is admin:', isCurrentlyAdmin);
      
      if (isCurrentlyAdmin) {
        // Remove admin
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('user_id', selectedUser.id);
        
        if (error) {
          console.error('❌ Remove admin error:', error);
          toast.error(`${t.errorUpdating}: ${error.message}`);
          return;
        }
        console.log('✅ Admin removed');
      } else {
        // Add admin with permissions
        const { error } = await supabase
          .from('admins')
          .insert({
            user_id: selectedUser.id,
            role: adminPermissions.role,
            is_active: adminPermissions.is_active,
            can_manage_users: adminPermissions.can_manage_users,
            can_manage_content: adminPermissions.can_manage_content,
            can_manage_admins: adminPermissions.can_manage_admins,
            can_manage_reports: adminPermissions.can_manage_reports,
            can_view_analytics: adminPermissions.can_view_analytics,
            can_manage_settings: adminPermissions.can_manage_settings,
          });
        
        if (error) {
          console.error('❌ Add admin error:', error);
          toast.error(`${t.errorUpdating}: ${error.message}`);
          return;
        }
        console.log('✅ Admin added with permissions');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.invalidateQueries({ queryKey: ['admin/admins'] });
      await refetchAdmins();
      
      setShowMakeAdminDialog(false);
      setShowAdminPermissionsDialog(false);
      setSelectedUser(null);
      
      // Reset permissions
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
      
      toast.success(t.updatedSuccessfully);
    } catch (error) {
      console.error('Error managing admin:', error);
      toast.error(t.errorUpdating);
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;
    try {
      console.log('🔧 Editing admin:', selectedAdmin.user_id, adminPermissions);
      
      const { error } = await supabase
        .from('admins')
        .update({
          role: adminPermissions.role,
          is_active: adminPermissions.is_active,
          can_manage_users: adminPermissions.can_manage_users,
          can_manage_content: adminPermissions.can_manage_content,
          can_manage_admins: adminPermissions.can_manage_admins,
          can_manage_reports: adminPermissions.can_manage_reports,
          can_view_analytics: adminPermissions.can_view_analytics,
          can_manage_settings: adminPermissions.can_manage_settings,
        })
        .eq('user_id', selectedAdmin.user_id);

      if (error) {
        console.error('❌ Edit admin error:', error);
        toast.error(`${t.errorUpdating}: ${error.message}`);
        return;
      }

      console.log('✅ Admin updated successfully');
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.invalidateQueries({ queryKey: ['admin/admins'] });
      await refetchAdmins();
      
      setShowAdminPermissionsDialog(false);
      setSelectedAdmin(null);
      toast.success(t.updatedSuccessfully);
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(t.errorUpdating);
    }
  };

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

  const openAdminPermissionsDialog = (admin: any, isNewAdmin: boolean = false) => {
    setSelectedAdmin(admin);
    if (isNewAdmin) {
      // Reset to defaults for new admin
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
    } else {
      // Load existing admin permissions
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
                  <p className="text-sm text-gray-400 mt-1">{lang === 'ar' ? 'إدارة شاملة للمنصة' : 'Complete Platform Management'}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  supabase.auth.signOut().then(() => setLocation('/auth'));
                }}
                className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </Button>
            </div>

            {/* Tabs - Modern Style */}
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
                  <Spinner className="w-8 h-8" />
                ) : (
                  <>
                    <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 font-medium">{t.totalUsers}</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2">{stats?.totalUsers || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-400 opacity-50" />
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 font-medium">{t.totalPosts}</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mt-2">{stats?.totalPosts || 0}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 font-medium">{t.activeUsers}</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mt-2">{stats?.activeUsers || 0}</p>
                        </div>
                        <Activity className="w-8 h-8 text-yellow-400 opacity-50" />
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 font-medium">{t.bannedUsers}</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mt-2">{stats?.bannedUsers || 0}</p>
                        </div>
                        <Ban className="w-8 h-8 text-red-400 opacity-50" />
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-slate-800/50 border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Crown className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{t.adminsList}</p>
                      <p className="text-2xl font-bold text-white">{adminUsers.length}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-slate-800/50 border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Database className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{t.databaseStatus}</p>
                      <p className="text-lg font-bold text-green-400">{t.healthy}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-slate-800/50 border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{lang === 'ar' ? 'حالة النظام' : 'System Status'}</p>
                      <p className="text-lg font-bold text-orange-400">{lang === 'ar' ? 'تشغيل' : 'Running'}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Users Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-white">{t.userManagement}</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder={t.search} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white w-48"
                    />
                  </div>
                </div>
              </div>

              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden backdrop-blur">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-slate-700">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t.username}</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t.fullName}</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t.status}</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{t.actions}</th>
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
                            <td className="px-6 py-4 text-sm font-medium text-white flex items-center gap-2">
                              {adminUsers.some((a: any) => a.user_id === u.id) && (
                                <Crown className="w-4 h-4 text-yellow-400" />
                              )}
                              {u.username}
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
                            <td className="px-6 py-4 text-sm flex gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(u);
                                  openAdminPermissionsDialog(u, true);
                                  setShowMakeAdminDialog(true);
                                }}
                                className="text-xs"
                                title={adminUsers.some((a: any) => a.user_id === u.id) ? 'Remove Admin' : 'Make Admin'}
                              >
                                <Crown className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant={u.is_banned ? "outline" : "destructive"}
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowBanDialog(true);
                                }}
                                className="text-xs"
                              >
                                <Ban className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(u)}
                                className="text-xs"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
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
                      <div>
                        <p className="text-lg font-bold text-white mb-4">{selectedUser.username}</p>
                        <div className="space-y-3">
                          {[
                            { key: 'isVerified', label: t.verified, icon: CheckCircle, color: 'blue' },
                            { key: 'isOfficial', label: t.official, icon: Shield, color: 'red' },
                            { key: 'isCreator', label: t.creator, icon: Star, color: 'yellow' },
                            { key: 'isPremium', label: t.premium, icon: Lock, color: 'purple' },
                            { key: 'isPopular', label: t.popular, icon: Award, color: 'orange' },
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition">
                              <Checkbox
                                checked={(editData as any)[key]}
                                onCheckedChange={(checked) =>
                                  setEditData({ ...editData, [key]: !!checked })
                                }
                              />
                              <span className="text-sm font-medium text-white">{label}</span>
                            </label>
                          ))}
                        </div>
                        <Button
                          className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          onClick={handleEditUser}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          {t.save}
                        </Button>
                      </div>
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
                      {filteredUsers.slice(0, 10).map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setEditData({
                              fullName: u.full_name || '',
                              bio: u.bio || '',
                              website: u.website || '',
                              location: u.location || '',
                              isVerified: u.is_verified || false,
                              isOfficial: u.is_official || false,
                              isCreator: u.is_creator || false,
                              isPremium: u.is_premium || false,
                              isPopular: u.is_popular || false,
                            });
                          }}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            selectedUser?.id === u.id
                              ? 'border-2 border-purple-500 bg-purple-500/20'
                              : 'border border-slate-700 bg-slate-700/20 hover:bg-slate-700/40'
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
              <h2 className="text-2xl font-bold text-white">{t.content}</h2>
              <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-center">
                <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">{t.noPosts}</p>
              </Card>
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

                        {/* Role Badge */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                          <span className="text-xs font-medium text-gray-300">{t.adminRole}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            admin.role === 'super_admin'
                              ? 'bg-red-500/30 text-red-300'
                              : 'bg-blue-500/30 text-blue-300'
                          }`}>
                            {admin.role === 'super_admin' ? t.superAdmin : t.moderator}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                          <span className="text-xs font-medium text-gray-300">{t.status}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            admin.is_active
                              ? 'bg-green-500/30 text-green-300'
                              : 'bg-red-500/30 text-red-300'
                          }`}>
                            {admin.is_active ? t.active : 'Inactive'}
                          </span>
                        </div>

                        {/* Permissions Summary */}
                        <div className="space-y-1 text-xs text-gray-400">
                          {admin.can_manage_users && <p>✓ {t.manageUsers}</p>}
                          {admin.can_manage_content && <p>✓ {t.manageContent}</p>}
                          {admin.can_manage_admins && <p>✓ {t.manageUsers} & Admins</p>}
                          {admin.can_manage_reports && <p>✓ {t.manageReports}</p>}
                          {admin.can_view_analytics && <p>✓ {t.viewAnalytics}</p>}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-slate-700">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdminPermissionsDialog(admin, false)}
                            className="flex-1 text-xs"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            {t.editAdmin}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(adminProfile);
                              setShowMakeAdminDialog(true);
                            }}
                          >
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
              <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-center">
                <Flag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">{t.noReports}</p>
              </Card>
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
                  <Checkbox checked={autoMod} onCheckedChange={(checked) => setAutoMod(checked === true)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-semibold text-white">{t.maintenanceMode}</p>
                      <p className="text-xs text-gray-400">{t.enableMaintenance}</p>
                    </div>
                  </div>
                  <Checkbox checked={maintenance} onCheckedChange={(checked) => setMaintenance(checked === true)} />
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-gray-400 mb-1">{t.apiUsage}</p>
                      <p className="text-lg font-bold text-blue-400">842 / 1000</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-gray-400 mb-1">{lang === 'ar' ? 'الطلبات اليومية' : 'Daily Requests'}</p>
                      <p className="text-lg font-bold text-green-400">2,354</p>
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
              <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-center">
                <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">{t.noActivity}</p>
              </Card>
            </div>
          )}
        </div>

        {/* Dialogs */}
        {/* Ban Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t.confirmBan}</DialogTitle>
              <DialogDescription className="text-gray-400">{t.areYouSure}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder={t.reason}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              {!selectedUser?.is_banned && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {lang === 'ar' ? 'مدة الحظر' : 'Ban Duration'}
                  </label>
                  <Select value={banDuration} onValueChange={setBanDuration}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
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
                <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                  {t.cancel}
                </Button>
                <Button variant="destructive" onClick={handleBanUser}>
                  {t.confirm}
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
              <DialogDescription className="text-gray-400">{t.areYouSure}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                {t.cancel}
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                {t.confirm}
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
            </DialogHeader>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMakeAdminDialog(false)}>
                {t.cancel}
              </Button>
              <Button 
                className={`${adminUsers.some((a: any) => a.user_id === selectedUser?.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                onClick={() => {
                  if (!adminUsers.some((a: any) => a.user_id === selectedUser?.id)) {
                    // Show permissions dialog for new admin
                    setShowAdminPermissionsDialog(true);
                  } else {
                    // Just remove admin
                    handleMakeAdmin();
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
          <DialogContent className="bg-slate-900 border-slate-700 max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{t.managePermissions}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Admin Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">{t.adminRole}</label>
                <Select value={adminPermissions.role} onValueChange={(value) => 
                  setAdminPermissions({ ...adminPermissions, role: value as any })
                }>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="moderator">{t.moderator}</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">{t.superAdmin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Is Active */}
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition">
                <Checkbox
                  checked={adminPermissions.is_active}
                  onCheckedChange={(checked) =>
                    setAdminPermissions({ ...adminPermissions, is_active: !!checked })
                  }
                />
                <span className="text-sm font-medium text-white">{t.isActive}</span>
              </label>

              {/* Permissions */}
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
                    <Checkbox
                      checked={(adminPermissions as any)[key]}
                      onCheckedChange={(checked) =>
                        setAdminPermissions({ ...adminPermissions, [key]: !!checked })
                      }
                    />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
                <Button variant="outline" onClick={() => setShowAdminPermissionsDialog(false)}>
                  {t.cancel}
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => {
                    if (selectedAdmin) {
                      // Editing existing admin
                      handleEditAdmin();
                    } else {
                      // Creating new admin
                      handleMakeAdmin();
                    }
                  }}
                >
                  {t.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{t.editUser}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={t.fullName}
                value={editData.fullName}
                onChange={(e) =>
                  setEditData({ ...editData, fullName: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                placeholder={t.bio}
                value={editData.bio}
                onChange={(e) =>
                  setEditData({ ...editData, bio: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                placeholder={t.website}
                value={editData.website}
                onChange={(e) =>
                  setEditData({ ...editData, website: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                placeholder={t.location}
                value={editData.location}
                onChange={(e) =>
                  setEditData({ ...editData, location: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  {t.cancel}
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={handleEditUser}
                >
                  {t.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
