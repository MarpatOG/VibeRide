import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {hashPassword} from '@/lib/server/password';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth-options';

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  role: 'client' | 'trainer' | 'admin';
  locale: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    lastName: user.lastName ?? undefined,
    role: user.role,
    locale: user.locale
  };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ok: false, reason: 'unauthorized'}, {status: 401});
  }
  const email = request.nextUrl.searchParams.get('email');
  if (email) {
    const user = await db.user.findUnique({
      where: {email},
      select: {id: true, email: true, name: true, lastName: true, role: true, locale: true}
    });
    if (!user) {
      return NextResponse.json({ok: false, reason: 'not-found'}, {status: 404});
    }
    return NextResponse.json(toPublicUser(user));
  }
  const users = await db.user.findMany({
    orderBy: {createdAt: 'asc'},
    select: {id: true, email: true, name: true, lastName: true, role: true, locale: true}
  });
  return NextResponse.json(users.map((user) => toPublicUser(user)));
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';
  const payload = (await request.json()) as {
    email: string;
    name: string;
    lastName?: string;
    password?: string;
    role?: 'client' | 'trainer' | 'admin';
    locale?: string;
  };
  const email = payload.email.trim().toLowerCase();
  const name = payload.name.trim();
  const lastName = (payload.lastName ?? '').trim();
  if (!email || !name) {
    return NextResponse.json({ok: false, reason: 'invalid-payload'}, {status: 400});
  }
  if (!payload.password || payload.password.length < 6) {
    return NextResponse.json({ok: false, reason: 'weak-password'}, {status: 400});
  }
  const requestedRole = payload.role ?? 'client';
  if (requestedRole !== 'client' && !isAdmin) {
    return NextResponse.json({ok: false, reason: 'forbidden-role'}, {status: 403});
  }
  const existing = await db.user.findUnique({where: {email}});
  if (existing) {
    return NextResponse.json({ok: false, reason: 'email-exists'}, {status: 409});
  }
  const id = `u-${email.replace(/[^a-z0-9]+/g, '-')}`;
  const created = await db.user.create({
    data: {
      id,
      email,
      name,
      lastName: lastName || null,
      passwordHash: hashPassword(payload.password),
      role: requestedRole,
      locale: payload.locale ?? 'ru'
    }
  });
  return NextResponse.json(
    toPublicUser({
      id: created.id,
      email: created.email,
      name: created.name,
      lastName: created.lastName,
      role: created.role,
      locale: created.locale
    }),
    {status: 201}
  );
}
