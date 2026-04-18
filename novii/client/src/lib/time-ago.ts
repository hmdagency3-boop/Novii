type LangCode = 'ar' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'hi' | 'tr' | 'fa' | 'ur' | 'he';

interface TimeUnit {
  just: string;
  minute: (n: number) => string;
  hour: (n: number) => string;
  day: (n: number) => string;
  week: (n: number) => string;
  month: (n: number) => string;
  year: (n: number) => string;
}

const translations: Record<LangCode, TimeUnit> = {
  ar: {
    just: 'الآن',
    minute: (n) => n === 1 ? 'منذ دقيقة' : n === 2 ? 'منذ دقيقتين' : n <= 10 ? `منذ ${n} دقائق` : `منذ ${n} دقيقة`,
    hour: (n) => n === 1 ? 'منذ ساعة' : n === 2 ? 'منذ ساعتين' : n <= 10 ? `منذ ${n} ساعات` : `منذ ${n} ساعة`,
    day: (n) => n === 1 ? 'أمس' : n === 2 ? 'منذ يومين' : n <= 10 ? `منذ ${n} أيام` : `منذ ${n} يوم`,
    week: (n) => n === 1 ? 'منذ أسبوع' : n === 2 ? 'منذ أسبوعين' : `منذ ${n} أسابيع`,
    month: (n) => n === 1 ? 'منذ شهر' : n === 2 ? 'منذ شهرين' : n <= 10 ? `منذ ${n} أشهر` : `منذ ${n} شهر`,
    year: (n) => n === 1 ? 'منذ سنة' : n === 2 ? 'منذ سنتين' : `منذ ${n} سنوات`,
  },
  en: {
    just: 'just now',
    minute: (n) => n === 1 ? '1 minute ago' : `${n} minutes ago`,
    hour: (n) => n === 1 ? '1 hour ago' : `${n} hours ago`,
    day: (n) => n === 1 ? 'yesterday' : `${n} days ago`,
    week: (n) => n === 1 ? '1 week ago' : `${n} weeks ago`,
    month: (n) => n === 1 ? '1 month ago' : `${n} months ago`,
    year: (n) => n === 1 ? '1 year ago' : `${n} years ago`,
  },
  es: {
    just: 'ahora mismo',
    minute: (n) => n === 1 ? 'hace 1 minuto' : `hace ${n} minutos`,
    hour: (n) => n === 1 ? 'hace 1 hora' : `hace ${n} horas`,
    day: (n) => n === 1 ? 'ayer' : `hace ${n} días`,
    week: (n) => n === 1 ? 'hace 1 semana' : `hace ${n} semanas`,
    month: (n) => n === 1 ? 'hace 1 mes' : `hace ${n} meses`,
    year: (n) => n === 1 ? 'hace 1 año' : `hace ${n} años`,
  },
  fr: {
    just: 'à l\'instant',
    minute: (n) => n === 1 ? 'il y a 1 minute' : `il y a ${n} minutes`,
    hour: (n) => n === 1 ? 'il y a 1 heure' : `il y a ${n} heures`,
    day: (n) => n === 1 ? 'hier' : `il y a ${n} jours`,
    week: (n) => n === 1 ? 'il y a 1 semaine' : `il y a ${n} semaines`,
    month: (n) => n === 1 ? 'il y a 1 mois' : `il y a ${n} mois`,
    year: (n) => n === 1 ? 'il y a 1 an' : `il y a ${n} ans`,
  },
  de: {
    just: 'gerade eben',
    minute: (n) => n === 1 ? 'vor 1 Minute' : `vor ${n} Minuten`,
    hour: (n) => n === 1 ? 'vor 1 Stunde' : `vor ${n} Stunden`,
    day: (n) => n === 1 ? 'gestern' : `vor ${n} Tagen`,
    week: (n) => n === 1 ? 'vor 1 Woche' : `vor ${n} Wochen`,
    month: (n) => n === 1 ? 'vor 1 Monat' : `vor ${n} Monaten`,
    year: (n) => n === 1 ? 'vor 1 Jahr' : `vor ${n} Jahren`,
  },
  it: {
    just: 'adesso',
    minute: (n) => n === 1 ? '1 minuto fa' : `${n} minuti fa`,
    hour: (n) => n === 1 ? '1 ora fa' : `${n} ore fa`,
    day: (n) => n === 1 ? 'ieri' : `${n} giorni fa`,
    week: (n) => n === 1 ? '1 settimana fa' : `${n} settimane fa`,
    month: (n) => n === 1 ? '1 mese fa' : `${n} mesi fa`,
    year: (n) => n === 1 ? '1 anno fa' : `${n} anni fa`,
  },
  pt: {
    just: 'agora mesmo',
    minute: (n) => n === 1 ? 'há 1 minuto' : `há ${n} minutos`,
    hour: (n) => n === 1 ? 'há 1 hora' : `há ${n} horas`,
    day: (n) => n === 1 ? 'ontem' : `há ${n} dias`,
    week: (n) => n === 1 ? 'há 1 semana' : `há ${n} semanas`,
    month: (n) => n === 1 ? 'há 1 mês' : `há ${n} meses`,
    year: (n) => n === 1 ? 'há 1 ano' : `há ${n} anos`,
  },
  ru: {
    just: 'только что',
    minute: (n) => n === 1 ? '1 минуту назад' : n < 5 ? `${n} минуты назад` : `${n} минут назад`,
    hour: (n) => n === 1 ? '1 час назад' : n < 5 ? `${n} часа назад` : `${n} часов назад`,
    day: (n) => n === 1 ? 'вчера' : n < 5 ? `${n} дня назад` : `${n} дней назад`,
    week: (n) => n === 1 ? '1 неделю назад' : n < 5 ? `${n} недели назад` : `${n} недель назад`,
    month: (n) => n === 1 ? '1 месяц назад' : n < 5 ? `${n} месяца назад` : `${n} месяцев назад`,
    year: (n) => n === 1 ? '1 год назад' : n < 5 ? `${n} года назад` : `${n} лет назад`,
  },
  zh: {
    just: '刚刚',
    minute: (n) => `${n}分钟前`,
    hour: (n) => `${n}小时前`,
    day: (n) => n === 1 ? '昨天' : `${n}天前`,
    week: (n) => `${n}周前`,
    month: (n) => `${n}个月前`,
    year: (n) => `${n}年前`,
  },
  ja: {
    just: 'たった今',
    minute: (n) => `${n}分前`,
    hour: (n) => `${n}時間前`,
    day: (n) => n === 1 ? '昨日' : `${n}日前`,
    week: (n) => `${n}週間前`,
    month: (n) => `${n}ヶ月前`,
    year: (n) => `${n}年前`,
  },
  ko: {
    just: '방금',
    minute: (n) => `${n}분 전`,
    hour: (n) => `${n}시간 전`,
    day: (n) => n === 1 ? '어제' : `${n}일 전`,
    week: (n) => `${n}주 전`,
    month: (n) => `${n}개월 전`,
    year: (n) => `${n}년 전`,
  },
  hi: {
    just: 'अभी',
    minute: (n) => n === 1 ? '1 मिनट पहले' : `${n} मिनट पहले`,
    hour: (n) => n === 1 ? '1 घंटे पहले' : `${n} घंटे पहले`,
    day: (n) => n === 1 ? 'कल' : `${n} दिन पहले`,
    week: (n) => n === 1 ? '1 सप्ताह पहले' : `${n} सप्ताह पहले`,
    month: (n) => n === 1 ? '1 महीने पहले' : `${n} महीने पहले`,
    year: (n) => n === 1 ? '1 साल पहले' : `${n} साल पहले`,
  },
  tr: {
    just: 'az önce',
    minute: (n) => n === 1 ? '1 dakika önce' : `${n} dakika önce`,
    hour: (n) => n === 1 ? '1 saat önce' : `${n} saat önce`,
    day: (n) => n === 1 ? 'dün' : `${n} gün önce`,
    week: (n) => n === 1 ? '1 hafta önce' : `${n} hafta önce`,
    month: (n) => n === 1 ? '1 ay önce' : `${n} ay önce`,
    year: (n) => n === 1 ? '1 yıl önce' : `${n} yıl önce`,
  },
  fa: {
    just: 'همین الان',
    minute: (n) => n === 1 ? '۱ دقیقه پیش' : `${n} دقیقه پیش`,
    hour: (n) => n === 1 ? '۱ ساعت پیش' : `${n} ساعت پیش`,
    day: (n) => n === 1 ? 'دیروز' : `${n} روز پیش`,
    week: (n) => n === 1 ? '۱ هفته پیش' : `${n} هفته پیش`,
    month: (n) => n === 1 ? '۱ ماه پیش' : `${n} ماه پیش`,
    year: (n) => n === 1 ? '۱ سال پیش' : `${n} سال پیش`,
  },
  ur: {
    just: 'ابھی',
    minute: (n) => n === 1 ? '1 منٹ پہلے' : `${n} منٹ پہلے`,
    hour: (n) => n === 1 ? '1 گھنٹہ پہلے' : `${n} گھنٹے پہلے`,
    day: (n) => n === 1 ? 'کل' : `${n} دن پہلے`,
    week: (n) => n === 1 ? '1 ہفتہ پہلے' : `${n} ہفتے پہلے`,
    month: (n) => n === 1 ? '1 مہینہ پہلے' : `${n} مہینے پہلے`,
    year: (n) => n === 1 ? '1 سال پہلے' : `${n} سال پہلے`,
  },
  he: {
    just: 'עכשיו',
    minute: (n) => n === 1 ? 'לפני דקה' : `לפני ${n} דקות`,
    hour: (n) => n === 1 ? 'לפני שעה' : `לפני ${n} שעות`,
    day: (n) => n === 1 ? 'אתמול' : `לפני ${n} ימים`,
    week: (n) => n === 1 ? 'לפני שבוע' : `לפני ${n} שבועות`,
    month: (n) => n === 1 ? 'לפני חודש' : `לפני ${n} חודשים`,
    year: (n) => n === 1 ? 'לפני שנה' : `לפני ${n} שנים`,
  },
};

export function timeAgo(date: string | Date, langCode: string = 'ar'): string {
  const lang = (translations[langCode as LangCode] ?? translations['en']);
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 45) return lang.just;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return lang.minute(minutes);

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang.hour(hours);

  const days = Math.floor(hours / 24);
  if (days < 7) return lang.day(days);

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return lang.week(weeks);

  const months = Math.floor(days / 30);
  if (months < 12) return lang.month(months);

  const years = Math.floor(days / 365);
  return lang.year(years);
}
