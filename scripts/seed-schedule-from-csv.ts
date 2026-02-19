import {PrismaClient, SessionLevel} from '@prisma/client';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {DEFAULT_HALL_ID} from '../lib/schedule/slot-rules';
import {WORKOUT_TYPES} from '../lib/data/workout-types';
import {defaultScheduleGenerationConfig, scheduleTemplates} from '../lib/constants/schedule';

type CsvRow = {
  day: number;
  slotStart: string;
  durationMin: number;
  workoutCode: string;
  trainerName: string;
  themeType: string;
  themeTitle: string;
  theme: string;
  description: string;
};

const prisma = new PrismaClient();
const CSV_PATH = process.env.SCHEDULE_CSV_PATH ?? 'mockschedule.csv';
const DAYS = Number.parseInt(process.env.DAYS ?? '10', 10);
const CAPACITY = Number.parseInt(process.env.CAPACITY ?? `${defaultScheduleGenerationConfig.capacity}`, 10);
const TIMEZONE_OFFSET = process.env.TZ_OFFSET ?? defaultScheduleGenerationConfig.timezoneOffset;
const SESSION_ID_PREFIX = process.env.SESSION_ID_PREFIX ?? defaultScheduleGenerationConfig.sessionIdPrefix;
const SESSION_START_SEQ = Number.parseInt(
  process.env.SESSION_START_SEQ ?? `${defaultScheduleGenerationConfig.sessionStartSeq}`,
  10
);
const MOJIBAKE_TRAINER_ALIASES = new Map<string, string>([
  ['Р®Р»СЏ РЎРјРёСЂРЅРѕРІР°', 'Юля Смирнова'],
  ['РљСЂРёСЃС‚РёРЅР° Р›РёР»РѕРІР°', 'Кристина Лилова'],
  ['РђР»РёРЅР° РљРѕРІР°Р»РµРІР°', 'Алина Ковалева'],
  ['РђРЅРґСЂРµР№ РўРёС‚РѕРІ', 'Андрей Титов'],
  ['РњР°СЂРёРЅР° Р›РµР±РµРґРµРІР°', 'Марина Лебедева'],
  ['РРіРѕСЂСЊ Р“Р°СЂРµРµРІ', 'Игорь Гареев']
]);

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
      theme,
      description
    });
  }

  rows.sort((a, b) => a.day - b.day || a.slotStart.localeCompare(b.slotStart));
  return rows;
}

function resolveTrainerId(trainerName: string, trainerIdByName: Map<string, string>) {
  const direct = trainerIdByName.get(normalizeName(trainerName));
  if (direct) return direct;

  const alias = MOJIBAKE_TRAINER_ALIASES.get(trainerName);
  if (!alias) return null;
  return trainerIdByName.get(normalizeName(alias)) ?? null;
}

async function main() {
  if (!Number.isInteger(DAYS) || DAYS < 1) {
    throw new Error(`DAYS must be a positive integer. Got: ${process.env.DAYS ?? 'undefined'}`);
  }
  if (!Number.isInteger(CAPACITY) || CAPACITY < 1) {
    throw new Error(`CAPACITY must be a positive integer. Got: ${process.env.CAPACITY ?? 'undefined'}`);
  }

  const trainers = await prisma.trainer.findMany({
    select: {id: true, name: true, lastName: true}
  });
  if (trainers.length === 0) {
    throw new Error('No trainers found in DB. Seed trainers first (npm run db:seed).');
  }

  const trainerIdByName = new Map<string, string>();
  for (const trainer of trainers) {
    const direct = normalizeName(`${trainer.name} ${trainer.lastName}`);
    const reverse = normalizeName(`${trainer.lastName} ${trainer.name}`);
    trainerIdByName.set(direct, trainer.id);
    trainerIdByName.set(reverse, trainer.id);
  }

  const csvBuffer = await readFile(resolve(process.cwd(), CSV_PATH));
  const decodeCandidates: Array<{name: string; value: string}> = [
    {name: 'utf-8', value: new TextDecoder('utf-8').decode(csvBuffer)},
    {name: 'windows-1251', value: new TextDecoder('windows-1251').decode(csvBuffer)}
  ];

  let templateRows: CsvRow[] | null = null;
  let chosenEncoding = '';
  let bestUnmatched = Number.POSITIVE_INFINITY;

  for (const candidate of decodeCandidates) {
    try {
      const parsed = parseCsv(candidate.value);
      let unmatched = 0;
      for (const row of parsed) {
        if (!resolveTrainerId(row.trainerName, trainerIdByName)) {
          unmatched += 1;
        }
      }

      if (unmatched < bestUnmatched) {
        bestUnmatched = unmatched;
        templateRows = parsed;
        chosenEncoding = candidate.name;
      }
      if (unmatched === 0) break;
    } catch {
      // Try next decoding candidate.
    }
  }

  if (!templateRows) {
    throw new Error(`Unable to parse ${CSV_PATH}.`);
  }
  if (bestUnmatched > 0) {
    throw new Error(`Unable to match ${bestUnmatched} trainer names from ${CSV_PATH}.`);
  }

  const templateDayNumbers = [...new Set(templateRows.map((row) => row.day))].sort((a, b) => a - b);
  if (templateDayNumbers.length === 0) {
    throw new Error('No template rows found in CSV.');
  }

  const workoutByCode = new Map(WORKOUT_TYPES.map((item) => [item.id.toLowerCase(), item] as const));
  const templateById = new Map(scheduleTemplates.map((item) => [item.id, item] as const));

  const startDateIso = getDateIsoInOffset(TIMEZONE_OFFSET);
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
        throw new Error(`Trainer "${row.trainerName}" not found in DB.`);
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

  await prisma.$transaction(async (tx) => {
    await tx.hall.upsert({
      where: {id: DEFAULT_HALL_ID},
      create: {id: DEFAULT_HALL_ID, name: 'Main hall'},
      update: {}
    });
    await tx.booking.deleteMany({});
    await tx.session.deleteMany({});
    await tx.session.createMany({data: sessionsToCreate});
  });

  console.log(
    `Seeded ${sessionsToCreate.length} sessions from ${CSV_PATH}. Start date: ${startDateIso}. Days: ${DAYS}. Encoding: ${chosenEncoding}.`
  );
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
