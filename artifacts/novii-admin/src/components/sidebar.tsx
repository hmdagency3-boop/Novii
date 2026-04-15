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
  BadgeCheck,
  UsersRound,
  ChevronRight,
  Menu,
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
      className={`flex flex-col h-screen bg-white border-r border-[#dbdbdb] transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-[245px]"
      }`}
    >
      <div className="flex items-center gap-3 px-5 h-[60px] border-b border-[#efefef]">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-[#262626]" />
          </button>
        ) : (
          <>
            <img
              src={`${import.meta.env.BASE_URL}novii_logo_transparent.png`}
              alt="Novii"
              className="w-7 h-7 object-contain shrink-0"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
              }}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[#262626] font-semibold text-[15px] leading-tight">Novii</span>
              <span className="text-[11px] text-[#8e8e8e] leading-tight">Admin Panel</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md hover:bg-[#f5f5f5] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#8e8e8e] rotate-180" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                isActive
                  ? "bg-[#f5f5f5] text-[#262626] font-semibold"
                  : "text-[#262626] hover:bg-[#fafafa]"
              }`}
              title={collapsed ? item.labelAr : undefined}
            >
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#262626] rounded-l-full" />
              )}
              <Icon
                className={`w-[22px] h-[22px] shrink-0 transition-all ${
                  isActive
                    ? "text-[#262626]"
                    : "text-[#262626] group-hover:scale-105"
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              {!collapsed && (
                <span className={`text-[14px] truncate ${isActive ? "font-semibold" : "font-normal"}`}>
                  {item.labelAr}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#efefef] p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="text-[11px] font-semibold text-[#262626]">
                  {(admin?.username || user?.email || "A").charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-[#262626] truncate">{admin?.username || user?.email}</span>
              <span className="text-[11px] text-[#8e8e8e] capitalize">{admin?.role?.replace("_", " ") || "Admin"}</span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#262626] hover:bg-[#fafafa] transition-colors"
          title="تسجيل خروج"
        >
          <LogOut className="w-[22px] h-[22px] shrink-0" strokeWidth={1.5} />
          {!collapsed && <span className="text-[14px]">تسجيل خروج</span>}
        </button>
      </div>
    </div>
  );
}
