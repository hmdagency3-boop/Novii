import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Flag,
  Settings,
  ScrollText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

export type TabId = "dashboard" | "users" | "content" | "communities" | "admins" | "reports" | "verification" | "settings" | "logs";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  openTabs: TabId[];
  onOpenTab: (tab: TabId) => void;
}

const menuItems: { id: TabId; label: string; labelAr: string; icon: React.ElementType; permission?: string }[] = [
  { id: "dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { id: "users", label: "Users", labelAr: "المستخدمين", icon: Users, permission: "can_manage_users" },
  { id: "content", label: "Content", labelAr: "المحتوى", icon: FileText, permission: "can_manage_content" },
  { id: "communities", label: "Communities", labelAr: "المجتمعات", icon: UsersRound, permission: "can_manage_content" },
  { id: "admins", label: "Admins", labelAr: "المشرفين", icon: Shield, permission: "can_manage_admins" },
  { id: "reports", label: "Reports", labelAr: "البلاغات", icon: Flag, permission: "can_manage_reports" },
  { id: "verification", label: "Verification", labelAr: "طلبات التوثيق", icon: BadgeCheck, permission: "can_manage_users" },
  { id: "settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, permission: "can_manage_settings" },
  { id: "logs", label: "Logs", labelAr: "السجلات", icon: ScrollText, permission: "can_view_analytics" },
];

export default function Sidebar({ activeTab, onTabChange, onOpenTab }: SidebarProps) {
  const { admin, logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (!admin) return false;
    if (admin.role === "super_admin") return true;
    return (admin as unknown as Record<string, boolean>)[permission] === true;
  };

  const handleClick = (id: TabId) => {
    onOpenTab(id);
    onTabChange(id);
  };

  return (
    <div
      className={`flex flex-col h-screen bg-[hsl(224,30%,14%)] border-r border-[hsl(224,25%,20%)] transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[hsl(224,25%,20%)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-sm tracking-tight">Novii Admin</span>
            <span className="text-[10px] text-slate-500 leading-none">Control Panel</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? "bg-purple-600/15 text-purple-400"
                  : "text-slate-400 hover:bg-[hsl(224,25%,18%)] hover:text-slate-200"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {!collapsed && (
                <span className="text-[13px] font-medium truncate">{item.labelAr}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[hsl(224,25%,20%)] p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-[hsl(224,25%,17%)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(admin?.username || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-semibold truncate">{admin?.username || user?.email}</span>
              <span className="text-[10px] text-purple-400 capitalize">{admin?.role?.replace("_", " ") || "Admin"}</span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Logout"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">تسجيل خروج</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-3 px-3 py-2 mt-1 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-[hsl(224,25%,18%)] transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
