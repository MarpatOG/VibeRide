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

function toDbSessionPatch(input: Partial<Session>) {
  return {
    hallId: typeof input.hallId === 'string' ? normalizeHallId(input.hallId) : undefined,
    startsAt: input.startsAt,
    durationMin: input.durationMin,
    titleRu: input.title?.ru,
    titleEn: input.title?.en,
    subtitleRu: input.subtitle?.ru,
    subtitleEn: input.subtitle?.en,
    descriptionRu: input.description?.ru,
    descriptionEn: input.description?.en,
    isThematic: typeof input.isThematic === 'boolean' ? input.isThematic : undefined,
    trainerId: typeof input.trainerId === 'string' ? (input.trainerId || null) : undefined,
    trainerDetached: typeof input.trainerDetached === 'boolean' ? input.trainerDetached : undefined,
    capacity: input.capacity,
    bookedCount: input.bookedCount,
    level: input.level
  };
}

export async function PATCH(request: NextRequest, context: {params: Promise<{sessionId: string}>}) {
  const {sessionId} = await context.params;
  const payload = (await request.json()) as Partial<Session>;
  const existing = await db.session.findUnique({
    where: {id: sessionId},
    select: {id: true, hallId: true, startsAt: true, durationMin: true}
  });

  if (!existing) {
    return NextResponse.json({error: 'NOT_FOUND', message: 'Session not found.'}, {status: 404});
  }

  const nextHallId = typeof payload.hallId === 'string' ? normalizeHallId(payload.hallId) : existing.hallId;
  const nextStartsAt = payload.startsAt ?? existing.startsAt;
  const nextDurationMin = payload.durationMin ?? existing.durationMin;

  const sameHallSessions = await db.session.findMany({
    where: {id: {not: sessionId}, hallId: nextHallId},
    select: {id: true, hallId: true, startsAt: true, durationMin: true}
  });

  const issue = findFirstHallSlotIssue([
    ...sameHallSessions,
    {id: existing.id, hallId: nextHallId, startsAt: nextStartsAt, durationMin: nextDurationMin}
  ]);

  if (issue) {
    const error = toSlotValidationHttpError(issue);
    return NextResponse.json(error.body, {status: error.status});
  }

  try {
    const updated = await db.session.update({
      where: {id: sessionId},
      data: toDbSessionPatch(payload)
    });
    return NextResponse.json(toSessionPayload(updated));
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

export async function DELETE(_request: NextRequest, context: {params: Promise<{sessionId: string}>}) {
  const {sessionId} = await context.params;
  await db.booking.deleteMany({where: {sessionId}});
  await db.session.delete({where: {id: sessionId}});
  return NextResponse.json({ok: true});
}
