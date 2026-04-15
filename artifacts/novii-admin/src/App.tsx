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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(224,30%,12%)] via-[hsl(250,25%,18%)] to-[hsl(224,30%,14%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <LoginPage />;
  }

  const ActivePage = pageComponents[activeTab] || DashboardPage;

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(220,20%,97%)]">
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
        <main className="flex-1 overflow-y-auto">
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
