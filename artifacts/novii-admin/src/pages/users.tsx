import { useEffect, useState, useMemo } from "react";
import {
  fetchUsers,
  banUser,
  deleteUser,
  updateUser,
  type UserProfile,
} from "@/lib/admin-api";
import {
  Search,
  MoreHorizontal,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Crown,
  Star,
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
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "banned" | "creators">("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionUser, setActionUser] = useState<UserProfile | null>(null);

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
    if (filter === "banned") result = result.filter((u) => u.is_banned);
    if (filter === "creators") result = result.filter((u) => u.is_creator);
    return result;
  }, [users, search, filter]);

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} مستخدم مسجل</p>
        </div>
        <button onClick={loadUsers} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو اسم المستخدم..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            dir="rtl"
          />
        </div>
        <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          {(["all", "verified", "banned", "creators"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "الكل" : f === "verified" ? "موثقين" : f === "banned" ? "محظورين" : "صناع محتوى"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المستخدم</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الشارات</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المتابعين</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المنشورات</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4"><div className="h-10 bg-gray-100 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">لا توجد نتائج</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.username || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{user.display_name || user.username}</p>
                          <p className="text-xs text-gray-400" dir="ltr">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {user.is_verified && <CheckCircle className="w-4 h-4 text-blue-500" title="موثق" />}
                        {user.is_official && <Shield className="w-4 h-4 text-purple-500" title="رسمي" />}
                        {user.is_creator && <Sparkles className="w-4 h-4 text-amber-500" title="صانع محتوى" />}
                        {user.is_premium && <Crown className="w-4 h-4 text-yellow-500" title="مميز" />}
                        {user.is_popular && <Flame className="w-4 h-4 text-pink-500" title="مشهور" />}
                        {user.is_active && <Zap className="w-4 h-4 text-green-500" title="نشط" />}
                        {user.is_gold_early_member && <Trophy className="w-4 h-4 text-yellow-400" title="عضو ذهبي مبكر" />}
                        {user.is_silver_early_member && <Medal className="w-4 h-4 text-slate-400" title="عضو فضي مبكر" />}
                        {user.is_bronze_early_member && <Award className="w-4 h-4 text-orange-600" title="عضو برونزي مبكر" />}
                        {user.is_beta_tester && <FlaskConical className="w-4 h-4 text-violet-500" title="مختبر بيتا" />}
                        {user.is_bug_hunter && <Bug className="w-4 h-4 text-lime-500" title="باك هانتر" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                          <Ban className="w-3 h-3" /> محظور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{(user.followers_count || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{(user.posts_count || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedUser(user)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="عرض">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setActionUser(user); setShowEditModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors" title="تعديل">
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setActionUser(user); setShowBanModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors" title={user.is_banned ? "إلغاء حظر" : "حظر"}>
                          <Ban className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setActionUser(user); setShowDeleteModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
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

function ViewUserModal({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose} title="تفاصيل المستخدم">
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
            {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : (user.username || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{user.display_name || user.username}</h3>
            <p className="text-sm text-gray-400" dir="ltr">@{user.username}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="المتابعين" value={user.followers_count || 0} />
          <InfoBox label="يتابع" value={user.following_count || 0} />
          <InfoBox label="المنشورات" value={user.posts_count || 0} />
          <InfoBox label="تاريخ التسجيل" value={new Date(user.created_at).toLocaleDateString("ar-EG")} />
        </div>
        {user.bio && <div className="bg-gray-50 rounded-xl p-3"><p className="text-sm text-gray-600">{user.bio}</p></div>}
        <div className="flex flex-wrap gap-2">
          {user.is_verified && <Badge color="blue">موثق</Badge>}
          {user.is_official && <Badge color="purple">رسمي</Badge>}
          {user.is_creator && <Badge color="amber">صانع محتوى</Badge>}
          {user.is_premium && <Badge color="yellow">مميز</Badge>}
          {user.is_popular && <Badge color="pink">مشهور</Badge>}
          {user.is_active && <Badge color="green">نشط</Badge>}
          {user.is_gold_early_member && <Badge color="yellow">عضو ذهبي مبكر</Badge>}
          {user.is_silver_early_member && <Badge color="slate">عضو فضي مبكر</Badge>}
          {user.is_bronze_early_member && <Badge color="orange">عضو برونزي مبكر</Badge>}
          {user.is_beta_tester && <Badge color="violet">مختبر بيتا</Badge>}
          {user.is_bug_hunter && <Badge color="lime">باك هانتر</Badge>}
          {user.is_banned && <Badge color="red">محظور</Badge>}
        </div>
        {user.is_banned && (user.ban_reason || user.banned_reason) && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-red-600 mb-1">سبب الحظر:</p>
            <p className="text-sm text-red-500">{user.ban_reason || user.banned_reason}</p>
            {(user.ban_expires_at || user.ban_until) && (
              <p className="text-xs text-red-400 mt-1">ينتهي: {new Date(user.ban_expires_at || user.ban_until!).toLocaleString("ar-EG")}</p>
            )}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

function BanModal({ user, onClose, onDone }: { user: UserProfile; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [durationNum, setDurationNum] = useState("7");
  const [durationUnit, setDurationUnit] = useState("d");
  const [isPermanent, setIsPermanent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleBan = async () => {
    setBusy(true);
    setError("");
    try {
      const duration = user.is_banned ? undefined : (isPermanent ? "permanent" : `${durationNum}${durationUnit}`);
      await banUser(user.id, {
        ban: !user.is_banned,
        reason: reason || undefined,
        duration,
      });
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل في تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title={user.is_banned ? "إلغاء حظر المستخدم" : "حظر المستخدم"}>
      <div className="space-y-4" dir="rtl">
        <p className="text-sm text-gray-600">
          {user.is_banned
            ? `هل تريد إلغاء حظر @${user.username}؟`
            : `هل تريد حظر @${user.username}؟`}
        </p>
        {!user.is_banned && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                rows={2}
              />
            </div>
            <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">حظر دائم</span>
            </label>
            {!isPermanent && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدة</label>
                  <input
                    type="number"
                    value={durationNum}
                    onChange={(e) => setDurationNum(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    min="1"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="h">ساعات</option>
                    <option value="d">أيام</option>
                    <option value="m">أشهر</option>
                    <option value="y">سنوات</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
          <button onClick={handleBan} disabled={busy} className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${user.is_banned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}>
            {busy ? "جاري..." : user.is_banned ? "إلغاء الحظر" : "حظر"}
          </button>
        </div>
      </div>
    </ModalWrapper>
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
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
          <p className="text-sm text-red-500 mt-1">سيتم حذف حساب @{user.username} نهائياً.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
          <button onClick={handleDelete} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
            {busy ? "جاري الحذف..." : "حذف نهائي"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function EditModal({ user, onClose, onDone }: { user: UserProfile; onClose: () => void; onDone: () => void }) {
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
  const [bio, setBio] = useState(user.bio || "");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateUser(user.id, { ...badges, bio });
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title={`تعديل @${user.username}`}>
      <div className="space-y-4" dir="rtl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">النبذة</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الشارات</label>
          <div className="space-y-2">
            {Object.entries({ is_verified: "موثق ✓", is_official: "رسمي 🛡", is_creator: "صانع محتوى ✨", is_premium: "مميز 👑", is_popular: "مشهور 🔥", is_active: "نشط ⚡", is_gold_early_member: "عضو ذهبي مبكر 🏆", is_silver_early_member: "عضو فضي مبكر 🥈", is_bronze_early_member: "عضو برونزي مبكر 🥉", is_beta_tester: "مختبر بيتا 🧪", is_bug_hunter: "باك هانتر 🐛" }).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={badges[key as keyof typeof badges]}
                  onChange={(e) => setBadges({ ...badges, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50">
            {busy ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-700">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    yellow: "bg-yellow-50 text-yellow-600",
    pink: "bg-pink-50 text-pink-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
    slate: "bg-slate-100 text-slate-600",
    orange: "bg-orange-50 text-orange-600",
    violet: "bg-violet-50 text-violet-600",
    lime: "bg-lime-50 text-lime-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
}
