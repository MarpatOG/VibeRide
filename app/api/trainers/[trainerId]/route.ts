import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {toTrainerPayload} from '@/lib/server/db-serializers';
import {Trainer} from '@/lib/types/trainer';

function toDbTrainerPayload(input: Trainer) {
  return {
    name: input.name,
    lastName: input.lastName,
    photoUrl: input.photoUrl,
    tagsJson: input.tags,
    bioRu: input.bio.ru,
    bioEn: input.bio.en
  };
}

export async function PATCH(request: NextRequest, context: {params: Promise<{trainerId: string}>}) {
  const {trainerId} = await context.params;
  const payload = (await request.json()) as Trainer;
  const updated = await db.trainer.update({
    where: {id: trainerId},
    data: toDbTrainerPayload(payload)
  });
  return NextResponse.json(toTrainerPayload(updated));
}

export async function DELETE(_request: NextRequest, context: {params: Promise<{trainerId: string}>}) {
  const {trainerId} = await context.params;
  await db.trainer.delete({where: {id: trainerId}});
  return NextResponse.json({ok: true});
}
