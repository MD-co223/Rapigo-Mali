import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${result}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (auth.role === 'CLIENT') {
      const client = await db.client.findUnique({ where: { userId: auth.userId } });
      if (!client) return NextResponse.json({ error: 'Profil client non trouvé' }, { status: 404 });
      where.clientId = client.id;
    } else if (auth.role === 'MERCHANT') {
      const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
      if (!merchant) return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
      where.merchantId = merchant.id;
    } else if (auth.role === 'DRIVER') {
      const driver = await db.driver.findUnique({ where: { userId: auth.userId } });
      if (!driver) return NextResponse.json({ error: 'Profil chauffeur non trouvé' }, { status: 404 });
      where.driverId = driver.id;
    }
    // ADMIN and SUPER_ADMIN see all

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: true,
          client: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
          merchant: { select: { id: true, businessName: true, logo: true, address: true } },
          driver: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, limit, offset });
  } catch (error) {
    console.error('List orders error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Seuls les clients peuvent passer des commandes' }, { status: 403 });
    }

    const body = await request.json();
    const { merchantId, items, deliveryAddress, deliveryCity, deliveryQuartier, paymentMethod, notes } = body;

    if (!merchantId || !items || !items.length || !deliveryAddress) {
      return NextResponse.json({ error: 'Données de commande incomplètes' }, { status: 400 });
    }

    const client = await db.client.findUnique({
      where: { userId: auth.userId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!client) {
      return NextResponse.json({ error: 'Profil client non trouvé' }, { status: 404 });
    }

    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      include: { deliveryZones: true },
    });

    if (!merchant || !merchant.isApproved) {
      return NextResponse.json({ error: 'Marchand non disponible' }, { status: 404 });
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      if (!item.productId || !item.name || item.price === undefined || !item.quantity) {
        return NextResponse.json({ error: 'Données produit invalides' }, { status: 400 });
      }
      subtotal += item.price * item.quantity;
    }

    // Find delivery fee
    const deliveryCityVal = deliveryCity || 'Bamako';
    let deliveryFee = 0;
    const matchedZone = merchant.deliveryZones.find(
      (z) => z.city === deliveryCityVal && z.isActive && (!deliveryQuartier || z.quartier === deliveryQuartier)
    );
    if (matchedZone) {
      deliveryFee = matchedZone.fee;
    } else {
      // Default to first zone for the city
      const cityZone = merchant.deliveryZones.find((z) => z.city === deliveryCityVal && z.isActive);
      if (cityZone) deliveryFee = cityZone.fee;
    }

    // Service fee from settings
    const serviceFeeSetting = await db.setting.findUnique({ where: { key: 'SERVICE_FEE_PERCENT' } });
    const serviceFeePercent = serviceFeeSetting ? parseInt(serviceFeeSetting.value) : 0;
    const serviceFee = Math.round(subtotal * serviceFeePercent / 100);

    const total = subtotal + deliveryFee + serviceFee;
    const orderNumber = generateOrderNumber();
    const status = paymentMethod === 'CASH' ? 'PENDING' : 'PAYMENT_PENDING';

    // Decrease stock
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const order = await db.order.create({
      data: {
        orderNumber,
        clientId: client.id,
        merchantId,
        status,
        subtotal,
        deliveryFee,
        serviceFee,
        discount: 0,
        total,
        paymentMethod: paymentMethod || 'CASH',
        deliveryAddress,
        deliveryCity: deliveryCityVal,
        deliveryQuartier: deliveryQuartier || null,
        notes: notes || null,
        items: {
          create: items.map((item: {
            productId: string; name: string; price: number; quantity: number;
            image?: string; supplements?: unknown; variants?: unknown; notes?: string;
          }) => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image || null,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            variants: item.variants ? JSON.stringify(item.variants) : null,
            supplements: item.supplements ? JSON.stringify(item.supplements) : null,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
        merchant: { select: { id: true, businessName: true, userId: true } },
      },
    });

    // Notify merchant
    await db.notification.create({
      data: {
        userId: merchant.userId,
        title: 'Nouvelle commande',
        message: `Nouvelle commande ${orderNumber} de ${client.user ? `${client.user.firstName} ${client.user.lastName}` : 'client'}`,
        type: 'ORDER',
        data: JSON.stringify({ orderId: order.id, orderNumber }),
      },
    });

    // Update client stats
    await db.client.update({
      where: { id: client.id },
      data: { totalOrders: { increment: 1 } },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}