import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      todayRevenue,
      pendingOrders,
      avgRating,
      totalRevenue,
      ordersByStatus,
      recentOrders,
      topProducts,
      weeklyRevenue,
    ] = await Promise.all([
      db.order.count({ where: { merchantId } }),
      db.order.count({ where: { merchantId, createdAt: { gte: todayStart } } }),
      db.order.aggregate({
        where: { merchantId, createdAt: { gte: todayStart }, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      db.order.count({ where: { merchantId, status: 'PENDING' } }),
      db.merchant.findUnique({ where: { id: merchantId }, select: { rating: true } }),
      db.order.aggregate({
        where: { merchantId, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      db.order.groupBy({
        by: ['status'],
        where: { merchantId },
        _count: { status: true },
      }),
      db.order.findMany({
        where: { merchantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      db.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: { order: { merchantId } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
      // Get last 7 days revenue
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          return db.order.aggregate({
            where: {
              merchantId,
              status: 'DELIVERED',
              createdAt: { gte: date, lt: nextDate },
            },
            _sum: { total: true },
          }).then((r) => ({
            day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            revenue: r._sum.total || 0,
          }));
        })
      ),
    ]);

    const productCount = await db.product.count({ where: { merchantId } });

    return NextResponse.json({
      totalOrders,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
      avgRating: avgRating?.rating || 0,
      totalRevenue: totalRevenue._sum.total || 0,
      productCount,
      ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count.status })),
      recentOrders,
      topProducts,
      weeklyRevenue,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}