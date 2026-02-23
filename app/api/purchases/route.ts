import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {products} from '@/lib/constants/catalog';
import {DEMO_CLIENT_USER_ID} from '@/lib/server/constants';

function createEntityId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultMembershipValidUntilIso() {
  const value = new Date();
  value.setMonth(value.getMonth() + 3);
  return value.toISOString();
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {productId?: string; userId?: string};
  const productId = payload.productId?.trim();
  const userId = payload.userId?.trim() || DEMO_CLIENT_USER_ID;

  if (!productId) {
    return NextResponse.json({ok: false, reason: 'product-id-required'}, {status: 400});
  }

  const product = products.find((item) => item.id === productId);
  if (!product) {
    return NextResponse.json({ok: false, reason: 'product-not-found'}, {status: 404});
  }

  const user = await db.user.findUnique({where: {id: userId}});
  if (!user) {
    return NextResponse.json({ok: false, reason: 'user-not-found'}, {status: 404});
  }

  const creditsAdded = product.credits ?? 0;
  const nowIso = new Date().toISOString();

  const result = await db.$transaction(async (transaction) => {
    const latestMembership = await transaction.membership.findFirst({
      where: {userId},
      orderBy: {createdAt: 'desc'}
    });

    let remainingAfter = latestMembership?.remainingSessions ?? 0;

    if (creditsAdded > 0) {
      if (latestMembership) {
        const updatedMembership = await transaction.membership.update({
          where: {id: latestMembership.id},
          data: {
            remainingSessions: latestMembership.remainingSessions + creditsAdded,
            active: true
          }
        });
        remainingAfter = updatedMembership.remainingSessions;
      } else {
        const createdMembership = await transaction.membership.create({
          data: {
            id: createEntityId('m'),
            userId,
            remainingSessions: creditsAdded,
            validUntil: buildDefaultMembershipValidUntilIso(),
            active: true
          }
        });
        remainingAfter = createdMembership.remainingSessions;
      }
    }

    await transaction.historyEvent.create({
      data: {
        id: createEntityId('h-purchase'),
        userId,
        type: 'membership_update',
        occurredAt: nowIso,
        titleRu: 'Покупка абонемента',
        titleEn: 'Membership purchase',
        noteRu:
          creditsAdded > 0
            ? `Покупка абонемента: +${creditsAdded}. Остаток: ${remainingAfter}.`
            : 'Покупка без начисления тренировок.',
        noteEn:
          creditsAdded > 0
            ? `"${product.name.en}" package: +${creditsAdded}. Remaining: ${remainingAfter}.`
            : `"${product.name.en}" purchase without session credits.`,
        metaJson: {
          kind: 'purchase',
          productId: product.id,
          productType: product.type,
          price: product.price,
          creditsAdded,
          remainingAfter
        }
      }
    });

    return {remainingAfter};
  });

  return NextResponse.json({
    ok: true,
    productId: product.id,
    creditsAdded,
    remainingSessions: result.remainingAfter
  });
}
