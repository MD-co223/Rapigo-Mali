import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || '';
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          avatar: true, role: true, isSuperAdmin: true, isVerified: true,
          isActive: true, lastLogin: true, createdAt: true,
          client: { select: { city: true, totalOrders: true, totalSpent: true } },
          merchant: { select: { businessName: true, isApproved: true } },
          driver: { select: { vehicleType: true, isApproved: true, isOnline: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, limit, offset });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}