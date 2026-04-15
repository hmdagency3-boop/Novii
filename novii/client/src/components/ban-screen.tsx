import { useAuth } from "@/lib/auth-context";

const logo = "/assets/novii_logo_new.png";

export function BanScreen() {
  const { banInfo, signOut } = useAuth();

  if (!banInfo) return null;

  const banUntil = banInfo.ban_until ? new Date(banInfo.ban_until) : null;
  const showDuration = banInfo.show_duration && banUntil;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden" dir="rtl" style={{ background: "hsl(240,10%,3.9%)" }}>
      <div className="w-full max-w-[380px] mx-4 flex flex-col items-center">
        <div className="mb-6">
          <img src={logo} alt="Novii" className="w-16 h-16 rounded-2xl shadow-lg object-contain p-1.5" style={{ background: "rgba(0,0,0,0.04)" }} />
        </div>

        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(239,68,68,0.15)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M15 9L9 15M9 9l6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-xl font-bold mb-1.5 text-center" style={{ color: "#f5f5f5", fontFamily: "var(--font-display, 'Outfit', sans-serif)" }}>
          {banInfo.is_permanent ? "تم تعليق حسابك" : "حسابك مقيّد مؤقتاً"}
        </h1>
        <p className="text-[14px] text-center leading-relaxed mb-6 max-w-[300px]" style={{ color: "#a1a1aa" }}>
          {banInfo.is_permanent
            ? "تم تعليق حسابك بشكل دائم لمخالفة إرشادات مجتمع Novii."
            : "تم تقييد حسابك مؤقتاً بسبب مخالفة إرشادات المجتمع."}
        </p>

        <div className="w-full space-y-3 mb-6">
          {banInfo.reason && (
            <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>سبب التقييد</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-[14px] leading-relaxed" style={{ color: "#a1a1aa" }}>{banInfo.reason}</p>
              </div>
            </div>
          )}

          {showDuration && banUntil && (
            <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>ينتهي التقييد في</span>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[15px] font-semibold" dir="ltr" style={{ color: "#f5f5f5" }}>
                  {banUntil.toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" })}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "#71717a" }}>
                  {getTimeLeft(banUntil)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full space-y-2.5">
          {banInfo.is_permanent && (
            <a
              href="mailto:support@novii.app"
              className="flex items-center justify-center w-full py-3 rounded-xl text-[14px] font-semibold transition-colors"
              style={{ color: "#ffffff", background: "hsl(262,80%,50%)", border: "1px solid hsl(262,80%,60%)" }}
            >
              تقديم استئناف
            </a>
          )}

          <button
            onClick={signOut}
            className="w-full py-3 rounded-xl text-[14px] font-medium transition-colors"
            style={{ color: "#a1a1aa", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            تسجيل الخروج
          </button>
        </div>

        <p className="text-[11px] text-center mt-8" style={{ color: "#52525b" }}>
          Novii Community Guidelines
        </p>
      </div>
    </div>
  );
}

function getTimeLeft(banUntil: Date): string {
  const diff = banUntil.getTime() - Date.now();
  if (diff <= 0) return "قريباً";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `متبقي ${days} يوم و ${hours} ساعة`;
  if (hours > 0) return `متبقي ${hours} ساعة و ${minutes} دقيقة`;
  if (minutes > 0) return `متبقي ${minutes} دقيقة`;
  return "قريباً";
}
