import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {DEMO_CLIENT_USER_ID} from '@/lib/server/constants';

function resolveUserId(request: NextRequest) {
  return request.nextUrl.searchParams.get('userId') ?? DEMO_CLIENT_USER_ID;
}

export async function GET(request: NextRequest) {
  const userId = resolveUserId(request);
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
  const payload = (await request.json()) as {sessionId: string; bikeNumber?: number; userId?: string};
  const userId = payload.userId ?? DEMO_CLIENT_USER_ID;
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
  if (existing) {
    const updated = await db.booking.update({
      where: {id: existing.id},
      data: {
        status: 'booked',
        bookedAt: now,
        bikeNumber: payload.bikeNumber ?? existing.bikeNumber ?? null,
        canceledAt: null
      }
    });
    return NextResponse.json({
      sessionId: updated.sessionId,
      bookedAt: updated.bookedAt,
      bikeNumber: updated.bikeNumber ?? undefined
    });
  }

  const created = await db.booking.create({
    data: {
      id: `b-${userId}-${payload.sessionId}`,
      userId,
      sessionId: payload.sessionId,
      bikeNumber: payload.bikeNumber ?? null,
      status: 'booked',
      bookedAt: now
    }
  });
  return NextResponse.json(
    {sessionId: created.sessionId, bookedAt: created.bookedAt, bikeNumber: created.bikeNumber ?? undefined},
    {status: 201}
  );
}

export async function DELETE(request: NextRequest) {
  const userId = resolveUserId(request);
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
  await db.booking.update({
    where: {id: existing.id},
    data: {status: 'canceled', canceledAt: new Date().toISOString()}
  });
  return NextResponse.json({ok: true});
}
