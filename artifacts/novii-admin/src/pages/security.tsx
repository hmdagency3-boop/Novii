import { useState, useEffect } from "react";
import { Shield, Ban, AlertTriangle, Activity, Plus, Trash2, X, Globe, Fingerprint, Monitor, MapPin } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface IPBan { id: string; ip_address: string; reason: string; is_active: boolean; expires_at: string | null; created_at: string; profiles?: { username: string } }
interface SuspiciousIP { ip: string; user_count: number; user_ids: string[] }
interface SuspiciousDevice { fingerprint: string; user_count: number; user_ids: string[] }
interface LoginActivity { id: string; user_id: string; ip_address: string; browser: string; os_name: string; country: string; city: string; device_type: string; last_active_at: string; login_count: number; profiles?: { username: string; full_name: string; avatar_url: string } }

type Tab = "suspicious" | "ip-bans" | "login-activity";

export default function SecurityPage() {
  const [tab, setTab] = useState<Tab>("suspicious");
  const [ipBans, setIPBans] = useState<IPBan[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [suspiciousDevices, setSuspiciousDevices] = useState<SuspiciousDevice[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBan, setShowAddBan] = useState(false);
  const [banForm, setBanForm] = useState({ ip_address: "", reason: "", expires_at: "" });

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === "suspicious") {
        const data = await adminFetch<{ suspiciousIPs: SuspiciousIP[]; suspiciousDevices: SuspiciousDevice[] }>("/security/suspicious");
        setSuspiciousIPs(data.suspiciousIPs || []);
        setSuspiciousDevices(data.suspiciousDevices || []);
      } else if (tab === "ip-bans") {
        const data = await adminFetch<IPBan[]>("/security/ip-bans");
        setIPBans(data);
      } else {
        const data = await adminFetch<LoginActivity[]>("/security/login-activity?limit=100");
        setLoginActivity(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function addIPBan() {
    if (!banForm.ip_address) return;
    await adminFetch("/security/ip-bans", {
      method: "POST",
      body: JSON.stringify({ ...banForm, expires_at: banForm.expires_at || null }),
    });
    setShowAddBan(false);
    setBanForm({ ip_address: "", reason: "", expires_at: "" });
    loadData();
  }

  async function removeIPBan(id: string) {
    if (!confirm("هل تريد إزالة حظر هذا IP؟")) return;
    await adminFetch(`/security/ip-bans/${id}`, { method: "DELETE" });
    loadData();
  }

  async function banIP(ip: string) {
    setBanForm({ ip_address: ip, reason: "نشاط مشبوه - عدة حسابات", expires_at: "" });
    setShowAddBan(true);
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "suspicious", label: "حسابات مشبوهة", icon: AlertTriangle },
    { id: "ip-bans", label: "حظر IP", icon: Ban },
    { id: "login-activity", label: "نشاط الدخول", icon: Activity },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">الأمان</h1>
            <p className="text-[13px] text-[#8e8e8e]">كشف الحسابات الوهمية وحظر IP ومراقبة الدخول</p>
          </div>
        </div>
        {tab === "ip-bans" && (
          <button onClick={() => setShowAddBan(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#262626] text-white text-sm font-medium hover:bg-[#363636] transition-colors">
            <Plus className="w-4 h-4" /> حظر IP
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626]"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {showAddBan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#262626]">حظر عنوان IP</h3>
              <button onClick={() => setShowAddBan(false)} className="p-1 rounded-full hover:bg-[#efefef]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={banForm.ip_address} onChange={(e) => setBanForm({ ...banForm, ip_address: e.target.value })} placeholder="عنوان IP" className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#262626] font-mono" dir="ltr" />
              <input value={banForm.reason} onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })} placeholder="السبب (اختياري)" className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#262626]" />
              <input type="datetime-local" value={banForm.expires_at} onChange={(e) => setBanForm({ ...banForm, expires_at: e.target.value })} className="w-full border border-[#dbdbdb] rounded-lg p-2.5 text-sm" />
              <button onClick={addIPBan} className="w-full py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors">حظر</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
        </div>
      ) : tab === "suspicious" ? (
        <div className="space-y-6">
          {suspiciousIPs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-[#262626]">عناوين IP مشتركة ({suspiciousIPs.length})</h2>
              </div>
              <div className="space-y-2">
                {suspiciousIPs.map((item) => (
                  <div key={item.ip} className="bg-white rounded-xl border border-[#efefef] p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded">{item.ip}</code>
                        <span className="text-[12px] text-red-500 font-medium">{item.user_count} حسابات</span>
                      </div>
                      <p className="text-[11px] text-[#8e8e8e] mt-1">IDs: {item.user_ids.slice(0, 3).map(id => id.slice(0, 8)).join("، ")}...</p>
                    </div>
                    <button onClick={() => banIP(item.ip)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[12px] font-medium hover:bg-red-100 transition-colors">
                      <Ban className="w-3 h-3 inline ml-1" /> حظر
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suspiciousDevices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Fingerprint className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-[#262626]">أجهزة مشتركة ({suspiciousDevices.length})</h2>
              </div>
              <div className="space-y-2">
                {suspiciousDevices.map((item) => (
                  <div key={item.fingerprint} className="bg-white rounded-xl border border-[#efefef] p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{item.fingerprint.slice(0, 16)}...</code>
                      <span className="text-[12px] text-orange-500 font-medium">{item.user_count} حسابات</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suspiciousIPs.length === 0 && suspiciousDevices.length === 0 && (
            <div className="text-center py-20 text-[#8e8e8e]">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد أنشطة مشبوهة</p>
            </div>
          )}
        </div>
      ) : tab === "ip-bans" ? (
        ipBans.length === 0 ? (
          <div className="text-center py-20 text-[#8e8e8e]">
            <Ban className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد عناوين محظورة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ipBans.map((ban) => (
              <div key={ban.id} className="bg-white rounded-xl border border-[#efefef] p-4 flex items-center justify-between">
                <div>
                  <code className="text-sm font-mono">{ban.ip_address}</code>
                  {ban.reason && <p className="text-[12px] text-[#8e8e8e] mt-1">{ban.reason}</p>}
                  <p className="text-[11px] text-[#8e8e8e]">
                    {new Date(ban.created_at).toLocaleDateString("ar")}
                    {ban.expires_at && ` · ينتهي ${new Date(ban.expires_at).toLocaleDateString("ar")}`}
                  </p>
                </div>
                <button onClick={() => removeIPBan(ban.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {loginActivity.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border border-[#efefef] p-3 flex items-center gap-3">
              {entry.profiles?.avatar_url ? (
                <img src={entry.profiles.avatar_url} className="w-8 h-8 rounded-full" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#efefef] flex items-center justify-center text-[10px] font-bold text-[#8e8e8e]">?</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#262626]">@{entry.profiles?.username || "مجهول"}</span>
                  <code className="text-[10px] text-[#8e8e8e] font-mono">{entry.ip_address}</code>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#8e8e8e]">
                  {entry.browser && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{entry.browser}</span>}
                  {entry.os_name && <span>{entry.os_name}</span>}
                  {entry.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{entry.country}{entry.city && ` - ${entry.city}`}</span>}
                  <span>تسجيلات: {entry.login_count}</span>
                </div>
              </div>
              <span className="text-[10px] text-[#8e8e8e]">{new Date(entry.last_active_at).toLocaleString("ar")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
