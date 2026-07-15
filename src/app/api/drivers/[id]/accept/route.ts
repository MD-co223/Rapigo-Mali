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

    if (auth.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Accès réservé aux chauffeurs' }, { status: 403 });
    }

    const { id: orderId } = await params;

    const driver = await db.driver.findUnique({
      where: { userId: auth.userId },
      include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } },
    });
    if (!driver || !driver.isApproved) {
      return NextResponse.json({ error: 'Chauffeur non approuvé' }, { status: 403 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { merchant: true, client: { include: { user: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.status !== 'READY') {
      return NextResponse.json({ error: 'Cette commande n\'est pas prête pour livraison' }, { status: 400 });
    }

    if (order.driverId) {
      return NextResponse.json({ error: 'Cette commande a déjà un chauffeur' }, { status: 409 });
    }

    // Update order
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'ASSIGNED',
        driverId: driver.id,
      },
      include: {
        client: { include: { user: true } },
        merchant: { select: { id: true, businessName: true, userId: true } },
        driver: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true, vehicleType: true, vehiclePlate: true } } } },
      },
    });

    // Create delivery record
    await db.delivery.create({
      data: {
        orderId,
        driverId: driver.id,
        status: 'ASSIGNED',
        pickupAddress: order.merchant.address,
        dropoffAddress: order.deliveryAddress,
      },
    });

    // Update driver
    await db.driver.update({
      where: { id: driver.id },
      data: { isAvailable: false },
    });

    // Notify client
    if (order.client?.user) {
      await db.notification.create({
        data: {
          userId: order.client.userId,
          title: 'Chauffeur assigné',
          message: `Un chauffeur a été assigné à votre commande ${order.orderNumber}`,
          type: 'DELIVERY',
          data: JSON.stringify({
            orderId,
            orderNumber: order.orderNumber,
            driver: {
              firstName: driver.user?.firstName,
              lastName: driver.user?.lastName,
              phone: driver.user?.phone,
              vehicleType: driver.vehicleType,
              vehiclePlate: driver.vehiclePlate,
            },
          }),
        },
      });
    }

    // Notify merchant
    await db.notification.create({
      data: {
        userId: order.merchant.userId,
        title: 'Chauffeur assigné',
        message: `Un chauffeur a accepté la livraison de la commande ${order.orderNumber}`,
        type: 'DELIVERY',
        data: JSON.stringify({ orderId, orderNumber: order.orderNumber }),
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Accept delivery error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}