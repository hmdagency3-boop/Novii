import { useEffect, useState } from "react";
import { fetchReports, updateReport, type ReportRecord } from "@/lib/admin-api";
import { Flag, RefreshCw, Eye, XCircle, Clock, AlertTriangle, User, CheckCircle, Ban, MessageSquare, Image } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  spam: "محتوى مزعج / سبام",
  nudity: "محتوى إباحي أو عري",
  harassment: "تنمر أو تحرش",
  violence: "عنف أو تهديد",
  hate_speech: "خطاب كراهية",
  false_info: "معلومات مضللة",
  impersonation: "انتحال شخصية",
  intellectual_property: "انتهاك حقوق ملكية فكرية",
  other: "سبب آخر",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<ReportRecord | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved" | "dismissed">("all");
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadReports = () => {
    setLoading(true);
    fetchReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  const filteredReports = filter === "all" ? reports : reports.filter(r => r.status === filter);

  const handleStatusUpdate = async (reportId: string, status: string) => {
    setUpdating(true);
    try {
      await updateReport(reportId, { status, admin_note: adminNote.trim() || undefined });
      loadReports();
      setViewReport(null);
      setAdminNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">البلاغات</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reports.length} بلاغ
            {pendingCount > 0 && <span className="text-amber-500 font-medium mr-2">• {pendingCount} قيد المراجعة</span>}
          </p>
        </div>
        <button onClick={loadReports} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "resolved", "dismissed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "الكل" : f === "pending" ? "قيد المراجعة" : f === "resolved" ? "تمت المعالجة" : "مرفوض"}
            {f === "pending" && pendingCount > 0 && (
              <span className="mr-1.5 bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المُبلِّغ</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المُبلَّغ عنه</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">السبب</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المنشور</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-10 bg-gray-100 rounded-lg animate-pulse" /></td></tr>
              ))
            ) : filteredReports.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">لا توجد بلاغات</td></tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id} className={`hover:bg-gray-50/50 transition-colors ${report.status === "pending" ? "bg-amber-50/30" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {report.reporter_avatar ? (
                        <img src={report.reporter_avatar} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700 font-medium">{report.reporter_username || report.reporter_id?.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {report.reported_avatar ? (
                        <img src={report.reported_avatar} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700 font-medium">{report.reported_username || report.reported_user_id?.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-600">{REASON_LABELS[report.reason] || report.reason}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {report.post_image ? (
                      <img src={report.post_image} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => { setViewReport(report); setAdminNote(report.admin_note || ""); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewReport(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">تفاصيل البلاغ</h2>
              <button onClick={() => setViewReport(null)} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4" dir="rtl">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">المُبلِّغ</p>
                  <div className="flex items-center gap-2">
                    {viewReport.reporter_avatar && <img src={viewReport.reporter_avatar} className="w-7 h-7 rounded-full object-cover" />}
                    <p className="text-sm font-semibold text-gray-700">{viewReport.reporter_username || viewReport.reporter_id?.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">المُبلَّغ عنه</p>
                  <div className="flex items-center gap-2">
                    {viewReport.reported_avatar && <img src={viewReport.reported_avatar} className="w-7 h-7 rounded-full object-cover" />}
                    <p className="text-sm font-semibold text-gray-700">{viewReport.reported_username || viewReport.reported_user_id?.slice(0, 8)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700">السبب: {REASON_LABELS[viewReport.reason] || viewReport.reason}</p>
                </div>
                {viewReport.description && <p className="text-sm text-amber-600">{viewReport.description}</p>}
              </div>

              {viewReport.post_image && (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <p className="text-xs text-gray-400 px-3 pt-2 pb-1 flex items-center gap-1"><Image className="w-3 h-3" /> المنشور المُبلَّغ عنه</p>
                  <img src={viewReport.post_image} className="w-full max-h-64 object-cover" />
                  {viewReport.post_caption && (
                    <p className="text-xs text-gray-600 p-3 border-t border-gray-100 line-clamp-3">{viewReport.post_caption}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <StatusBadge status={viewReport.status} />
                <span className="text-xs text-gray-400">{new Date(viewReport.created_at).toLocaleString("ar-EG")}</span>
              </div>

              {viewReport.status === "pending" && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ملاحظة الأدمن (اختياري)</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="أضف ملاحظة..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(viewReport.id, "resolved")}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      معالجة
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(viewReport.id, "dismissed")}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      رفض
                    </button>
                  </div>
                </div>
              )}

              {viewReport.admin_note && viewReport.status !== "pending" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-400 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> ملاحظة الأدمن</p>
                  <p className="text-sm text-blue-700">{viewReport.admin_note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600",
    resolved: "bg-green-50 text-green-600",
    dismissed: "bg-gray-100 text-gray-500",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    resolved: <CheckCircle className="w-3 h-3" />,
    dismissed: <Ban className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {icons[status]} {status === "pending" ? "قيد المراجعة" : status === "resolved" ? "تمت المعالجة" : status === "dismissed" ? "مرفوض" : status}
    </span>
  );
}
