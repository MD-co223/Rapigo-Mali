import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Seuls les clients peuvent noter' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { score, comment, merchantId, driverId } = body;

    if (!score || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score invalide (1-5 requis)' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'La commande doit être livrée pour être notée' }, { status: 400 });
    }

    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    if (!client || client.id !== order.clientId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Check if already rated
    const existing = await db.rating.findUnique({ where: { orderId: id } });
    if (existing) {
      return NextResponse.json({ error: 'Commande déjà notée' }, { status: 409 });
    }

    const rating = await db.rating.create({
      data: {
        orderId: id,
        clientId: client.id,
        merchantId: merchantId || order.merchantId,
        driverId: driverId || order.driverId || null,
        score,
        comment: comment || null,
      },
    });

    // Update merchant rating
    if (merchantId || order.merchantId) {
      const mId = merchantId || order.merchantId;
      const allRatings = await db.rating.findMany({ where: { merchantId: mId } });
      const avgRating = allRatings.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / allRatings.length;
      await db.merchant.update({
        where: { id: mId },
        data: {
          rating: Math.round(avgRating * 100) / 100,
          totalRatings: allRatings.length,
        },
      });
    }

    // Update driver rating
    if ((driverId || order.driverId) && (driverId || order.driverId) !== null) {
      const dId = driverId || order.driverId;
      if (dId) {
        const allDriverRatings = await db.rating.findMany({ where: { driverId: dId } });
        const avgDriverRating = allDriverRatings.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / allDriverRatings.length;
        await db.driver.update({
          where: { id: dId },
          data: {
            rating: Math.round(avgDriverRating * 100) / 100,
            totalRatings: allDriverRatings.length,
          },
        });
      }
    }

    // Notify merchant
    if (merchantId || order.merchantId) {
      const mId = merchantId || order.merchantId;
      const m = await db.merchant.findUnique({ where: { id: mId } });
      if (m) {
        await db.notification.create({
          data: {
            userId: m.userId,
            title: 'Nouvelle évaluation',
            message: `Nouvelle note de ${score}/5 pour la commande ${order.orderNumber}`,
            type: 'ORDER',
            data: JSON.stringify({ orderId: id, score, comment }),
          },
        });
      }
    }

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error('Submit rating error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}