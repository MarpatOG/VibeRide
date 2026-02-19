import {Locale} from '@/lib/locale';
import {Localized} from '@/lib/types/localized';

export function t(text: Localized, locale: Locale) {
  return text[locale];
}

