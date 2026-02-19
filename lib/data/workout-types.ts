import {Locale} from '@/lib/locale';

type LocalizedText = {
  ru: string;
  en: string;
};

export type WorkoutTypeId = 'start' | 'core' | 'intervals' | 'power' | 'endurance' | 'cinema';

export type WorkoutType = {
  id: WorkoutTypeId;
  scheduleTemplateId: string;
  name: string;
  durationMin: number;
  description: LocalizedText;
  intensity: 1 | 2 | 3 | 4 | 5;
  color: string;
  label: LocalizedText;
};

export const WORKOUT_TYPES: WorkoutType[] = [
  {
    id: 'start',
    scheduleTemplateId: 'vibe-start',
    name: 'VibeStart',
    durationMin: 50,
    description: {
      ru: 'Первый заезд. Знакомство со студией и техникой.',
      en: 'First ride. A smooth intro to studio flow and bike technique.'
    },
    intensity: 2,
    color: '#5DA9FF',
    label: {ru: 'Новичкам', en: 'Beginners'}
  },
  {
    id: 'core',
    scheduleTemplateId: 'vibe-core',
    name: 'VibeCore',
    durationMin: 55,
    description: {
      ru: 'Фирменная базовая тренировка VibeRide.',
      en: 'Signature base workout of VibeRide.'
    },
    intensity: 3,
    color: '#FF2F8F',
    label: {ru: 'Для всех уровней', en: 'All levels'}
  },
  {
    id: 'intervals',
    scheduleTemplateId: 'vibe-intervals',
    name: 'VibeIntervals',
    durationMin: 85,
    description: {
      ru: 'Интервалы под музыку. Максимальный драйв.',
      en: 'Intervals to music with maximum drive.'
    },
    intensity: 5,
    color: '#8B5CF6',
    label: {ru: 'Высокая нагрузка', en: 'High load'}
  },
  {
    id: 'power',
    scheduleTemplateId: 'vibe-power',
    name: 'VibePower',
    durationMin: 50,
    description: {
      ru: 'Силовая работа с высоким сопротивлением.',
      en: 'Strength-focused rides with high resistance.'
    },
    intensity: 4,
    color: '#EF4444',
    label: {ru: 'Сила и контроль', en: 'Strength and control'}
  },
  {
    id: 'endurance',
    scheduleTemplateId: 'vibe-endurance',
    name: 'VibeTempo',
    durationMin: 75,
    description: {
      ru: 'Длинная дистанция и устойчивый ритм.',
      en: 'Long distance work with stable rhythm.'
    },
    intensity: 3,
    color: '#14B8A6',
    label: {ru: 'Кардиобаза', en: 'Cardio base'}
  },
  {
    id: 'cinema',
    scheduleTemplateId: 'vibe-cinema',
    name: 'VibeCinema',
    durationMin: 95,
    description: {
      ru: 'Сайклинг + кино на большом экране.',
      en: 'Cycling plus cinema on a big screen.'
    },
    intensity: 2,
    color: '#F59E0B',
    label: {ru: 'Фан-формат', en: 'Fun format'}
  }
];

const byShortId = new Map(WORKOUT_TYPES.map((item) => [item.id, item] as const));
const byScheduleTemplateId = new Map(WORKOUT_TYPES.map((item) => [item.scheduleTemplateId, item] as const));
const byName = new Map(WORKOUT_TYPES.map((item) => [item.name.toLowerCase(), item] as const));

export function getWorkoutTypeByShortId(value: string) {
  return byShortId.get(value as WorkoutTypeId) ?? null;
}

export function getWorkoutTypeByScheduleTemplateId(value: string) {
  return byScheduleTemplateId.get(value) ?? null;
}

export function getWorkoutTypeBySessionTitle(title: {ru: string; en: string} | string) {
  if (typeof title === 'string') {
    return byName.get(title.trim().toLowerCase()) ?? null;
  }
  return byName.get(title.ru.trim().toLowerCase()) ?? byName.get(title.en.trim().toLowerCase()) ?? null;
}

export function resolveWorkoutTypeFilterValue(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  const byId = getWorkoutTypeByShortId(trimmed);
  if (byId) return byId.scheduleTemplateId;
  const byTemplate = getWorkoutTypeByScheduleTemplateId(trimmed);
  if (byTemplate) return byTemplate.scheduleTemplateId;
  return '';
}

export function getWorkoutTypeDescription(type: WorkoutType, locale: Locale) {
  return type.description[locale];
}

export function getWorkoutTypeLabel(type: WorkoutType, locale: Locale) {
  return type.label[locale];
}

