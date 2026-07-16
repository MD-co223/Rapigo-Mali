import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const zones = await db.deliveryZone.findMany({
      where: { merchantId: id, isActive: true },
      orderBy: { city: 'asc' },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Get delivery zones error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
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
    const { city, quartier, fee } = body;

    if (!city || fee === undefined || fee === null) {
      return NextResponse.json({ error: 'Ville et frais de livraison requis' }, { status: 400 });
    }

    if (typeof fee !== 'number' || fee < 0) {
      return NextResponse.json({ error: 'Frais de livraison invalides' }, { status: 400 });
    }

    const zone = await db.deliveryZone.create({
      data: {
        merchantId: id,
        city,
        quartier: quartier || null,
        fee,
      },
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error('Create delivery zone error:', error);
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

    const { id: merchantId } = await params;
    const body = await request.json();
    const { zoneId, city, quartier, fee, isActive } = body;

    if (!zoneId) {
      return NextResponse.json({ error: 'zoneId requis' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    if (merchant.userId !== auth.userId && auth.role !== 'ADMIN' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const zone = await db.deliveryZone.findFirst({ where: { id: zoneId, merchantId } });
    if (!zone) {
      return NextResponse.json({ error: 'Zone non trouvée' }, { status: 404 });
    }

    const updated = await db.deliveryZone.update({
      where: { id: zoneId },
      data: {
        ...(city !== undefined && { city }),
        ...(quartier !== undefined && { quartier }),
        ...(fee !== undefined && { fee }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update delivery zone error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: merchantId } = await params;
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json({ error: 'zoneId requis' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    if (merchant.userId !== auth.userId && auth.role !== 'ADMIN' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await db.deliveryZone.delete({
      where: { id: zoneId, merchantId },
    });

    return NextResponse.json({ message: 'Zone supprimée' });
  } catch (error) {
    console.error('Delete delivery zone error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}