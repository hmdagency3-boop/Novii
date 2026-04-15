import { useEffect, useState } from "react";
import { fetchSettings, updateSettings, type SettingRecord } from "@/lib/admin-api";
import { Settings, Save, RefreshCw, Plus, XCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSettings = () => {
    setLoading(true);
    fetchSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      await updateSettings(key, value);
      loadSettings();
      setEditKey(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    try {
      await updateSettings(newKey.trim(), newValue);
      loadSettings();
      setShowAdd(false);
      setNewKey("");
      setNewValue("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#262626]">إعدادات المنصة</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة إعدادات النظام</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSettings} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> إضافة إعداد
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#efefef]">
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المفتاح</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">القيمة</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">آخر تحديث</th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">تعديل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-5 py-4"><div className="h-10 bg-gray-100 rounded-lg animate-pulse" /></td></tr>
              ))
            ) : settings.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">لا توجد إعدادات</td></tr>
            ) : (
              settings.map((s) => (
                <tr key={s.key} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <code className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded" dir="ltr">{s.key}</code>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {editKey === s.key ? (
                      <div className="flex gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6]/20"
                          autoFocus
                        />
                        <button onClick={() => handleSave(s.key, editValue)} disabled={saving} className="p-1.5 rounded-lg bg-[#0095f6] text-white hover:bg-[#1877f2] transition-colors disabled:opacity-50">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditKey(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                          <XCircle className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600">{s.value}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(s.updated_at).toLocaleString("ar-EG")}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => { setEditKey(s.key); setEditValue(s.value); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">إضافة إعداد جديد</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4" dir="rtl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المفتاح</label>
                <input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6]/20"
                  placeholder="setting_key"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القيمة</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6]/20 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
                <button onClick={handleAdd} disabled={saving || !newKey.trim()} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors disabled:opacity-50">
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
