import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {db} from '@/lib/db';
import {toSessionPayload} from '@/lib/server/db-serializers';
import {DEFAULT_HALL_ID, findFirstHallSlotIssue} from '@/lib/schedule/slot-rules';
import {toSlotValidationHttpError} from '@/lib/server/session-slot-validation';
import {Session} from '@/lib/types/session';

function normalizeHallId(hallId: string | null | undefined) {
  return hallId || DEFAULT_HALL_ID;
}

function normalizeSessionInput(input: Session): Session {
  return {
    ...input,
    hallId: normalizeHallId(input.hallId)
  };
}

function toDbSessionPayload(input: Session) {
  return {
    id: input.id,
    hallId: normalizeHallId(input.hallId),
    startsAt: input.startsAt,
    durationMin: input.durationMin,
    titleRu: input.title.ru,
    titleEn: input.title.en,
    subtitleRu: input.subtitle.ru,
    subtitleEn: input.subtitle.en,
    descriptionRu: input.description.ru,
    descriptionEn: input.description.en,
    isThematic: Boolean(input.isThematic),
    trainerId: input.trainerId || null,
    trainerDetached: Boolean(input.trainerDetached),
    capacity: input.capacity,
    bookedCount: input.bookedCount,
    level: input.level
  };
}

export async function GET() {
  const sessions = await db.session.findMany({orderBy: {startsAt: 'asc'}});
  return NextResponse.json(sessions.map((item) => toSessionPayload(item)));
}

export async function POST(request: NextRequest) {
  const payload = normalizeSessionInput((await request.json()) as Session);
  const existing = await db.session.findMany({
    where: {hallId: payload.hallId},
    select: {id: true, hallId: true, startsAt: true, durationMin: true}
  });
  const issue = findFirstHallSlotIssue([
    ...existing,
    {id: payload.id, hallId: payload.hallId, startsAt: payload.startsAt, durationMin: payload.durationMin}
  ]);

  if (issue) {
    const error = toSlotValidationHttpError(issue);
    return NextResponse.json(error.body, {status: error.status});
  }

  try {
    const created = await db.session.create({data: toDbSessionPayload(payload)});
    return NextResponse.json(toSessionPayload(created), {status: 201});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'SLOT_CONFLICT',
          message: 'A session already exists for this hall and start time.'
        },
        {status: 409}
      );
    }
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  const payload = ((await request.json()) as Session[]).map((item) => normalizeSessionInput(item));
  const issue = findFirstHallSlotIssue(payload);

  if (issue) {
    const error = toSlotValidationHttpError(issue);
    return NextResponse.json(error.body, {status: error.status});
  }

  try {
    await db.$transaction([
      db.booking.deleteMany({}),
      db.session.deleteMany({}),
      db.session.createMany({data: payload.map((item) => toDbSessionPayload(item))})
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'SLOT_CONFLICT',
          message: 'A session already exists for this hall and start time.'
        },
        {status: 409}
      );
    }
    throw error;
  }

  const sessions = await db.session.findMany({orderBy: {startsAt: 'asc'}});
  return NextResponse.json(sessions.map((item) => toSessionPayload(item)));
}
