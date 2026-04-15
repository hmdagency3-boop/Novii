import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/admin-api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  BadgeCheck, Clock, CheckCircle, XCircle, User, ExternalLink,
  RefreshCw, Filter, Eye,
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
  pending: { label: "قيد المراجعة", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  approved: { label: "مقبول", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <BadgeCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">طلبات التوثيق</h1>
            <p className="text-sm text-slate-400">إدارة طلبات توثيق الحسابات</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 mr-2">
              {pendingCount} قيد المراجعة
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <RefreshCw className="w-4 h-4 ml-2" /> تحديث
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-indigo-600 hover:bg-indigo-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
          >
            <Filter className="w-3 h-3 ml-1.5" />
            {f === "all" ? "الكل" : statusConfig[f].label}
            <span className="text-xs opacity-60 mr-1">
              ({f === "all" ? requests.length : requests.filter(r => r.status === f).length})
            </span>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BadgeCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{filter === "all" ? "لا توجد طلبات توثيق" : "لا توجد طلبات بهذه الحالة"}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-right">المستخدم</TableHead>
                <TableHead className="text-slate-400 text-right">الفئة</TableHead>
                <TableHead className="text-slate-400 text-right">السبب</TableHead>
                <TableHead className="text-slate-400 text-right">الحالة</TableHead>
                <TableHead className="text-slate-400 text-right">التاريخ</TableHead>
                <TableHead className="text-slate-400 text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => {
                const sc = statusConfig[req.status];
                const StatusIcon = sc.icon;
                return (
                  <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {req.profile?.avatar_url ? (
                          <img src={req.profile.avatar_url} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{req.full_name || req.profile?.username}</p>
                          <p className="text-xs text-slate-500">@{req.profile?.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-300">{categoryLabels[req.category] || req.category}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-300 max-w-[200px] truncate">{req.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${sc.color} text-xs`}>
                        <StatusIcon className="w-3 h-3 ml-1" /> {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-400">{new Date(req.created_at).toLocaleDateString('ar-EG')}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(req); setAdminNote(req.admin_note || ""); }} className="text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4 ml-1" /> عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
        <DialogContent className="bg-[hsl(224,30%,14%)] border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل طلب التوثيق</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-5" dir="rtl">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50">
                {selectedRequest.profile?.avatar_url ? (
                  <img src={selectedRequest.profile.avatar_url} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg">{selectedRequest.full_name}</p>
                  <p className="text-sm text-slate-400">@{selectedRequest.profile?.username}</p>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span>{selectedRequest.profile?.followers_count || 0} متابع</span>
                    <span>{selectedRequest.profile?.posts_count || 0} منشور</span>
                  </div>
                </div>
              </div>

              {(selectedRequest.id_card_url || selectedRequest.selfie_url) && (
                <div>
                  <label className="text-xs text-slate-500 block mb-2">مستندات التحقق من الهوية</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRequest.id_card_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <p className="text-[10px] font-medium text-center py-1 bg-slate-800 text-slate-400 border-b border-slate-700">البطاقة الشخصية</p>
                        <a href={selectedRequest.id_card_url} target="_blank" rel="noopener noreferrer">
                          <img src={selectedRequest.id_card_url} alt="ID Card" className="w-full h-32 object-contain bg-slate-900/50 hover:opacity-80 transition-opacity cursor-zoom-in" />
                        </a>
                      </div>
                    )}
                    {selectedRequest.selfie_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <p className="text-[10px] font-medium text-center py-1 bg-slate-800 text-slate-400 border-b border-slate-700">صورة السيلفي</p>
                        <a href={selectedRequest.selfie_url} target="_blank" rel="noopener noreferrer">
                          <img src={selectedRequest.selfie_url} alt="Selfie" className="w-full h-32 object-contain bg-slate-900/50 hover:opacity-80 transition-opacity cursor-zoom-in" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">الفئة</label>
                  <p className="text-sm">{categoryLabels[selectedRequest.category] || selectedRequest.category}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">سبب الطلب</label>
                  <p className="text-sm bg-slate-800/50 rounded-lg p-3">{selectedRequest.reason}</p>
                </div>
                {Object.entries(selectedRequest.social_links || {}).filter(([, v]) => v).length > 0 && (
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">الروابط</label>
                    <div className="space-y-1">
                      {Object.entries(selectedRequest.social_links).filter(([, v]) => v).map(([k, v]) => {
                        const isSafe = /^https?:\/\//i.test(v);
                        return isSafe ? (
                          <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:underline">
                            <ExternalLink className="w-3 h-3" /> {k}: {v}
                          </a>
                        ) : (
                          <span key={k} className="flex items-center gap-2 text-sm text-slate-400">
                            <ExternalLink className="w-3 h-3" /> {k}: {v}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.status === "pending" && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5">ملاحظة الأدمن (اختياري)</label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="أضف ملاحظة..."
                      className="bg-slate-800/50 border-slate-700 text-white"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleAction("approved")} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 ml-2" /> قبول وتوثيق
                    </Button>
                    <Button onClick={() => handleAction("rejected")} disabled={actionLoading} variant="destructive" className="flex-1">
                      <XCircle className="w-4 h-4 ml-2" /> رفض
                    </Button>
                  </div>
                </div>
              )}

              {selectedRequest.status !== "pending" && (
                <div className={`p-3 rounded-lg ${selectedRequest.status === "approved" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  <p className="text-sm font-medium">{selectedRequest.status === "approved" ? "✅ تم القبول والتوثيق" : "❌ تم الرفض"}</p>
                  {selectedRequest.admin_note && <p className="text-xs text-slate-400 mt-1">ملاحظة: {selectedRequest.admin_note}</p>}
                  {selectedRequest.reviewed_at && <p className="text-xs text-slate-500 mt-1">بتاريخ: {new Date(selectedRequest.reviewed_at).toLocaleDateString('ar-EG')}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
