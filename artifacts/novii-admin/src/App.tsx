import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoginPage from "@/pages/login";
import Sidebar, { type TabId } from "@/components/sidebar";
import TabBar from "@/components/tab-bar";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import ContentPage from "@/pages/content";
import CommunitiesPage from "@/pages/communities";
import AdminsPage from "@/pages/admins";
import ReportsPage from "@/pages/reports";
import VerificationPage from "@/pages/verification";
import AppealsPage from "@/pages/appeals";
import SettingsPage from "@/pages/settings";
import LogsPage from "@/pages/logs";

const pageComponents: Record<TabId, React.FC> = {
  dashboard: DashboardPage,
  users: UsersPage,
  content: ContentPage,
  communities: CommunitiesPage,
  admins: AdminsPage,
  reports: ReportsPage,
  verification: VerificationPage,
  appeals: AppealsPage,
  settings: SettingsPage,
  logs: LogsPage,
};

function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const [openTabs, setOpenTabs] = useState<TabId[]>(["dashboard"]);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const handleOpenTab = useCallback((tab: TabId) => {
    setOpenTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  }, []);

  const handleCloseTab = useCallback(
    (tab: TabId) => {
      if (tab === "dashboard") return;
      setOpenTabs((prev) => prev.filter((t) => t !== tab));
      if (activeTab === tab) {
        setActiveTab("dashboard");
      }
    },
    [activeTab]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
          <p className="text-[#8e8e8e] text-[14px]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <LoginPage />;
  }

  const ActivePage = pageComponents[activeTab] || DashboardPage;

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openTabs={openTabs}
        onOpenTab={handleOpenTab}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TabBar
          openTabs={openTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCloseTab={handleCloseTab}
        />
        <main className="flex-1 overflow-y-auto bg-[#fafafa]">
          <ActivePage />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminPanel />
    </AuthProvider>
  );
}

export default App;
