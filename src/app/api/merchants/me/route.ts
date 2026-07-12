import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({
      where: { userId },
      include: {
        businesses: true,
        user: { select: { email: true, firstName: true, lastName: true, phone: true, avatar: true } },
        subscriptions: {
          include: { plan: true },
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({ where: { userId: data.userId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours;
    if (data.businessType !== undefined) updateData.businessType = data.businessType;

    const updated = await db.merchant.update({
      where: { userId: data.userId },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}