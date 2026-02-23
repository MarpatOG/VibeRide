import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {toMembershipPayload, toUserProfilePayload} from '@/lib/server/db-serializers';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  void request;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }
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
