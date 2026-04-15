import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Megaphone, Bell, Plus, Trash2, ToggleLeft, ToggleRight, Send, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  target: string;
  is_active: boolean;
  is_banner: boolean;
  expires_at: string | null;
  created_at: string;
  profiles?: { username: string };
}

export default function AnnouncementsPage() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "info", is_banner: false, expires_at: "" });
  const [broadcastContent, setBroadcastContent] = useState("");
  const [sending, setSending] = useState(false);

  const headers = { "Content-Type": "application/json", "x-user-token": token || "" };

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", { headers });
      if (res.ok) setAnnouncements(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function createAnnouncement() {
    if (!form.title || !form.content) return alert("العنوان والمحتوى مطلوبين");
    setSending(true);
    try {
      await fetch("/api/admin/announcements", {
        method: "POST", headers,
        body: JSON.stringify({ ...form, expires_at: form.expires_at || null }),
      });
      setShowCreate(false);
      setForm({ title: "", content: "", type: "info", is_banner: false, expires_at: "" });
      loadAnnouncements();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ is_active: !current }),
    });
    loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("هل تريد حذف هذا الإعلان؟")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE", headers });
    loadAnnouncements();
  }

  async function sendBroadcast() {
    if (!broadcastContent.trim()) return;
    if (!confirm(`هل تريد إرسال إشعار لجميع المستخدمين؟`)) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST", headers,
        body: JSON.stringify({ content: broadcastContent, type: "system" }),
      });
      const data = await res.json();
      alert(`تم الإرسال بنجاح إلى ${data.sent} مستخدم`);
      setShowBroadcast(false);
      setBroadcastContent("");
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  }

  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    success: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">الإعلانات والإشعارات</h1>
            <p className="text-[13px] text-[#8e8e8e]">إدارة الإعلانات وإرسال الإشعارات الجماعية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBroadcast(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors">
            <Bell className="w-4 h-4" /> إشعار جماعي
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#262626] text-white text-sm font-medium hover:bg-[#363636] transition-colors">
            <Plus className="w-4 h-4" /> إعلان جديد
          </button>
        </div>
      </div>

      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#262626]">إشعار جماعي</h3>
              <button onClick={() => setShowBroadcast(false)} className="p-1 rounded-full hover:bg-[#efefef]"><X className="w-5 h-5" /></button>
            </div>
            <textarea
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="محتوى الإشعار..."
              className="w-full border border-[#dbdbdb] rounded-lg p-3 text-sm resize-none h-32 focus:outline-none focus:border-[#262626]"
            />
            <button onClick={sendBroadcast} disabled={sending} className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors">
              <Send className="w-4 h-4" /> {sending ? "جاري الإرسال..." : "إرسال للجميع"}
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#262626]">إعلان جديد</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-full hover:bg-[#efefef]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="العنوان" className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#262626]" />
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="المحتوى" className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm resize-none h-24 focus:outline-none focus:border-[#262626]" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm">
                <option value="info">معلومات</option>
                <option value="warning">تحذير</option>
                <option value="success">نجاح</option>
                <option value="error">خطأ</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_banner} onChange={(e) => setForm({ ...form, is_banner: e.target.checked })} className="rounded" />
                عرض كبانر أعلى التطبيق
              </label>
              <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm" placeholder="تاريخ الانتهاء (اختياري)" />
              <button onClick={createAnnouncement} disabled={sending} className="w-full py-2.5 rounded-lg bg-[#262626] text-white font-medium text-sm hover:bg-[#363636] disabled:opacity-50 transition-colors">
                {sending ? "جاري الإنشاء..." : "إنشاء الإعلان"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e8e]">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد إعلانات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className={`bg-white rounded-xl border border-[#efefef] p-4 ${!ann.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#262626]">{ann.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[ann.type] || typeColors.info}`}>{ann.type}</span>
                    {ann.is_banner && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">بانر</span>}
                  </div>
                  <p className="text-[13px] text-[#8e8e8e] mb-2">{ann.content}</p>
                  <div className="text-[11px] text-[#8e8e8e]">
                    {new Date(ann.created_at).toLocaleDateString("ar")}
                    {ann.expires_at && ` · ينتهي ${new Date(ann.expires_at).toLocaleDateString("ar")}`}
                    {ann.profiles?.username && ` · بواسطة @${ann.profiles.username}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(ann.id, ann.is_active)} className="p-2 rounded-lg hover:bg-[#fafafa] transition-colors" title={ann.is_active ? "إيقاف" : "تفعيل"}>
                    {ann.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-[#8e8e8e]" />}
                  </button>
                  <button onClick={() => deleteAnnouncement(ann.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
