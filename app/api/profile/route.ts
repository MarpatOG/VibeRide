import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {toMembershipPayload, toUserProfilePayload} from '@/lib/server/db-serializers';
import {DEMO_CLIENT_USER_ID} from '@/lib/server/constants';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') ?? DEMO_CLIENT_USER_ID;
  const [user, membership] = await Promise.all([
    db.user.findUnique({where: {id: userId}}),
    db.membership.findFirst({where: {userId}, orderBy: {createdAt: 'desc'}})
  ]);

  if (!user) {
    return NextResponse.json({ok: false, reason: 'user-not-found'}, {status: 404});
  }

  return NextResponse.json({
    profile: toUserProfilePayload(user),
    membership: toMembershipPayload(membership)
  });
}
