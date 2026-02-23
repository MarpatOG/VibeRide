import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {toLocalizedHistoryPayload} from '@/lib/server/db-serializers';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }
  const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ru';
  const events = await db.historyEvent.findMany({
    where: {userId},
    orderBy: {occurredAt: 'desc'}
  });
  return NextResponse.json(events.map((item) => toLocalizedHistoryPayload(item, locale)));
}
