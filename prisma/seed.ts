import {PrismaClient, SessionLevel} from '@prisma/client';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {type ScheduleTemplate} from '../lib/schedule/generator';
import {DEFAULT_HALL_ID} from '../lib/schedule/slot-rules';
import {WORKOUT_TYPES} from '../lib/data/workout-types';

const prisma = new PrismaClient();
const CSV_PATH = 'mockschedule.csv';
const DAYS = 10;
const CAPACITY = 20;
const TIMEZONE_OFFSET = '+03:00';
const SESSION_ID_PREFIX = 's-';
const SESSION_START_SEQ = 201;

const trainersSeed = [
  {
    id: 't-ilya',
    name: 'Игорь',
    lastName: 'Гареев',
    photoUrl: '/images/trainers/trainer1.png',
    tagsJson: ['Спринт', 'Сила', 'Результат'],
    bioRu: 'Ведет интенсивные тренировки с акцентом на спринт и работу по мощности.',
    bioEn: 'Leads high-intensity rides focused on sprint execution and power output.'
  },
  {
    id: 't-yulia',
    name: 'Юля',
    lastName: 'Смирнова',
    photoUrl: '/images/trainers/trainer2.png',
    tagsJson: ['Ритм', 'Новички', 'Техника'],
    bioRu: 'Собирает занятие вокруг ритма и техники. Дает понятный вход и уверенный прогресс.',
    bioEn: 'Builds classes around rhythm and clean technique with a clear path for progress.'
  },
  {
    id: 't-alina',
    name: 'Алина',
    lastName: 'Ковалева',
    photoUrl: '/images/trainers/trainer3.png',
    tagsJson: ['Выносливость', 'Темп', 'Грув'],
    bioRu: 'Специалист по выносливости и длинным темповым отрезкам. Любит контроль пульса и аккуратную технику.',
    bioEn: 'Endurance specialist with long tempo blocks, heart-rate control and precision riding.'
  },
  {
    id: 't-marina',
    name: 'Марина',
    lastName: 'Лебедева',
    photoUrl: '/images/trainers/trainer4.png',
    tagsJson: ['Сила', 'HIIT', 'Результат'],
    bioRu: 'Силовые интервалы, высокая интенсивность и дисциплина в каждом сете.',
    bioEn: 'Power intervals, high intensity and strict structure in every set.'
  },
  {
    id: 't-sofia',
    name: 'Кристина',
    lastName: 'Лилова',
    photoUrl: '/images/trainers/trainer5.png',
    tagsJson: ['Ритм', 'Выносливость', 'Поток'],
    bioRu: 'Миксует ритм и темповую выносливость, помогает держать технику на длинных отрезках.',
    bioEn: 'Blends rhythm and tempo endurance while keeping technique clean over longer sets.'
  },
  {
    id: 't-arseny',
    name: 'Андрей',
    lastName: 'Титов',
    photoUrl: '/images/trainers/trainer6.png',
    tagsJson: ['Сила', 'Спринт', 'Мощность'],
    bioRu: 'Ставит акцент на силовую работу, короткие ускорения и точный контроль нагрузки.',
    bioEn: 'Focuses on strength blocks, short accelerations and precise load control.'
  }
];

const scheduleTemplates: ScheduleTemplate<{ru: string; en: string}>[] = [
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

const hallsSeed = [{id: DEFAULT_HALL_ID, name: 'Основной зал'}];

type CsvRow = {
  day: number;
  slotStart: string;
  durationMin: number;
  workoutCode: string;
  trainerName: string;
  themeType: string;
  themeTitle: string;
  description: string;
};

function normalizeName(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е');
}

function addDays(dateIso: string, days: number) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const next = new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + days));
  return next.toISOString().slice(0, 10);
}

