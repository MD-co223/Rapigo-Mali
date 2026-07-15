import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const [
      totalUsers,
      totalMerchants,
      totalDrivers,
      totalOrders,
      pendingMerchants,
      pendingDrivers,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      db.user.count({ where: { role: 'CLIENT' } }),
      db.merchant.count(),
      db.driver.count(),
      db.order.count(),
      db.merchant.count({ where: { isApproved: false } }),
      db.driver.count({ where: { isApproved: false } }),
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { include: { user: { select: { firstName: true, lastName: true } } } },
          merchant: { select: { businessName: true } },
        },
      }),
      db.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
      }),
    ]);

    // Total revenue from delivered orders
    const revenueResult = await db.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true },
    });
    const totalRevenue = revenueResult._sum.total || 0;

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await db.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { total: true, createdAt: true },
    });

    const revenueByMonth: Record<string, number> = {};
    monthlyOrders.forEach((order) => {
      const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + order.total;
    });

    return NextResponse.json({
      totalUsers,
      totalMerchants,
      totalDrivers,
      totalOrders,
      totalRevenue,
      pendingMerchants,
      pendingDrivers,
      recentOrders,
      ordersByStatus,
      revenueByMonth,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}