import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const where: Record<string, unknown> = { isAvailable: true };
    if (merchantId) where.merchantId = merchantId;
    if (category) where.categoryId = category;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' as const };
    }

    const products = await db.product.findMany({
      where,
      include: { merchant: { select: { businessName: true } }, category: { select: { name: true, icon: true } } },
      orderBy: { totalSold: 'desc' },
      take: 50,
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}