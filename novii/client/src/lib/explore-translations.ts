export type ExploreTranslation = {
  searchPlaceholder: string;
  trendingHashtags: string;
};

export const exploreTranslations: Record<string, ExploreTranslation> = {
  ar: { searchPlaceholder: "ابحث في نوفيي...", trendingHashtags: "هاشتاقات رائجة" },
  en: { searchPlaceholder: "Search Novii...", trendingHashtags: "Trending hashtags" },
  es: { searchPlaceholder: "Buscar en Novii...", trendingHashtags: "Hashtags populares" },
  fr: { searchPlaceholder: "Rechercher sur Novii...", trendingHashtags: "Hashtags tendance" },
  de: { searchPlaceholder: "Novii durchsuchen...", trendingHashtags: "Trend-Hashtags" },
  it: { searchPlaceholder: "Cerca su Novii...", trendingHashtags: "Hashtag di tendenza" },
  pt: { searchPlaceholder: "Pesquisar no Novii...", trendingHashtags: "Hashtags em alta" },
  ru: { searchPlaceholder: "Поиск в Novii...", trendingHashtags: "Популярные хэштеги" },
  zh: { searchPlaceholder: "在 Novii 中搜索...", trendingHashtags: "热门话题标签" },
  ja: { searchPlaceholder: "Noviiで検索...", trendingHashtags: "トレンドのハッシュタグ" },
  ko: { searchPlaceholder: "Novii에서 검색...", trendingHashtags: "인기 해시태그" },
  hi: { searchPlaceholder: "Novii में खोजें...", trendingHashtags: "ट्रेंडिंग हैशटैग" },
  tr: { searchPlaceholder: "Novii'de ara...", trendingHashtags: "Trend hashtagler" },
  fa: { searchPlaceholder: "جستجو در Novii...", trendingHashtags: "هشتگ‌های پرطرفدار" },
  ur: { searchPlaceholder: "Novii میں تلاش کریں...", trendingHashtags: "ٹرینڈنگ ہیش ٹیگز" },
  he: { searchPlaceholder: "חיפוש ב-Novii...", trendingHashtags: "האשטגים פופולריים" },
};

export function getExploreTranslation(code: string): ExploreTranslation {
  return exploreTranslations[code] || exploreTranslations.en;
}
