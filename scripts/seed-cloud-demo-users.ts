import 'dotenv/config';
import {hashPassword} from '../lib/server/password';

type DemoUser = {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: 'client' | 'trainer' | 'admin';
  password: string;
  locale: string;
};

const demoUsers: DemoUser[] = [
  {
    id: 'u-client',
    email: 'client@viberide.local',
    name: 'Demo',
    lastName: 'Client',
    role: 'client',
    password: 'Client123!',
    locale: 'ru'
  },
  {
    id: 'u-admin',
    email: 'admin@viberide.local',
    name: 'Demo',
    lastName: 'Admin',
    role: 'admin',
    password: 'Admin123!',
    locale: 'ru'
  },
  {
    id: 'u-trainer',
    email: 'trainer@viberide.local',
    name: 'Demo',
    lastName: 'Trainer',
    role: 'trainer',
    password: 'Trainer123!',
    locale: 'ru'
  }
];

function resolveDatabaseUrl() {
  const existingPrismaUrl = process.env.POSTGRES_PRISMA_URL?.trim();
  const existingDirectUrl = process.env.POSTGRES_URL_NON_POOLING?.trim();
  const fallbackUrl = process.env.DATABASE_URL?.trim();

  if (!existingPrismaUrl && fallbackUrl) {
    process.env.POSTGRES_PRISMA_URL = fallbackUrl;
  }
  if (!existingDirectUrl && fallbackUrl) {
    process.env.POSTGRES_URL_NON_POOLING = fallbackUrl;
  }

  return (process.env.POSTGRES_PRISMA_URL ?? '').trim();
}

function assertSupabaseTarget(databaseUrl: string) {
  const allowAnyTarget = process.env.ALLOW_NON_SUPABASE_SEED === 'true';
  const looksLikeSupabase = /supabase\.co|supabase\.com|pooler\./i.test(databaseUrl);
  if (!databaseUrl) {
    throw new Error(
      'Database URL is missing. Set POSTGRES_PRISMA_URL (or DATABASE_URL) before running cloud seed.'
    );
  }
  if (!looksLikeSupabase && !allowAnyTarget) {
    throw new Error(
      'Refusing to seed non-Supabase database. Set ALLOW_NON_SUPABASE_SEED=true to override explicitly.'
    );
  }
}

async function main() {
  const databaseUrl = resolveDatabaseUrl();
  assertSupabaseTarget(databaseUrl);

  const {PrismaClient} = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    for (const demoUser of demoUsers) {
      const passwordHash = hashPassword(demoUser.password);
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{email: demoUser.email}, {id: demoUser.id}]
        },
        select: {id: true}
      });

      if (existingUser) {
        await prisma.user.update({
          where: {id: existingUser.id},
          data: {
            email: demoUser.email,
            name: demoUser.name,
            lastName: demoUser.lastName,
            role: demoUser.role,
            locale: demoUser.locale,
            passwordHash
          }
        });
      } else {
        await prisma.user.create({
          data: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            lastName: demoUser.lastName,
            role: demoUser.role,
            locale: demoUser.locale,
            passwordHash
          }
        });
      }
    }

    console.log('Cloud demo users upserted successfully.');
    console.log('Client:  client@viberide.local / Client123!');
    console.log('Admin:   admin@viberide.local / Admin123!');
    console.log('Trainer: trainer@viberide.local / Trainer123!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
