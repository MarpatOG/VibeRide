import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {toLocalizedHistoryPayload} from '@/lib/server/db-serializers';
import {DEMO_CLIENT_USER_ID} from '@/lib/server/constants';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') ?? DEMO_CLIENT_USER_ID;
  const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ru';
  const events = await db.historyEvent.findMany({
    where: {userId},
    orderBy: {occurredAt: 'desc'}
  });
  return NextResponse.json(events.map((item) => toLocalizedHistoryPayload(item, locale)));
}
