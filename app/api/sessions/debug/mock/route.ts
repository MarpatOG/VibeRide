import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {SessionLevel} from '@prisma/client';
import {getServerSession} from 'next-auth';
import {NextResponse} from 'next/server';
import {authOptions} from '@/lib/auth-options';
import {db} from '@/lib/db';
import {scheduleTemplates} from '@/lib/constants/schedule';
import {WORKOUT_TYPES} from '@/lib/data/workout-types';
import {DEFAULT_HALL_ID} from '@/lib/schedule/slot-rules';

export const runtime = 'nodejs';

const CSV_PATH = 'mockschedule.csv';
const DAYS_TO_APPEND = 10;
const DEFAULT_CAPACITY = 20;
const TIMEZONE_OFFSET = '+03:00';

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
    .replace(/\u0451/g, '\u0435');
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
  const shifted = new Date(Date.now() + totalOffsetMs);
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
  return trainerIdByName.get(normalizeName(trainerName)) ?? null;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }

  try {
    const trainers = await db.trainer.findMany({
      select: {id: true, name: true, lastName: true}
    });
    if (trainers.length === 0) {
      return NextResponse.json({ok: false, reason: 'trainers-not-found'}, {status: 409});
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
      return NextResponse.json({ok: false, reason: 'csv-parse-failed'}, {status: 400});
    }
    if (bestUnmatched > 0) {
      return NextResponse.json(
        {ok: false, reason: 'trainer-match-failed', message: `Unable to match ${bestUnmatched} trainer names from CSV.`},
        {status: 400}
      );
    }

    const templateDayNumbers = [...new Set(templateRows.map((row) => row.day))].sort((a, b) => a - b);
    if (templateDayNumbers.length === 0) {
      return NextResponse.json({ok: false, reason: 'csv-empty'}, {status: 400});
    }

    const templateRowsByDay = new Map<number, CsvRow[]>();
    for (const day of templateDayNumbers) {
      templateRowsByDay.set(
        day,
        templateRows.filter((row) => row.day === day)
      );
    }

    const workoutByCode = new Map(WORKOUT_TYPES.map((item) => [item.id.toLowerCase(), item] as const));
    const templateById = new Map(scheduleTemplates.map((item) => [item.id, item] as const));

    const latestSession = await db.session.findFirst({
      orderBy: {startsAt: 'desc'},
      select: {startsAt: true}
    });
    const startDateIso = latestSession
      ? addDays(latestSession.startsAt.slice(0, 10), 1)
      : getDateIsoInOffset(TIMEZONE_OFFSET);

    const runSuffix = Date.now().toString(36);
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

    for (let dayIndex = 0; dayIndex < DAYS_TO_APPEND; dayIndex += 1) {
      const dateIso = addDays(startDateIso, dayIndex);
      const templateDay = templateDayNumbers[dayIndex % templateDayNumbers.length];
      const rowsForDay = templateRowsByDay.get(templateDay) ?? [];

      for (let rowIndex = 0; rowIndex < rowsForDay.length; rowIndex += 1) {
        const row = rowsForDay[rowIndex];
        const workout = workoutByCode.get(row.workoutCode);
        if (!workout) {
          return NextResponse.json(
            {
              ok: false,
              reason: 'unknown-workout',
              message: `Unknown workout_code "${row.workoutCode}" in CSV day ${row.day}, slot ${row.slotStart}.`
            },
            {status: 400}
          );
        }

        const scheduleTemplate = templateById.get(workout.scheduleTemplateId);
        if (!scheduleTemplate) {
          return NextResponse.json(
            {ok: false, reason: 'schedule-template-not-found', message: `No template for workout "${row.workoutCode}".`},
            {status: 400}
          );
        }

        const trainerId = resolveTrainerId(row.trainerName, trainerIdByName);
        if (!trainerId) {
          return NextResponse.json(
            {ok: false, reason: 'trainer-not-found', message: `Trainer "${row.trainerName}" not found in DB.`},
            {status: 400}
          );
        }

        const csvDescription = row.description.trim();
        const isThematicFromCsv = Boolean(row.themeType.trim() || row.themeTitle.trim() || csvDescription);

        sessionsToCreate.push({
          id: `s-debug-${runSuffix}-${dayIndex + 1}-${rowIndex + 1}`,
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
          capacity: DEFAULT_CAPACITY,
          bookedCount: 0,
          level: scheduleTemplate.level as SessionLevel
        });
      }
    }

    if (sessionsToCreate.length === 0) {
      return NextResponse.json({ok: false, reason: 'csv-empty'}, {status: 400});
    }

    await db.$transaction(async (transaction) => {
      await transaction.hall.upsert({
        where: {id: DEFAULT_HALL_ID},
        create: {id: DEFAULT_HALL_ID, name: 'Main hall'},
        update: {}
      });
      await transaction.session.createMany({data: sessionsToCreate});
    });

    const endDateIso = addDays(startDateIso, DAYS_TO_APPEND - 1);
    return NextResponse.json({
      ok: true,
      addedDays: DAYS_TO_APPEND,
      addedSessions: sessionsToCreate.length,
      range: {startDate: startDateIso, endDate: endDateIso},
      encoding: chosenEncoding
    });
  } catch (error) {
    console.error('Unable to append mock schedule from CSV.', error);
    const message = error instanceof Error && error.message.trim() ? error.message : undefined;
    return NextResponse.json({ok: false, reason: 'internal-error', message}, {status: 500});
  }
}
