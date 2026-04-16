import { X } from "lucide-react";
import type { TabId } from "./sidebar";

const tabLabels: Record<TabId, string> = {
  dashboard: "لوحة التحكم",
  users: "المستخدمين",
  content: "المنشورات",
  stories: "القصص",
  reels: "الريلز",
  communities: "المجتمعات",
  admins: "المشرفين",
  reports: "البلاغات",
  verification: "طلبات التوثيق",
  appeals: "الاستئنافات",
  analytics: "التحليلات",
  announcements: "الإعلانات",
  security: "الأمان",
  hashtags: "الهاشتاقات",
  "content-filter": "فلتر المحتوى",
  algorithm: "الخوارزمية",
  settings: "الإعدادات",
  logs: "السجلات",
};

interface TabBarProps {
  openTabs: TabId[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onCloseTab: (tab: TabId) => void;
}

export default function TabBar({ openTabs, activeTab, onTabChange, onCloseTab }: TabBarProps) {
  return (
    <div className="flex items-center bg-white border-b border-[#dbdbdb] h-[44px] px-2 overflow-x-auto scrollbar-thin gap-0.5">
      {openTabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <div
            key={tab}
            className={`group flex items-center gap-1.5 px-3.5 h-[34px] rounded-md cursor-pointer transition-all duration-150 min-w-0 shrink-0 select-none ${
              isActive
                ? "bg-[#efefef] text-[#262626]"
                : "text-[#8e8e8e] hover:text-[#262626] hover:bg-[#fafafa]"
            }`}
            onClick={() => onTabChange(tab)}
          >
            <span className={`text-[13px] truncate ${isActive ? "font-semibold" : "font-normal"}`}>
              {tabLabels[tab]}
            </span>
            {tab !== "dashboard" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#dbdbdb] transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
