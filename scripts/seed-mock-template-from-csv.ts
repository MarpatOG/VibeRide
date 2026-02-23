import {PrismaClient} from '@prisma/client';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {scheduleTemplates} from '../lib/constants/schedule';
import {WORKOUT_TYPES} from '../lib/data/workout-types';

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

const prisma = new PrismaClient();
const CSV_PATH = process.env.SCHEDULE_CSV_PATH ?? 'mockschedule.csv';
const TEMPLATE_CODE = process.env.MOCK_TEMPLATE_CODE ?? 'default';
const TEMPLATE_NAME = process.env.MOCK_TEMPLATE_NAME ?? 'Default mock schedule';
const TEMPLATE_TZ_OFFSET = process.env.MOCK_TEMPLATE_TZ_OFFSET ?? '+03:00';
const TEMPLATE_CAPACITY = Number.parseInt(process.env.MOCK_TEMPLATE_CAPACITY ?? '20', 10);
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
    if (!workoutCode || !trainerName) {
      throw new Error(`Invalid required values at line ${lineIndex + 1}.`);
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
  const direct = trainerIdByName.get(normalizeName(trainerName));
  if (direct) return direct;
  const alias = MOJIBAKE_TRAINER_ALIASES.get(trainerName);
  if (!alias) return null;
  return trainerIdByName.get(normalizeName(alias)) ?? null;
}

async function main() {
  if (!Number.isInteger(TEMPLATE_CAPACITY) || TEMPLATE_CAPACITY < 1) {
    throw new Error(`MOCK_TEMPLATE_CAPACITY must be a positive integer. Got: ${process.env.MOCK_TEMPLATE_CAPACITY ?? 'undefined'}`);
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

  const workoutByCode = new Map(WORKOUT_TYPES.map((item) => [item.id.toLowerCase(), item] as const));
  const scheduleTemplateById = new Map(scheduleTemplates.map((item) => [item.id, item] as const));

  const normalizedRows = templateRows.map((row) => {
    const workoutType = workoutByCode.get(row.workoutCode);
    if (!workoutType) {
      throw new Error(`Unknown workout_code "${row.workoutCode}" for day ${row.day} and slot ${row.slotStart}.`);
    }

    const scheduleTemplate = scheduleTemplateById.get(workoutType.scheduleTemplateId);
    if (!scheduleTemplate) {
      throw new Error(`Missing schedule template "${workoutType.scheduleTemplateId}" for workout_code "${row.workoutCode}".`);
    }

    const trainerId = resolveTrainerId(row.trainerName, trainerIdByName);
    if (!trainerId) {
      throw new Error(`Trainer "${row.trainerName}" was not found in DB.`);
    }

    const description = row.description.trim();
    const isThematic = Boolean(row.themeType.trim() || row.themeTitle.trim() || description || scheduleTemplate.isThematicDefault);

    return {
      day: row.day,
      slotStart: row.slotStart,
      durationMin: row.durationMin,
      scheduleTemplateId: scheduleTemplate.id,
      trainerId,
      descriptionRu: description,
      descriptionEn: description,
      isThematic
    };
  });

  if (normalizedRows.length === 0) {
    throw new Error('No rows prepared for template import.');
  }

  await prisma.$transaction(async (transaction) => {
    const template = await transaction.mockScheduleTemplate.upsert({
      where: {code: TEMPLATE_CODE},
      create: {
        code: TEMPLATE_CODE,
        name: TEMPLATE_NAME,
        timezoneOffset: TEMPLATE_TZ_OFFSET,
        capacity: TEMPLATE_CAPACITY
      },
      update: {
        name: TEMPLATE_NAME,
        timezoneOffset: TEMPLATE_TZ_OFFSET,
        capacity: TEMPLATE_CAPACITY
      },
      select: {id: true}
    });

    await transaction.mockScheduleTemplateRow.deleteMany({
      where: {templateId: template.id}
    });

    await transaction.mockScheduleTemplateRow.createMany({
      data: normalizedRows.map((row) => ({
        templateId: template.id,
        day: row.day,
        slotStart: row.slotStart,
        durationMin: row.durationMin,
        scheduleTemplateId: row.scheduleTemplateId,
        trainerId: row.trainerId,
        descriptionRu: row.descriptionRu,
        descriptionEn: row.descriptionEn,
        isThematic: row.isThematic
      }))
    });
  });

  console.log(
    `Mock template "${TEMPLATE_CODE}" imported. Rows: ${normalizedRows.length}. Source: ${CSV_PATH}. Encoding: ${chosenEncoding}.`
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
