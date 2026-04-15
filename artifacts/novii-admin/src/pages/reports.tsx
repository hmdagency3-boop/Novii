import { useEffect, useState, useMemo } from "react";
import { fetchReports, updateReport, deleteContent, banUser, warnUser, type ReportRecord } from "@/lib/admin-api";
import {
  Flag, RefreshCw, Eye, XCircle, Clock, AlertTriangle, User, CheckCircle, Ban,
  MessageSquare, Image, Trash2, Search, Shield, ExternalLink, ChevronDown,
  BarChart3, Filter, ArrowUpDown, Hash, AlertOctagon, EyeOff, Unlock
} from "lucide-react";

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

const REASON_COLORS: Record<string, string> = {
  spam: "bg-gray-100 text-gray-600",
  nudity: "bg-pink-50 text-pink-600",
  harassment: "bg-red-50 text-red-600",
  violence: "bg-red-100 text-red-700",
  hate_speech: "bg-orange-50 text-orange-600",
  false_info: "bg-yellow-50 text-yellow-700",
  impersonation: "bg-indigo-50 text-indigo-600",
  intellectual_property: "bg-blue-50 text-blue-600",
  other: "bg-gray-50 text-gray-500",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<ReportRecord | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved" | "dismissed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);
  const [showWarnConfirm, setShowWarnConfirm] = useState(false);
  const [warnMessage, setWarnMessage] = useState("");
  const [banReason, setBanReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadReports = () => {
    setLoading(true);
    fetchReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    resolved: reports.filter(r => r.status === "resolved").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  }), [reports]);

  const reportsByUser = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => {
      map[r.reported_user_id] = (map[r.reported_user_id] || 0) + 1;
    });
    return map;
  }, [reports]);

  const reportsByPost = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => {
      if (r.reported_post_id) {
        map[r.reported_post_id] = (map[r.reported_post_id] || 0) + 1;
      }
    });
    return map;
  }, [reports]);

  const filteredReports = useMemo(() => {
    let result = reports;
    if (filter !== "all") result = result.filter(r => r.status === filter);
    if (reasonFilter !== "all") result = result.filter(r => r.reason === reasonFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.reporter_username || "").toLowerCase().includes(q) ||
        (r.reported_username || "").toLowerCase().includes(q) ||
        (r.reason || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.post_caption || "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "oldest") result = [...result].reverse();
    return result;
  }, [reports, filter, reasonFilter, searchQuery, sortBy]);

  const handleStatusUpdate = async (reportId: string, status: string) => {
    setUpdating(true);
    try {
      await updateReport(reportId, { status, admin_note: adminNote.trim() || undefined });
      setActionSuccess(status === "resolved" ? "تمت المعالجة بنجاح" : "تم الرفض");
      setTimeout(() => { setActionSuccess(null); setViewReport(null); setAdminNote(""); }, 1500);
      loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePost = async () => {
    if (!viewReport?.reported_post_id) return;
    setUpdating(true);
    try {
      await deleteContent(viewReport.reported_post_id);
      await updateReport(viewReport.id, { status: "resolved", admin_note: (adminNote.trim() ? adminNote.trim() + " — " : "") + "تم حذف المنشور" });
      setActionSuccess("تم حذف المنشور بنجاح");
      setShowDeleteConfirm(false);
      setTimeout(() => { setActionSuccess(null); setViewReport(null); setAdminNote(""); }, 1500);
      loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleBanUser = async () => {
    if (!viewReport?.reported_user_id) return;
    setUpdating(true);
    try {
      await banUser(viewReport.reported_user_id, { ban: true, reason: banReason || "بناءً على بلاغ" });
      await updateReport(viewReport.id, { status: "resolved", admin_note: (adminNote.trim() ? adminNote.trim() + " — " : "") + "تم حظر المستخدم" });
      setActionSuccess("تم حظر المستخدم بنجاح");
      setShowBanConfirm(false);
      setBanReason("");
      setTimeout(() => { setActionSuccess(null); setViewReport(null); setAdminNote(""); }, 1500);
      loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!viewReport?.reported_user_id) return;
    setUpdating(true);
    try {
      await banUser(viewReport.reported_user_id, { ban: false });
      await updateReport(viewReport.id, { status: "resolved", admin_note: (adminNote.trim() ? adminNote.trim() + " — " : "") + "تم رفع الحظر عن المستخدم" });
      setActionSuccess("تم رفع الحظر بنجاح");
      setShowUnbanConfirm(false);
      setTimeout(() => { setActionSuccess(null); setViewReport(null); setAdminNote(""); }, 1500);
      loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleWarnUser = async () => {
    if (!viewReport?.reported_user_id) return;
    setUpdating(true);
    try {
      await warnUser(viewReport.reported_user_id, { reason: warnMessage || "مخالفة سياسة الاستخدام" });
      const note = (adminNote.trim() ? adminNote.trim() + " — " : "") + "⚠️ تحذير للمستخدم: " + (warnMessage || "مخالفة سياسة الاستخدام");
      await updateReport(viewReport.id, { status: "resolved", admin_note: note });
      setActionSuccess("تم إرسال التحذير وإغلاق البلاغ");
      setShowWarnConfirm(false);
      setWarnMessage("");
      setTimeout(() => { setActionSuccess(null); setViewReport(null); setAdminNote(""); }, 1500);
      loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickAction = async (reportId: string, status: "resolved" | "dismissed") => {
    setQuickUpdatingId(reportId);
    try {
      await updateReport(reportId, { status });
      loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setQuickUpdatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#262626]">البلاغات</h1>
          <p className="text-sm text-[#8e8e8e] mt-1">إدارة ومعالجة بلاغات المستخدمين</p>
        </div>
        <button onClick={loadReports} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="إجمالي البلاغات" value={stats.total} icon={<Flag className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
        <StatCard label="قيد المراجعة" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="bg-amber-50 text-amber-600" pulse={stats.pending > 0} />
        <StatCard label="تمت المعالجة" value={stats.resolved} icon={<CheckCircle className="w-5 h-5" />} color="bg-green-50 text-green-600" />
        <StatCard label="مرفوض" value={stats.dismissed} icon={<Ban className="w-5 h-5" />} color="bg-gray-100 text-gray-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو المحتوى..."
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>

        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {(["all", "pending", "resolved", "dismissed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "الكل" : f === "pending" ? "قيد المراجعة" : f === "resolved" ? "تمت المعالجة" : "مرفوض"}
              {f === "pending" && stats.pending > 0 && (
                <span className="mr-1 bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>

        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          <option value="all">كل الأسباب</option>
          {Object.entries(REASON_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <button
          onClick={() => setSortBy(s => s === "newest" ? "oldest" : "newest")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortBy === "newest" ? "الأحدث أولاً" : "الأقدم أولاً"}
        </button>
      </div>

      <div className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#efefef]">
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">المُبلِّغ</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">المُبلَّغ عنه</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">السبب</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">المنشور</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">عدد البلاغات</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
              <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-4"><div className="h-12 bg-gray-100 rounded-lg animate-pulse" /></td></tr>
              ))
            ) : filteredReports.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-16 text-center">
                <Flag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">لا توجد بلاغات</p>
              </td></tr>
            ) : (
              filteredReports.map((report) => {
                const userReportCount = reportsByUser[report.reported_user_id] || 0;
                const postReportCount = report.reported_post_id ? (reportsByPost[report.reported_post_id] || 0) : 0;
                return (
                  <tr key={report.id} className={`hover:bg-gray-50/80 transition-colors ${report.status === "pending" ? "bg-amber-50/20" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {report.reporter_avatar ? (
                          <img src={report.reporter_avatar} className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-100" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-3.5 h-3.5 text-gray-400" /></div>
                        )}
                        <span className="text-sm text-gray-700 font-medium">{report.reporter_username || report.reporter_id?.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {report.reported_avatar ? (
                          <img src={report.reported_avatar} className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-100" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-3.5 h-3.5 text-gray-400" /></div>
                        )}
                        <div>
                          <span className="text-sm text-gray-700 font-medium block">{report.reported_username || report.reported_user_id?.slice(0, 8)}</span>
                          {userReportCount > 1 && (
                            <span className="text-[10px] text-red-500 font-medium">{userReportCount} بلاغات على هذا المستخدم</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${REASON_COLORS[report.reason] || REASON_COLORS.other}`}>
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {report.post_image ? (
                        <div className="relative">
                          <img src={report.post_image} className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-100" />
                          {postReportCount > 1 && (
                            <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{postReportCount}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5">
                        {postReportCount > 0 && (
                          <span className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">{postReportCount}</span> على البوست</span>
                        )}
                        <span className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">{userReportCount}</span> على المستخدم</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-gray-400">
                        <div>{new Date(report.created_at).toLocaleDateString("ar-EG")}</div>
                        <div className="text-[10px] text-gray-300">{new Date(report.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {report.status === "pending" ? (
                          <>
                            <button
                              title="معالجة سريعة"
                              onClick={() => handleQuickAction(report.id, "resolved")}
                              disabled={quickUpdatingId === report.id}
                              className="p-1.5 rounded-lg hover:bg-green-100 text-green-500 hover:text-green-700 transition-colors disabled:opacity-40"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              title="رفض سريع"
                              onClick={() => handleQuickAction(report.id, "dismissed")}
                              disabled={quickUpdatingId === report.id}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
                        <button
                          title="عرض التفاصيل وإجراءات إضافية"
                          onClick={() => { setViewReport(report); setAdminNote(report.admin_note || ""); setShowDeleteConfirm(false); setShowBanConfirm(false); setShowUnbanConfirm(false); setShowWarnConfirm(false); setActionSuccess(null); }}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && filteredReports.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-400">عرض {filteredReports.length} من {reports.length} بلاغ</span>
          </div>
        )}
      </div>

      {viewReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewReport(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">تفاصيل البلاغ</h2>
                  <p className="text-[11px] text-gray-400">#{viewReport.id.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={() => setViewReport(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>

            {actionSuccess && (
              <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">{actionSuccess}</span>
              </div>
            )}

            <div className="p-6 space-y-5" dir="rtl">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wider">المُبلِّغ</p>
                  <div className="flex items-center gap-3">
                    {viewReport.reporter_avatar ? (
                      <img src={viewReport.reporter_avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-gray-800">{viewReport.reporter_username || "مجهول"}</p>
                      <p className="text-[10px] text-gray-400">{viewReport.reporter_id?.slice(0, 12)}...</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50">
                  <p className="text-[11px] text-red-400 mb-2 font-medium uppercase tracking-wider">المُبلَّغ عنه</p>
                  <div className="flex items-center gap-3">
                    {viewReport.reported_avatar ? (
                      <img src={viewReport.reported_avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><User className="w-5 h-5 text-red-400" /></div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-gray-800">{viewReport.reported_username || "مجهول"}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-red-500 font-semibold">{reportsByUser[viewReport.reported_user_id] || 0} بلاغ على هذا المستخدم</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-amber-800">السبب</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${REASON_COLORS[viewReport.reason] || REASON_COLORS.other}`}>
                        {REASON_LABELS[viewReport.reason] || viewReport.reason}
                      </span>
                    </div>
                    {viewReport.description && (
                      <p className="text-sm text-amber-700 mt-2 leading-relaxed bg-amber-100/50 rounded-lg p-3">{viewReport.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {(viewReport.post_image || viewReport.post_caption) && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100/80 border-b border-gray-200">
                    <Image className="w-4 h-4 text-gray-500" />
                    <p className="text-xs font-semibold text-gray-600">المنشور المُبلَّغ عنه</p>
                    {viewReport.reported_post_id && (reportsByPost[viewReport.reported_post_id] || 0) > 1 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mr-auto">
                        {reportsByPost[viewReport.reported_post_id]} بلاغ على هذا المنشور
                      </span>
                    )}
                  </div>
                  {viewReport.post_image && (
                    <img src={viewReport.post_image} className="w-full max-h-72 object-contain bg-black/5" />
                  )}
                  {viewReport.post_caption && (
                    <p className="text-sm text-gray-700 p-4 border-t border-gray-200 leading-relaxed">{viewReport.post_caption}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <StatusBadge status={viewReport.status} />
                <span className="text-xs text-gray-400">{new Date(viewReport.created_at).toLocaleString("ar-EG")}</span>
              </div>

              {viewReport.admin_note && viewReport.status !== "pending" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-blue-600">ملاحظة الأدمن</p>
                  </div>
                  <p className="text-sm text-blue-800">{viewReport.admin_note}</p>
                  {viewReport.resolved_at && (
                    <p className="text-[10px] text-blue-400 mt-2">تم بتاريخ: {new Date(viewReport.resolved_at).toLocaleString("ar-EG")}</p>
                  )}
                </div>
              )}

              {viewReport.status === "pending" && !actionSuccess && (
                <div className="space-y-4 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">ملاحظة الأدمن</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="أضف ملاحظة حول قرارك..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-gray-50"
                      rows={2}
                    />
                  </div>

                  {!showDeleteConfirm && !showBanConfirm && !showUnbanConfirm && !showWarnConfirm && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStatusUpdate(viewReport.id, "resolved")}
                          disabled={updating}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          تمت المعالجة
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(viewReport.id, "dismissed")}
                          disabled={updating}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Ban className="w-4 h-4" />
                          رفض البلاغ
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setShowWarnConfirm(true)}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors border border-amber-200"
                        >
                          <AlertOctagon className="w-4 h-4" />
                          تحذير المستخدم
                        </button>
                        <button
                          onClick={() => setShowUnbanConfirm(true)}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium transition-colors border border-blue-200"
                        >
                          <Unlock className="w-4 h-4" />
                          رفع الحظر
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {viewReport.reported_post_id && (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors border border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف المنشور
                          </button>
                        )}
                        <button
                          onClick={() => setShowBanConfirm(true)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors border border-red-200"
                        >
                          <Shield className="w-4 h-4" />
                          حظر المستخدم
                        </button>
                      </div>
                    </>
                  )}

                  {showDeleteConfirm && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-bold text-red-700">تأكيد حذف المنشور</p>
                      </div>
                      <p className="text-xs text-red-600">سيتم حذف المنشور نهائياً وتحديث حالة البلاغ إلى "تمت المعالجة"</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeletePost}
                          disabled={updating}
                          className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                        >
                          {updating ? "جاري الحذف..." : "تأكيد الحذف"}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {showBanConfirm && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-bold text-red-700">تأكيد حظر المستخدم: {viewReport.reported_username}</p>
                      </div>
                      <input
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="سبب الحظر..."
                        className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleBanUser}
                          disabled={updating}
                          className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                        >
                          {updating ? "جاري الحظر..." : "تأكيد الحظر"}
                        </button>
                        <button
                          onClick={() => { setShowBanConfirm(false); setBanReason(""); }}
                          className="flex-1 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {showUnbanConfirm && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-5 h-5 text-blue-500" />
                        <p className="text-sm font-bold text-blue-700">تأكيد رفع الحظر عن: {viewReport.reported_username}</p>
                      </div>
                      <p className="text-xs text-blue-600">سيتم رفع الحظر عن المستخدم وإغلاق البلاغ كـ "تمت المعالجة".</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUnbanUser}
                          disabled={updating}
                          className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                        >
                          {updating ? "جاري رفع الحظر..." : "تأكيد رفع الحظر"}
                        </button>
                        <button
                          onClick={() => setShowUnbanConfirm(false)}
                          className="flex-1 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {showWarnConfirm && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-amber-500" />
                        <p className="text-sm font-bold text-amber-700">تحذير المستخدم: {viewReport.reported_username}</p>
                      </div>
                      <input
                        value={warnMessage}
                        onChange={(e) => setWarnMessage(e.target.value)}
                        placeholder="سبب التحذير... (اختياري)"
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                      />
                      <p className="text-[11px] text-amber-600">سيتم تسجيل التحذير في ملاحظة البلاغ وإغلاقه كـ "تمت المعالجة".</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleWarnUser}
                          disabled={updating}
                          className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
                        >
                          {updating ? "جاري الإرسال..." : "تأكيد التحذير"}
                        </button>
                        <button
                          onClick={() => { setShowWarnConfirm(false); setWarnMessage(""); }}
                          className="flex-1 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, pulse }: { label: string; value: number; icon: React.ReactNode; color: string; pulse?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${color} relative overflow-hidden`}>
      {pulse && <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    resolved: "bg-green-100 text-green-700 border-green-200",
    dismissed: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    resolved: <CheckCircle className="w-3 h-3" />,
    dismissed: <Ban className="w-3 h-3" />,
  };
  const labels: Record<string, string> = {
    pending: "قيد المراجعة",
    resolved: "تمت المعالجة",
    dismissed: "مرفوض",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${styles[status] || styles.pending}`}>
      {icons[status]} {labels[status] || status}
    </span>
  );
}
