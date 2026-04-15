import { useState, useEffect } from "react";
import { fetchBanAppeals, updateBanAppeal, type BanAppeal } from "@/lib/admin-api";
import { Scale, Clock, CheckCircle2, XCircle, Eye, ChevronDown, Loader2 } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "قيد الانتظار", color: "#d97706", bg: "#fffbeb" },
  reviewing: { label: "قيد المراجعة", color: "#2563eb", bg: "#eff6ff" },
  approved: { label: "مقبول", color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "مرفوض", color: "#dc2626", bg: "#fef2f2" },
};

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBanAppeals();
      setAppeals(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? appeals : appeals.filter(a => a.status === filter);
  const counts = {
    all: appeals.length,
    pending: appeals.filter(a => a.status === 'pending').length,
    reviewing: appeals.filter(a => a.status === 'reviewing').length,
    approved: appeals.filter(a => a.status === 'approved').length,
    rejected: appeals.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#efefef] flex items-center justify-center">
            <Scale className="w-5 h-5 text-[#262626]" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#262626]">الاستئنافات</h1>
            <p className="text-[13px] text-[#8e8e8e]">مراجعة طلبات استئناف الحظر</p>
          </div>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#262626] bg-white border border-[#dbdbdb] hover:bg-[#fafafa] transition-colors">
          تحديث
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "pending", "reviewing", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              filter === f
                ? "bg-[#262626] text-white"
                : "bg-white text-[#8e8e8e] border border-[#dbdbdb] hover:text-[#262626]"
            }`}
          >
            {f === "all" ? "الكل" : statusConfig[f]?.label}
            <span className="mr-1.5 text-[12px] opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#8e8e8e]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Scale className="w-12 h-12 mx-auto text-[#dbdbdb] mb-3" />
          <p className="text-[#8e8e8e] text-[14px]">لا توجد استئنافات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appeal => (
            <AppealCard
              key={appeal.id}
              appeal={appeal}
              onSelect={() => setSelectedAppeal(appeal)}
            />
          ))}
        </div>
      )}

      {selectedAppeal && (
        <AppealModal
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
          onDone={() => { setSelectedAppeal(null); load(); }}
        />
      )}
    </div>
  );
}

function AppealCard({ appeal, onSelect }: { appeal: BanAppeal; onSelect: () => void }) {
  const status = statusConfig[appeal.status];
  const profile = appeal.profiles;

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-xl border border-[#dbdbdb] p-4 hover:border-[#8e8e8e] transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || '?'}&background=random`}
            className="w-10 h-10 rounded-full object-cover border border-[#dbdbdb]"
            alt=""
          />
          <div>
            <p className="text-[14px] font-semibold text-[#262626]">{profile?.full_name || profile?.username || 'مستخدم'}</p>
            <p className="text-[12px] text-[#8e8e8e]">@{profile?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-2.5 py-1 rounded-md text-[12px] font-semibold"
            style={{ color: status.color, background: status.bg }}
          >
            {status.label}
          </span>
          <span className="text-[12px] text-[#8e8e8e]">
            {new Date(appeal.created_at).toLocaleDateString("ar-EG")}
          </span>
        </div>
      </div>
      {appeal.message && (
        <p className="text-[13px] text-[#8e8e8e] mt-2 line-clamp-1">"{appeal.message}"</p>
      )}
    </div>
  );
}

function AppealModal({ appeal, onClose, onDone }: { appeal: BanAppeal; onClose: () => void; onDone: () => void }) {
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const status = statusConfig[appeal.status];
  const profile = appeal.profiles;
  const canAct = ['pending', 'reviewing'].includes(appeal.status);

  async function handleAction(action: 'approved' | 'rejected') {
    setBusy(true);
    setError("");
    try {
      await updateBanAppeal(appeal.id, { status: action, admin_note: adminNote.trim() || undefined });
      onDone();
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto mx-4 shadow-xl"
          dir="rtl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-[#efefef] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || '?'}&background=random`}
                className="w-11 h-11 rounded-full object-cover border border-[#dbdbdb]"
                alt=""
              />
              <div>
                <p className="text-[15px] font-bold text-[#262626]">{profile?.full_name || profile?.username}</p>
                <p className="text-[13px] text-[#8e8e8e]">@{profile?.username}</p>
              </div>
            </div>
            <span
              className="px-3 py-1.5 rounded-lg text-[13px] font-semibold"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-[14px] font-semibold text-[#262626] mb-3">المستندات المقدمة</h3>
              <div className="grid grid-cols-3 gap-3">
                <DocImage label="البطاقة — الوجه" url={appeal.id_front_url} onClick={() => setLightboxImg(appeal.id_front_url)} />
                <DocImage label="البطاقة — الظهر" url={appeal.id_back_url} onClick={() => setLightboxImg(appeal.id_back_url)} />
                <DocImage label="صورة شخصية" url={appeal.selfie_url} onClick={() => setLightboxImg(appeal.selfie_url)} />
              </div>
            </div>

            {appeal.message && (
              <div>
                <h3 className="text-[14px] font-semibold text-[#262626] mb-1.5">رسالة المستخدم</h3>
                <p className="text-[14px] text-[#262626] bg-[#fafafa] rounded-xl p-3 border border-[#efefef]">{appeal.message}</p>
              </div>
            )}

            <div className="text-[13px] text-[#8e8e8e] flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                تاريخ الطلب: {new Date(appeal.created_at).toLocaleString("ar-EG")}
              </span>
              {appeal.reviewed_at && (
                <span>تمت المراجعة: {new Date(appeal.reviewed_at).toLocaleString("ar-EG")}</span>
              )}
            </div>

            {appeal.admin_note && !canAct && (
              <div className="bg-[#fafafa] rounded-xl p-3 border border-[#efefef]">
                <p className="text-[13px] font-medium text-[#262626] mb-1">ملاحظة المشرف</p>
                <p className="text-[13px] text-[#8e8e8e]">{appeal.admin_note}</p>
              </div>
            )}

            {canAct && (
              <>
                <div>
                  <label className="block text-[13px] font-medium text-[#262626] mb-1.5">ملاحظة المشرف (اختياري)</label>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={2}
                    placeholder="أضف ملاحظة..."
                    className="w-full rounded-xl px-4 py-3 text-[14px] border border-[#dbdbdb] bg-white focus:outline-none focus:border-[#262626] resize-none placeholder:text-[#8e8e8e]"
                  />
                </div>

                {error && (
                  <p className="text-[13px] text-[#ed4956]">{error}</p>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleAction('rejected')}
                    disabled={busy}
                    className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-[#ed4956] hover:bg-[#dc3545] transition-colors disabled:opacity-50"
                  >
                    رفض الاستئناف
                  </button>
                  <button
                    onClick={() => handleAction('approved')}
                    disabled={busy}
                    className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-[#16a34a] hover:bg-[#15803d] transition-colors disabled:opacity-50"
                  >
                    قبول ورفع الحظر
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" />
        </div>
      )}
    </>
  );
}

function DocImage({ label, url, onClick }: { label: string; url: string; onClick: () => void }) {
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <img
        src={url}
        alt={label}
        className="w-full h-[140px] object-cover rounded-xl border border-[#dbdbdb]"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl flex items-center justify-center">
        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-[11px] text-[#8e8e8e] mt-1.5 text-center">{label}</p>
    </div>
  );
}
