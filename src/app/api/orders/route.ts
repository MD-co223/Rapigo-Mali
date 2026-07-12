import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (userId) where.clientId = userId;
    if (status) where.status = status;

    const orders = await db.order.findMany({
      where,
      include: {
        items: true,
        merchant: { select: { businessName: true, phone: true } },
        driver: { select: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { items: orderItems, ...orderData } = data;
    const orderNumber = `ORD-${String(Date.now()).slice(-6)}`;

    // Validate required fields
    // Resolve clientId from userId if needed
    let clientId = orderData.clientId;
    if (clientId) {
      // Check if it's a User ID by trying to find a Client with this userId
      let client = await db.client.findUnique({ where: { userId: clientId } });
      if (client) {
        clientId = client.id;
      } else {
        // It might already be a Client ID
        client = await db.client.findUnique({ where: { id: clientId } });
        if (!client) {
          return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
        }
      }
    }

    if (!clientId || !orderData.merchantId) {
      return NextResponse.json({ error: 'ClientId et MerchantId requis' }, { status: 400 });
    }

    // Create order with items in a transaction-like approach
    const order = await db.order.create({
      data: {
        orderNumber,
        clientId,
        merchantId: orderData.merchantId,
        businessId: orderData.businessId || null,
        subtotal: orderData.subtotal || 0,
        deliveryFee: orderData.deliveryFee || 500,
        serviceFee: orderData.serviceFee || 0,
        discount: orderData.discount || 0,
        total: orderData.total || 0,
        paymentMethod: orderData.paymentMethod || 'CASH',
        paymentStatus: orderData.paymentStatus || 'PENDING',
        deliveryAddress: orderData.deliveryAddress || '',
        deliveryCity: orderData.deliveryCity || 'Bamako',
        deliveryQuartier: orderData.deliveryQuartier || '',
        notes: orderData.notes || '',
        estimatedTime: orderData.estimatedTime || 30,
        status: 'PENDING',
        items: Array.isArray(orderItems) ? {
          create: orderItems.map((item: Record<string, unknown>) => ({
            productId: item.productId as string || '',
            productName: item.productName as string || '',
            productImage: (item.productImage as string) || null,
            quantity: (item.quantity as number) || 1,
            unitPrice: (item.unitPrice as number) || 0,
            totalPrice: (item.totalPrice as number) || 0,
            variants: item.variants ? JSON.stringify(item.variants) : null,
            notes: (item.notes as string) || null,
          })),
        } : undefined,
      },
      include: { items: true },
    });

    // Create notification for merchant
    if (order.merchantId) {
      const merchant = await db.merchant.findUnique({ where: { id: order.merchantId }, select: { userId: true, businessName: true } });
      if (merchant) {
        await db.notification.create({
          data: {
            userId: merchant.userId,
            title: 'Nouvelle commande',
            message: `Commande ${order.orderNumber} — ${formatAmount(order.total)}`,
            type: 'ORDER',
          },
        });
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}