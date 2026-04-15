import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/admin-api";
import { toast } from "sonner";
import {
  BadgeCheck, Clock, CheckCircle, XCircle, User, ExternalLink,
  RefreshCw, Eye, X,
} from "lucide-react";

interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string;
  reason: string;
  category: string;
  social_links: Record<string, string>;
  id_card_url: string | null;
  selfie_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    followers_count: number;
    posts_count: number;
    is_verified: boolean;
    created_at: string;
  } | null;
}

const categoryLabels: Record<string, string> = {
  personal: "شخصي",
  creator: "صانع محتوى",
  business: "نشاط تجاري",
  public_figure: "شخصية عامة",
  organization: "مؤسسة",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "قيد المراجعة", color: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock },
  approved: { label: "مقبول", color: "bg-green-50 text-green-600 border-green-200", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
};

export default function VerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<VerificationRequest[]>("/verification-requests");
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch verification requests:", err);
      toast.error("فشل تحميل طلبات التوثيق");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await adminFetch(`/verification-requests/${selectedRequest.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_note: adminNote || undefined }),
      });
      toast.success(status === "approved" ? "تم قبول الطلب وتوثيق الحساب" : "تم رفض الطلب");
      setSelectedRequest(null);
      setAdminNote("");
      fetchRequests();
    } catch (err: any) {
      console.error("Action failed:", err);
      toast.error(err?.message || "فشل تنفيذ الإجراء");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-[#262626]">طلبات التوثيق</h1>
            <p className="text-sm text-[#8e8e8e]">إدارة طلبات توثيق الحسابات</p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium px-2.5 py-1 rounded-full">
              {pendingCount} قيد المراجعة
            </span>
          )}
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#262626] text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> تحديث
        </button>
      </div>

      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? "bg-white text-[#262626] shadow-sm" : "text-[#8e8e8e] hover:text-[#262626]"
            }`}
          >
            {f === "all" ? "الكل" : statusConfig[f].label}
            <span className="text-[10px] opacity-60 mr-1">
              ({f === "all" ? requests.length : requests.filter(r => r.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#0095f6] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e8e]">
          <BadgeCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{filter === "all" ? "لا توجد طلبات توثيق" : "لا توجد طلبات بهذه الحالة"}</p>
        </div>
      ) : (
        <div className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#efefef]">
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">المستخدم</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">الفئة</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">السبب</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">الحالة</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">التاريخ</th>
                <th className="text-center px-5 py-3.5 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efefef]">
              {filtered.map((req) => {
                const sc = statusConfig[req.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={req.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {req.profile?.avatar_url ? (
                          <img src={req.profile.avatar_url} className="w-9 h-9 rounded-full object-cover ring-1 ring-[#dbdbdb]" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#8e8e8e]" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#262626]">{req.full_name || req.profile?.username}</p>
                          <p className="text-xs text-[#8e8e8e]">@{req.profile?.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-[#262626]">{categoryLabels[req.category] || req.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-[#262626] max-w-[200px] truncate">{req.reason}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" /> {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-[#8e8e8e]">{new Date(req.created_at).toLocaleDateString('ar-EG')}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => { setSelectedRequest(req); setAdminNote(req.admin_note || ""); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0095f6] hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> عرض
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefef] sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-[#262626]">تفاصيل طلب التوثيق</h2>
              <button onClick={() => setSelectedRequest(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-[#8e8e8e]" />
              </button>
            </div>

            <div className="p-6 space-y-5" dir="rtl">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#fafafa] border border-[#efefef]">
                {selectedRequest.profile?.avatar_url ? (
                  <div className="p-[2px] rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]">
                    <img src={selectedRequest.profile.avatar_url} className="w-14 h-14 rounded-full object-cover border-2 border-white" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#8e8e8e]" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg text-[#262626]">{selectedRequest.full_name}</p>
                  <p className="text-sm text-[#8e8e8e]">@{selectedRequest.profile?.username}</p>
                  <div className="flex gap-4 mt-1 text-xs text-[#8e8e8e]">
                    <span>{selectedRequest.profile?.followers_count || 0} متابع</span>
                    <span>{selectedRequest.profile?.posts_count || 0} منشور</span>
                  </div>
                </div>
              </div>

              {(selectedRequest.id_card_url || selectedRequest.selfie_url) && (
                <div>
                  <label className="text-xs text-[#8e8e8e] block mb-2 font-medium">مستندات التحقق من الهوية</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRequest.id_card_url && (
                      <div className="rounded-lg overflow-hidden border border-[#dbdbdb]">
                        <p className="text-[10px] font-medium text-center py-1 bg-[#fafafa] text-[#8e8e8e] border-b border-[#efefef]">البطاقة الشخصية</p>
                        <a href={selectedRequest.id_card_url} target="_blank" rel="noopener noreferrer">
                          <img src={selectedRequest.id_card_url} alt="ID Card" className="w-full h-32 object-contain bg-gray-50 hover:opacity-80 transition-opacity cursor-zoom-in" />
                        </a>
                      </div>
                    )}
                    {selectedRequest.selfie_url && (
                      <div className="rounded-lg overflow-hidden border border-[#dbdbdb]">
                        <p className="text-[10px] font-medium text-center py-1 bg-[#fafafa] text-[#8e8e8e] border-b border-[#efefef]">صورة السيلفي</p>
                        <a href={selectedRequest.selfie_url} target="_blank" rel="noopener noreferrer">
                          <img src={selectedRequest.selfie_url} alt="Selfie" className="w-full h-32 object-contain bg-gray-50 hover:opacity-80 transition-opacity cursor-zoom-in" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#8e8e8e] block mb-1">الفئة</label>
                  <p className="text-sm text-[#262626]">{categoryLabels[selectedRequest.category] || selectedRequest.category}</p>
                </div>
                <div>
                  <label className="text-xs text-[#8e8e8e] block mb-1">سبب الطلب</label>
                  <p className="text-sm bg-[#fafafa] rounded-lg p-3 text-[#262626] border border-[#efefef]">{selectedRequest.reason}</p>
                </div>
                {Object.entries(selectedRequest.social_links || {}).filter(([, v]) => v).length > 0 && (
                  <div>
                    <label className="text-xs text-[#8e8e8e] block mb-1">الروابط</label>
                    <div className="space-y-1">
                      {Object.entries(selectedRequest.social_links).filter(([, v]) => v).map(([k, v]) => {
                        const isSafe = /^https?:\/\//i.test(v);
                        return isSafe ? (
                          <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0095f6] hover:underline">
                            <ExternalLink className="w-3 h-3" /> {k}: {v}
                          </a>
                        ) : (
                          <span key={k} className="flex items-center gap-2 text-sm text-[#8e8e8e]">
                            <ExternalLink className="w-3 h-3" /> {k}: {v}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.status === "pending" && (
                <div className="space-y-3 pt-4 border-t border-[#efefef]">
                  <div>
                    <label className="text-xs text-[#8e8e8e] block mb-1.5">ملاحظة الأدمن (اختياري)</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="أضف ملاحظة..."
                      className="w-full px-3 py-2 border border-[#dbdbdb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6]/20 focus:border-[#0095f6]/40 resize-none text-[#262626]"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction("approved")}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#00c853] hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" /> قبول وتوثيق
                    </button>
                    <button
                      onClick={() => handleAction("rejected")}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#ed4956] hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status !== "pending" && (
                <div className={`p-3 rounded-lg border ${selectedRequest.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <p className="text-sm font-medium text-[#262626]">{selectedRequest.status === "approved" ? "تم القبول والتوثيق" : "تم الرفض"}</p>
                  {selectedRequest.admin_note && <p className="text-xs text-[#8e8e8e] mt-1">ملاحظة: {selectedRequest.admin_note}</p>}
                  {selectedRequest.reviewed_at && <p className="text-xs text-[#8e8e8e] mt-1">بتاريخ: {new Date(selectedRequest.reviewed_at).toLocaleDateString('ar-EG')}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
