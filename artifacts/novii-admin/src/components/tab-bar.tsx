import { X } from "lucide-react";
import type { TabId } from "./sidebar";

const tabLabels: Record<TabId, string> = {
  dashboard: "لوحة التحكم",
  users: "المستخدمين",
  content: "المحتوى",
  admins: "المشرفين",
  reports: "البلاغات",
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
    <div className="flex items-center bg-[hsl(220,18%,95%)] border-b border-[hsl(220,15%,88%)] h-10 px-1 overflow-x-auto scrollbar-thin">
      {openTabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <div
            key={tab}
            className={`group flex items-center gap-2 px-4 h-9 rounded-t-lg cursor-pointer transition-all duration-150 min-w-0 shrink-0 ${
              isActive
                ? "bg-white border border-b-0 border-[hsl(220,15%,88%)] -mb-px text-gray-800"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            }`}
            onClick={() => onTabChange(tab)}
          >
            <span className="text-[13px] font-medium truncate">{tabLabels[tab]}</span>
            {tab !== "dashboard" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all"
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
