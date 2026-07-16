import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'MERCHANT') {
      return NextResponse.json({ error: 'Accès réservé aux marchands' }, { status: 403 });
    }

    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
    }

    const [
      totalOrders,
      totalProducts,
      totalRevenue,
      pendingOrders,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      db.order.count({ where: { merchantId: merchant.id } }),
      db.product.count({ where: { merchantId: merchant.id } }),
      db.order.aggregate({
        where: { merchantId: merchant.id, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      db.order.count({ where: { merchantId: merchant.id, status: 'PENDING' } }),
      db.order.findMany({
        where: { merchantId: merchant.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      db.order.groupBy({
        by: ['status'],
        where: { merchantId: merchant.id },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      totalOrders,
      totalProducts,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders,
      rating: merchant.rating,
      totalRatings: merchant.totalRatings,
      recentOrders,
      ordersByStatus,
    });
  } catch (error) {
    console.error('Merchant stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}