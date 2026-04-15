import { useEffect, useState, useMemo } from "react";
import {
  fetchCommunities,
  fetchCommunityMembers,
  deleteCommunity,
  kickCommunityMember,
  type CommunityRecord,
  type CommunityMemberRecord,
} from "@/lib/admin-api";
import {
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Users,
  MessageSquare,
  Lock,
  Globe,
  CheckCircle,
  UserX,
  Crown,
  X,
} from "lucide-react";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommunityRecord | null>(null);

  const load = () => {
    setLoading(true);
    fetchCommunities()
      .then(setCommunities)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = communities;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.creator_username?.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s)
      );
    }
    if (filter === "public") result = result.filter((c) => !c.is_private);
    if (filter === "private") result = result.filter((c) => c.is_private);
    return result;
  }, [communities, search, filter]);

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المجتمعات</h1>
          <p className="text-sm text-gray-500 mt-1">{communities.length} مجتمع مسجل</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
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
            placeholder="بحث بالاسم أو المنشئ..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            dir="rtl"
          />
        </div>
        <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          {(["all", "public", "private"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "الكل" : f === "public" ? "عام" : "خاص"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المجتمع</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المنشئ</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">النوع</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الأعضاء</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الرسائل</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">لا توجد مجتمعات</td>
                </tr>
              ) : (
                filtered.map((community) => (
                  <tr key={community.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                          {community.avatar_url ? (
                            <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            community.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{community.name}</p>
                          {community.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">{community.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                          {community.creator_avatar ? (
                            <img src={community.creator_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (community.creator_username || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-sm text-gray-600 dir-ltr">@{community.creator_username || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {community.is_private ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <Lock className="w-3 h-3" /> خاص
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          <Globe className="w-3 h-3" /> عام
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        {community.members_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        {community.messages_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(community.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedCommunity(community)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="عرض الأعضاء"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(community)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="حذف المجتمع"
                        >
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

      {selectedCommunity && (
        <MembersModal
          community={selectedCommunity}
          onClose={() => setSelectedCommunity(null)}
          onRefresh={load}
        />
      )}
      {deleteTarget && (
        <DeleteCommunityModal
          community={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={load}
        />
      )}
    </div>
  );
}

function MembersModal({
  community,
  onClose,
  onRefresh,
}: {
  community: CommunityRecord;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [members, setMembers] = useState<CommunityMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [kickingId, setKickingId] = useState<string | null>(null);

  const loadMembers = () => {
    setLoading(true);
    fetchCommunityMembers(community.id)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMembers(); }, [community.id]);

  const handleKick = async (member: CommunityMemberRecord) => {
    setKickingId(member.user_id);
    try {
      await kickCommunityMember(community.id, member.user_id);
      loadMembers();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setKickingId(null);
    }
  };

  const active = members.filter((m) => !m.kicked_at);
  const kicked = members.filter((m) => m.kicked_at);

  const roleLabel = (role: string) => {
    if (role === "admin") return { label: "مدير", color: "text-purple-600 bg-purple-50" };
    if (role === "moderator") return { label: "مشرف", color: "text-blue-600 bg-blue-50" };
    return { label: "عضو", color: "text-gray-500 bg-gray-100" };
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {community.avatar_url ? (
                <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                community.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{community.name}</h2>
              <p className="text-xs text-gray-400">{active.length} عضو نشط</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4" dir="rtl">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-gray-400 py-8">لا يوجد أعضاء</p>
          ) : (
            <div className="space-y-4">
              {active.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">الأعضاء النشطون ({active.length})</p>
                  <div className="space-y-2">
                    {active.map((member) => {
                      const { label, color } = roleLabel(member.role);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (member.username || "?").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-gray-800 truncate">{member.display_name || member.username || "مجهول"}</p>
                                {member.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                {member.role === "admin" && <Crown className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-400" dir="ltr">@{member.username || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                            {member.is_muted && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-orange-600 bg-orange-50">كتم</span>
                            )}
                            {member.role !== "admin" && (
                              <button
                                onClick={() => handleKick(member)}
                                disabled={kickingId === member.user_id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                title="طرد العضو"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {kicked.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">الأعضاء المطرودون ({kicked.length})</p>
                  <div className="space-y-2">
                    {kicked.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-red-50/60 opacity-70"
                      >
                        <div className="w-9 h-9 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-sm font-bold shrink-0">
                          {(member.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-700 truncate">{member.display_name || member.username || "مجهول"}</p>
                          <p className="text-xs text-gray-400" dir="ltr">@{member.username || "—"}</p>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-red-600 bg-red-100">مطرود</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteCommunityModal({
  community,
  onClose,
  onDone,
}: {
  community: CommunityRecord;
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setBusy(true);
    setError("");
    try {
      await deleteCommunity(community.id);
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل في تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" dir="rtl">
          <h2 className="text-base font-bold text-gray-800">حذف المجتمع</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4" dir="rtl">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm text-red-600 font-medium">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
            <p className="text-sm text-red-500 mt-1">
              سيتم حذف مجتمع <span className="font-semibold">"{community.name}"</span> مع جميع رسائله وأعضائه نهائياً.
            </p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {busy ? "جاري الحذف..." : "حذف نهائي"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
