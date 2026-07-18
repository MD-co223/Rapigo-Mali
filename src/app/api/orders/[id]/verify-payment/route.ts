import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
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
      include: {
        merchant: true,
        client: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Authorization: MERCHANT (owner) or ADMIN
    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;
    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });

    if (!isAdmin && !(merchant && merchant.id === order.merchantId)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (order.paymentStatus !== 'UPLOADED') {
      return NextResponse.json({ error: 'Aucune preuve de paiement à vérifier' }, { status: 400 });
    }

    const body = await request.json();
    const { reject } = body as { reject?: boolean };

    const updateData: Record<string, unknown> = {
      paymentStatus: reject ? 'REJECTED' : 'PAID',
    };

    // If approving and order was waiting for payment, move to PENDING
    if (!reject && order.status === 'PAYMENT_PENDING') {
      updateData.status = 'PENDING';
    }

    const updated = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        client: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
        merchant: { select: { id: true, businessName: true, userId: true, logo: true } },
        driver: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
      },
    });

    // Notify client
    const notificationMessage = reject
      ? `Le paiement de la commande ${order.orderNumber} a été refusé. Veuillez contacter le marchand.`
      : `Le paiement de la commande ${order.orderNumber} a été confirmé.`;

    await db.notification.create({
      data: {
        userId: order.client.userId,
        title: reject ? 'Paiement refusé' : 'Paiement confirmé',
        message: notificationMessage,
        type: 'PAYMENT',
        data: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, status: updated.status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Erreur serveur, veuillez réessayer' }, { status: 500 });
  }
}