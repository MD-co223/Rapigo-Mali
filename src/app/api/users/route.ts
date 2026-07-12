import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, avatar: true, isVerified: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}