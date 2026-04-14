import { useEffect, useState } from "react";
import { fetchStats, type PlatformStats } from "@/lib/admin-api";
import { Users, FileText, Flag, Shield, TrendingUp, UserPlus, Ban, Globe } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return null;

  const cards = [
    { label: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "from-purple-500 to-indigo-600", bgColor: "bg-purple-50", textColor: "text-purple-600" },
    { label: "المستخدمين النشطين", value: stats.activeUsers, icon: TrendingUp, color: "from-emerald-500 to-teal-600", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
    { label: "المحظورين", value: stats.bannedUsers, icon: Ban, color: "from-red-500 to-rose-600", bgColor: "bg-red-50", textColor: "text-red-600" },
    { label: "المنشورات", value: stats.totalPosts, icon: FileText, color: "from-blue-500 to-cyan-600", bgColor: "bg-blue-50", textColor: "text-blue-600" },
    { label: "البلاغات", value: stats.totalReports, icon: Flag, color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50", textColor: "text-amber-600" },
    { label: "المجتمعات", value: stats.totalCommunities, icon: Globe, color: "from-teal-500 to-cyan-600", bgColor: "bg-teal-50", textColor: "text-teal-600" },
    { label: "المشرفين", value: stats.totalAdmins, icon: Shield, color: "from-violet-500 to-purple-600", bgColor: "bg-violet-50", textColor: "text-violet-600" },
    { label: "مستخدمين جدد (أسبوع)", value: stats.newUsersThisWeek, icon: UserPlus, color: "from-pink-500 to-rose-600", bgColor: "bg-pink-50", textColor: "text-pink-600" },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <p className="text-sm text-gray-500 mt-1">نظرة عامة على إحصائيات المنصة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{card.value.toLocaleString()}</p>
                </div>
                <div className={`${card.bgColor} p-2.5 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-16 bg-gray-100 rounded mt-3 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]" dir="rtl">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Flag className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">خطأ في تحميل البيانات</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md">{message}</p>
      </div>
    </div>
  );
}
