import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {CANCEL_WINDOW_MINUTES_BEFORE_START} from '@/lib/constants/booking';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth-options';

async function resolveSessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function createHistoryEventId() {
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveCancelDeadlineMs(startsAt: string) {
  const startsAtMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) return null;
  return startsAtMs - CANCEL_WINDOW_MINUTES_BEFORE_START * 60_000;
}

export async function GET(request: NextRequest) {
  void request;
  const userId = await resolveSessionUserId();
  if (!userId) {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }
  const bookings = await db.booking.findMany({
    where: {userId, status: 'booked'},
    orderBy: {bookedAt: 'desc'}
  });
  return NextResponse.json(
    bookings.map((item) => ({
      sessionId: item.sessionId,
      bookedAt: item.bookedAt,
      bikeNumber: item.bikeNumber ?? undefined
    }))
  );
}

export async function POST(request: NextRequest) {
  const userId = await resolveSessionUserId();
  if (!userId) {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }

  const payload = (await request.json()) as {sessionId: string; bikeNumber?: number};
  if (!payload.sessionId) {
    return NextResponse.json({ok: false, reason: 'session-id-required'}, {status: 400});
  }

  const session = await db.session.findUnique({where: {id: payload.sessionId}});
  if (!session) {
    return NextResponse.json({ok: false, reason: 'session-not-found'}, {status: 404});
  }

  const nowMs = Date.now();
  const startsAtMs = new Date(session.startsAt).getTime();
  if (Number.isFinite(startsAtMs) && startsAtMs <= nowMs) {
    return NextResponse.json({ok: false, reason: 'session-started'}, {status: 409});
  }

  const existing = await db.booking.findUnique({
    where: {
      userId_sessionId: {
        userId,
        sessionId: payload.sessionId
      }
    }
  });

  if (existing && existing.status === 'booked') {
    return NextResponse.json({ok: false, reason: 'already-booked'}, {status: 409});
  }

  const now = new Date().toISOString();

  const bookingResult = await db.$transaction(async (transaction) => {
    const membership = await transaction.membership.findFirst({
      where: {userId},
      orderBy: {createdAt: 'desc'}
    });

    if (!membership || !membership.active || membership.remainingSessions < 1) {
      return {ok: false as const, reason: 'no-membership-credits' as const};
    }

    const nextRemainingSessions = membership.remainingSessions - 1;
    await transaction.membership.update({
      where: {id: membership.id},
      data: {
        remainingSessions: nextRemainingSessions,
        active: nextRemainingSessions > 0
      }
    });

    const booking = existing
      ? await transaction.booking.update({
          where: {id: existing.id},
          data: {
            status: 'booked',
            bookedAt: now,
            bikeNumber: payload.bikeNumber ?? existing.bikeNumber ?? null,
            canceledAt: null
          }
        })
      : await transaction.booking.create({
          data: {
            id: `b-${userId}-${payload.sessionId}`,
            userId,
            sessionId: payload.sessionId,
            bikeNumber: payload.bikeNumber ?? null,
            status: 'booked',
            bookedAt: now
          }
        });

    await transaction.historyEvent.create({
      data: {
        id: createHistoryEventId(),
        userId,
        type: 'session_debited',
        occurredAt: now,
        titleRu: 'Списание тренировки',
        titleEn: 'Session debit',
        noteRu: `Запись на занятие. Остаток тренировок: ${nextRemainingSessions}.`,
        noteEn: `Booked a session. Remaining sessions: ${nextRemainingSessions}.`,
        metaJson: {
          bookingId: booking.id,
          sessionId: payload.sessionId,
          remainingSessions: nextRemainingSessions
        }
      }
    });

    return {
      ok: true as const,
      booking,
      remainingSessions: nextRemainingSessions
    };
  });

  if (!bookingResult.ok) {
    return NextResponse.json({ok: false, reason: bookingResult.reason}, {status: 409});
  }

  const cancelDeadlineMs = resolveCancelDeadlineMs(session.startsAt);
  const responseBody = {
    sessionId: bookingResult.booking.sessionId,
    bookedAt: bookingResult.booking.bookedAt,
    bikeNumber: bookingResult.booking.bikeNumber ?? undefined,
    remainingSessions: bookingResult.remainingSessions,
    cancelDeadlineAt: cancelDeadlineMs ? new Date(cancelDeadlineMs).toISOString() : undefined
  };

  return NextResponse.json(responseBody, {status: existing ? 200 : 201});
}

export async function DELETE(request: NextRequest) {
  const userId = await resolveSessionUserId();
  if (!userId) {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ok: false, reason: 'sessionId-required'}, {status: 400});
  }
  const existing = await db.booking.findUnique({
    where: {
      userId_sessionId: {
        userId,
        sessionId
      }
    }
  });
  if (!existing || existing.status !== 'booked') {
    return NextResponse.json({ok: false, reason: 'not-found'}, {status: 404});
  }

  const session = await db.session.findUnique({where: {id: sessionId}});
  if (!session) {
    return NextResponse.json({ok: false, reason: 'session-not-found'}, {status: 404});
  }

  const now = new Date();
  const nowMs = now.getTime();
  const cancelDeadlineMs = resolveCancelDeadlineMs(session.startsAt);
  const refundable = Number.isFinite(cancelDeadlineMs) ? nowMs <= (cancelDeadlineMs as number) : false;
  const nowIso = now.toISOString();

  const result = await db.$transaction(async (transaction) => {
    await transaction.booking.update({
      where: {id: existing.id},
      data: {status: 'canceled', canceledAt: nowIso}
    });

    if (!refundable) {
      await transaction.historyEvent.create({
        data: {
          id: createHistoryEventId(),
          userId,
          type: 'canceled',
          occurredAt: nowIso,
          titleRu: 'Поздняя отмена',
          titleEn: 'Late cancellation',
          noteRu: 'Тренировка сгорела: отмена позднее дедлайна 23:59 до старта.',
          noteEn: 'Session burned: cancellation was after 23:59 cutoff before start.',
          metaJson: {sessionId, refundable: false}
        }
      });
      return {remainingSessions: null as number | null};
    }

    const membership = await transaction.membership.findFirst({
      where: {userId},
      orderBy: {createdAt: 'desc'}
    });

    if (!membership) {
      return {remainingSessions: null as number | null};
    }

    const updatedMembership = await transaction.membership.update({
      where: {id: membership.id},
      data: {
        remainingSessions: membership.remainingSessions + 1,
        active: true
      }
    });

    await transaction.historyEvent.create({
      data: {
        id: createHistoryEventId(),
        userId,
        type: 'membership_update',
        occurredAt: nowIso,
        titleRu: 'Возврат тренировки',
        titleEn: 'Session refund',
        noteRu: `Отмена до дедлайна 23:59. Остаток тренировок: ${updatedMembership.remainingSessions}.`,
        noteEn: `Canceled before 23:59 cutoff. Remaining sessions: ${updatedMembership.remainingSessions}.`,
        metaJson: {sessionId, refundable: true, remainingSessions: updatedMembership.remainingSessions}
      }
    });

    return {remainingSessions: updatedMembership.remainingSessions as number | null};
  });

  return NextResponse.json({
    ok: true,
    refunded: refundable,
    remainingSessions: result.remainingSessions,
    cancelDeadlineAt: cancelDeadlineMs ? new Date(cancelDeadlineMs).toISOString() : undefined
  });
}
