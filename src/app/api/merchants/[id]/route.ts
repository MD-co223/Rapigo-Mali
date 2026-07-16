import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const merchant = await db.merchant.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true, email: true } },
        products: {
          where: { isAvailable: true },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        },
        deliveryZones: { where: { isActive: true } },
        paymentConfigs: { where: { isEnabled: true } },
        _count: { select: { orders: true, ratings: true } },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error('Get merchant error:', error);
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

    const merchant = await db.merchant.findUnique({ where: { id } });
    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    if (merchant.userId !== auth.userId && auth.role !== 'ADMIN' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
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
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update merchant error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const merchant = await db.merchant.findUnique({ where: { id } });
    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    await db.merchant.delete({ where: { id } });

    return NextResponse.json({ message: 'Marchand supprimé' });
  } catch (error) {
    console.error('Delete merchant error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}