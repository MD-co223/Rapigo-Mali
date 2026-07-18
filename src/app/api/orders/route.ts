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
    const { merchantId, items, deliveryAddress, deliveryCity, deliveryQuartier, paymentMethod, notes, couponId } = body;

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

    // Apply coupon discount (server-side validation)
    let discount = 0;
    let validatedCouponId: string | null = null;
    if (couponId) {
      const coupon = await db.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) {
        return NextResponse.json({ error: 'Code promo invalide' }, { status: 400 });
      }
      if (!coupon.isActive) {
        return NextResponse.json({ error: 'Code promo inactif' }, { status: 400 });
      }
      const now = new Date();
      if (coupon.startDate > now) {
        return NextResponse.json({ error: 'Code promo pas encore valide' }, { status: 400 });
      }
      if (coupon.endDate < now) {
        return NextResponse.json({ error: 'Code promo expiré' }, { status: 400 });
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Nombre maximum d\'utilisations atteint' }, { status: 400 });
      }
      if (coupon.minOrder && subtotal < coupon.minOrder) {
        return NextResponse.json({ error: `Commande minimum de ${coupon.minOrder} FCFA requise pour ce code` }, { status: 400 });
      }
      if (coupon.merchantId && coupon.merchantId !== merchantId) {
        return NextResponse.json({ error: 'Code promo non valide pour ce marchand' }, { status: 400 });
      }
      // Check if client already used this coupon
      const alreadyUsed = await db.couponUsage.findFirst({
        where: { couponId: coupon.id, clientId: client.id },
      });
      if (alreadyUsed) {
        return NextResponse.json({ error: 'Code promo déjà utilisé' }, { status: 400 });
      }

      // Calculate discount server-side
      if (coupon.type === 'PERCENTAGE') {
        discount = Math.round(subtotal * coupon.value / 100);
      } else if (coupon.type === 'FIXED') {
        discount = coupon.value;
      } else if (coupon.type === 'FREE_DELIVERY') {
        discount = deliveryFee; // Free delivery = discount equals delivery fee
      }
      discount = Math.min(discount, subtotal);
      validatedCouponId = coupon.id;
    }

    const total = subtotal + deliveryFee + serviceFee - discount;
    const orderNumber = generateOrderNumber();
    const status = paymentMethod === 'CASH' ? 'PENDING' : 'PAYMENT_PENDING';

    // Create order and decrease stock in a transaction
    const order = await db.$transaction(async (tx) => {
      // Verify stock availability
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Produit ${item.productId} non trouvé`);
        }
        if ((product.stock ?? 0) < item.quantity) {
          throw new Error(`Stock insuffisant pour ${product.name} (disponible: ${product.stock ?? 0})`);
        }
      }

      // Decrease stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, totalSold: { increment: item.quantity } },
        });
      }

      // Create order with items
      const created = await tx.order.create({
        data: {
          orderNumber,
          clientId: client.id,
          merchantId,
          status,
          subtotal,
          deliveryFee,
          serviceFee,
          discount,
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

      // Update client stats
      await tx.client.update({
        where: { id: client.id },
        data: { totalOrders: { increment: 1 } },
      });

      // Record coupon usage inside transaction
      if (discount > 0 && validatedCouponId) {
        await tx.coupon.update({ where: { id: validatedCouponId }, data: { usedCount: { increment: 1 } } });
        await tx.couponUsage.create({ data: { couponId: validatedCouponId, clientId: client.id, orderId: created.id, discount } });
      }

      return created;
    });

    // Notify merchant (outside transaction)
    await db.notification.create({
      data: {
        userId: merchant.userId,
        title: 'Nouvelle commande',
        message: `Nouvelle commande ${orderNumber} de ${client.user ? `${client.user.firstName} ${client.user.lastName}` : 'client'}`,
        type: 'ORDER',
        data: JSON.stringify({ orderId: order.id, orderNumber }),
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes('Stock insuffisant')) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      if (msg.includes('non trouvé')) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      // Prisma unique constraint (race condition on email/phone, shouldn't happen in orders but just in case)
      if (msg.includes('Prisma')) {
        return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur, veuillez réessayer' }, { status: 500 });
  }
}