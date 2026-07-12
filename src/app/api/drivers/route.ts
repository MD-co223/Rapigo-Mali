import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const drivers = await db.driver.findMany({
      include: {
        user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, avatar: true, isVerified: true, isActive: true } },
      },
      orderBy: { totalEarnings: 'desc' },
      take: 50,
    });
    return NextResponse.json(drivers);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}