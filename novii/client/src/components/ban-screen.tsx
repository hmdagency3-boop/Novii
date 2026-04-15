import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export function BanScreen() {
  const { banInfo, signOut } = useAuth();
  const [countdown, setCountdown] = useState("");
  const [showAppeal, setShowAppeal] = useState(false);

  const banUntil = banInfo?.ban_until ? new Date(banInfo.ban_until) : null;

  useEffect(() => {
    if (!banUntil) return;
    const tick = () => {
      const diff = banUntil.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("00:00:00");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) {
        setCountdown(`${d} يوم ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      } else {
        setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [banUntil]);

  if (!banInfo) return null;

  const strikes = banInfo.strikes_count ?? 0;
  const maxStrikes = 5;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-white" />

      <div className="relative w-full max-w-[400px] mx-4">
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#FF3B30] via-[#FF6B6B] to-[#FF9500] p-[3px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-[#262626] mb-2 text-center leading-tight">
            {banInfo.is_permanent ? "تم تعليق حسابك نهائياً" : "تم تقييد حسابك مؤقتاً"}
          </h1>
          <p className="text-[14px] text-[#8e8e8e] text-center leading-relaxed max-w-[320px] mb-6">
            {banInfo.is_permanent
              ? "حسابك معلّق بشكل دائم بسبب انتهاك متكرر لإرشادات المجتمع."
              : "حسابك مقيّد مؤقتاً بسبب انتهاك إرشادات مجتمع Novii."}
          </p>

          <div className="w-full space-y-3 mb-6">
            {banInfo.reason && (
              <div className="w-full bg-[#fafafa] border border-[#efefef] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#efefef] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
                  <span className="text-[13px] font-semibold text-[#262626]">سبب التقييد</span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[14px] text-[#262626] leading-relaxed">{banInfo.reason}</p>
                </div>
              </div>
            )}

            {!banInfo.is_permanent && banUntil && (
              <div className="w-full bg-[#fafafa] border border-[#efefef] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#efefef] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9500]" />
                  <span className="text-[13px] font-semibold text-[#262626]">الوقت المتبقي</span>
                </div>
                <div className="px-4 py-4 flex flex-col items-center">
                  <div className="font-mono text-[28px] font-bold text-[#262626] tracking-wider" dir="ltr">
                    {countdown}
                  </div>
                  <p className="text-[12px] text-[#8e8e8e] mt-1.5">
                    ينتهي: {banUntil.toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            )}

            {strikes > 0 && (
              <div className="w-full bg-[#fafafa] border border-[#efefef] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#efefef] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ed4956]" />
                    <span className="text-[13px] font-semibold text-[#262626]">سجل المخالفات</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#ed4956]">{strikes}/{maxStrikes}</span>
                </div>
                <div className="px-4 py-3.5">
                  <div className="flex gap-2 justify-center mb-2">
                    {Array.from({ length: maxStrikes }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-[6px] rounded-full transition-all"
                        style={{
                          background: i < strikes
                            ? strikes >= 4 ? "#ed4956" : strikes >= 3 ? "#FF9500" : "#FFB800"
                            : "#efefef",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#8e8e8e] text-center">
                    {strikes >= 4
                      ? "تحذير: مخالفة إضافية قد تؤدي لتعليق الحساب نهائياً"
                      : strikes >= 3
                      ? "يُرجى الالتزام بإرشادات المجتمع لتجنب التعليق الدائم"
                      : "حافظ على التزامك بقواعد المجتمع"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full space-y-2.5">
            {banInfo.is_permanent && (
              <button
                onClick={() => setShowAppeal(!showAppeal)}
                className="w-full py-3 rounded-xl text-[14px] font-semibold text-[#0095f6] bg-[#0095f6]/5 hover:bg-[#0095f6]/10 transition-colors border border-[#0095f6]/20"
              >
                تقديم استئناف
              </button>
            )}

            <button
              onClick={signOut}
              className="w-full py-3 rounded-xl text-[14px] font-semibold text-[#262626] bg-[#fafafa] hover:bg-[#efefef] transition-colors border border-[#dbdbdb]"
            >
              تسجيل الخروج
            </button>
          </div>

          {showAppeal && (
            <div className="w-full mt-4 bg-[#fafafa] border border-[#efefef] rounded-2xl p-4">
              <p className="text-[13px] text-[#262626] leading-relaxed mb-3">
                إذا كنت تعتقد أن هذا القرار غير عادل، يمكنك التواصل معنا عبر:
              </p>
              <a
                href="mailto:support@novii.app"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                support@novii.app
              </a>
              <p className="text-[11px] text-[#8e8e8e] text-center mt-2.5 leading-relaxed">
                يُرجى ذكر اسم المستخدم وسبب الاستئناف بالتفصيل. سيتم مراجعة طلبك خلال ٤٨ ساعة.
              </p>
            </div>
          )}

          <p className="text-[11px] text-[#c7c7c7] text-center mt-6">
            Novii Community Guidelines
          </p>
        </div>
      </div>
    </div>
  );
}
