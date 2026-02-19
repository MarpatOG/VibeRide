import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (email) {
    const user = await db.user.findUnique({where: {email}});
    if (!user) {
      return NextResponse.json({ok: false, reason: 'not-found'}, {status: 404});
    }
    return NextResponse.json(user);
  }
  const users = await db.user.findMany({orderBy: {createdAt: 'asc'}});
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    email: string;
    name: string;
    lastName?: string;
    role?: 'client' | 'trainer' | 'admin';
    locale?: string;
  };
  const email = payload.email.trim().toLowerCase();
  const name = payload.name.trim();
  const lastName = (payload.lastName ?? '').trim();
  if (!email || !name) {
    return NextResponse.json({ok: false, reason: 'invalid-payload'}, {status: 400});
  }
  const existing = await db.user.findUnique({where: {email}});
  if (existing) {
    return NextResponse.json(existing);
  }
  const id = `u-${email.replace(/[^a-z0-9]+/g, '-')}`;
  const created = await db.user.create({
    data: {
      id,
      email,
      name,
      lastName: lastName || null,
      role: payload.role ?? 'client',
      locale: payload.locale ?? 'ru'
    }
  });
  return NextResponse.json(created, {status: 201});
}
