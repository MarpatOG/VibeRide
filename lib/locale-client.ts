'use client';

import {defaultLocale, Locale} from '@/lib/locale';

const ruMessages: Record<string, string> = {
  'nav.menu': 'Меню',
  'nav.schedule': 'Расписание',
  'nav.pricing': 'Цены и акции',
  'nav.trainers': 'Тренеры',
  'nav.about': 'О нас',
  'nav.faq': 'FAQ',
  'nav.ctaBook': 'Записаться'
};

export function useLocale(): Locale {
  return defaultLocale;
}

export function useT() {
  return (key: string) => ruMessages[key] ?? key;
}