function getDateIsoInOffset(offset: string) {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  if (!match) {
    throw new Error(`Invalid TZ offset: "${offset}". Expected format "+03:00".`);
  }
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3], 10);
  const totalOffsetMs = sign * (hours * 60 + minutes) * 60_000;
  const utcNowMs = Date.now();
  const shifted = new Date(utcNowMs + totalOffsetMs);
  return shifted.toISOString().slice(0, 10);
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, '').trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV is empty.');
  }

  const headers = parseCsvLine(lines[0]);
  const required = ['day', 'slot_start', 'duration_min', 'workout_code', 'trainer'];
  for (const key of required) {
    if (!headers.includes(key)) {
      throw new Error(`CSV is missing required column: "${key}".`);
    }
  }

  const indexOf = (key: string) => headers.indexOf(key);
  const readCell = (row: string[], key: string) => {
    const index = indexOf(key);
    if (index < 0) return '';
    return row[index] ?? '';
  };

  const rows: CsvRow[] = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const raw = parseCsvLine(lines[lineIndex]);
    const day = Number.parseInt(readCell(raw, 'day'), 10);
    const slotStart = readCell(raw, 'slot_start');
    const durationMin = Number.parseInt(readCell(raw, 'duration_min'), 10);
    const workoutCode = readCell(raw, 'workout_code').toLowerCase();
    const trainerName = readCell(raw, 'trainer');
    const theme = readCell(raw, 'theme');
    const themeType = readCell(raw, 'theme_type') || (theme ? 'theme' : '');
    const themeTitle = readCell(raw, 'theme_title') || theme;
    const description = readCell(raw, 'description') || themeTitle;

    if (!Number.isInteger(day) || day < 1) {
      throw new Error(`Invalid day value at line ${lineIndex + 1}.`);
    }
    if (!/^\d{2}:\d{2}$/.test(slotStart)) {
      throw new Error(`Invalid slot_start at line ${lineIndex + 1}.`);
    }
    if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 120) {
      throw new Error(`Invalid duration_min at line ${lineIndex + 1}.`);
    }
    if (!workoutCode) {
      throw new Error(`Empty workout_code at line ${lineIndex + 1}.`);
    }
    if (!trainerName) {
      throw new Error(`Empty trainer at line ${lineIndex + 1}.`);
    }

    rows.push({
      day,
      slotStart,
      durationMin,
      workoutCode,
      trainerName,
      themeType,
      themeTitle,
      description
    });
  }

  rows.sort((a, b) => a.day - b.day || a.slotStart.localeCompare(b.slotStart));
  return rows;
}

function resolveTrainerId(trainerName: string, trainerIdByName: Map<string, string>) {
  return trainerIdByName.get(normalizeName(trainerName)) ?? null;
}

