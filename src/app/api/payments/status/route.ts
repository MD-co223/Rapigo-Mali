/**
 * GET /api/payments/status?orderId={orderId}
 * 
 * Returns the current payment status for an order.
 * Used by the frontend to poll for payment completion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        paymentMethod: true,
        status: true,
        total: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // Get the latest FedaPay payment for this order
    const payment = await db.payment.findFirst({
      where: {
        orderId,
        method: { startsWith: 'FEDAPAY' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        providerRef: true,
        paidAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      data: {
        order,
        payment,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}