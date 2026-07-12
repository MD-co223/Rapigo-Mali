import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');
    const pending = searchParams.get('pending');

    const where: Record<string, unknown> = {};
    if (pending === 'true') {
      where.isApproved = false;
    } else if (all !== 'true') {
      // Client app: only show approved
      where.isApproved = true;
    }

    const merchants = await db.merchant.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true, isActive: true } },
        businesses: { select: { name: true, _count: { select: { products: true } } } },
        products: { select: { _count: true }, take: 1 },
      },
      orderBy: [{ isApproved: 'asc' }, { rating: 'desc' }],
    });

    // Enrich with product count
    const enriched = merchants.map((m) => ({
      ...m,
      productCount: m.products?.length || 0,
    }));

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}