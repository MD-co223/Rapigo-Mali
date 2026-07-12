import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const merchants = await db.merchant.findMany({
      where: { isApproved: true },
      include: { user: { select: { firstName: true, lastName: true, avatar: true } }, businesses: true, products: { take: 5, where: { isAvailable: true } } },
      orderBy: { rating: 'desc' },
    });
    return NextResponse.json(merchants);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}