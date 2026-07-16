import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const VALID_TRANSITIONS: Record<string, string[]> = {
  CANCELLED: ['PENDING', 'PAYMENT_PENDING'],
  CONFIRMED: ['PENDING', 'PAYMENT_PENDING'],
  PREPARING: ['CONFIRMED'],
  READY: ['PREPARING'],
  ASSIGNED: ['READY'],
  PICKED_UP: ['ASSIGNED'],
  IN_TRANSIT: ['PICKED_UP'],
  DELIVERED: ['IN_TRANSIT'],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Allow lookup by orderNumber too
    const order = await db.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        client: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
        merchant: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        driver: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
        delivery: true,
        ratings: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Authorization: must be participant
    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    const driver = await db.driver.findUnique({ where: { userId: auth.userId } });
    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;

    const isParticipant =
      isAdmin ||
      (client && client.id === order.clientId) ||
      (merchant && merchant.id === order.merchantId) ||
      (driver && driver.id === order.driverId);

    if (!isParticipant) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, cancelReason } = body;

    if (!status) {
      return NextResponse.json({ error: 'Statut requis' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { client: true, merchant: true, driver: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;
    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    const driver = await db.driver.findUnique({ where: { userId: auth.userId } });

    // Validate transitions based on role
    if (status === 'CANCELLED') {
      if (!isAdmin && !(client && client.id === order.clientId)) {
        return NextResponse.json({ error: 'Seul le client peut annuler' }, { status: 403 });
      }
      if (!VALID_TRANSITIONS.CANCELLED.includes(order.status) && !isAdmin) {
        return NextResponse.json({ error: 'Impossible d\'annuler cette commande' }, { status: 400 });
      }
    } else if (['CONFIRMED', 'PREPARING', 'READY'].includes(status)) {
      if (!isAdmin && !(merchant && merchant.id === order.merchantId)) {
        return NextResponse.json({ error: 'Seul le marchand peut modifier ce statut' }, { status: 403 });
      }
      if (!VALID_TRANSITIONS[status].includes(order.status) && !isAdmin) {
        return NextResponse.json({ error: 'Transition de statut invalide' }, { status: 400 });
      }
    } else if (['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(status)) {
      if (!isAdmin && !(driver && driver.id === order.driverId)) {
        return NextResponse.json({ error: 'Seul le chauffeur peut modifier ce statut' }, { status: 403 });
      }
      if (!VALID_TRANSITIONS[status].includes(order.status) && !isAdmin) {
        return NextResponse.json({ error: 'Transition de statut invalide' }, { status: 400 });
      }
    }

    const bodyData = body as { status: string; cancelReason?: string; driverId?: string };
    const updateData: Record<string, unknown> = { status };
    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = bodyData.cancelReason || null;
    }
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }
    if (status === 'ASSIGNED' && bodyData.driverId) {
      updateData.driverId = bodyData.driverId;
    }

    const updated = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        client: { include: { user: true } },
        merchant: { include: { user: true } },
        driver: { include: { user: true } },
      },
    });

    // Create notifications
    const statusMessages: Record<string, string> = {
      CANCELLED: `Commande ${order.orderNumber} annulée`,
      CONFIRMED: `Commande ${order.orderNumber} confirmée`,
      PREPARING: `Commande ${order.orderNumber} en préparation`,
      READY: `Commande ${order.orderNumber} prête pour livraison`,
      PICKED_UP: `Commande ${order.orderNumber} récupérée par le chauffeur`,
      IN_TRANSIT: `Commande ${order.orderNumber} en cours de livraison`,
      DELIVERED: `Commande ${order.orderNumber} livrée avec succès`,
    };

    const message = statusMessages[status] || `Commande ${order.orderNumber} mise à jour`;

    // Notify client
    if (updated.client?.user) {
      await db.notification.create({
        data: {
          userId: updated.client.userId,
          title: 'Mise à jour de commande',
          message,
          type: 'ORDER',
          data: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, status }),
        },
      });
    }

    // Notify merchant on client/driver status changes
    if (updated.merchant?.user && (auth.role === 'CLIENT' || auth.role === 'DRIVER')) {
      await db.notification.create({
        data: {
          userId: updated.merchant.userId,
          title: 'Mise à jour de commande',
          message,
          type: 'ORDER',
          data: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, status }),
        },
      });
    }

    // Notify driver on merchant status changes
    if (updated.driver?.user && auth.role === 'MERCHANT') {
      await db.notification.create({
        data: {
          userId: updated.driver.userId,
          title: 'Mise à jour de commande',
          message,
          type: 'ORDER',
          data: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, status }),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}