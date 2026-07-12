import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalUsers, totalMerchants, totalDrivers, totalOrders,
      totalRevenue, activeOrders, pendingMerchants, totalProducts,
      totalDeliveriesToday, avgRating,
    ] = await Promise.all([
      db.user.count(),
      db.merchant.count({ where: { isApproved: true } }),
      db.driver.count({ where: { isVerified: true } }),
      db.order.count(),
      db.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
      db.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT'] } } }),
      db.merchant.count({ where: { isApproved: false } }),
      db.product.count(),
      db.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.merchant.aggregate({ _avg: { rating: true } }),
    ]);

    // Orders by status
    const ordersByStatus = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Recent orders
    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: { select: { businessName: true } },
      },
    });

    // Top merchants
    const topMerchants = await db.merchant.findMany({
      where: { isApproved: true },
      orderBy: { rating: 'desc' },
      take: 5,
      include: { businesses: true, products: { take: 1 } },
    });

    return NextResponse.json({
      totalUsers, totalMerchants, totalDrivers, totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      activeOrders, pendingMerchants, totalProducts,
      totalDeliveriesToday,
      avgRating: avgRating._avg.rating || 0,
      ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count.status })),
      recentOrders,
      topMerchants,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}