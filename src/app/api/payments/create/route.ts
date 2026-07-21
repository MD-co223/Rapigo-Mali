/**
 * POST /api/payments/create
 *
 * Creates a FedaPay transaction for an existing order.
 * Requires authentication (CLIENT role).
 *
 * Request body:
 * - orderId: string (required)
 *
 * Response:
 * - On success: { data: { paymentUrl, token, transactionId, paymentId } }
 * - On error: { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import {
  createFedaPayTransaction,
} from '@/lib/fedapay';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    if (authUser.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId est requis' },
        { status: 400 }
      );
    }

    // 3. Fetch the order with client and items
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        client: { include: { user: true } },
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // 4. Verify ownership
    if (order.clientId !== authUser.userId && order.client?.userId !== authUser.userId) {
      return NextResponse.json(
        { error: 'Cette commande ne vous appartient pas' },
        { status: 403 }
      );
    }

    // 5. Verify order is awaiting payment
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Cette commande est déjà payée' },
        { status: 400 }
      );
    }
    if (!['PENDING', 'FAILED'].includes(order.paymentStatus)) {
      return NextResponse.json(
        { error: `Impossible de payer une commande avec le statut: ${order.paymentStatus}` },
        { status: 400 }
      );
    }

    // 6. Check if a FedaPay payment already exists for this order
    const existingPayment = await db.payment.findFirst({
      where: {
        orderId: order.id,
        method: { startsWith: 'FEDAPAY' },
        status: { in: ['PENDING'] },
      },
    });

    if (existingPayment) {
      // If there's already a pending FedaPay payment, return its info
      // But create a new FedaPay transaction (old one may be expired)
      // Actually, let's just create a fresh one
    }

    // 7. Create FedaPay transaction
    const clientUser = order.client?.user;
    const result = await createFedaPayTransaction({
      orderReference: order.orderNumber,
      amount: order.total,
      customer: {
        firstname: clientUser?.firstName || 'Client',
        lastname: clientUser?.lastName || 'Rapigo',
        email: clientUser?.email || undefined,
        phone_number: clientUser?.phone || undefined,
      },
    });

    // 8. Create Payment record in database
    const payment = await db.payment.create({
      data: {
        orderId: order.id,
        userId: authUser.userId,
        amount: order.total,
        currency: order.currency || 'XOF',
        method: 'FEDAPAY',
        status: 'PENDING',
        transactionRef: order.orderNumber,
        providerRef: String(result.transactionId),
        metadata: JSON.stringify({
          fedaPayTransactionId: result.transactionId,
          fedaPayToken: result.token,
          fedaPayReference: result.reference,
          fedaPayStatus: result.status,
        }),
      },
    });

    // 9. Update order payment method and status
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: 'FEDAPAY',
        paymentStatus: 'PENDING',
      },
    });

    // 10. Return payment URL and token
    return NextResponse.json({
      data: {
        paymentUrl: result.paymentUrl,
        token: result.token,
        transactionId: result.transactionId,
        paymentId: payment.id,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[FedaPay] Error creating payment:', error);
    return NextResponse.json(
      { error: `Erreur de paiement: ${message}` },
      { status: 500 }
    );
  }
}