import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        avatar: true, role: true, isVerified: true, isActive: true, isSuperAdmin: true,
        client: auth.role === 'CLIENT' ? { include: { _count: { select: { orders: true } } } } : false,
        merchant: auth.role === 'MERCHANT' ? { include: { _count: { select: { products: true, orders: true } } } } : false,
        driver: auth.role === 'DRIVER' ? true : false,
      },
    });

    if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const { firstName, lastName, phone } = body;

    const user = await db.user.update({
      where: { id: auth.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
      },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, avatar: true, role: true, isVerified: true, isActive: true, isSuperAdmin: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Auth me PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
