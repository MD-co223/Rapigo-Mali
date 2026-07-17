import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    
    if (auth.role !== 'MERCHANT') {
      return NextResponse.json({ error: 'Accès réservé aux marchands' }, { status: 403 });
    }

    const merchant = await db.merchant.findUnique({
      where: { userId: auth.userId },
      include: {
        user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, isActive: true } },
        deliveryZones: true,
        paymentConfigs: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { products: true, orders: true } },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error('Merchant me error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (auth.role !== 'MERCHANT') {
      return NextResponse.json({ error: 'Accès réservé aux marchands' }, { status: 403 });
    }

    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const updatableFields = [
      'businessName', 'businessType', 'description', 'shortDescription',
      'logo', 'coverImage', 'address', 'city', 'quartier', 'phone',
      'email', 'website', 'operatingHours', 'minOrderAmount',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const updated = await db.merchant.update({
      where: { id: merchant.id },
      data,
      include: {
        user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, isActive: true } },
        deliveryZones: true,
        paymentConfigs: true,
        _count: { select: { products: true, orders: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Merchant me PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}