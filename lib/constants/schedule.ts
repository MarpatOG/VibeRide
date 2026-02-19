import {type ScheduleTemplate, type TrainerCycleRule} from '@/lib/schedule/generator';
import {DEFAULT_HALL_ID} from '@/lib/schedule/slot-rules';
import {Localized} from '@/lib/types/localized';

export const scheduleSlotTimes = ['09:00', '10:00', '11:00', '16:00', '17:30', '19:00'];

export const scheduleTemplates: ScheduleTemplate<Localized>[] = [
  {
    id: 'vibe-start',
    durationMin: 50,
    level: 'beginner',
    title: {ru: 'VibeStart', en: 'VibeStart'},
    subtitle: {ru: 'Легкий старт', en: 'Easy Start'},
    description: {ru: 'Плавная разминка и мягкий вход в тренировку.', en: 'Smooth warm-up ride'},
    shifts: ['morning']
  },
  {
    id: 'vibe-core',
    durationMin: 55,
    level: 'beginner',
    title: {ru: 'VibeCore', en: 'VibeCore'},
    subtitle: {ru: 'Фирменный ритм', en: 'Signature Rhythm'},
    description: {ru: 'Кардио-тренировка с акцентом на ритм.', en: 'Cardio with beat focus'},
    shifts: ['morning', 'evening']
  },
  {
    id: 'vibe-endurance',
    durationMin: 75,
    level: 'intermediate',
    title: {ru: 'VibeTempo', en: 'VibeTempo'},
    subtitle: {ru: 'Темп и выносливость', en: 'Tempo & Endurance'},
    description: {ru: 'Интервалы и работа на выносливость.', en: 'Intervals and endurance'},
    shifts: ['morning', 'evening']
  },
  {
    id: 'vibe-intervals',
    durationMin: 85,
    level: 'intermediate',
    title: {ru: 'VibeIntervals', en: 'VibeIntervals'},
    subtitle: {ru: 'HIIT-интервалы', en: 'HIIT Intervals'},
    description: {ru: 'Темповый тренировочный блок.', en: 'Tempo training block'},
    shifts: ['evening']
  },
  {
    id: 'vibe-power',
    durationMin: 50,
    level: 'advanced',
    title: {ru: 'VibePower', en: 'VibePower'},
    subtitle: {ru: 'Силовой драйв', en: 'Power Drive'},
    description: {ru: 'Высокоинтенсивная пульсовая работа.', en: 'High-intensity pulse work'},
    shifts: ['evening']
  },
  {
    id: 'vibe-cinema',
    durationMin: 95,
    level: 'advanced',
    title: {ru: 'VibeCinema', en: 'VibeCinema'},
    subtitle: {ru: 'Кинорайд на выносливость', en: 'Endurance Cinema Ride'},
    description: {ru: 'Длинный сет с устойчивым темпом.', en: 'Long-form set with sustainable pace'},
    isThematicDefault: true,
    shifts: ['evening']
  }
];

export const scheduleTrainerRules: TrainerCycleRule[] = [
  {trainerId: 't-yulia', shift: 'morning', cycleOffset: 0},
  {trainerId: 't-sofia', shift: 'morning', cycleOffset: 1},
  {trainerId: 't-alina', shift: 'morning', cycleOffset: 2},
  {trainerId: 't-marina', shift: 'evening', cycleOffset: 0},
  {trainerId: 't-arseny', shift: 'evening', cycleOffset: 1},
  {trainerId: 't-ilya', shift: 'evening', cycleOffset: 2}
];

export const defaultScheduleGenerationConfig = {
  hallId: DEFAULT_HALL_ID,
  startDate: '2026-02-09',
  days: 10,
  timezoneOffset: '+03:00',
  slotTimes: scheduleSlotTimes,
  capacity: 20,
  templates: scheduleTemplates,
  trainerRules: scheduleTrainerRules,
  closingTemplateId: 'vibe-cinema',
  eveningShiftStartsAt: '16:00',
  sessionIdPrefix: 's-',
  sessionStartSeq: 201
} as const;


