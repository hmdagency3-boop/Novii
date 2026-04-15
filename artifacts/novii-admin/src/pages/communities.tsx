import { useEffect, useState, useMemo } from "react";
import {
  fetchCommunities,
  fetchCommunityMembers,
  fetchCommunityMessages,
  deleteCommunity,
  kickCommunityMember,
  unkickCommunityMember,
  muteCommunityMember,
  unmuteCommunityMember,
  setCommunityMemberRole,
  deleteCommunityMessage,
  sendSystemMessage,
  type CommunityRecord,
  type CommunityMemberRecord,
  type CommunityMessageRecord,
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
  UserCheck,
  Crown,
  X,
  VolumeX,
  Volume2,
  ChevronDown,
  Image as ImageIcon,
  Copy,
  Check,
  Send,
  AlertTriangle,
  Settings,
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
                        <span className="text-sm text-gray-600" dir="ltr">@{community.creator_username || "—"}</span>
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
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                          title="إدارة المجتمع"
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
        <CommunityDetailModal
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

function Avatar({ url, name, size = "md" }: { url?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded-lg transition-colors ${copied ? "text-green-500" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
      title="نسخ"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CommunityDetailModal({
  community,
  onClose,
  onRefresh,
}: {
  community: CommunityRecord;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"members" | "chat">("members");

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0" dir="rtl">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar url={community.avatar_url} name={community.name} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-800">{community.name}</h2>
                {community.is_private ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                    <Lock className="w-2.5 h-2.5" /> خاص
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">
                    <Globe className="w-2.5 h-2.5" /> عام
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                المنشئ: @{community.creator_username || "—"} · {community.members_count} عضو · {community.messages_count} رسالة
              </p>
              {/* Invite code */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-gray-400 font-medium">كود الدعوة:</span>
                <div className="flex items-center gap-1 bg-purple-50 border border-purple-100 rounded-lg px-2 py-0.5">
                  <span className="text-xs font-mono font-bold text-purple-700 tracking-widest" dir="ltr">
                    {community.invite_code}
                  </span>
                  <CopyButton text={community.invite_code} />
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors shrink-0 mr-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-6" dir="rtl">
          <button
            onClick={() => setTab("members")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "members"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" /> الأعضاء
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "chat"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> الشات
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "members" ? (
            <MembersTab community={community} onRefresh={onRefresh} />
          ) : (
            <ChatTab community={community} />
          )}
        </div>
      </div>
    </div>
  );
}

function MembersTab({ community, onRefresh }: { community: CommunityRecord; onRefresh: () => void }) {
  const [members, setMembers] = useState<CommunityMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showKicked, setShowKicked] = useState(false);

  const load = () => {
    setLoading(true);
    fetchCommunityMembers(community.id)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [community.id]);

  const act = async (fn: () => Promise<unknown>, userId: string) => {
    setBusyId(userId);
    try {
      await fn();
      load();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const active = members.filter((m) => !m.kicked_at);
  const kicked = members.filter((m) => m.kicked_at);

  const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: "أدمن", color: "text-purple-600 bg-purple-50" },
    moderator: { label: "مشرف", color: "text-blue-600 bg-blue-50" },
    member: { label: "عضو", color: "text-gray-500 bg-gray-100" },
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4" dir="rtl">
      {active.length === 0 && kicked.length === 0 ? (
        <p className="text-center text-gray-400 py-10">لا يوجد أعضاء</p>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                الأعضاء النشطون ({active.length})
              </p>
              {active.map((member) => {
                const rc = roleConfig[member.role] || roleConfig.member;
                const isCreator = member.user_id === community.created_by;
                const busy = busyId === member.user_id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors"
                  >
                    <Avatar url={member.avatar_url} name={member.username || "?"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{member.display_name || member.username || "مجهول"}</p>
                        {member.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        {isCreator && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" title="المنشئ" />}
                      </div>
                      <p className="text-xs text-gray-400" dir="ltr">@{member.username || "—"}</p>
                    </div>

                    {/* Role badge + change */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${rc.color}`}>
                        {isCreator ? "منشئ" : rc.label}
                      </span>

                      {member.is_muted && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-orange-600 bg-orange-50">كتم</span>
                      )}

                      {/* Role selector */}
                      {!isCreator && (
                        <div className="relative">
                          <select
                            value={member.role}
                            disabled={busy}
                            onChange={(e) =>
                              act(() => setCommunityMemberRole(community.id, member.user_id, e.target.value), member.user_id)
                            }
                            className="appearance-none text-[11px] font-medium px-2 py-0.5 rounded-lg border border-gray-200 bg-white text-gray-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50 pl-5"
                          >
                            <option value="member">عضو</option>
                            <option value="moderator">مشرف</option>
                            <option value="admin">أدمن</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-gray-400 absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}

                      {/* Mute / Unmute */}
                      <button
                        onClick={() =>
                          act(
                            () =>
                              member.is_muted
                                ? unmuteCommunityMember(community.id, member.user_id)
                                : muteCommunityMember(community.id, member.user_id),
                            member.user_id
                          )
                        }
                        disabled={busy}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          member.is_muted
                            ? "hover:bg-green-50 text-orange-500 hover:text-green-600"
                            : "hover:bg-orange-50 text-gray-400 hover:text-orange-500"
                        }`}
                        title={member.is_muted ? "إلغاء الكتم" : "كتم"}
                      >
                        {member.is_muted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>

                      {/* Kick */}
                      <button
                        onClick={() =>
                          act(() => kickCommunityMember(community.id, member.user_id), member.user_id)
                        }
                        disabled={busy}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="طرد"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {kicked.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowKicked((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showKicked ? "rotate-180" : ""}`} />
                الأعضاء المطرودون ({kicked.length})
              </button>
              {showKicked && (
                <div className="space-y-2">
                  {kicked.map((member) => {
                    const busy = busyId === member.user_id;
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/60">
                        <div className="w-9 h-9 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-sm font-bold shrink-0">
                          {(member.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-700">{member.display_name || member.username || "مجهول"}</p>
                          <p className="text-xs text-gray-400" dir="ltr">@{member.username || "—"}</p>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-red-600 bg-red-100 shrink-0">مطرود</span>
                        <button
                          onClick={() =>
                            act(() => unkickCommunityMember(community.id, member.user_id), member.user_id)
                          }
                          disabled={busy}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50 shrink-0"
                          title="إلغاء الطرد"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const MIGRATION_SQL = "ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN NOT NULL DEFAULT FALSE;";

function ChatTab({ community }: { community: CommunityRecord }) {
  const [messages, setMessages] = useState<CommunityMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<{ text: string; sql?: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const load = () => {
    setLoading(true);
    fetchCommunityMessages(community.id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [community.id]);

  const handleDelete = async (msg: CommunityMessageRecord) => {
    setDeletingId(msg.id);
    try {
      await deleteCommunityMessage(community.id, msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_deleted: true } : m))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async () => {
    if (!msgInput.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const result = await sendSystemMessage(community.id, msgInput.trim());
      if (result.error === "MIGRATION_NEEDED") {
        setSendError({ text: "يجب تشغيل الـ SQL التالي في Supabase Dashboard أولاً:", sql: result.sql });
      } else {
        setMsgInput("");
        load();
      }
    } catch (e: any) {
      setSendError({ text: e?.message || "فشل في إرسال الرسالة" });
    } finally {
      setSending(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(MIGRATION_SQL).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* Send system message form */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <p className="text-[11px] font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          إرسال رسالة باسم النظام
        </p>
        {sendError && (
          <div className="mb-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5">
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>{sendError.text}</span>
            </div>
            {sendError.sql && (
              <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-1.5 mt-1">
                <code className="text-[10px] font-mono text-amber-900 flex-1 break-all">{sendError.sql}</code>
                <button
                  onClick={copySql}
                  className={`shrink-0 p-1 rounded transition-colors ${sqlCopied ? "text-green-600" : "text-amber-600 hover:text-amber-800"}`}
                >
                  {sqlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="اكتب رسالة النظام هنا..."
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 placeholder:text-gray-400"
            dir="rtl"
          />
          <button
            onClick={handleSend}
            disabled={sending || !msgInput.trim()}
            className="px-3 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5 text-sm font-medium"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            إرسال
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-400">{messages.length} رسالة (آخر 100)</p>
          <button onClick={load} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {messages.length === 0 && (
          <p className="text-center text-gray-400 py-12">لا توجد رسائل</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 group p-2 rounded-xl transition-colors ${
              msg.is_deleted
                ? "opacity-50 bg-red-50/40"
                : msg.is_system_message
                ? "bg-purple-50/60 border border-purple-100"
                : "hover:bg-gray-50"
            }`}
          >
            {msg.is_system_message ? (
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white border border-purple-100">
                <img src={`${import.meta.env.BASE_URL}novii_logo_transparent.png`} alt="النظام" className="w-full h-full object-contain" />
              </div>
            ) : (
              <Avatar url={msg.sender_avatar} name={msg.sender_username || "?"} size="sm" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                {msg.is_system_message ? (
                  <span className="text-xs font-bold text-purple-700">النظام</span>
                ) : (
                  <span className="text-xs font-semibold text-gray-700">
                    {msg.sender_display_name || msg.sender_username || "مجهول"}
                  </span>
                )}
                <span className="text-[10px] text-gray-400" dir="ltr">
                  {new Date(msg.created_at).toLocaleString("ar-EG")}
                </span>
                {msg.is_deleted && (
                  <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">محذوف</span>
                )}
              </div>

              {msg.content && !msg.is_deleted && (
                <p className={`text-sm break-words leading-relaxed ${msg.is_system_message ? "text-purple-800 font-medium" : "text-gray-700"}`}>
                  {msg.content}
                </p>
              )}
              {msg.content && msg.is_deleted && (
                <p className="text-sm text-gray-400 italic line-through">{msg.content}</p>
              )}
              {msg.image_url && !msg.is_deleted && !msg.is_system_message && (
                <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-xs text-purple-600 hover:underline">
                  <ImageIcon className="w-3.5 h-3.5" /> عرض الصورة
                </a>
              )}
            </div>

            {!msg.is_deleted && (
              <button
                onClick={() => handleDelete(msg)}
                disabled={deletingId === msg.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all disabled:opacity-50 shrink-0"
                title="حذف الرسالة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
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
