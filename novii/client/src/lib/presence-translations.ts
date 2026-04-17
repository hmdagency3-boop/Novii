export type PresenceTranslation = {
  activeNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
  locale: string;
};

export const presenceTranslations: Record<string, PresenceTranslation> = {
  ar: {
    activeNow: "نشط الآن",
    minutesAgo: (n) => `قبل ${n} دقيقة`,
    hoursAgo: (n) => `قبل ${n} ساعة`,
    daysAgo: (n) => `قبل ${n} يوم`,
    locale: "ar-SA",
  },
  en: {
    activeNow: "Active now",
    minutesAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n} h ago`,
    daysAgo: (n) => `${n} d ago`,
    locale: "en-US",
  },
  es: {
    activeNow: "Activo ahora",
    minutesAgo: (n) => `hace ${n} min`,
    hoursAgo: (n) => `hace ${n} h`,
    daysAgo: (n) => `hace ${n} d`,
    locale: "es-ES",
  },
  fr: {
    activeNow: "Actif maintenant",
    minutesAgo: (n) => `il y a ${n} min`,
    hoursAgo: (n) => `il y a ${n} h`,
    daysAgo: (n) => `il y a ${n} j`,
    locale: "fr-FR",
  },
  de: {
    activeNow: "Jetzt aktiv",
    minutesAgo: (n) => `vor ${n} Min.`,
    hoursAgo: (n) => `vor ${n} Std.`,
    daysAgo: (n) => `vor ${n} T.`,
    locale: "de-DE",
  },
  it: {
    activeNow: "Attivo ora",
    minutesAgo: (n) => `${n} min fa`,
    hoursAgo: (n) => `${n} h fa`,
    daysAgo: (n) => `${n} g fa`,
    locale: "it-IT",
  },
  pt: {
    activeNow: "Ativo agora",
    minutesAgo: (n) => `há ${n} min`,
    hoursAgo: (n) => `há ${n} h`,
    daysAgo: (n) => `há ${n} d`,
    locale: "pt-BR",
  },
  ru: {
    activeNow: "В сети",
    minutesAgo: (n) => `${n} мин назад`,
    hoursAgo: (n) => `${n} ч назад`,
    daysAgo: (n) => `${n} дн назад`,
    locale: "ru-RU",
  },
  zh: {
    activeNow: "在线",
    minutesAgo: (n) => `${n} 分钟前`,
    hoursAgo: (n) => `${n} 小时前`,
    daysAgo: (n) => `${n} 天前`,
    locale: "zh-CN",
  },
  ja: {
    activeNow: "オンライン",
    minutesAgo: (n) => `${n}分前`,
    hoursAgo: (n) => `${n}時間前`,
    daysAgo: (n) => `${n}日前`,
    locale: "ja-JP",
  },
  ko: {
    activeNow: "온라인",
    minutesAgo: (n) => `${n}분 전`,
    hoursAgo: (n) => `${n}시간 전`,
    daysAgo: (n) => `${n}일 전`,
    locale: "ko-KR",
  },
  hi: {
    activeNow: "अभी सक्रिय",
    minutesAgo: (n) => `${n} मिनट पहले`,
    hoursAgo: (n) => `${n} घंटे पहले`,
    daysAgo: (n) => `${n} दिन पहले`,
    locale: "hi-IN",
  },
  tr: {
    activeNow: "Şimdi aktif",
    minutesAgo: (n) => `${n} dk önce`,
    hoursAgo: (n) => `${n} sa önce`,
    daysAgo: (n) => `${n} g önce`,
    locale: "tr-TR",
  },
  fa: {
    activeNow: "آنلاین",
    minutesAgo: (n) => `${n} دقیقه پیش`,
    hoursAgo: (n) => `${n} ساعت پیش`,
    daysAgo: (n) => `${n} روز پیش`,
    locale: "fa-IR",
  },
  ur: {
    activeNow: "آن لائن",
    minutesAgo: (n) => `${n} منٹ پہلے`,
    hoursAgo: (n) => `${n} گھنٹے پہلے`,
    daysAgo: (n) => `${n} دن پہلے`,
    locale: "ur-PK",
  },
  he: {
    activeNow: "מחובר עכשיו",
    minutesAgo: (n) => `לפני ${n} דק'`,
    hoursAgo: (n) => `לפני ${n} ש'`,
    daysAgo: (n) => `לפני ${n} י'`,
    locale: "he-IL",
  },
};

export function getPresenceTranslation(code: string): PresenceTranslation {
  return presenceTranslations[code] || presenceTranslations.en;
}

export function formatLastSeen(lastSeen: string, code: string, isOnline = false): string {
  const t = getPresenceTranslation(code);
  if (isOnline) return t.activeNow;
  if (!lastSeen) return "";
  const now = new Date();
  const d = new Date(lastSeen);
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return t.activeNow;
  if (diffMin < 60) return t.minutesAgo(diffMin);
  if (diffHr < 24) return t.hoursAgo(diffHr);
  if (diffDay < 7) return t.daysAgo(diffDay);
  return d.toLocaleDateString(t.locale);
}
