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

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });

    if (!client || client.id !== order.clientId) {
      if (!merchant || merchant.id !== order.merchantId) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }

    if (order.paymentStatus !== 'PENDING') {
      return NextResponse.json({ error: 'Preuve de paiement déjà soumise ou traitée' }, { status: 400 });
    }

    const body = await request.json();
    const { imageUrl, note } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 });
    }

    const updated = await db.order.update({
      where: { id },
      data: {
        paymentProof: imageUrl,
        paymentNote: note || null,
        paymentStatus: 'UPLOADED',
      },
    });

    // Notify merchant
    await db.notification.create({
      data: {
        userId: order.merchant.userId,
        title: 'Preuve de paiement reçue',
        message: `Preuve de paiement pour la commande ${order.orderNumber}. Veuillez vérifier.`,
        type: 'PAYMENT',
        data: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Upload payment proof error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}