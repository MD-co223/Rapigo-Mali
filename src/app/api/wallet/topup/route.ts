import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

/**
 * POST /api/wallet/topup
 * 
 * Request a wallet top-up (credit).
 * 
 * Future Orange Money integration:
 *   - OM API: POST https://api.orange.com/orange-money-moneytransfer/v1/transfers
 *   - Headers: Authorization: Bearer {access_token}
 *   - Body: { amount, currency: "OUV", payeeMsisdn: "{clientPhone}", payeeAccountType: "MSISDN" }
 * 
 * Future Wave integration:
 *   - Wave API: POST https://api.wave.com/v1/transfers
 *   - Headers: Authorization: Bearer {api_key}
 *   - Body: { amount, currency: "XOF", recipient_phone: "{clientPhone}" }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method, reference } = body as {
      amount?: number;
      method?: string;
      reference?: string;
    };

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: 'Le montant minimum est de 100 FCFA' }, { status: 400 });
    }

    if (amount > 500000) {
      return NextResponse.json({ error: 'Le montant maximum est de 500 000 FCFA' }, { status: 400 });
    }

    // Validate method
    const validMethods = ['ORANGE_MONEY', 'WAVE', 'CARD', 'QR_CODE'];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 });
    }

    // Get or create wallet
    let wallet = await db.wallet.findUnique({
      where: { userId: auth.userId },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId: auth.userId, balance: 0 },
      });
    }

    if (!wallet.isActive) {
      return NextResponse.json({ error: 'Portefeuille désactivé' }, { status: 400 });
    }

    // Generate unique reference
    const txRef = `TOP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create PENDING transaction (balance not updated until confirmed)
    const transaction = await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        description: `Recharge via ${methodLabel(method)}`,
        status: 'PENDING',
        reference: txRef,
        method,
        metadata: JSON.stringify({
          providerRef: reference || null,
          method,
          initiatedAt: new Date().toISOString(),
        }),
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: auth.userId,
        title: 'Demande de recharge',
        message: `Votre demande de recharge de ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA via ${methodLabel(method)} a été soumise. Référence : ${txRef}`,
        type: 'PAYMENT',
        data: JSON.stringify({ transactionId: transaction.id, reference: txRef, amount, method }),
      },
    });

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        reference: transaction.reference,
        method: transaction.method,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
      message: `Demande de recharge de ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA soumise avec succès`,
    }, { status: 201 });
  } catch (error) {
    console.error('Wallet topup error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function methodLabel(method: string): string {
  const labels: Record<string, string> = {
    ORANGE_MONEY: 'Orange Money',
    WAVE: 'Wave',
    CARD: 'Carte bancaire',
    QR_CODE: 'QR Code',
  };
  return labels[method] || method;
}