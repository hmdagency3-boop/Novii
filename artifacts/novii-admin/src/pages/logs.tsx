import { useEffect, useState } from "react";
import { fetchLogs, type LogRecord } from "@/lib/admin-api";
import { ScrollText, RefreshCw, Shield, User, FileText, Settings, Flag, Eye, XCircle } from "lucide-react";

const actionIcons: Record<string, React.ReactNode> = {
  ban_user: <User className="w-3.5 h-3.5 text-red-500" />,
  unban_user: <User className="w-3.5 h-3.5 text-green-500" />,
  delete_user: <User className="w-3.5 h-3.5 text-red-600" />,
  update_user: <User className="w-3.5 h-3.5 text-blue-500" />,
  delete_post: <FileText className="w-3.5 h-3.5 text-red-500" />,
  add_admin: <Shield className="w-3.5 h-3.5 text-purple-500" />,
  update_admin: <Shield className="w-3.5 h-3.5 text-blue-500" />,
  remove_admin: <Shield className="w-3.5 h-3.5 text-red-500" />,
  update_setting: <Settings className="w-3.5 h-3.5 text-teal-500" />,
  resolve_report: <Flag className="w-3.5 h-3.5 text-green-500" />,
};

const actionLabels: Record<string, string> = {
  ban_user: "حظر مستخدم",
  unban_user: "إلغاء حظر",
  delete_user: "حذف مستخدم",
  update_user: "تعديل مستخدم",
  delete_post: "حذف منشور",
  add_admin: "إضافة مشرف",
  update_admin: "تعديل مشرف",
  remove_admin: "إزالة مشرف",
  update_setting: "تعديل إعداد",
  resolve_report: "معالجة بلاغ",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewLog, setViewLog] = useState<LogRecord | null>(null);

  const loadLogs = () => {
    setLoading(true);
    fetchLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, []);

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">سجل العمليات</h1>
          <p className="text-sm text-gray-500 mt-1">آخر {logs.length} عملية</p>
        </div>
        <button onClick={loadLogs} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4"><div className="h-12 bg-gray-100 rounded-lg animate-pulse" /></div>
            ))
          ) : logs.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-400">لا توجد سجلات</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  {actionIcons[log.action] || <ScrollText className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {actionLabels[log.action] || log.action}
                    </span>
                    {log.target_id && (
                      <code className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-mono" dir="ltr">
                        {log.target_id.slice(0, 8)}...
                      </code>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    بواسطة {log.admin_username || log.admin_id?.slice(0, 8)} &middot; {new Date(log.created_at).toLocaleString("ar-EG")}
                  </p>
                </div>
                <button onClick={() => setViewLog(log)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {viewLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewLog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">تفاصيل العملية</h2>
              <button onClick={() => setViewLog(null)} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4" dir="rtl">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">العملية</p>
                  <p className="text-sm font-semibold text-gray-700">{actionLabels[viewLog.action] || viewLog.action}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">المشرف</p>
                  <p className="text-sm font-semibold text-gray-700">{viewLog.admin_username || viewLog.admin_id?.slice(0, 8)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">النوع</p>
                  <p className="text-sm font-semibold text-gray-700">{viewLog.target_type}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">الهدف</p>
                  <p className="text-sm font-semibold text-gray-700 break-all" dir="ltr">{viewLog.target_id}</p>
                </div>
              </div>
              {viewLog.details && Object.keys(viewLog.details).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">التفاصيل</p>
                  <pre className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 overflow-x-auto font-mono" dir="ltr">
                    {JSON.stringify(viewLog.details, null, 2)}
                  </pre>
                </div>
              )}
              <p className="text-xs text-gray-400 text-left" dir="ltr">{new Date(viewLog.created_at).toLocaleString("ar-EG")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