async function main() {
  const csvBuffer = await readFile(resolve(process.cwd(), CSV_PATH));
  const templateRows = parseCsv(new TextDecoder('utf-8').decode(csvBuffer));
  const templateDayNumbers = [...new Set(templateRows.map((row) => row.day))].sort((a, b) => a - b);

  if (templateDayNumbers.length === 0) {
    throw new Error('No template rows found in CSV.');
  }

  const workoutByCode = new Map(WORKOUT_TYPES.map((item) => [item.id.toLowerCase(), item] as const));
  const templateById = new Map(scheduleTemplates.map((item) => [item.id, item] as const));
  const trainerIdByName = new Map<string, string>();
  const startDateIso = getDateIsoInOffset(TIMEZONE_OFFSET);

  for (const trainer of trainersSeed) {
    const direct = normalizeName(`${trainer.name} ${trainer.lastName}`);
    const reverse = normalizeName(`${trainer.lastName} ${trainer.name}`);
    trainerIdByName.set(direct, trainer.id);
    trainerIdByName.set(reverse, trainer.id);
  }

  let sequence = SESSION_START_SEQ;
  const sessionsToCreate: Array<{
    id: string;
    hallId: string;
    startsAt: string;
    durationMin: number;
    titleRu: string;
    titleEn: string;
    subtitleRu: string;
    subtitleEn: string;
    descriptionRu: string;
    descriptionEn: string;
    isThematic: boolean;
    trainerId: string;
    trainerDetached: boolean;
    capacity: number;
    bookedCount: number;
    level: SessionLevel;
  }> = [];

  for (let dayIndex = 0; dayIndex < DAYS; dayIndex += 1) {
    const dateIso = addDays(startDateIso, dayIndex);
    const templateDay = templateDayNumbers[dayIndex % templateDayNumbers.length];
    const rowsForDay = templateRows.filter((row) => row.day === templateDay);

    for (const row of rowsForDay) {
      const workout = workoutByCode.get(row.workoutCode);
      if (!workout) {
        throw new Error(`Unknown workout_code "${row.workoutCode}" in CSV day ${row.day}, slot ${row.slotStart}.`);
      }

      const scheduleTemplate = templateById.get(workout.scheduleTemplateId);
      if (!scheduleTemplate) {
        throw new Error(`No schedule template for workout_code "${row.workoutCode}".`);
      }

      const trainerId = resolveTrainerId(row.trainerName, trainerIdByName);
      if (!trainerId) {
        throw new Error(`Trainer "${row.trainerName}" not found in seed trainers.`);
      }

      const csvDescription = row.description.trim();
      const isThematicFromCsv = Boolean(row.themeType.trim() || row.themeTitle.trim() || csvDescription);

      sessionsToCreate.push({
        id: `${SESSION_ID_PREFIX}${sequence++}`,
        hallId: DEFAULT_HALL_ID,
        startsAt: `${dateIso}T${row.slotStart}:00${TIMEZONE_OFFSET}`,
        durationMin: row.durationMin,
        titleRu: scheduleTemplate.title.ru,
        titleEn: scheduleTemplate.title.en,
        subtitleRu: scheduleTemplate.subtitle.ru,
        subtitleEn: scheduleTemplate.subtitle.en,
        descriptionRu: csvDescription,
        descriptionEn: csvDescription,
        isThematic: isThematicFromCsv || Boolean(scheduleTemplate.isThematicDefault),
        trainerId,
        trainerDetached: false,
        capacity: CAPACITY,
        bookedCount: 0,
        level: scheduleTemplate.level
      });
    }
  }

  await prisma.$transaction([
    prisma.historyEvent.deleteMany({}),
    prisma.booking.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.hall.deleteMany({}),
    prisma.membership.deleteMany({}),
    prisma.trainer.deleteMany({}),
    prisma.user.deleteMany({})
  ]);

  await prisma.user.createMany({
    data: [
      {id: 'u-admin', email: 'admin@viberide.demo', name: 'Demo', lastName: 'Admin', role: 'admin', locale: 'ru'},
      {id: 'u-trainer', email: 'trainer@viberide.demo', name: 'Demo', lastName: 'Trainer', role: 'trainer', locale: 'ru'},
      {id: 'u-client', email: 'oleg@viberide.demo', name: 'Oleg', lastName: 'Sokolov', role: 'client', locale: 'ru'}
    ]
  });

  await prisma.trainer.createMany({data: trainersSeed});
  await prisma.hall.createMany({data: hallsSeed});

  await prisma.session.createMany({data: sessionsToCreate});

  await prisma.membership.create({
    data: {
      id: 'm-u-client',
      userId: 'u-client',
      remainingSessions: 6,
      validUntil: '2026-03-15',
      active: true
    }
  });

  await prisma.booking.createMany({
    data: [
      {
        id: 'b-u-client-s201',
        userId: 'u-client',
        sessionId: 's-201',
        bikeNumber: 7,
        status: 'booked',
        bookedAt: '2026-02-15T20:00:00+03:00'
      },
      {
        id: 'b-u-client-s202',
        userId: 'u-client',
        sessionId: 's-202',
        bikeNumber: 11,
        status: 'booked',
        bookedAt: '2026-02-15T20:05:00+03:00'
      }
    ],
    skipDuplicates: true
  });

  await prisma.historyEvent.createMany({
    data: [
      {
        id: 'event-1',
        userId: 'u-client',
        type: 'completed',
        occurredAt: '2026-02-07T12:10:00+03:00',
        titleRu: 'Посещение Base Tempo',
        titleEn: 'Base Tempo attended',
        noteRu: 'Тренер: Нина Ковалева',
        noteEn: 'Trainer: Nina Kovaleva'
      },
      {
        id: 'event-2',
        userId: 'u-client',
        type: 'session_debited',
        occurredAt: '2026-02-07T12:11:00+03:00',
        titleRu: 'Списано 1 занятие с абонемента',
        titleEn: '1 session deducted from membership'
      },
      {
        id: 'event-3',
        userId: 'u-client',
        type: 'canceled',
        occurredAt: '2026-01-29T14:00:00+03:00',
        titleRu: 'Отмена Night Sprint',
        titleEn: 'Night Sprint canceled'
      }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
