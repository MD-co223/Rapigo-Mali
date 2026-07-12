import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        merchant: { select: { businessName: true, phone: true, address: true } },
        driver: { select: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } } },
        client: { select: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      },
    });
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const allowedStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (data.status && !allowedStatuses.includes(data.status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.status === 'DELIVERED') updateData.deliveredAt = new Date();
    if (data.status === 'CANCELLED') { updateData.cancelledAt = new Date(); updateData.cancelReason = data.cancelReason || null; }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
    return NextResponse.json(order);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}