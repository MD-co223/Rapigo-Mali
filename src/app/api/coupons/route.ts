import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'ADMIN' && auth.role !== 'MERCHANT' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const where: Record<string, unknown> = {};

    if (auth.role === 'MERCHANT') {
      const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
      if (!merchant) return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
      where.merchantId = merchant.id;
    }

    const coupons = await db.coupon.findMany({
      where,
      include: { merchant: { select: { id: true, businessName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('List coupons error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'ADMIN' && auth.role !== 'MERCHANT' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { code, type, value, minOrder, maxUses, startDate, endDate, merchantId } = body;

    if (!code || !type || value === undefined || !endDate) {
      return NextResponse.json({ error: 'Code, type, valeur et date de fin requis' }, { status: 400 });
    }

    const validTypes = ['PERCENTAGE', 'FIXED', 'FREE_DELIVERY'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Ce code promo existe déjà' }, { status: 409 });
    }

    let mId = merchantId || null;
    if (auth.role === 'MERCHANT') {
      const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
      if (!merchant) return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
      mId = merchant.id;
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase(),
        merchantId: mId,
        type,
        value: Math.round(value),
        minOrder: minOrder ? Math.round(minOrder) : 0,
        maxUses: maxUses || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}