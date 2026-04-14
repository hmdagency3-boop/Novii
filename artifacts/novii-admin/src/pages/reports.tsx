import { useEffect, useState } from "react";
import { fetchReports, type ReportRecord } from "@/lib/admin-api";
import { Flag, RefreshCw, Eye, XCircle, Clock, AlertTriangle, User } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<ReportRecord | null>(null);

  const loadReports = () => {
    setLoading(true);
    fetchReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">البلاغات</h1>
          <p className="text-sm text-gray-500 mt-1">{reports.length} بلاغ</p>
        </div>
        <button onClick={loadReports} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المُبلِّغ</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المُبلَّغ عنه</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">السبب</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">عرض</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-10 bg-gray-100 rounded-lg animate-pulse" /></td></tr>
              ))
            ) : reports.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">لا توجد بلاغات</td></tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{report.reporter_username || report.reporter_id?.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">{report.reported_username || report.reported_user_id?.slice(0, 8)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-600 truncate max-w-[200px] block">{report.reason}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => setViewReport(report)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">تفاصيل البلاغ</h2>
              <button onClick={() => setViewReport(null)} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4" dir="rtl">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">المُبلِّغ</p>
                  <p className="text-sm font-semibold text-gray-700">{viewReport.reporter_username || viewReport.reporter_id?.slice(0, 8)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">المُبلَّغ عنه</p>
                  <p className="text-sm font-semibold text-gray-700">{viewReport.reported_username || viewReport.reported_user_id?.slice(0, 8)}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700">السبب: {viewReport.reason}</p>
                </div>
                {viewReport.description && <p className="text-sm text-amber-600">{viewReport.description}</p>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <StatusBadge status={viewReport.status} />
                <span className="text-xs text-gray-400">{new Date(viewReport.created_at).toLocaleString("ar-EG")}</span>
              </div>
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
    resolved: <Flag className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {icons[status]} {status === "pending" ? "قيد المراجعة" : status === "resolved" ? "تمت المعالجة" : status === "dismissed" ? "مرفوض" : status}
    </span>
  );
}
