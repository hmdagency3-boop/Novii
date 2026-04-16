import { useState, useEffect } from "react";
import { fetchUserDetails, fetchUserActivity, type UserActivityResponse } from "@/lib/admin-api";
import {
  ArrowRight, Smartphone, Globe, MapPin, Clock, Shield, AlertTriangle,
  FileText, Image, Film, MessageCircle, Users, Ban, Eye, CheckCircle2,
  XCircle, Loader2, Copy, ExternalLink, Wifi, MonitorSmartphone, Calendar,
  Heart, BarChart3, UserCheck, UserX, Scale, BadgeCheck, Flag, Mail, Phone,
} from "lucide-react";

const fmt = (d: string) => d ? new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("ar-EG", { dateStyle: "long" }) : "—";

export default function UserDetailPage({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchUserDetails(userId)
      .then(setData)
      .catch((err) => setError(err?.message || "حدث خطأ في جلب بيانات المستخدم"))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-7 h-7 animate-spin text-[#8e8e8e]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-[#d97706] mx-auto mb-3" />
        <p className="text-[14px] text-[#262626] font-medium mb-1">خطأ في جلب البيانات</p>
        <p className="text-[13px] text-[#8e8e8e] mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setError(null); setLoading(true); fetchUserDetails(userId).then(setData).catch((e: any) => setError(e?.message || "خطأ")).finally(() => setLoading(false)); }} className="px-4 py-2 rounded-lg bg-[#0095f6] text-white text-[13px] font-medium">إعادة المحاولة</button>
          <button onClick={onBack} className="px-4 py-2 rounded-lg bg-[#efefef] text-[#262626] text-[13px] font-medium">رجوع</button>
        </div>
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#8e8e8e]">لم يتم العثور على المستخدم</p>
        <button onClick={onBack} className="mt-4 text-[#0095f6] text-[14px] font-medium">رجوع</button>
      </div>
    );
  }

  const p = data.profile;
  const tabs = [
    { id: "overview", label: "نظرة عامة", icon: BarChart3 },
    { id: "devices", label: "الأجهزة", count: data.devices?.length, icon: Smartphone },
    { id: "posts", label: "المنشورات", count: (data.posts?.length || 0) + (data.reels?.length || 0), icon: Image },
    { id: "stories", label: "القصص", count: data.stories?.length, icon: Film },
    { id: "reports", label: "البلاغات", count: (data.reports_against?.length || 0) + (data.reports_by?.length || 0), icon: Flag },
    { id: "activity", label: "النشاط", icon: Heart },
    { id: "moderation", label: "الإشراف", icon: Shield },
    { id: "connections", label: "الاتصالات", icon: Users },
  ];

  function copyId() {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto" dir="rtl">
      <button onClick={onBack} className="flex items-center gap-2 text-[14px] text-[#8e8e8e] hover:text-[#262626] transition-colors mb-5">
        <ArrowRight className="w-4 h-4" />
        رجوع للمستخدمين
      </button>

      <div className="bg-white rounded-2xl border border-[#dbdbdb] p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="relative">
            <img
              src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.username}&background=random&size=96`}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#dbdbdb]"
              alt=""
            />
            {p.is_online && <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-[#44b700] border-2 border-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[20px] font-bold text-[#262626]">{p.display_name || p.username}</h1>
              {p.is_verified && <BadgeCheck className="w-5 h-5 text-[#0095f6]" />}
              {p.is_banned && <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white bg-[#ed4956]">محظور</span>}
              {p.is_private && <span className="px-2 py-0.5 rounded text-[11px] font-semibold text-[#8e8e8e] bg-[#efefef]">خاص</span>}
            </div>
            <p className="text-[14px] text-[#8e8e8e]">@{p.username}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <button onClick={copyId} className="text-[12px] text-[#8e8e8e] hover:text-[#262626] font-mono flex items-center gap-1">
                {userId.slice(0, 8)}...
                <Copy className="w-3 h-3" />
                {copiedId && <span className="text-[#16a34a] text-[11px]">تم النسخ</span>}
              </button>
            </div>
            {p.bio && <p className="text-[13px] text-[#262626] mt-2 max-w-[400px]">{p.bio}</p>}
          </div>
          <div className="flex gap-6 text-center shrink-0">
            <StatBox label="منشورات" value={p.posts_count || 0} />
            <StatBox label="متابعين" value={p.followers_count || 0} />
            <StatBox label="متابَعين" value={p.following_count || 0} />
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {p.is_official && <Badge label="رسمي" color="#0095f6" />}
          {p.is_creator && <Badge label="صانع محتوى" color="#833AB4" />}
          {p.is_premium && <Badge label="مميز" color="#d4a017" />}
          {p.is_popular && <Badge label="شائع" color="#E1306C" />}
          {p.is_gold_early_member && <Badge label="عضو ذهبي مبكر" color="#FFD700" />}
          {p.is_silver_early_member && <Badge label="عضو فضي مبكر" color="#C0C0C0" />}
          {p.is_bronze_early_member && <Badge label="عضو برونزي مبكر" color="#CD7F32" />}
          {p.is_beta_tester && <Badge label="مختبر بيتا" color="#16a34a" />}
          {p.is_bug_hunter && <Badge label="صائد أخطاء" color="#dc2626" />}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[13px]">
          <InfoItem
            icon={Mail}
            label="البريد الإلكتروني"
            value={p.email || "—"}
            verified={!!p.email_confirmed_at}
            copyable={!!p.email}
          />
          <InfoItem
            icon={Phone}
            label="رقم الهاتف"
            value={p.phone ? (p.phone.startsWith('+') ? p.phone : `+${p.phone}`) : "—"}
            verified={!!p.phone_confirmed_at}
            copyable={!!p.phone}
          />
          <InfoItem icon={Calendar} label="تاريخ التسجيل" value={fmtDate(p.created_at)} />
          <InfoItem icon={Clock} label="آخر ظهور" value={p.last_seen ? fmt(p.last_seen) : "غير معروف"} />
          <InfoItem icon={MapPin} label="الموقع" value={p.location || "—"} />
          <InfoItem icon={Globe} label="الجنس" value={p.gender === 'male' ? 'ذكر' : p.gender === 'female' ? 'أنثى' : p.gender || '—'} />
        </div>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id ? "bg-[#262626] text-white" : "text-[#8e8e8e] hover:bg-[#efefef] hover:text-[#262626]"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === t.id ? "bg-white/20" : "bg-[#efefef]"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#dbdbdb] p-5">
        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "devices" && <DevicesTab devices={data.devices} />}
        {activeTab === "posts" && <PostsTab posts={data.posts} reels={data.reels} />}
        {activeTab === "stories" && <StoriesTab stories={data.stories} />}
        {activeTab === "reports" && <ReportsTab against={data.reports_against} by={data.reports_by} />}
        {activeTab === "activity" && <ActivityTab userId={userId} />}
        {activeTab === "moderation" && <ModerationTab data={data} />}
        {activeTab === "connections" && <ConnectionsTab data={data} />}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[18px] font-bold text-[#262626]">{value.toLocaleString()}</p>
      <p className="text-[12px] text-[#8e8e8e]">{label}</p>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function InfoItem({ icon: Icon, label, value, verified, copyable }: { icon: any; label: string; value: string; verified?: boolean; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!copyable || value === "—") return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fafafa] ${copyable && value !== "—" ? "cursor-pointer hover:bg-[#f0f0f0] transition-colors" : ""}`}
      onClick={handleCopy}
      title={copyable && value !== "—" ? "نسخ" : undefined}
    >
      <Icon className="w-4 h-4 text-[#8e8e8e] shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-[11px] text-[#8e8e8e]">{label}</p>
          {verified && <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />}
        </div>
        <p className="text-[13px] text-[#262626] font-medium truncate" dir="ltr" style={{ textAlign: 'right' }}>{value}</p>
      </div>
      {copyable && value !== "—" && (
        <span className="shrink-0">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5 text-[#8e8e8e]" />}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[15px] font-bold text-[#262626] mb-3">{children}</h3>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-[14px] text-[#8e8e8e] text-center py-8">{text}</p>;
}

function OverviewTab({ data }: { data: any }) {
  const stats = data.statistics;
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>إحصائيات الاستخدام</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="إعجابات أُعطيت" value={stats?.total_likes_given ?? 0} icon={Heart} color="#ed4956" />
          <MetricCard label="تعليقات" value={stats?.total_comments_created ?? 0} icon={MessageCircle} color="#0095f6" />
          <MetricCard label="منشورات شوهدت" value={stats?.total_posts_viewed ?? 0} icon={Eye} color="#833AB4" />
          <MetricCard label="وقت الاستخدام (دقيقة)" value={Math.round((stats?.total_time_spent_seconds ?? 0) / 60)} icon={Clock} color="#16a34a" />
        </div>
      </div>

      {data.devices?.length > 0 && (
        <div>
          <SectionTitle>آخر جهاز نشط</SectionTitle>
          <DeviceRow device={data.devices[0]} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionTitle>ملخص سريع</SectionTitle>
          <div className="space-y-2 text-[13px]">
            <QuickRow label="الأجهزة" value={`${data.devices?.length || 0} جهاز`} />
            <QuickRow label="المنشورات" value={`${data.posts?.length || 0}`} />
            <QuickRow label="الريلز" value={`${data.reels?.length || 0}`} />
            <QuickRow label="البلاغات ضده" value={`${data.reports_against?.length || 0}`} />
            <QuickRow label="التحذيرات" value={`${data.warnings?.length || 0}`} />
            <QuickRow label="الاستئنافات" value={`${data.appeals?.length || 0}`} />
            <QuickRow label="المجتمعات" value={`${data.communities?.length || 0}`} />
            <QuickRow label="المحظورين" value={`${data.blocked_users?.length || 0}`} />
          </div>
        </div>
        <div>
          <SectionTitle>المخالفات</SectionTitle>
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full ${i < (data.profile.strikes_count || 0) ? "bg-[#ed4956]" : "bg-[#efefef]"}`} />
            ))}
          </div>
          <p className="text-[13px] text-[#8e8e8e]">{data.profile.strikes_count || 0} من 5 مخالفات</p>
          {data.profile.is_banned && (
            <div className="mt-3 p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca]">
              <p className="text-[13px] font-semibold text-[#dc2626]">محظور حالياً</p>
              {data.profile.banned_reason && <p className="text-[12px] text-[#ef4444] mt-1">{data.profile.banned_reason}</p>}
              {data.profile.ban_until && <p className="text-[12px] text-[#8e8e8e] mt-1">ينتهي: {fmt(data.profile.ban_until)}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#fafafa] border border-[#efefef]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[12px] text-[#8e8e8e]">{label}</span>
      </div>
      <p className="text-[18px] font-bold text-[#262626]">{value.toLocaleString()}</p>
    </div>
  );
}

function QuickRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#fafafa] last:border-0">
      <span className="text-[#8e8e8e]">{label}</span>
      <span className="font-semibold text-[#262626]">{value}</span>
    </div>
  );
}

function DeviceRow({ device }: { device: any }) {
  return (
    <div className="p-3 rounded-xl bg-[#fafafa] border border-[#efefef]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-[#dbdbdb] flex items-center justify-center">
          <MonitorSmartphone className="w-5 h-5 text-[#262626]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#262626]">
            {device.device_name || device.device_model || device.browser || "جهاز غير معروف"}
            {device.os_name && ` · ${device.os_name} ${device.os_version || ''}`}
          </p>
          <p className="text-[12px] text-[#8e8e8e]">
            {device.browser} {device.browser_version && `v${device.browser_version}`}
            {device.device_type && ` · ${device.device_type}`}
          </p>
        </div>
        <div className="text-left text-[12px] text-[#8e8e8e] shrink-0">
          <p className="font-mono">{device.ip_address || '—'}</p>
          <p>{device.city && device.country ? `${device.city}, ${device.country}` : device.country || '—'}</p>
        </div>
      </div>
    </div>
  );
}

function DevicesTab({ devices }: { devices: any[] }) {
  if (!devices?.length) return <EmptyState text="لا توجد أجهزة مسجلة" />;

  return (
    <div>
      <SectionTitle>الأجهزة المسجلة ({devices.length})</SectionTitle>
      <div className="space-y-2">
        {devices.map((d, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#fafafa] border border-[#efefef]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#dbdbdb] flex items-center justify-center">
                  <MonitorSmartphone className="w-5 h-5 text-[#262626]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#262626]">
                    {d.device_name || d.device_model || d.browser || "جهاز غير معروف"}
                  </p>
                  <p className="text-[12px] text-[#8e8e8e]">
                    {d.os_name} {d.os_version} · {d.browser} {d.browser_version}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.is_trusted && <span className="text-[11px] px-2 py-0.5 rounded bg-[#f0fdf4] text-[#16a34a] font-medium">موثوق</span>}
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${d.status === 'active' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fafafa] text-[#8e8e8e]'}`}>
                  {d.status === 'active' ? 'نشط' : d.status || '—'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
              <div><span className="text-[#8e8e8e]">IP: </span><span className="font-mono text-[#262626]">{d.ip_address || '—'}</span></div>
              <div><span className="text-[#8e8e8e]">آخر IP: </span><span className="font-mono text-[#262626]">{d.last_login_ip || '—'}</span></div>
              <div><span className="text-[#8e8e8e]">الموقع: </span><span className="text-[#262626]">{d.city && d.country ? `${d.city}, ${d.country}` : d.country || '—'}</span></div>
              <div><span className="text-[#8e8e8e]">نوع: </span><span className="text-[#262626]">{d.device_type || '—'}</span></div>
              <div><span className="text-[#8e8e8e]">الشاشة: </span><span className="text-[#262626]">{d.screen_resolution || '—'}</span></div>
              <div><span className="text-[#8e8e8e]">التوقيت: </span><span className="text-[#262626]">{d.timezone || '—'}</span></div>
              <div><span className="text-[#8e8e8e]">اللغة: </span><span className="text-[#262626]">{d.language || '—'}</span></div>
              <div><span className="text-[#8e8e8e]">تسجيلات: </span><span className="text-[#262626]">{d.login_count ?? '—'}</span></div>
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-[#8e8e8e]">
              <span>أول دخول: {d.first_login_at ? fmt(d.first_login_at) : '—'}</span>
              <span>آخر نشاط: {d.last_active_at ? fmt(d.last_active_at) : '—'}</span>
            </div>
            {d.device_fingerprint && (
              <p className="text-[11px] text-[#8e8e8e] mt-1 font-mono">بصمة: {d.device_fingerprint.slice(0, 16)}...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsTab({ posts, reels }: { posts: any[]; reels: any[] }) {
  const [tab, setTab] = useState<'posts' | 'reels'>('posts');
  const items = tab === 'posts' ? posts : reels;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('posts')} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium ${tab === 'posts' ? 'bg-[#262626] text-white' : 'text-[#8e8e8e] bg-[#fafafa]'}`}>
          المنشورات ({posts?.length || 0})
        </button>
        <button onClick={() => setTab('reels')} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium ${tab === 'reels' ? 'bg-[#262626] text-white' : 'text-[#8e8e8e] bg-[#fafafa]'}`}>
          الريلز ({reels?.length || 0})
        </button>
      </div>

      {!items?.length ? <EmptyState text={tab === 'posts' ? "لا توجد منشورات" : "لا توجد ريلز"} /> : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item: any) => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden bg-[#fafafa] border border-[#efefef] aspect-square">
              {(item.image_url || item.thumbnail_url) ? (
                <img src={item.image_url || item.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#dbdbdb]" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-3 text-white text-[13px] font-semibold">
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{item.likes_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{item.comments_count || 0}</span>
                </div>
              </div>
              {item.is_deleted && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ed4956] text-white">محذوف</div>
              )}
              {item.is_archived && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8e8e8e] text-white">مؤرشف</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StoriesTab({ stories }: { stories: any[] }) {
  if (!stories?.length) return <EmptyState text="لا توجد قصص" />;

  return (
    <div>
      <SectionTitle>القصص ({stories.length})</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {stories.map((s: any) => {
          const isExpired = s.expires_at && new Date(s.expires_at) < new Date();
          return (
            <div key={s.id} className="relative group rounded-xl overflow-hidden bg-[#fafafa] border border-[#efefef] aspect-[9/16]">
              {s.media_url ? (
                s.media_type === 'video' ? (
                  <video src={s.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={s.media_url} alt="" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-8 h-8 text-[#dbdbdb]" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="flex items-center gap-1 text-white text-[11px]">
                  <Eye className="w-3 h-3" />
                  <span>{s.views_count || 0}</span>
                </div>
                <p className="text-[10px] text-white/70 mt-0.5">{fmt(s.created_at)}</p>
              </div>
              {isExpired && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8e8e8e] text-white">منتهية</div>
              )}
              {s.media_type && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/40 text-white">
                  {s.media_type === 'video' ? 'فيديو' : 'صورة'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportsTab({ against, by }: { against: any[]; by: any[] }) {
  const [tab, setTab] = useState<'against' | 'by'>('against');
  const items = tab === 'against' ? against : by;

  const statusColors: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "معلق", color: "#d97706", bg: "#fffbeb" },
    resolved: { label: "تم الحل", color: "#16a34a", bg: "#f0fdf4" },
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('against')} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium ${tab === 'against' ? 'bg-[#ed4956] text-white' : 'text-[#8e8e8e] bg-[#fafafa]'}`}>
          بلاغات ضده ({against?.length || 0})
        </button>
        <button onClick={() => setTab('by')} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium ${tab === 'by' ? 'bg-[#262626] text-white' : 'text-[#8e8e8e] bg-[#fafafa]'}`}>
          بلاغات منه ({by?.length || 0})
        </button>
      </div>

      {!items?.length ? <EmptyState text="لا توجد بلاغات" /> : (
        <div className="space-y-2">
          {items.map((r: any) => {
            const st = statusColors[r.status] || statusColors.pending;
            return (
              <div key={r.id} className="p-3 rounded-xl bg-[#fafafa] border border-[#efefef] flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#262626]">{r.reason}</p>
                  {r.description && <p className="text-[12px] text-[#8e8e8e] mt-0.5 line-clamp-1">{r.description}</p>}
                  <p className="text-[11px] text-[#8e8e8e] mt-1">{fmt(r.created_at)}</p>
                </div>
                <span className="px-2 py-1 rounded text-[11px] font-semibold" style={{ color: st.color, background: st.bg }}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModerationTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>التحذيرات ({data.warnings?.length || 0})</SectionTitle>
        {!data.warnings?.length ? <EmptyState text="لا توجد تحذيرات" /> : (
          <div className="space-y-2">
            {data.warnings.map((w: any) => (
              <div key={w.id} className="p-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7]">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-[#d97706]" />
                  <span className="text-[13px] font-semibold text-[#92400e]">{w.warning_type === 'strike' ? 'إنذار' : w.warning_type === 'ban' ? 'حظر' : 'تحذير'}</span>
                  {!w.is_active && <span className="text-[11px] text-[#8e8e8e]">(منتهي)</span>}
                </div>
                <p className="text-[13px] text-[#262626]">{w.reason}</p>
                <p className="text-[11px] text-[#8e8e8e] mt-1">{fmt(w.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>الاستئنافات ({data.appeals?.length || 0})</SectionTitle>
        {!data.appeals?.length ? <EmptyState text="لا توجد استئنافات" /> : (
          <div className="space-y-2">
            {data.appeals.map((a: any) => {
              const colors: Record<string, string> = { pending: "#d97706", reviewing: "#2563eb", approved: "#16a34a", rejected: "#dc2626" };
              const labels: Record<string, string> = { pending: "معلق", reviewing: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };
              return (
                <div key={a.id} className="p-3 rounded-xl bg-[#fafafa] border border-[#efefef] flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[#262626]">طلب استئناف</p>
                    {a.message && <p className="text-[12px] text-[#8e8e8e] mt-0.5 line-clamp-1">{a.message}</p>}
                    <p className="text-[11px] text-[#8e8e8e] mt-1">{fmt(a.created_at)}</p>
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: colors[a.status] }}>{labels[a.status]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>طلبات التوثيق ({data.verification_requests?.length || 0})</SectionTitle>
        {!data.verification_requests?.length ? <EmptyState text="لا توجد طلبات توثيق" /> : (
          <div className="space-y-2">
            {data.verification_requests.map((v: any) => (
              <div key={v.id} className="p-3 rounded-xl bg-[#fafafa] border border-[#efefef] flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#262626]">{v.full_name} — {v.category}</p>
                  <p className="text-[11px] text-[#8e8e8e] mt-1">{fmt(v.created_at)}</p>
                </div>
                <span className="text-[12px] font-semibold" style={{ color: v.status === 'approved' ? '#16a34a' : v.status === 'rejected' ? '#dc2626' : '#d97706' }}>
                  {v.status === 'approved' ? 'مقبول' : v.status === 'rejected' ? 'مرفوض' : 'معلق'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>سجل إجراءات الأدمن ({data.admin_logs?.length || 0})</SectionTitle>
        {!data.admin_logs?.length ? <EmptyState text="لا توجد إجراءات" /> : (
          <div className="space-y-1">
            {data.admin_logs.map((l: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#fafafa] last:border-0 text-[12px]">
                <span className="text-[#8e8e8e] shrink-0">{fmt(l.created_at)}</span>
                <span className="font-medium text-[#262626]">{l.action}</span>
                {l.details && <span className="text-[#8e8e8e] truncate">{l.details}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectionsTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>المجتمعات ({data.communities?.length || 0})</SectionTitle>
        {!data.communities?.length ? <EmptyState text="لا ينتمي لأي مجتمع" /> : (
          <div className="grid grid-cols-2 gap-2">
            {data.communities.map((c: any) => (
              <div key={c.community_id} className="flex items-center gap-3 p-3 rounded-xl bg-[#fafafa] border border-[#efefef]">
                <img src={c.communities?.avatar_url || `https://ui-avatars.com/api/?name=${c.communities?.name || '?'}&background=random`} className="w-9 h-9 rounded-full object-cover" alt="" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#262626] truncate">{c.communities?.name}</p>
                  <p className="text-[11px] text-[#8e8e8e]">{c.role === 'admin' ? 'مشرف' : c.role === 'moderator' ? 'وسيط' : 'عضو'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>عينة من المتابعين</SectionTitle>
        {!data.followers_sample?.length ? <EmptyState text="لا يوجد متابعين" /> : (
          <div className="flex flex-wrap gap-2">
            {data.followers_sample.map((f: any) => (
              <div key={f.follower_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fafafa] border border-[#efefef]">
                <img src={f.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${f.profiles?.username}&background=random&size=28`} className="w-6 h-6 rounded-full" alt="" />
                <span className="text-[12px] text-[#262626]">@{f.profiles?.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>عينة من المتابَعين</SectionTitle>
        {!data.following_sample?.length ? <EmptyState text="لا يتابع أحداً" /> : (
          <div className="flex flex-wrap gap-2">
            {data.following_sample.map((f: any) => (
              <div key={f.following_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fafafa] border border-[#efefef]">
                <img src={f.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${f.profiles?.username}&background=random&size=28`} className="w-6 h-6 rounded-full" alt="" />
                <span className="text-[12px] text-[#262626]">@{f.profiles?.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>المستخدمين المحظورين ({data.blocked_users?.length || 0})</SectionTitle>
        {!data.blocked_users?.length ? <EmptyState text="لم يحظر أحداً" /> : (
          <div className="flex flex-wrap gap-2">
            {data.blocked_users.map((b: any) => (
              <div key={b.blocked_user_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fef2f2] border border-[#fecaca]">
                <UserX className="w-4 h-4 text-[#dc2626]" />
                <span className="text-[12px] text-[#262626]">@{b.profiles?.username || b.blocked_user_id?.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityTab({ userId }: { userId: string }) {
  const [data, setData] = useState<UserActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'likes' | 'comments'>('likes');

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetchUserActivity(userId)
      .then(setData)
      .catch((e: any) => setErr(e?.message || 'فشل تحميل النشاط'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#8e8e8e]" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-7 h-7 text-[#d97706] mx-auto mb-3" />
        <p className="text-[13px] text-[#8e8e8e]">{err}</p>
      </div>
    );
  }

  const items = tab === 'likes' ? (data?.liked_posts || []) : (data?.commented_posts || []);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('likes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium ${tab === 'likes' ? 'bg-[#262626] text-white' : 'text-[#8e8e8e] bg-[#fafafa]'}`}
        >
          <Heart className="w-3.5 h-3.5" />
          الإعجابات ({data?.liked_total || 0})
        </button>
        <button
          onClick={() => setTab('comments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium ${tab === 'comments' ? 'bg-[#262626] text-white' : 'text-[#8e8e8e] bg-[#fafafa]'}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          التعليقات ({data?.commented_total || 0})
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState text={tab === 'likes' ? 'لم يعجب بأي منشور بعد' : 'لم يعلق على أي منشور بعد'} />
      ) : (
        <div className="space-y-2">
          {items.map((post: any) => {
            const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
            const username = profile?.username || 'مستخدم';
            const ts = tab === 'likes' ? post.liked_at : post.last_comment_at;
            return (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#fafafa] border border-[#efefef] hover:border-[#dbdbdb] transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-white border border-[#efefef] overflow-hidden shrink-0 flex items-center justify-center">
                  {post.image_url ? (
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#dbdbdb]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[13px] font-semibold text-[#262626] truncate">@{username}</span>
                    {profile?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#0095f6] shrink-0" />}
                    <span className="text-[11px] text-[#8e8e8e]">·</span>
                    <span className="text-[11px] text-[#8e8e8e] shrink-0">{ts ? fmt(ts) : ''}</span>
                  </div>

                  {tab === 'comments' && post.last_comment && (
                    <p dir="auto" className="text-[12px] text-[#262626] bg-white rounded-md px-2 py-1 mb-1 border border-[#efefef] line-clamp-2">
                      {post.last_comment}
                    </p>
                  )}

                  <p dir="auto" className="text-[12px] text-[#8e8e8e] line-clamp-2">
                    {post.caption?.trim() || 'بدون وصف'}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#8e8e8e]">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count || 0}</span>
                    {post.is_deleted && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ed4956] text-white">محذوف</span>}
                    {post.is_archived && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8e8e8e] text-white">مؤرشف</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
