export const locales = ['ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
