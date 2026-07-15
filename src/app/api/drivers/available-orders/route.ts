import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Accès réservé aux chauffeurs' }, { status: 403 });
    }

    const driver = await db.driver.findUnique({ where: { userId: auth.userId } });
    if (!driver || !driver.isApproved) {
      return NextResponse.json({ error: 'Chauffeur non approuvé' }, { status: 403 });
    }

    const orders = await db.order.findMany({
      where: {
        status: 'READY',
        driverId: null,
      },
      include: {
        client: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
        merchant: { select: { id: true, businessName: true, logo: true, address: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Available orders error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}