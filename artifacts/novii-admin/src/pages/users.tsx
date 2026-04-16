import { useEffect, useState, useMemo } from "react";
import {
  fetchUsers,
  banUser,
  deleteUser,
  updateUser,
  forceLogoutUser,
  featureUser,
  resetUserPassword,
  uploadUserAvatar,
  type UserProfile,
} from "@/lib/admin-api";
import {
  Search,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Crown,
  Sparkles,
  Eye,
  UserCog,
  Shield,
  RefreshCw,
  Flame,
  Zap,
  Award,
  Medal,
  Trophy,
  FlaskConical,
  Bug,
  LogOut,
  X,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  Camera,
  Key,
  User,
  AtSign,
  AlertCircle,
  Check,
  Loader2,
  Upload,
} from "lucide-react";

import UserDetailPage from "./user-detail";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "featured" | "banned" | "creators">("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionUser, setActionUser] = useState<UserProfile | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const close = () => setActionMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(s) ||
          u.display_name?.toLowerCase().includes(s) ||
          u.id.includes(s)
      );
    }
    if (filter === "verified") result = result.filter((u) => u.is_verified);
    if (filter === "featured") result = result.filter((u) => u.is_featured);
    if (filter === "banned") result = result.filter((u) => u.is_banned);
    if (filter === "creators") result = result.filter((u) => u.is_creator);
    return result;
  }, [users, search, filter]);

  const filters = [
    { key: "all" as const, label: "الكل", count: users.length },
    { key: "verified" as const, label: "موثقين", count: users.filter(u => u.is_verified).length },
    { key: "featured" as const, label: "معزّزين", count: users.filter(u => u.is_featured).length },
    { key: "banned" as const, label: "محظورين", count: users.filter(u => u.is_banned).length },
    { key: "creators" as const, label: "صناع محتوى", count: users.filter(u => u.is_creator).length },
  ];

  if (detailUserId) {
    return <UserDetailPage userId={detailUserId} onBack={() => setDetailUserId(null)} />;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-[#262626]">إدارة المستخدمين</h1>
          <p className="text-[14px] text-[#8e8e8e] mt-0.5">{users.length} مستخدم مسجل</p>
        </div>
        <button
          onClick={loadUsers}
          className="p-2 rounded-full hover:bg-[#f5f5f5] transition-colors"
          title="تحديث"
        >
          <RefreshCw className={`w-5 h-5 text-[#262626] ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full pr-10 pl-4 py-2 bg-[#efefef] border-none rounded-lg text-[14px] text-[#262626] placeholder-[#8e8e8e] focus:outline-none focus:bg-[#dbdbdb]/60 transition-colors"
            dir="rtl"
          />
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 ${
                filter === f.key
                  ? "bg-[#262626] text-white"
                  : "bg-[#efefef] text-[#262626] hover:bg-[#dbdbdb]"
              }`}
            >
              {f.label}
              <span className={`mr-1 text-[11px] ${filter === f.key ? "text-white/70" : "text-[#8e8e8e]"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#efefef]">
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">المستخدم</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">الشارات</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">الحالة</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">المتابعين</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">المنشورات</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">التاريخ</th>
                <th className="text-center px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#efefef] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#efefef] animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 bg-[#efefef] rounded animate-pulse" />
                          <div className="h-3 w-16 bg-[#f5f5f5] rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td colSpan={5} className="px-4 py-3"><div className="h-4 bg-[#f5f5f5] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-6 bg-[#f5f5f5] rounded animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="text-[14px] text-[#8e8e8e]">لا توجد نتائج</p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-b border-[#efefef] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDetailUserId(user.id)} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-[1.5px] shrink-0 cursor-pointer hover:scale-110 transition-transform">
                          <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[12px] font-semibold text-[#262626]">
                                {(user.username || "?").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-[14px] font-semibold text-[#262626] truncate">{user.display_name || user.username}</p>
                            {user.is_verified && <CheckCircle className="w-3.5 h-3.5 text-[#0095f6] shrink-0" fill="#0095f6" stroke="white" strokeWidth={3} />}
                          </div>
                          <p className="text-[12px] text-[#8e8e8e]" dir="ltr">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {user.is_featured && <BadgeTag icon={<Star className="w-3 h-3" />} color="#ff9500" title="معزّز" />}
                        {user.is_official && <BadgeTag icon={<Shield className="w-3 h-3" />} color="#833AB4" title="رسمي" />}
                        {user.is_creator && <BadgeTag icon={<Sparkles className="w-3 h-3" />} color="#ff9500" title="صانع محتوى" />}
                        {user.is_premium && <BadgeTag icon={<Crown className="w-3 h-3" />} color="#ffc107" title="مميز" />}
                        {user.is_popular && <BadgeTag icon={<Flame className="w-3 h-3" />} color="#E1306C" title="مشهور" />}
                        {user.is_active && <BadgeTag icon={<Zap className="w-3 h-3" />} color="#00c853" title="نشط" />}
                        {user.is_gold_early_member && <BadgeTag icon={<Trophy className="w-3 h-3" />} color="#ffc107" title="ذهبي" />}
                        {user.is_silver_early_member && <BadgeTag icon={<Medal className="w-3 h-3" />} color="#90a4ae" title="فضي" />}
                        {user.is_bronze_early_member && <BadgeTag icon={<Award className="w-3 h-3" />} color="#e65100" title="برونزي" />}
                        {user.is_beta_tester && <BadgeTag icon={<FlaskConical className="w-3 h-3" />} color="#7c4dff" title="بيتا" />}
                        {user.is_bug_hunter && <BadgeTag icon={<Bug className="w-3 h-3" />} color="#76ff03" title="باك هانتر" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ed4956]/10 text-[#ed4956]">
                          محظور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00c853]/10 text-[#00c853]">
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[14px] text-[#262626] font-medium tabular-nums">{(user.followers_count || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[14px] text-[#262626] font-medium tabular-nums">{(user.posts_count || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[12px] text-[#8e8e8e]">{new Date(user.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === user.id ? null : user.id); }}
                          className="p-1.5 rounded-full hover:bg-[#efefef] transition-colors mx-auto block"
                        >
                          <MoreHorizontal className="w-5 h-5 text-[#262626]" />
                        </button>
                        {actionMenu === user.id && (
                          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#dbdbdb] py-1.5 z-50 min-w-[180px]" dir="rtl">
                            <ActionMenuItem icon={<Eye className="w-4 h-4" />} label="عرض التفاصيل" onClick={() => { setDetailUserId(user.id); setActionMenu(null); }} />
                            <ActionMenuItem icon={<UserCog className="w-4 h-4" />} label="تعديل" onClick={() => { setActionUser(user); setShowEditModal(true); setActionMenu(null); }} />
                            <ActionMenuItem
                              icon={user.is_featured ? <Star className="w-4 h-4" fill="currentColor" /> : <TrendingUp className="w-4 h-4" />}
                              label={user.is_featured ? "إلغاء التعزيز" : "تعزيز في الترند"}
                              onClick={async () => {
                                setActionMenu(null);
                                try {
                                  await featureUser(user.id, !user.is_featured);
                                  loadUsers();
                                } catch { alert("فشل في تحديث التعزيز"); }
                              }}
                              variant={user.is_featured ? "warning" : undefined}
                            />
                            <ActionMenuItem
                              icon={<Ban className="w-4 h-4" />}
                              label={user.is_banned ? "إلغاء الحظر" : "حظر"}
                              onClick={() => { setActionUser(user); setShowBanModal(true); setActionMenu(null); }}
                              variant={user.is_banned ? "success" : "warning"}
                            />
                            <ActionMenuItem
                              icon={<LogOut className="w-4 h-4" />}
                              label="إنهاء الجلسات"
                              onClick={async () => {
                                setActionMenu(null);
                                if (confirm(`إنهاء جميع جلسات @${user.username}؟`)) {
                                  try {
                                    const result = await forceLogoutUser(user.id);
                                    alert(`تم إنهاء ${result.sessions_terminated} جلسة`);
                                  } catch { alert("فشل في إنهاء الجلسات"); }
                                }
                              }}
                              variant="warning"
                            />
                            <div className="h-px bg-[#efefef] my-1" />
                            <ActionMenuItem
                              icon={<Trash2 className="w-4 h-4" />}
                              label="حذف الحساب"
                              onClick={() => { setActionUser(user); setShowDeleteModal(true); setActionMenu(null); }}
                              variant="danger"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && <ViewUserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
      {showBanModal && actionUser && <BanModal user={actionUser} onClose={() => { setShowBanModal(false); setActionUser(null); }} onDone={loadUsers} />}
      {showDeleteModal && actionUser && <DeleteModal user={actionUser} onClose={() => { setShowDeleteModal(false); setActionUser(null); }} onDone={loadUsers} />}
      {showEditModal && actionUser && <EditModal user={actionUser} onClose={() => { setShowEditModal(false); setActionUser(null); }} onDone={loadUsers} />}
    </div>
  );
}

function BadgeTag({ icon, color, title }: { icon: React.ReactNode; color: string; title: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full transition-transform hover:scale-110"
      style={{ backgroundColor: `${color}15`, color }}
      title={title}
    >
      {icon}
    </span>
  );
}

function ActionMenuItem({ icon, label, onClick, variant }: { icon: React.ReactNode; label: string; onClick: () => void; variant?: "danger" | "warning" | "success" }) {
  const colorClass = variant === "danger" ? "text-[#ed4956] hover:bg-[#ed4956]/5"
    : variant === "warning" ? "text-[#ff9500] hover:bg-[#ff9500]/5"
    : variant === "success" ? "text-[#00c853] hover:bg-[#00c853]/5"
    : "text-[#262626] hover:bg-[#fafafa]";

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-4 py-2 text-[14px] transition-colors ${colorClass}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ViewUserModal({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose} title="تفاصيل المستخدم">
      <div className="space-y-5" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-[77px] h-[77px] rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-[3px] shrink-0">
            <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[22px] font-semibold text-[#262626]">{(user.username || "?").charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[20px] font-light text-[#262626]">{user.username}</h3>
              {user.is_verified && <CheckCircle className="w-4 h-4 text-[#0095f6]" fill="#0095f6" stroke="white" strokeWidth={3} />}
            </div>
            {user.display_name && <p className="text-[14px] font-semibold text-[#262626] mt-0.5">{user.display_name}</p>}
          </div>
        </div>

        <div className="flex border-t border-b border-[#efefef] py-3">
          <StatItem label="منشورات" value={user.posts_count || 0} />
          <StatItem label="متابعين" value={user.followers_count || 0} />
          <StatItem label="يتابع" value={user.following_count || 0} />
        </div>

        {user.bio && <p className="text-[14px] text-[#262626] leading-relaxed">{user.bio}</p>}

        <div className="flex flex-wrap gap-1.5">
          {user.is_verified && <UserBadge color="#0095f6">موثق</UserBadge>}
          {user.is_official && <UserBadge color="#833AB4">رسمي</UserBadge>}
          {user.is_creator && <UserBadge color="#ff9500">صانع محتوى</UserBadge>}
          {user.is_premium && <UserBadge color="#ffc107">مميز</UserBadge>}
          {user.is_popular && <UserBadge color="#E1306C">مشهور</UserBadge>}
          {user.is_active && <UserBadge color="#00c853">نشط</UserBadge>}
          {user.is_gold_early_member && <UserBadge color="#ffc107">عضو ذهبي مبكر</UserBadge>}
          {user.is_silver_early_member && <UserBadge color="#90a4ae">عضو فضي مبكر</UserBadge>}
          {user.is_bronze_early_member && <UserBadge color="#e65100">عضو برونزي مبكر</UserBadge>}
          {user.is_beta_tester && <UserBadge color="#7c4dff">مختبر بيتا</UserBadge>}
          {user.is_bug_hunter && <UserBadge color="#76ff03">باك هانتر</UserBadge>}
          {user.is_banned && <UserBadge color="#ed4956">محظور</UserBadge>}
        </div>

        <div className="bg-[#fafafa] rounded-lg p-3">
          <p className="text-[12px] text-[#8e8e8e]">تاريخ التسجيل</p>
          <p className="text-[14px] text-[#262626] font-medium">{new Date(user.created_at).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {user.is_banned && (user.ban_reason || user.banned_reason) && (
          <div className="bg-[#ed4956]/5 border border-[#ed4956]/15 rounded-lg p-3">
            <p className="text-[12px] font-semibold text-[#ed4956] mb-1">سبب الحظر</p>
            <p className="text-[14px] text-[#262626]">{user.ban_reason || user.banned_reason}</p>
            {(user.ban_expires_at || user.ban_until) && (
              <p className="text-[12px] text-[#8e8e8e] mt-1">ينتهي: {new Date(user.ban_expires_at || user.ban_until!).toLocaleString("ar-EG")}</p>
            )}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[18px] font-semibold text-[#262626]">{value.toLocaleString()}</p>
      <p className="text-[14px] text-[#8e8e8e]">{label}</p>
    </div>
  );
}

function UserBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {children}
    </span>
  );
}

const BAN_REASONS = [
  { id: "spam", label: "سبام / محتوى مزعج", icon: "🚫" },
  { id: "harassment", label: "تحرش أو تنمر", icon: "⚠️" },
  { id: "hate_speech", label: "خطاب كراهية أو عنصرية", icon: "🔴" },
  { id: "nudity", label: "محتوى إباحي أو عري", icon: "🔞" },
  { id: "violence", label: "عنف أو تهديد", icon: "💀" },
  { id: "impersonation", label: "انتحال شخصية", icon: "🎭" },
  { id: "scam", label: "احتيال أو نصب", icon: "💰" },
  { id: "underage", label: "حساب قاصر (أقل من 13 سنة)", icon: "👶" },
  { id: "fake_account", label: "حساب وهمي أو مزيف", icon: "🤖" },
  { id: "intellectual_property", label: "انتهاك حقوق ملكية فكرية", icon: "©️" },
  { id: "misinformation", label: "نشر معلومات مضللة", icon: "📰" },
  { id: "other", label: "سبب آخر", icon: "📝" },
];

const BAN_DURATIONS = [
  { label: "ساعة واحدة", value: "1h" },
  { label: "6 ساعات", value: "6h" },
  { label: "12 ساعة", value: "12h" },
  { label: "24 ساعة", value: "24h" },
  { label: "3 أيام", value: "3d" },
  { label: "7 أيام", value: "7d" },
  { label: "14 يوم", value: "14d" },
  { label: "30 يوم", value: "30d" },
  { label: "90 يوم (3 أشهر)", value: "90d" },
  { label: "6 أشهر", value: "6m" },
  { label: "سنة", value: "1y" },
  { label: "دائم", value: "permanent" },
];

function BanModal({ user, onClose, onDone }: { user: UserProfile; onClose: () => void; onDone: () => void }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("7d");
  const [terminateSessions, setTerminateSessions] = useState(true);
  const [showDuration, setShowDuration] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"reason" | "duration" | "confirm">(user.is_banned ? "confirm" : "reason");

  const reasonLabel = BAN_REASONS.find(r => r.id === selectedReason)?.label || "";
  const finalReason = selectedReason === "other" ? customReason : reasonLabel;
  const durationLabel = BAN_DURATIONS.find(d => d.value === selectedDuration)?.label || "";

  const handleBan = async () => {
    setBusy(true);
    setError("");
    try {
      await banUser(user.id, {
        ban: !user.is_banned,
        reason: user.is_banned ? undefined : finalReason,
        duration: user.is_banned ? undefined : selectedDuration,
        terminateSessions: user.is_banned ? undefined : terminateSessions,
        showDuration: user.is_banned ? undefined : showDuration,
      });
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل في تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };

  if (user.is_banned) {
    return (
      <ModalWrapper onClose={onClose} title="إلغاء حظر المستخدم">
        <div className="space-y-4" dir="rtl">
          <div className="flex items-center gap-3 p-4 bg-[#00c853]/5 border border-[#00c853]/15 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-[#00c853]/10 flex items-center justify-center text-lg">✅</div>
            <div>
              <p className="text-[14px] font-semibold text-[#262626]">رفع الحظر عن @{user.username}</p>
              <p className="text-[12px] text-[#8e8e8e]">سيتمكن المستخدم من استخدام المنصة بشكل طبيعي</p>
            </div>
          </div>
          {(user.ban_reason || user.banned_reason) && (
            <div className="bg-[#fafafa] rounded-lg p-3">
              <p className="text-[12px] text-[#8e8e8e] mb-1">سبب الحظر الحالي:</p>
              <p className="text-[14px] text-[#262626]">{user.ban_reason || user.banned_reason}</p>
            </div>
          )}
          {error && <div className="bg-[#ed4956]/5 border border-[#ed4956]/15 rounded-lg px-4 py-3 text-[13px] text-[#ed4956]">{error}</div>}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
            <button onClick={handleBan} disabled={busy} className="px-5 py-2 rounded-lg text-[14px] font-semibold text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors disabled:opacity-50">
              {busy ? "جاري..." : "رفع الحظر"}
            </button>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  const stepIndex = step === "reason" ? 0 : step === "duration" ? 1 : 2;

  return (
    <ModalWrapper onClose={onClose} title="حظر المستخدم">
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center gap-3 p-3 bg-[#fafafa] rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-[1.5px] shrink-0">
            <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
              {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[11px] font-semibold">{(user.username||"?")[0].toUpperCase()}</span>}
            </div>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#262626]">{user.display_name || user.username}</p>
            <p className="text-[12px] text-[#8e8e8e]">@{user.username}</p>
          </div>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-[#ed4956]" : "bg-[#efefef]"}`} />
          ))}
        </div>

        {step === "reason" && (
          <div className="space-y-3">
            <p className="text-[14px] font-semibold text-[#262626]">لماذا تريد حظر هذا الحساب؟</p>
            <div className="space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin">
              {BAN_REASONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] text-right transition-all ${
                    selectedReason === r.id
                      ? "bg-[#ed4956]/5 text-[#ed4956] font-medium"
                      : "hover:bg-[#fafafa] text-[#262626]"
                  }`}
                >
                  <span className="text-[16px] shrink-0">{r.icon}</span>
                  <span className="flex-1">{r.label}</span>
                  {selectedReason === r.id && (
                    <div className="w-5 h-5 rounded-full bg-[#ed4956] flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedReason === "other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="اكتب سبب الحظر..."
                className="w-full px-3 py-2.5 border border-[#dbdbdb] rounded-lg text-[14px] text-[#262626] focus:outline-none focus:border-[#8e8e8e] resize-none placeholder-[#8e8e8e] transition-colors"
                rows={2}
              />
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
              <button
                onClick={() => setStep("duration")}
                disabled={!selectedReason || (selectedReason === "other" && !customReason.trim())}
                className="px-5 py-2 rounded-lg text-[14px] font-semibold text-white bg-[#ed4956] hover:bg-[#dc3545] transition-colors disabled:opacity-30"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {step === "duration" && (
          <div className="space-y-3">
            <p className="text-[14px] font-semibold text-[#262626]">ما مدة الحظر؟</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto scrollbar-thin">
              {BAN_DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDuration(d.value)}
                  className={`px-3 py-2.5 rounded-lg text-[13px] text-center transition-all ${
                    selectedDuration === d.value
                      ? d.value === "permanent" ? "bg-[#ed4956] text-white font-bold" : "bg-[#ed4956]/10 text-[#ed4956] font-semibold border border-[#ed4956]/30"
                      : d.value === "permanent" ? "bg-[#fafafa] text-[#ed4956] font-medium hover:bg-[#ed4956]/5" : "bg-[#fafafa] text-[#262626] hover:bg-[#efefef]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#fafafa] cursor-pointer transition-colors hover:bg-[#efefef]">
              <input
                type="checkbox"
                checked={terminateSessions}
                onChange={(e) => setTerminateSessions(e.target.checked)}
                className="w-4 h-4 rounded border-[#dbdbdb] text-[#ed4956] focus:ring-[#ed4956]/20 accent-[#ed4956]"
              />
              <div>
                <span className="text-[14px] text-[#262626] font-medium">إنهاء جميع الجلسات</span>
                <p className="text-[12px] text-[#8e8e8e]">تسجيل خروج فوري من جميع الأجهزة</p>
              </div>
            </label>

            {selectedDuration !== "permanent" && (
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[#fafafa] cursor-pointer transition-colors hover:bg-[#efefef]">
                <input
                  type="checkbox"
                  checked={showDuration}
                  onChange={(e) => setShowDuration(e.target.checked)}
                  className="w-4 h-4 rounded border-[#dbdbdb] text-[#0095f6] focus:ring-[#0095f6]/20 accent-[#0095f6]"
                />
                <div>
                  <span className="text-[14px] text-[#262626] font-medium">إظهار مدة الحظر للمستخدم</span>
                  <p className="text-[12px] text-[#8e8e8e]">السماح للمستخدم بمعرفة متى ينتهي الحظر</p>
                </div>
              </label>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setStep("reason")} className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">رجوع</button>
              <button onClick={() => setStep("confirm")} className="px-5 py-2 rounded-lg text-[14px] font-semibold text-white bg-[#ed4956] hover:bg-[#dc3545] transition-colors">
                التالي
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && !user.is_banned && (
          <div className="space-y-3">
            <div className="bg-[#fafafa] rounded-lg p-4 space-y-3">
              <p className="text-[14px] font-bold text-[#262626]">مراجعة قبل الحظر</p>
              <div className="space-y-2.5 text-[14px]">
                <ConfirmRow label="المستخدم" value={`@${user.username}`} />
                <ConfirmRow label="السبب" value={finalReason} />
                <ConfirmRow label="المدة" value={durationLabel} highlight={selectedDuration === "permanent"} />
                <ConfirmRow label="إنهاء الجلسات" value={terminateSessions ? "نعم" : "لا"} />
                {selectedDuration !== "permanent" && (
                  <ConfirmRow label="إظهار المدة للمستخدم" value={showDuration ? "نعم" : "لا"} />
                )}
              </div>
            </div>

            {selectedDuration === "permanent" && (
              <div className="bg-[#ff9500]/5 border border-[#ff9500]/15 rounded-lg p-3 flex items-start gap-2">
                <span className="text-[14px] mt-0.5">⚠️</span>
                <p className="text-[12px] text-[#262626]">الحظر الدائم يمنع المستخدم من الوصول للمنصة نهائياً. يمكن رفعه لاحقاً بواسطة مسؤول.</p>
              </div>
            )}

            {error && <div className="bg-[#ed4956]/5 border border-[#ed4956]/15 rounded-lg px-4 py-3 text-[13px] text-[#ed4956]">{error}</div>}

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setStep("duration")} className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">رجوع</button>
              <button
                onClick={handleBan}
                disabled={busy}
                className="px-5 py-2 rounded-lg text-[14px] font-bold text-white bg-[#ed4956] hover:bg-[#dc3545] transition-colors disabled:opacity-50"
              >
                {busy ? "جاري التنفيذ..." : "تأكيد الحظر"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

function ConfirmRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#8e8e8e]">{label}</span>
      <span className={`font-medium ${highlight ? "text-[#ed4956]" : "text-[#262626]"}`}>{value}</span>
    </div>
  );
}

function DeleteModal({ user, onClose, onDone }: { user: UserProfile; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteUser(user.id);
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title="حذف المستخدم">
      <div className="space-y-4" dir="rtl">
        <div className="bg-[#ed4956]/5 border border-[#ed4956]/15 rounded-lg p-4">
          <p className="text-[14px] text-[#ed4956] font-semibold">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
          <p className="text-[13px] text-[#262626] mt-1">سيتم حذف حساب @{user.username} نهائياً.</p>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
          <button onClick={handleDelete} disabled={busy} className="px-5 py-2 rounded-lg text-[14px] font-semibold text-white bg-[#ed4956] hover:bg-[#dc3545] transition-colors disabled:opacity-50">
            {busy ? "جاري الحذف..." : "حذف نهائي"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function EditModal({ user, onClose, onDone }: { user: UserProfile; onClose: () => void; onDone: () => void }) {
  const [activeTab, setActiveTab] = useState<"profile" | "badges" | "password">("profile");
  const [displayName, setDisplayName] = useState(user.display_name || user.full_name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [badges, setBadges] = useState({
    is_verified: user.is_verified,
    is_official: user.is_official,
    is_creator: user.is_creator,
    is_premium: user.is_premium,
    is_popular: user.is_popular,
    is_active: user.is_active,
    is_gold_early_member: user.is_gold_early_member,
    is_silver_early_member: user.is_silver_early_member,
    is_bronze_early_member: user.is_bronze_early_member,
    is_beta_tester: user.is_beta_tester,
    is_bug_hunter: user.is_bug_hunter,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة يجب أن يكون أقل من 10 ميغابايت");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const handleSaveProfile = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (avatarFile) {
        const result = await uploadUserAvatar(user.id, avatarFile);
        setAvatarPreview(result.avatar_url);
        setAvatarFile(null);
      } else if (!avatarPreview && user.avatar_url) {
        await updateUser(user.id, { avatar_url: null });
      }

      const payload: Record<string, any> = { ...badges, bio };
      if (displayName !== (user.display_name || user.full_name || "")) {
        payload.display_name = displayName;
      }
      if (username !== user.username) {
        payload.username = username;
      }

      await updateUser(user.id, payload);
      setSuccess("تم حفظ التغييرات بنجاح");
      setTimeout(() => { onDone(); onClose(); }, 800);
    } catch (e: any) {
      setError(e?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) { setError("أدخل كلمة المرور الجديدة"); return; }
    if (newPassword.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (newPassword !== confirmPassword) { setError("كلمة المرور وتأكيدها غير متطابقتين"); return; }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await resetUserPassword(user.id, newPassword);
      setSuccess("تم تغيير كلمة المرور بنجاح");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message || "فشل في تغيير كلمة المرور");
    } finally {
      setBusy(false);
    }
  };

  const badgeList: [string, string][] = [
    ["is_verified", "موثق ✓"],
    ["is_official", "رسمي 🛡"],
    ["is_creator", "صانع محتوى ✨"],
    ["is_premium", "مميز 👑"],
    ["is_popular", "مشهور 🔥"],
    ["is_active", "نشط ⚡"],
    ["is_gold_early_member", "عضو ذهبي مبكر 🏆"],
    ["is_silver_early_member", "عضو فضي مبكر 🥈"],
    ["is_bronze_early_member", "عضو برونزي مبكر 🥉"],
    ["is_beta_tester", "مختبر بيتا 🧪"],
    ["is_bug_hunter", "باك هانتر 🐛"],
  ];

  const tabs = [
    { id: "profile" as const, label: "الملف الشخصي", icon: User },
    { id: "badges" as const, label: "الشارات", icon: Award },
    { id: "password" as const, label: "كلمة المرور", icon: Key },
  ];

  return (
    <ModalWrapper onClose={onClose} title={`تعديل @${user.username}`}>
      <div className="space-y-4" dir="rtl">
        <div className="flex gap-1 bg-[#fafafa] rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setError(""); setSuccess(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[12px] font-medium transition-all ${
                activeTab === t.id ? "bg-white text-[#262626] shadow-sm" : "text-[#8e8e8e] hover:text-[#262626]"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ed4956]/10 text-[#ed4956]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-[12px] font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00c853]/10 text-[#00c853]">
            <Check className="w-4 h-4 shrink-0" />
            <p className="text-[12px] font-medium">{success}</p>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                {avatarPreview ? (
                  <img src={avatarPreview} className="w-20 h-20 rounded-full object-cover border-2 border-[#dbdbdb]" alt="" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#efefef] flex items-center justify-center border-2 border-[#dbdbdb]">
                    <User className="w-8 h-8 text-[#8e8e8e]" />
                  </div>
                )}
                <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
                </label>
              </div>
              <div className="flex gap-2">
                <label className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#0095f6]/10 text-[#0095f6] hover:bg-[#0095f6]/20 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3 inline ml-1" />
                  تغيير الصورة
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
                </label>
                {avatarPreview && (
                  <button onClick={handleRemoveAvatar} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#ed4956]/10 text-[#ed4956] hover:bg-[#ed4956]/20 transition-colors">
                    إزالة الصورة
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#262626] mb-1.5">
                <User className="w-3.5 h-3.5 text-[#8e8e8e]" />
                الاسم الظاهر
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="الاسم الظاهر"
                className="w-full px-3 py-2.5 border border-[#dbdbdb] rounded-lg text-[14px] text-[#262626] focus:outline-none focus:border-[#0095f6] placeholder-[#8e8e8e] transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#262626] mb-1.5">
                <AtSign className="w-3.5 h-3.5 text-[#8e8e8e]" />
                اسم المستخدم
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8e8e8e]">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="username"
                  dir="ltr"
                  className="w-full px-3 pr-8 py-2.5 border border-[#dbdbdb] rounded-lg text-[14px] text-[#262626] focus:outline-none focus:border-[#0095f6] placeholder-[#8e8e8e] transition-colors text-left"
                />
              </div>
              {username !== user.username && username.length > 0 && username.length < 3 && (
                <p className="text-[11px] text-[#ed4956] mt-1">اسم المستخدم يجب أن يكون 3 أحرف على الأقل</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#262626] mb-1.5">النبذة</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#dbdbdb] rounded-lg text-[14px] text-[#262626] focus:outline-none focus:border-[#0095f6] resize-none placeholder-[#8e8e8e] transition-colors"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
              <button onClick={handleSaveProfile} disabled={busy || (username.length > 0 && username.length < 3)} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors disabled:opacity-50 flex items-center gap-2">
                {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري الحفظ...</> : "حفظ التغييرات"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "badges" && (
          <div className="space-y-4">
            <div className="space-y-0.5 max-h-[350px] overflow-y-auto scrollbar-thin">
              {badgeList.map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#fafafa] cursor-pointer transition-colors">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${badges[key as keyof typeof badges] ? "bg-[#0095f6] border-[#0095f6]" : "border-[#dbdbdb]"}`}>
                    {badges[key as keyof typeof badges] && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={badges[key as keyof typeof badges]}
                    onChange={(e) => setBadges({ ...badges, [key]: e.target.checked })}
                    className="sr-only"
                  />
                  <span className="text-[14px] text-[#262626]">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
              <button onClick={handleSaveProfile} disabled={busy} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors disabled:opacity-50 flex items-center gap-2">
                {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري الحفظ...</> : "حفظ الشارات"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#ff9500]/10">
              <AlertCircle className="w-4 h-4 text-[#ff9500] shrink-0" />
              <p className="text-[12px] text-[#ff9500] font-medium">سيتم تسجيل خروج المستخدم من جميع الأجهزة بعد تغيير كلمة المرور</p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#262626] mb-1.5">
                <Key className="w-3.5 h-3.5 text-[#8e8e8e]" />
                كلمة المرور الجديدة
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                className="w-full px-3 py-2.5 border border-[#dbdbdb] rounded-lg text-[14px] text-[#262626] focus:outline-none focus:border-[#0095f6] placeholder-[#8e8e8e] transition-colors"
                dir="ltr"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#262626] mb-1.5">
                <Key className="w-3.5 h-3.5 text-[#8e8e8e]" />
                تأكيد كلمة المرور
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                className="w-full px-3 py-2.5 border border-[#dbdbdb] rounded-lg text-[14px] text-[#262626] focus:outline-none focus:border-[#0095f6] placeholder-[#8e8e8e] transition-colors"
                dir="ltr"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-[#ed4956] mt-1">كلمة المرور وتأكيدها غير متطابقتين</p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="w-4 h-4 rounded border-[#dbdbdb] accent-[#0095f6]" />
              <span className="text-[13px] text-[#262626]">إظهار كلمة المرور</span>
            </label>

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
              <button
                onClick={handleResetPassword}
                disabled={busy || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#ed4956] hover:bg-[#d63950] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري التغيير...</> : "تغيير كلمة المرور"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[460px] max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#efefef]">
          <h2 className="text-[16px] font-semibold text-[#262626] flex-1 text-center">{title}</h2>
          <button onClick={onClose} className="absolute left-4 p-0.5 hover:opacity-60 transition-opacity">
            <X className="w-5 h-5 text-[#262626]" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto scrollbar-thin flex-1">{children}</div>
      </div>
    </div>
  );
}
