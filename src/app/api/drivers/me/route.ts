import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (auth.role !== 'DRIVER') return NextResponse.json({ error: 'Accès réservé aux livreurs' }, { status: 403 });

    const driver = await db.driver.findUnique({
      where: { userId: auth.userId },
      include: {
        user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, isActive: true } },
        _count: { select: { deliveries: true, orders: true } },
      },
    });

    if (!driver) return NextResponse.json({ error: 'Profil livreur non trouvé' }, { status: 404 });
    return NextResponse.json(driver);
  } catch (error) {
    console.error('Driver me error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (auth.role !== 'DRIVER') return NextResponse.json({ error: 'Accès réservé aux livreurs' }, { status: 403 });

    const driver = await db.driver.findUnique({ where: { userId: auth.userId } });
    if (!driver) return NextResponse.json({ error: 'Profil livreur non trouvé' }, { status: 404 });

    const body = await request.json();

    const updated = await db.driver.update({
      where: { id: driver.id },
      data: {
        ...(body.vehicleType !== undefined && { vehicleType: body.vehicleType }),
        ...(body.vehiclePlate !== undefined && { vehiclePlate: body.vehiclePlate }),
        ...(body.vehicleBrand !== undefined && { vehicleBrand: body.vehicleBrand }),
        ...(body.vehicleColor !== undefined && { vehicleColor: body.vehicleColor }),
        ...(body.idCardNumber !== undefined && { idCardNumber: body.idCardNumber }),
        ...(body.licenseNumber !== undefined && { licenseNumber: body.licenseNumber }),
        ...(body.idCardImage !== undefined && { idCardImage: body.idCardImage }),
        ...(body.licenseImage !== undefined && { licenseImage: body.licenseImage }),
        ...(body.vehicleImage !== undefined && { vehicleImage: body.vehicleImage }),
        ...(body.selfieImage !== undefined && { selfieImage: body.selfieImage }),
        ...(body.isOnline !== undefined && { isOnline: body.isOnline }),
      },
      include: {
        user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, isActive: true } },
        _count: { select: { deliveries: true, orders: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Driver me PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}