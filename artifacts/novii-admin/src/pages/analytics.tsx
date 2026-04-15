import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BarChart3, TrendingUp, Smartphone, Globe, Heart, Eye, MessageSquare, Users } from "lucide-react";

interface GrowthData { date: string; count: number; }
interface TopPost { id: string; caption: string; likes_count: number; comments_count: number; image_url: string; profiles?: { username: string; avatar_url: string } }
interface DeviceData { browsers: Record<string, number>; os: Record<string, number>; devices: Record<string, number>; countries: Record<string, number>; }

function StatBar({ items, color }: { items: [string, number][]; color: string }) {
  const max = Math.max(...items.map(i => i[1]), 1);
  return (
    <div className="space-y-2">
      {items.slice(0, 8).map(([name, count]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-[12px] text-[#262626] w-24 truncate text-left">{name}</span>
          <div className="flex-1 h-6 bg-[#fafafa] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="text-[12px] text-[#8e8e8e] w-10 text-left">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [growth, setGrowth] = useState<GrowthData[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const headers = { "Content-Type": "application/json", "x-user-token": token || "" };

  useEffect(() => {
    loadAll();
  }, [days]);

  async function loadAll() {
    setLoading(true);
    try {
      const [growthRes, topRes, devRes] = await Promise.all([
        fetch(`/api/admin/analytics/growth?days=${days}`, { headers }),
        fetch(`/api/admin/analytics/top-posts?limit=10`, { headers }),
        fetch(`/api/admin/analytics/devices`, { headers }),
      ]);
      if (growthRes.ok) setGrowth(await growthRes.json());
      if (topRes.ok) setTopPosts(await topRes.json());
      if (devRes.ok) setDeviceData(await devRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const maxGrowth = Math.max(...growth.map(g => g.count), 1);
  const totalNew = growth.reduce((s, g) => s + g.count, 0);

  const sortEntries = (obj: Record<string, number>) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">التحليلات المتقدمة</h1>
            <p className="text-[13px] text-[#8e8e8e]">إحصائيات تفصيلية للمنصة</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${days === d ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626]"}`}>
              {d} يوم
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#efefef] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-[#262626]">نمو المستخدمين</h2>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8e8e8e]" />
            <span className="text-sm font-bold text-[#262626]">+{totalNew}</span>
            <span className="text-[12px] text-[#8e8e8e]">في آخر {days} يوم</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-40">
          {growth.map((g) => (
            <div key={g.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-6 bg-[#262626] text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {g.date}: {g.count}
              </div>
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-sm min-h-[4px] transition-all hover:opacity-80"
                style={{ height: `${(g.count / maxGrowth) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-[#8e8e8e]">{growth[0]?.date}</span>
          <span className="text-[10px] text-[#8e8e8e]">{growth[growth.length - 1]?.date}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-[#efefef] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-[#262626]">أكثر المنشورات تفاعلاً</h2>
          </div>
          <div className="space-y-3">
            {topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#fafafa] transition-colors">
                <span className="text-[14px] font-bold text-[#8e8e8e] w-6">{i + 1}</span>
                {post.image_url && (
                  <img src={post.image_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#262626] truncate">{post.caption || "بدون وصف"}</p>
                  <span className="text-[11px] text-[#8e8e8e]">@{post.profiles?.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-[11px] text-[#8e8e8e]">{post.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-blue-400" />
                    <span className="text-[11px] text-[#8e8e8e]">{post.comments_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {deviceData && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#efefef] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-purple-500" />
                <h2 className="font-semibold text-[#262626]">المتصفحات</h2>
              </div>
              <StatBar items={sortEntries(deviceData.browsers)} color="bg-purple-500" />
            </div>

            <div className="bg-white rounded-xl border border-[#efefef] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-[#262626]">أنظمة التشغيل</h2>
              </div>
              <StatBar items={sortEntries(deviceData.os)} color="bg-blue-500" />
            </div>

            <div className="bg-white rounded-xl border border-[#efefef] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-green-500" />
                <h2 className="font-semibold text-[#262626]">الدول</h2>
              </div>
              <StatBar items={sortEntries(deviceData.countries)} color="bg-green-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
