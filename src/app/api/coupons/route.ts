import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/coupons - List coupons
export async function GET() {
  try {
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(coupons);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/coupons - Create a coupon
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.code || !data.value || !data.endDate) {
      return NextResponse.json({ error: 'Code, valeur et date de fin requis' }, { status: 400 });
    }

    const coupon = await db.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        merchantId: data.merchantId || null,
        type: data.type || 'PERCENTAGE',
        value: parseFloat(data.value) || 0,
        minOrder: parseFloat(data.minOrder) || 0,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: new Date(data.endDate),
        isActive: true,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'Ce code de coupon existe déjà' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}