import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const approved = searchParams.get('approved');
    const available = searchParams.get('available');

    // Non-admin can only see their own profile
    if (auth.role !== 'ADMIN' && !auth.isSuperAdmin) {
      if (auth.role === 'DRIVER') {
        const driver = await db.driver.findUnique({
          where: { userId: auth.userId },
          include: { user: { select: { firstName: true, lastName: true, avatar: true, phone: true, email: true, isActive: true } } },
        });
        return NextResponse.json(driver ? [driver] : []);
      }
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const where: Record<string, unknown> = {};
    if (approved === 'true') where.isApproved = true;
    if (approved === 'false') where.isApproved = false;
    if (available === 'true') where.isAvailable = true;

    const drivers = await db.driver.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, avatar: true, phone: true, email: true, isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error('List drivers error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Accès réservé aux chauffeurs' }, { status: 403 });
    }

    const existing = await db.driver.findUnique({ where: { userId: auth.userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Profil chauffeur non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const { vehicleType, vehiclePlate, vehicleBrand, vehicleColor, idCardNumber,
      licenseNumber, idCardImage, licenseImage, vehicleImage, selfieImage } = body;

    const validTypes = ['MOTO', 'VELO', 'VOITURE'];
    if (vehicleType && !validTypes.includes(vehicleType)) {
      return NextResponse.json({ error: 'Type de véhicule invalide' }, { status: 400 });
    }

    const updated = await db.driver.update({
      where: { userId: auth.userId },
      data: {
        ...(vehicleType && { vehicleType }),
        ...(vehiclePlate !== undefined && { vehiclePlate }),
        ...(vehicleBrand !== undefined && { vehicleBrand }),
        ...(vehicleColor !== undefined && { vehicleColor }),
        ...(idCardNumber !== undefined && { idCardNumber }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(idCardImage !== undefined && { idCardImage }),
        ...(licenseImage !== undefined && { licenseImage }),
        ...(vehicleImage !== undefined && { vehicleImage }),
        ...(selfieImage !== undefined && { selfieImage }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update driver error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}