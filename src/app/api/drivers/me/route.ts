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
