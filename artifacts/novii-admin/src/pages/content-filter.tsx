import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Filter, Plus, Trash2, AlertTriangle, X, ShieldAlert } from "lucide-react";

interface BannedWord {
  id: string;
  word: string;
  severity: string;
  is_active: boolean;
  created_at: string;
}

export default function ContentFilterPage() {
  const { token } = useAuth();
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [severity, setSeverity] = useState("warning");

  const headers = { "Content-Type": "application/json", "x-user-token": token || "" };

  useEffect(() => { loadWords(); }, []);

  async function loadWords() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banned-words", { headers });
      if (res.ok) setWords(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function addWord() {
    if (!newWord.trim()) return;
    await fetch("/api/admin/banned-words", {
      method: "POST", headers,
      body: JSON.stringify({ word: newWord.trim(), severity }),
    });
    setNewWord("");
    setShowAdd(false);
    loadWords();
  }

  async function removeWord(id: string) {
    if (!confirm("هل تريد إزالة هذه الكلمة؟")) return;
    await fetch(`/api/admin/banned-words/${id}`, { method: "DELETE", headers });
    loadWords();
  }

  const severityColors: Record<string, string> = {
    warning: "bg-yellow-100 text-yellow-700",
    block: "bg-red-100 text-red-700",
    shadow: "bg-gray-100 text-gray-700",
  };

  const severityLabels: Record<string, string> = {
    warning: "تحذير",
    block: "حظر",
    shadow: "إخفاء",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">فلتر المحتوى</h1>
            <p className="text-[13px] text-[#8e8e8e]">{words.length} كلمة محظورة</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#262626] text-white text-sm font-medium hover:bg-[#363636] transition-colors">
          <Plus className="w-4 h-4" /> إضافة كلمة
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800">كيف يعمل الفلتر؟</p>
          <p className="text-[12px] text-yellow-700 mt-1">
            <strong>تحذير:</strong> يسمح بالنشر مع إشعار الأدمن •
            <strong> حظر:</strong> يمنع النشر تماماً •
            <strong> إخفاء:</strong> ينشر بدون ظهور في الاستكشاف
          </p>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#262626]">إضافة كلمة محظورة</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-full hover:bg-[#efefef]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="الكلمة المحظورة" className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#262626]" />
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm">
                <option value="warning">تحذير - إشعار الأدمن</option>
                <option value="block">حظر - منع النشر</option>
                <option value="shadow">إخفاء - لا يظهر في الاستكشاف</option>
              </select>
              <button onClick={addWord} className="w-full py-2.5 rounded-lg bg-[#262626] text-white font-medium text-sm hover:bg-[#363636] transition-colors">إضافة</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e8e]">
          <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد كلمات محظورة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {words.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-[#efefef] p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-[#8e8e8e]" />
                <span className="font-medium text-[#262626] text-sm">{w.word}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${severityColors[w.severity] || severityColors.warning}`}>
                  {severityLabels[w.severity] || w.severity}
                </span>
              </div>
              <button onClick={() => removeWord(w.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
