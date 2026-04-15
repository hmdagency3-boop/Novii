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
    { label: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "#0095f6" },
    { label: "المستخدمين النشطين", value: stats.activeUsers, icon: TrendingUp, color: "#00c853" },
    { label: "المحظورين", value: stats.bannedUsers, icon: Ban, color: "#ed4956" },
    { label: "المنشورات", value: stats.totalPosts, icon: FileText, color: "#5b51d8" },
    { label: "البلاغات", value: stats.totalReports, icon: Flag, color: "#ff9500" },
    { label: "المجتمعات", value: stats.totalCommunities, icon: Globe, color: "#00bcd4" },
    { label: "المشرفين", value: stats.totalAdmins, icon: Shield, color: "#833AB4" },
    { label: "مستخدمين جدد (أسبوع)", value: stats.newUsersThisWeek, icon: UserPlus, color: "#E1306C" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#262626]">لوحة التحكم</h1>
        <p className="text-[14px] text-[#8e8e8e] mt-0.5">نظرة عامة على إحصائيات المنصة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-[#dbdbdb] rounded-lg p-5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[13px] text-[#8e8e8e] font-normal leading-tight">{card.label}</p>
                  <p className="text-[28px] font-semibold text-[#262626] mt-2 leading-none">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} strokeWidth={1.5} />
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
    <div className="p-6 max-w-[1200px] mx-auto" dir="rtl">
      <div className="mb-6">
        <div className="h-6 w-32 bg-[#efefef] rounded animate-pulse" />
        <div className="h-4 w-56 bg-[#f5f5f5] rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#dbdbdb] rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-3.5 w-20 bg-[#efefef] rounded animate-pulse" />
                <div className="h-8 w-14 bg-[#f5f5f5] rounded mt-3 animate-pulse" />
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f5f5f5] animate-pulse" />
            </div>
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
        <div className="w-14 h-14 rounded-full bg-[#ed4956]/10 flex items-center justify-center mx-auto mb-3">
          <Flag className="w-6 h-6 text-[#ed4956]" />
        </div>
        <h3 className="text-[16px] font-semibold text-[#262626]">خطأ في تحميل البيانات</h3>
        <p className="text-[14px] text-[#8e8e8e] mt-1 max-w-md">{message}</p>
      </div>
    </div>
  );
}
