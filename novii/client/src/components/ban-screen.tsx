import { ShieldAlert, Clock, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function BanScreen() {
  const { banInfo, signOut } = useAuth();

  if (!banInfo) return null;

  const banUntil = banInfo.ban_until ? new Date(banInfo.ban_until) : null;
  const timeLeft = banUntil ? getTimeLeft(banUntil) : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-8rem] right-[-8rem] w-80 h-80 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-8rem] w-80 h-80 rounded-full bg-orange-500/8 blur-3xl" />
      </div>

      <div className="relative max-w-sm w-full space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            تم تقييد حسابك
          </h1>
          <p className="text-sm text-muted-foreground">
            {banInfo.is_permanent
              ? "تم حظر حسابك بشكل دائم بسبب مخالفة شروط الاستخدام."
              : "تم تقييد حسابك مؤقتاً بسبب مخالفة سياسة الاستخدام."}
          </p>
        </div>

        {banInfo.reason && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-right">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-500">سبب الحظر</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{banInfo.reason}</p>
          </div>
        )}

        {timeLeft && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-500">مدة الحظر المتبقية</span>
            </div>
            <p className="text-lg font-bold text-foreground">{timeLeft}</p>
            {banUntil && (
              <p className="text-xs text-muted-foreground mt-1">
                ينتهي في: {banUntil.toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" })}
              </p>
            )}
          </div>
        )}

        {banInfo.is_permanent && (
          <div className="bg-muted/50 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              إذا كنت تعتقد أن هذا الحظر غير عادل، يمكنك التواصل مع فريق الدعم
              عبر البريد الإلكتروني لتقديم استئناف.
            </p>
          </div>
        )}

        {(banInfo.strikes_count ?? 0) > 0 && (
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs text-muted-foreground">عدد المخالفات:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(banInfo.strikes_count ?? 0, 5) }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-red-500" />
              ))}
              {Array.from({ length: Math.max(0, 5 - (banInfo.strikes_count ?? 0)) }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-muted" />
              ))}
            </div>
            <span className="text-xs font-medium text-red-500">{banInfo.strikes_count}/5</span>
          </div>
        )}

        <Button
          variant="outline"
          onClick={signOut}
          className="w-full mt-4"
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل خروج
        </Button>
      </div>
    </div>
  );
}

function getTimeLeft(banUntil: Date): string {
  const diff = banUntil.getTime() - Date.now();
  if (diff <= 0) return "قريباً جداً";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} يوم و ${hours % 24} ساعة`;
  } else if (hours > 0) {
    return `${hours} ساعة و ${minutes % 60} دقيقة`;
  } else if (minutes > 0) {
    return `${minutes} دقيقة`;
  } else {
    return "قريباً جداً";
  }
}
