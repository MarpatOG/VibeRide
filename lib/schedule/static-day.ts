const STATIC_DAY_ZERO_UTC = Date.UTC(2030, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

export function dayNumberToDateIso(dayNumber: number) {
  const safe = Math.max(1, Math.floor(dayNumber || 1));
  const utc = STATIC_DAY_ZERO_UTC + (safe - 1) * DAY_MS;
  return new Date(utc).toISOString().slice(0, 10);
}

export function dateIsoToDayNumber(dateIso: string) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const utc = Date.UTC(year, (month || 1) - 1, day || 1);
  return Math.floor((utc - STATIC_DAY_ZERO_UTC) / DAY_MS) + 1;
}

export function formatDayNumber(dayNumber: number, locale: 'ru' | 'en') {
  return locale === 'ru' ? `День ${dayNumber}` : `Day ${dayNumber}`;
}

