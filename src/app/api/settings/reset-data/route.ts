import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Non autorisé - Super admin uniquement' }, { status: 401 });
    }

    // Delete in reverse dependency order
    // Reports
    await db.report.deleteMany({});
    // Deliveries
    await db.delivery.deleteMany({});
    // Driver locations
    await db.driverLocation.deleteMany({});
    // Ratings
    await db.rating.deleteMany({});
    // Coupon usages
    await db.couponUsage.deleteMany({});
    // Coupons
    await db.coupon.deleteMany({});
    // Payments
    await db.payment.deleteMany({});
    // Order items
    await db.orderItem.deleteMany({});
    // Orders
    await db.order.deleteMany({});
    // Transactions
    await db.transaction.deleteMany({});
    // Wallets (non-admin)
    const adminUsers = await db.user.findMany({
      where: { OR: [{ role: 'ADMIN' }, { isSuperAdmin: true }] },
      select: { id: true },
    });
    const adminIds = adminUsers.map((u) => u.id);
    await db.wallet.deleteMany({
      where: { userId: { notIn: adminIds } },
    });
    // Subscriptions
    await db.subscription.deleteMany({});
    // Products
    await db.product.deleteMany({});
    // Delivery zones
    await db.deliveryZone.deleteMany({});
    // Merchant payment configs
    await db.merchantPaymentConfig.deleteMany({});
    // Advertisements
    await db.advertisement.deleteMany({});
    // Merchants
    await db.merchant.deleteMany({});
    // Drivers
    await db.driver.deleteMany({});
    // Clients
    await db.client.deleteMany({});
    // Favorites
    await db.favorite.deleteMany({});
    // Referrals
    await db.referral.deleteMany({});
    // Messages
    await db.message.deleteMany({});
    // Chats
    await db.chat.deleteMany({});
    // Notifications (non-admin)
    await db.notification.deleteMany({
      where: { userId: { notIn: adminIds } },
    });
    // Support tickets (non-admin)
    await db.supportTicket.deleteMany({
      where: { userId: { notIn: adminIds } },
    });
    // Audit logs (non-admin)
    await db.auditLog.deleteMany({
      where: { userId: { notIn: adminIds } },
    });
    // Non-admin users
    await db.user.deleteMany({
      where: {
        id: { notIn: adminIds },
      },
    });

    return NextResponse.json({
      message: 'Données commerciales réinitialisées avec succès',
      kept: { adminUsers: adminIds.length, settings: true, plans: true, categories: true },
    });
  } catch (error) {
    console.error('Reset data error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}