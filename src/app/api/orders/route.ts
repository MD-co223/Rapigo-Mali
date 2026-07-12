import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (userId) where.clientId = userId;
    if (status) where.status = status;

    const orders = await db.order.findMany({
      where,
      include: {
        items: true,
        merchant: { select: { businessName: true, phone: true } },
        driver: { select: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const orderNumber = `ORD-${String(Date.now()).slice(-6)}`;
    const order = await db.order.create({
      data: { ...data, orderNumber },
      include: { items: true },
    });
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}