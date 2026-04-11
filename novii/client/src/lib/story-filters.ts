export interface StoryFilter {
  id: string;
  name: string;
  nameAr: string;
  css: string;
}

export const STORY_FILTERS: StoryFilter[] = [
  { id: 'normal',    name: 'Normal',    nameAr: 'عادي',      css: 'none' },
  { id: 'clarendon', name: 'Clarendon', nameAr: 'كلارندون',  css: 'brightness(1.1) contrast(1.2) saturate(1.35)' },
  { id: 'gingham',   name: 'Gingham',   nameAr: 'جينغهام',   css: 'brightness(1.05) hue-rotate(-10deg) sepia(0.04)' },
  { id: 'moon',      name: 'Moon',      nameAr: 'مون',        css: 'grayscale(1) brightness(1.1) contrast(1.1)' },
  { id: 'lark',      name: 'Lark',      nameAr: 'لارك',       css: 'brightness(1.1) contrast(0.9) saturate(1.4)' },
  { id: 'reyes',     name: 'Reyes',     nameAr: 'ريس',        css: 'brightness(1.05) contrast(0.85) saturate(0.75) sepia(0.22)' },
  { id: 'juno',      name: 'Juno',      nameAr: 'جونو',       css: 'brightness(1.05) contrast(1.1) saturate(1.4) hue-rotate(-5deg)' },
  { id: 'slumber',   name: 'Slumber',   nameAr: 'سلامبر',    css: 'brightness(0.9) saturate(0.6) hue-rotate(5deg) sepia(0.1)' },
  { id: 'crema',     name: 'Crema',     nameAr: 'كريما',      css: 'brightness(1.05) contrast(0.9) saturate(0.85) sepia(0.15)' },
  { id: 'ludwig',    name: 'Ludwig',    nameAr: 'لودفيغ',    css: 'brightness(1.05) contrast(0.95) saturate(0.9)' },
  { id: 'aden',      name: 'Aden',      nameAr: 'آدن',        css: 'brightness(1.1) contrast(0.85) saturate(0.85) hue-rotate(20deg)' },
  { id: 'perpetua',  name: 'Perpetua',  nameAr: 'بيربيتوا',  css: 'brightness(1.05) contrast(1.1) saturate(1.1) hue-rotate(-10deg)' },
  { id: 'nashville', name: 'Nashville', nameAr: 'ناشفيل',    css: 'brightness(1.1) contrast(1.1) saturate(1.2) sepia(0.15) hue-rotate(-10deg)' },
  { id: 'inkwell',   name: 'Inkwell',   nameAr: 'إنكويل',    css: 'grayscale(1) brightness(1.05) contrast(1.2) sepia(0.1)' },
  { id: 'lo-fi',     name: 'Lo-Fi',     nameAr: 'لو-فاي',    css: 'saturate(1.5) contrast(1.1) brightness(0.95)' },
];

export function getFilterById(id: string): StoryFilter {
  return STORY_FILTERS.find(f => f.id === id) || STORY_FILTERS[0];
}
