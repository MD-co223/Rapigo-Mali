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
