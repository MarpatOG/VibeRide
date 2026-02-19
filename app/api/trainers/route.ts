import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {toTrainerPayload} from '@/lib/server/db-serializers';
import {Trainer} from '@/lib/types/trainer';

function toDbTrainerPayload(input: Trainer) {
  return {
    id: input.id,
    name: input.name,
    lastName: input.lastName,
    photoUrl: input.photoUrl,
    tagsJson: input.tags,
    bioRu: input.bio.ru,
    bioEn: input.bio.en
  };
}

export async function GET() {
  const trainers = await db.trainer.findMany({orderBy: {name: 'asc'}});
  return NextResponse.json(trainers.map((item) => toTrainerPayload(item)));
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Trainer;
  const created = await db.trainer.create({data: toDbTrainerPayload(payload)});
  return NextResponse.json(toTrainerPayload(created), {status: 201});
}

export async function PUT(request: NextRequest) {
  const payload = (await request.json()) as Trainer[];
  await db.$transaction([
    db.trainer.deleteMany({}),
    db.trainer.createMany({data: payload.map((item) => toDbTrainerPayload(item))})
  ]);
  const trainers = await db.trainer.findMany({orderBy: {name: 'asc'}});
  return NextResponse.json(trainers.map((item) => toTrainerPayload(item)));
}
