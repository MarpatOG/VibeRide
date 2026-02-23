import {SessionLevel} from '@prisma/client';
import {getServerSession} from 'next-auth';
import {NextResponse} from 'next/server';
import {authOptions} from '@/lib/auth-options';
import {db} from '@/lib/db';
import {scheduleTemplates} from '@/lib/constants/schedule';
import {DEFAULT_HALL_ID} from '@/lib/schedule/slot-rules';

export const runtime = 'nodejs';

const DEFAULT_TEMPLATE_CODE = 'default';
const DAYS_TO_APPEND = 10;
const FALLBACK_CAPACITY = 20;

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

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }

  try {
    const template = await db.mockScheduleTemplate.findUnique({
      where: {code: DEFAULT_TEMPLATE_CODE},
      include: {
        rows: {
          orderBy: [{day: 'asc'}, {slotStart: 'asc'}]
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'template-not-configured',
          message: `Mock template \"${DEFAULT_TEMPLATE_CODE}\" is not configured. Run: npm run db:seed:mock-template`
        },
        {status: 409}
      );
    }

    if (template.rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'template-empty',
          message: `Mock template \"${template.code}\" has no rows.`
        },
        {status: 409}
      );
    }

    const templateById = new Map(scheduleTemplates.map((item) => [item.id, item] as const));

    for (const row of template.rows) {
      if (!/^\d{2}:\d{2}$/.test(row.slotStart)) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'template-invalid-time',
            message: `Invalid slotStart \"${row.slotStart}\" in template row ${row.id}.`
          },
          {status: 400}
        );
      }
      if (!Number.isInteger(row.day) || row.day < 1) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'template-invalid-day',
            message: `Invalid day \"${row.day}\" in template row ${row.id}.`
          },
          {status: 400}
        );
      }
      if (!Number.isInteger(row.durationMin) || row.durationMin < 1 || row.durationMin > 120) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'template-invalid-duration',
            message: `Invalid duration \"${row.durationMin}\" in template row ${row.id}.`
          },
          {status: 400}
        );
      }
      if (!templateById.has(row.scheduleTemplateId)) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'template-unknown-schedule-template',
            message: `Unknown scheduleTemplateId \"${row.scheduleTemplateId}\" in template row ${row.id}.`
          },
          {status: 400}
        );
      }
    }

    const templateDayNumbers = [...new Set(template.rows.map((row) => row.day))].sort((a, b) => a - b);
    const templateRowsByDay = new Map<number, typeof template.rows>();
    for (const day of templateDayNumbers) {
      templateRowsByDay.set(
        day,
        template.rows.filter((row) => row.day === day)
      );
    }

    const latestSession = await db.session.findFirst({
      orderBy: {startsAt: 'desc'},
      select: {startsAt: true}
    });

    const startDateIso = latestSession
      ? addDays(latestSession.startsAt.slice(0, 10), 1)
      : getDateIsoInOffset(template.timezoneOffset);

    const runSuffix = Date.now().toString(36);
    const capacity = template.capacity > 0 ? template.capacity : FALLBACK_CAPACITY;

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
        const scheduleTemplate = templateById.get(row.scheduleTemplateId);
        if (!scheduleTemplate) {
          return NextResponse.json(
            {
              ok: false,
              reason: 'template-unknown-schedule-template',
              message: `Unknown scheduleTemplateId \"${row.scheduleTemplateId}\" in template row ${row.id}.`
            },
            {status: 400}
          );
        }

        const descriptionRu = row.descriptionRu.trim();
        const descriptionEn = (row.descriptionEn || row.descriptionRu).trim();

        sessionsToCreate.push({
          id: `s-debug-${runSuffix}-${dayIndex + 1}-${rowIndex + 1}`,
          hallId: DEFAULT_HALL_ID,
          startsAt: `${dateIso}T${row.slotStart}:00${template.timezoneOffset}`,
          durationMin: row.durationMin,
          titleRu: scheduleTemplate.title.ru,
          titleEn: scheduleTemplate.title.en,
          subtitleRu: scheduleTemplate.subtitle.ru,
          subtitleEn: scheduleTemplate.subtitle.en,
          descriptionRu,
          descriptionEn,
          isThematic: row.isThematic || Boolean(scheduleTemplate.isThematicDefault),
          trainerId: row.trainerId,
          trainerDetached: false,
          capacity,
          bookedCount: 0,
          level: scheduleTemplate.level as SessionLevel
        });
      }
    }

    if (sessionsToCreate.length === 0) {
      return NextResponse.json({ok: false, reason: 'template-empty'}, {status: 400});
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
      template: {code: template.code, timezoneOffset: template.timezoneOffset, capacity}
    });
  } catch (error) {
    console.error('Unable to append mock schedule from DB template.', error);
    const message = error instanceof Error && error.message.trim() ? error.message : undefined;
    return NextResponse.json({ok: false, reason: 'internal-error', message}, {status: 500});
  }
}
