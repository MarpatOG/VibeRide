import {Locale} from '@/lib/locale';
import {HistoryEventType, SkillLevel} from '@/lib/types/profile';

function getLocaleCode(locale: Locale) {
  return locale === 'ru' ? 'ru-RU' : 'en-US';
}

export function formatDate(isoValue: string, locale: Locale) {
  const value = new Date(isoValue);
  return new Intl.DateTimeFormat(getLocaleCode(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(value);
}

export function formatDateTime(isoValue: string, locale: Locale) {
  const value = new Date(isoValue);
  return new Intl.DateTimeFormat(getLocaleCode(locale), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
    .format(value)
    .replace('.', ':');
}

export function getLevelLabel(level: SkillLevel, locale: Locale) {
  if (locale === 'ru') {
    if (level === 'beginner') return 'Базовый';
    if (level === 'intermediate') return 'Средний';
    return 'Продвинутый';
  }
  if (level === 'beginner') return 'Beginner';
  if (level === 'intermediate') return 'Intermediate';
  return 'Advanced';
}

export function getHistoryTypeLabel(type: HistoryEventType, locale: Locale) {
  if (locale === 'ru') {
    if (type === 'completed') return 'Посещение';
    if (type === 'canceled') return 'Отмена';
    if (type === 'session_debited') return 'Списание';
    return 'Абонемент';
  }
  if (type === 'completed') return 'Completed';
  if (type === 'canceled') return 'Canceled';
  if (type === 'session_debited') return 'Debited';
  return 'Membership';
}
