/**
 * POST /api/payments/subscription
 * Creates a FedaPay transaction for merchant/driver subscription payment.
 * Requires MERCHANT or DRIVER role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { createFedaPayTransaction } from '@/lib/fedapay';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const user = await db.user.findUnique({ where: { id: authUser.userId } });
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    if (!['MERCHANT', 'DRIVER'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès réservé aux commerçants et livreurs' }, { status: 403 });
    }

    const body = await request.json();
    const amount = body.amount || 4000;

    const result = await createFedaPayTransaction({
      orderReference: `SUB-${user.id.slice(0, 8)}-${Date.now()}`,
      amount,
      customer: {
        firstname: user.firstName || 'Utilisateur',
        lastname: user.lastName || 'Rapigo',
        email: user.email || undefined,
        phone_number: user.phone || undefined,
      },
    });

    await db.payment.create({
      data: {
        userId: user.id,
        amount,
        currency: 'XOF',
        method: 'FEDAPAY',
        status: 'PENDING',
        transactionRef: `SUB-${user.id.slice(0, 8)}`,
        providerRef: String(result.transactionId),
        metadata: JSON.stringify({
          type: 'SUBSCRIPTION',
          role: user.role,
          fedaPayTransactionId: result.transactionId,
          fedaPayToken: result.token,
        }),
      },
    });

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      token: result.token,
      transactionId: result.transactionId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[FedaPay Subscription] Error:', error);
    return NextResponse.json({ error: `Erreur: ${message}` }, { status: 500 });
  }
}