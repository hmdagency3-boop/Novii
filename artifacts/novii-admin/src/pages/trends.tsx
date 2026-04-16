import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, TrendingDown, BarChart3, Hash, Users, FileText, Video,
  Star, StarOff, RefreshCw, ArrowUp, ArrowDown, Minus, Flame, Eye,
  Heart, MessageCircle, Zap, Clock, ChevronDown, Search
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface TrendsData {
  period_days: number;
  overview: {
    total_posts: number;
    total_reels: number;
    post_engagement_growth: number;
    reel_engagement_growth: number;
    total_engagement: number;
  };
  trending_words: { word: string; count: number; prev_count: number; growth: number }[];
  trending_posts: any[];
  trending_reels: any[];
  trending_accounts: any[];
  trending_hashtags: any[];
  predicted_trends: { word: string; count: number; growth: number; prediction: string }[];
  featured: { posts: any[]; reels: any[]; accounts: any[] };
}

type Section = "overview" | "words" | "posts" | "reels" | "accounts" | "hashtags" | "predictions" | "featured";

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");

  const loadTrends = () => {
    setLoading(true);
    adminFetch<TrendsData>(`/trends?days=${days}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTrends(); }, [days]);

  async function toggleFeaturePost(id: string, featured: boolean) {
    await adminFetch(`/content/${id}/feature`, { method: "POST", body: JSON.stringify({ featured }) });
    loadTrends();
  }

  async function toggleFeatureReel(id: string, featured: boolean) {
    await adminFetch(`/reels/${id}/feature`, { method: "POST", body: JSON.stringify({ featured }) });
    loadTrends();
  }

  async function toggleFeatureAccount(id: string, featured: boolean) {
    await adminFetch(`/users/${id}/feature`, { method: "POST", body: JSON.stringify({ featured }) });
    loadTrends();
  }

  async function toggleHashtagPin(id: string, pinned: boolean) {
    await adminFetch(`/hashtags/${id}`, { method: "PATCH", body: JSON.stringify({ is_pinned: pinned }) });
    loadTrends();
  }

  async function toggleHashtagBan(id: string, banned: boolean) {
    await adminFetch(`/hashtags/${id}`, { method: "PATCH", body: JSON.stringify({ is_banned: banned }) });
    loadTrends();
  }

  const sections: { id: Section; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview", label: "نظرة عامة", icon: BarChart3 },
    { id: "words", label: "الكلمات", icon: Search, count: data?.trending_words.length },
    { id: "posts", label: "البوستات", icon: FileText, count: data?.trending_posts.length },
    { id: "reels", label: "الريلز", icon: Video, count: data?.trending_reels.length },
    { id: "accounts", label: "الحسابات", icon: Users, count: data?.trending_accounts.length },
    { id: "hashtags", label: "الهاشتاقات", icon: Hash, count: data?.trending_hashtags.length },
    { id: "predictions", label: "التوقعات", icon: Zap, count: data?.predicted_trends.length },
    { id: "featured", label: "المعزّزين", icon: Star, count: data ? (data.featured.posts.length + data.featured.reels.length + data.featured.accounts.length) : 0 },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">متابعة الترندات</h1>
            <p className="text-[13px] text-[#8e8e8e]">تحليل وإدارة المحتوى الرائج</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-[#efefef] text-[13px] text-[#262626] border-none focus:outline-none"
          >
            <option value={1}>٢٤ ساعة</option>
            <option value={3}>٣ أيام</option>
            <option value={7}>أسبوع</option>
            <option value={14}>أسبوعين</option>
            <option value={30}>شهر</option>
          </select>
          <button onClick={loadTrends} className="p-2 rounded-full hover:bg-[#f5f5f5] transition-colors">
            <RefreshCw className={`w-5 h-5 text-[#262626] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
              section === s.id ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626] hover:bg-[#dbdbdb]"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
            {s.count !== undefined && (
              <span className={`text-[11px] ${section === s.id ? "text-white/70" : "text-[#8e8e8e]"}`}>{s.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#f5f5f5] rounded-lg animate-pulse" />)}
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-[#8e8e8e]">فشل في تحميل البيانات</div>
      ) : (
        <>
          {section === "overview" && <OverviewSection data={data} />}
          {section === "words" && <WordsSection words={data.trending_words} />}
          {section === "posts" && <PostsSection posts={data.trending_posts} onToggleFeature={toggleFeaturePost} />}
          {section === "reels" && <ReelsSection reels={data.trending_reels} onToggleFeature={toggleFeatureReel} />}
          {section === "accounts" && <AccountsSection accounts={data.trending_accounts} onToggleFeature={toggleFeatureAccount} />}
          {section === "hashtags" && <HashtagsSection hashtags={data.trending_hashtags} onTogglePin={toggleHashtagPin} onToggleBan={toggleHashtagBan} />}
          {section === "predictions" && <PredictionsSection predictions={data.predicted_trends} />}
          {section === "featured" && <FeaturedSection featured={data.featured} onTogglePost={toggleFeaturePost} onToggleReel={toggleFeatureReel} onToggleAccount={toggleFeatureAccount} />}
        </>
      )}
    </div>
  );
}

function GrowthBadge({ value }: { value: number }) {
  if (value > 0) return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#00c853]"><ArrowUp className="w-3 h-3" />+{value}%</span>;
  if (value < 0) return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#ed4956]"><ArrowDown className="w-3 h-3" />{value}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#8e8e8e]"><Minus className="w-3 h-3" />0%</span>;
}

function StatCard({ icon: Icon, label, value, growth, color }: { icon: React.ElementType; label: string; value: number | string; growth?: number; color: string }) {
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ background: `${color}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        {growth !== undefined && <GrowthBadge value={growth} />}
      </div>
      <p className="text-[22px] font-bold text-[#262626] tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-[12px] text-[#8e8e8e] mt-0.5">{label}</p>
    </div>
  );
}

function OverviewSection({ data }: { data: TrendsData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="بوستات" value={data.overview.total_posts} growth={data.overview.post_engagement_growth} color="#0095f6" />
        <StatCard icon={Video} label="ريلز" value={data.overview.total_reels} growth={data.overview.reel_engagement_growth} color="#833AB4" />
        <StatCard icon={Heart} label="إجمالي التفاعل" value={data.overview.total_engagement} color="#ed4956" />
        <StatCard icon={Flame} label="كلمات ترند" value={data.trending_words.length} color="#ff9500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#dbdbdb] rounded-xl p-4">
          <h3 className="text-[14px] font-semibold text-[#262626] mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-[#ff9500]" />أكثر الكلمات استخداماً</h3>
          <div className="space-y-2">
            {data.trending_words.slice(0, 8).map((w, i) => (
              <div key={w.word} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#8e8e8e] w-5 text-center">{i + 1}</span>
                  <span className="text-[14px] text-[#262626] font-medium">{w.word}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#8e8e8e] tabular-nums">{w.count}×</span>
                  <GrowthBadge value={w.growth} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#dbdbdb] rounded-xl p-4">
          <h3 className="text-[14px] font-semibold text-[#262626] mb-3 flex items-center gap-2"><Hash className="w-4 h-4 text-[#833AB4]" />أعلى الهاشتاقات</h3>
          <div className="space-y-2">
            {data.trending_hashtags.slice(0, 8).map((h: any, i: number) => (
              <div key={h.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#8e8e8e] w-5 text-center">{i + 1}</span>
                  <span className="text-[14px] text-[#262626] font-medium">#{h.name}</span>
                  {h.is_pinned && <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#0095f6]/10 text-[#0095f6] font-bold">مثبت</span>}
                </div>
                <span className="text-[12px] text-[#8e8e8e] tabular-nums">{h.posts_count} بوست</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.predicted_trends.length > 0 && (
        <div className="bg-gradient-to-r from-[#ff9500]/5 to-[#ff6b00]/5 border border-[#ff9500]/20 rounded-xl p-4">
          <h3 className="text-[14px] font-semibold text-[#262626] mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-[#ff9500]" />توقعات الانتشار</h3>
          <div className="flex flex-wrap gap-2">
            {data.predicted_trends.map((p) => (
              <span key={p.word} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium ${
                p.prediction === 'viral' ? 'bg-[#ed4956]/10 text-[#ed4956]' :
                p.prediction === 'rising_fast' ? 'bg-[#ff9500]/10 text-[#ff9500]' :
                'bg-[#00c853]/10 text-[#00c853]'
              }`}>
                {p.prediction === 'viral' ? <Flame className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {p.word}
                <span className="opacity-70">+{p.growth}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WordsSection({ words }: { words: TrendsData['trending_words'] }) {
  const maxCount = Math.max(...words.map(w => w.count), 1);
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#efefef]">
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-12">#</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الكلمة</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الاستخدام</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الفترة السابقة</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">النمو</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-[200px]">الانتشار</th>
          </tr>
        </thead>
        <tbody>
          {words.map((w, i) => (
            <tr key={w.word} className="border-b border-[#efefef] last:border-0 hover:bg-[#fafafa]">
              <td className="px-4 py-3 text-[13px] font-bold text-[#8e8e8e]">{i + 1}</td>
              <td className="px-4 py-3 text-[14px] font-semibold text-[#262626]">{w.word}</td>
              <td className="px-4 py-3 text-[14px] text-[#262626] tabular-nums">{w.count}</td>
              <td className="px-4 py-3 text-[14px] text-[#8e8e8e] tabular-nums">{w.prev_count}</td>
              <td className="px-4 py-3"><GrowthBadge value={w.growth} /></td>
              <td className="px-4 py-3">
                <div className="w-full bg-[#efefef] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#0095f6] to-[#833AB4] h-2 rounded-full transition-all" style={{ width: `${(w.count / maxCount) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostsSection({ posts, onToggleFeature }: { posts: any[]; onToggleFeature: (id: string, featured: boolean) => void }) {
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#efefef]">
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-12">#</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الكاتب</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">المحتوى</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">نقاط الترند</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">التفاعل</th>
            <th className="text-center px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-[60px]">تعزيز</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p, i) => (
            <tr key={p.id} className="border-b border-[#efefef] last:border-0 hover:bg-[#fafafa]">
              <td className="px-4 py-3">
                <span className={`text-[13px] font-bold ${i < 3 ? 'text-[#ff9500]' : 'text-[#8e8e8e]'}`}>{i + 1}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#833AB4] to-[#E1306C] p-[1px] shrink-0">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold">{(p.profiles?.username || '?')[0].toUpperCase()}</span>}
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-[#262626]">@{p.profiles?.username || '?'}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-[13px] text-[#262626] truncate max-w-[200px]">{p.caption || '—'}</p>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold bg-[#ff9500]/10 text-[#ff9500]">
                  <Flame className="w-3 h-3" />{p.trend_score}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-[12px] text-[#8e8e8e]">
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{p.likes_count}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{p.comments_count}</span>
                  <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{p.views_count}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onToggleFeature(p.id, !p.is_featured)}
                  className={`p-1.5 rounded-full transition-colors ${p.is_featured ? 'bg-[#ff9500]/10 text-[#ff9500]' : 'hover:bg-[#ff9500]/10 text-[#8e8e8e] hover:text-[#ff9500]'}`}
                  title={p.is_featured ? 'إلغاء التعزيز' : 'تعزيز'}
                >
                  {p.is_featured ? <Star className="w-4 h-4" fill="currentColor" /> : <StarOff className="w-4 h-4" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReelsSection({ reels, onToggleFeature }: { reels: any[]; onToggleFeature: (id: string, featured: boolean) => void }) {
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#efefef]">
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-12">#</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الكاتب</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الوصف</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">نقاط الترند</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">التفاعل</th>
            <th className="text-center px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-[60px]">تعزيز</th>
          </tr>
        </thead>
        <tbody>
          {reels.map((r, i) => (
            <tr key={r.id} className="border-b border-[#efefef] last:border-0 hover:bg-[#fafafa]">
              <td className="px-4 py-3">
                <span className={`text-[13px] font-bold ${i < 3 ? 'text-[#833AB4]' : 'text-[#8e8e8e]'}`}>{i + 1}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#833AB4] to-[#E1306C] p-[1px] shrink-0">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold">{(r.profiles?.username || '?')[0].toUpperCase()}</span>}
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-[#262626]">@{r.profiles?.username || '?'}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-[13px] text-[#262626] truncate max-w-[200px]">{r.caption || '—'}</p>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold bg-[#833AB4]/10 text-[#833AB4]">
                  <Flame className="w-3 h-3" />{r.trend_score}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-[12px] text-[#8e8e8e]">
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{r.likes_count}</span>
                  <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{r.views_count}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onToggleFeature(r.id, !r.is_featured)}
                  className={`p-1.5 rounded-full transition-colors ${r.is_featured ? 'bg-[#833AB4]/10 text-[#833AB4]' : 'hover:bg-[#833AB4]/10 text-[#8e8e8e] hover:text-[#833AB4]'}`}
                >
                  {r.is_featured ? <Star className="w-4 h-4" fill="currentColor" /> : <StarOff className="w-4 h-4" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccountsSection({ accounts, onToggleFeature }: { accounts: any[]; onToggleFeature: (id: string, featured: boolean) => void }) {
  const maxEng = Math.max(...accounts.map(a => a.total_engagement), 1);
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#efefef]">
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-12">#</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الحساب</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">إجمالي التفاعل</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">عدد المنشورات</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">متوسط التفاعل</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-[180px]">مستوى الترند</th>
            <th className="text-center px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-[60px]">تعزيز</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a, i) => (
            <tr key={a.user_id} className="border-b border-[#efefef] last:border-0 hover:bg-[#fafafa]">
              <td className="px-4 py-3">
                <span className={`text-[13px] font-bold ${i < 3 ? 'text-[#E1306C]' : 'text-[#8e8e8e]'}`}>{i + 1}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] to-[#E1306C] p-[1px] shrink-0">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(a.username || '?')[0].toUpperCase()}</span>}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-semibold text-[#262626]">{a.full_name || a.username}</span>
                      {a.is_verified && <span className="text-[#0095f6]">✓</span>}
                      {a.is_featured && <Star className="w-3 h-3 text-[#ff9500]" fill="#ff9500" />}
                    </div>
                    <span className="text-[11px] text-[#8e8e8e]" dir="ltr">@{a.username}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[14px] font-medium text-[#262626] tabular-nums">{a.total_engagement.toLocaleString()}</td>
              <td className="px-4 py-3 text-[14px] text-[#262626] tabular-nums">{a.content_count}</td>
              <td className="px-4 py-3 text-[14px] text-[#262626] tabular-nums">{a.avg_engagement.toLocaleString()}</td>
              <td className="px-4 py-3">
                <div className="w-full bg-[#efefef] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#E1306C] to-[#F77737] h-2 rounded-full transition-all" style={{ width: `${(a.total_engagement / maxEng) * 100}%` }} />
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onToggleFeature(a.user_id, !a.is_featured)}
                  className={`p-1.5 rounded-full transition-colors ${a.is_featured ? 'bg-[#ff9500]/10 text-[#ff9500]' : 'hover:bg-[#ff9500]/10 text-[#8e8e8e] hover:text-[#ff9500]'}`}
                >
                  {a.is_featured ? <Star className="w-4 h-4" fill="currentColor" /> : <StarOff className="w-4 h-4" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HashtagsSection({ hashtags, onTogglePin, onToggleBan }: { hashtags: any[]; onTogglePin: (id: string, pinned: boolean) => void; onToggleBan: (id: string, banned: boolean) => void }) {
  const maxCount = Math.max(...hashtags.map((h: any) => h.posts_count), 1);
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#efefef]">
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-12">#</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الهاشتاق</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">عدد البوستات</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e]">الحالة</th>
            <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-[180px]">الانتشار</th>
            <th className="text-center px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] w-[100px]">التحكم</th>
          </tr>
        </thead>
        <tbody>
          {hashtags.map((h: any, i: number) => (
            <tr key={h.id} className={`border-b border-[#efefef] last:border-0 hover:bg-[#fafafa] ${h.is_banned ? 'opacity-50' : ''}`}>
              <td className="px-4 py-3 text-[13px] font-bold text-[#8e8e8e]">{i + 1}</td>
              <td className="px-4 py-3">
                <span className="text-[14px] font-semibold text-[#262626]">#{h.name}</span>
              </td>
              <td className="px-4 py-3 text-[14px] text-[#262626] tabular-nums">{h.posts_count}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {h.is_pinned && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0095f6]/10 text-[#0095f6]">مثبت</span>}
                  {h.is_banned && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ed4956]/10 text-[#ed4956]">محظور</span>}
                  {!h.is_pinned && !h.is_banned && <span className="text-[12px] text-[#8e8e8e]">عادي</span>}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="w-full bg-[#efefef] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#833AB4] to-[#0095f6] h-2 rounded-full" style={{ width: `${(h.posts_count / maxCount) * 100}%` }} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onTogglePin(h.id, !h.is_pinned)}
                    className={`p-1.5 rounded-full transition-colors ${h.is_pinned ? 'bg-[#0095f6]/10 text-[#0095f6]' : 'hover:bg-[#0095f6]/10 text-[#8e8e8e] hover:text-[#0095f6]'}`}
                    title={h.is_pinned ? 'إلغاء التثبيت' : 'تثبيت في الترند'}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleBan(h.id, !h.is_banned)}
                    className={`p-1.5 rounded-full transition-colors ${h.is_banned ? 'bg-[#ed4956]/10 text-[#ed4956]' : 'hover:bg-[#ed4956]/10 text-[#8e8e8e] hover:text-[#ed4956]'}`}
                    title={h.is_banned ? 'إلغاء الحظر' : 'إيقاف الترند'}
                  >
                    {h.is_banned ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PredictionsSection({ predictions }: { predictions: TrendsData['predicted_trends'] }) {
  if (predictions.length === 0) {
    return (
      <div className="bg-white border border-[#dbdbdb] rounded-xl p-12 text-center">
        <Zap className="w-10 h-10 text-[#dbdbdb] mx-auto mb-3" />
        <p className="text-[14px] text-[#8e8e8e]">لا توجد توقعات حالياً — تحتاج كلمات بنمو أكثر من 50% وتكرار 3 مرات على الأقل</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {predictions.map((p, i) => (
        <div key={p.word} className={`bg-white border rounded-xl p-4 flex items-center justify-between ${
          p.prediction === 'viral' ? 'border-[#ed4956]/30 bg-[#ed4956]/[0.02]' :
          p.prediction === 'rising_fast' ? 'border-[#ff9500]/30 bg-[#ff9500]/[0.02]' :
          'border-[#dbdbdb]'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-[16px] font-bold text-[#262626]">{i + 1}</span>
            <div>
              <p className="text-[15px] font-semibold text-[#262626]">{p.word}</p>
              <p className="text-[12px] text-[#8e8e8e]">ظهر {p.count} مرة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GrowthBadge value={p.growth} />
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              p.prediction === 'viral' ? 'bg-[#ed4956]/10 text-[#ed4956]' :
              p.prediction === 'rising_fast' ? 'bg-[#ff9500]/10 text-[#ff9500]' :
              'bg-[#00c853]/10 text-[#00c853]'
            }`}>
              {p.prediction === 'viral' ? '🔥 فايرال' : p.prediction === 'rising_fast' ? '🚀 صاعد بسرعة' : '📈 صاعد'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedSection({ featured, onTogglePost, onToggleReel, onToggleAccount }: {
  featured: TrendsData['featured'];
  onTogglePost: (id: string, featured: boolean) => void;
  onToggleReel: (id: string, featured: boolean) => void;
  onToggleAccount: (id: string, featured: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#dbdbdb] rounded-xl p-4">
        <h3 className="text-[14px] font-semibold text-[#262626] mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#E1306C]" />حسابات معزّزة ({featured.accounts.length})
        </h3>
        {featured.accounts.length === 0 ? (
          <p className="text-[13px] text-[#8e8e8e] py-4 text-center">لا توجد حسابات معزّزة</p>
        ) : (
          <div className="space-y-2">
            {featured.accounts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#efefef] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] to-[#E1306C] p-[1px]">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(a.username||'?')[0].toUpperCase()}</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-[#262626]">{a.full_name || a.username}</span>
                    <span className="text-[11px] text-[#8e8e8e] mr-1">@{a.username}</span>
                  </div>
                </div>
                <button onClick={() => onToggleAccount(a.id, false)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#ed4956]/10 text-[#ed4956] hover:bg-[#ed4956]/20 transition-colors">
                  إلغاء التعزيز
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#dbdbdb] rounded-xl p-4">
        <h3 className="text-[14px] font-semibold text-[#262626] mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0095f6]" />بوستات معزّزة ({featured.posts.length})
        </h3>
        {featured.posts.length === 0 ? (
          <p className="text-[13px] text-[#8e8e8e] py-4 text-center">لا توجد بوستات معزّزة</p>
        ) : (
          <div className="space-y-2">
            {featured.posts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#efefef] last:border-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-[#262626] truncate max-w-[300px]">{p.caption || '—'}</p>
                  <span className="text-[11px] text-[#8e8e8e]">@{p.profiles?.username}</span>
                </div>
                <button onClick={() => onTogglePost(p.id, false)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#ed4956]/10 text-[#ed4956] hover:bg-[#ed4956]/20 transition-colors">
                  إلغاء التعزيز
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#dbdbdb] rounded-xl p-4">
        <h3 className="text-[14px] font-semibold text-[#262626] mb-3 flex items-center gap-2">
          <Video className="w-4 h-4 text-[#833AB4]" />ريلز معزّزة ({featured.reels.length})
        </h3>
        {featured.reels.length === 0 ? (
          <p className="text-[13px] text-[#8e8e8e] py-4 text-center">لا توجد ريلز معزّزة</p>
        ) : (
          <div className="space-y-2">
            {featured.reels.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#efefef] last:border-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-[#262626] truncate max-w-[300px]">{r.caption || '—'}</p>
                  <span className="text-[11px] text-[#8e8e8e]">@{r.profiles?.username}</span>
                </div>
                <button onClick={() => onToggleReel(r.id, false)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#ed4956]/10 text-[#ed4956] hover:bg-[#ed4956]/20 transition-colors">
                  إلغاء التعزيز
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
