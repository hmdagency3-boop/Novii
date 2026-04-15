import { useAuth } from "@/lib/auth-context";

const logo = "/assets/novii_logo_new.png";

export function BanScreen() {
  const { banInfo, signOut } = useAuth();

  if (!banInfo) return null;

  const banUntil = banInfo.ban_until ? new Date(banInfo.ban_until) : null;
  const showDuration = banInfo.show_duration && banUntil;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-white via-white to-purple-50/40 overflow-hidden" dir="rtl" style={{ isolation: "isolate" }}>
      <div className="w-full max-w-[380px] mx-4 flex flex-col items-center">
        <div className="mb-6">
          <img src={logo} alt="Novii" className="w-16 h-16 rounded-2xl shadow-lg object-contain bg-black/5 p-1.5" />
        </div>

        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="hsl(var(--destructive))" strokeWidth="1.5" />
            <path d="M15 9L9 15M9 9l6 6" stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-1.5 text-center font-[var(--font-display)]">
          {banInfo.is_permanent ? "تم تعليق حسابك" : "حسابك مقيّد مؤقتاً"}
        </h1>
        <p className="text-[14px] text-muted-foreground text-center leading-relaxed mb-6 max-w-[300px]">
          {banInfo.is_permanent
            ? "تم تعليق حسابك بشكل دائم لمخالفة إرشادات مجتمع Novii."
            : "تم تقييد حسابك مؤقتاً بسبب مخالفة إرشادات المجتمع."}
        </p>

        <div className="w-full space-y-3 mb-6">
          {banInfo.reason && (
            <div className="w-full rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                <span className="text-[13px] font-semibold text-foreground">سبب التقييد</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-[14px] text-foreground/90 leading-relaxed">{banInfo.reason}</p>
              </div>
            </div>
          )}

          {showDuration && banUntil && (
            <div className="w-full rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                <span className="text-[13px] font-semibold text-foreground">ينتهي التقييد في</span>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[15px] font-semibold text-foreground" dir="ltr">
                  {banUntil.toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" })}
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
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
              className="flex items-center justify-center w-full py-3 rounded-xl text-[14px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/15"
            >
              تقديم استئناف
            </a>
          )}

          <button
            onClick={signOut}
            className="w-full py-3 rounded-xl text-[14px] font-medium text-muted-foreground bg-muted/50 hover:bg-muted transition-colors border border-border"
          >
            تسجيل الخروج
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center mt-8">
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
