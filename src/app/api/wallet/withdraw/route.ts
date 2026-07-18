import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

/**
 * POST /api/wallet/withdraw
 * 
 * Request a wallet withdrawal (debit).
 * 
 * Future Orange Money disbursement:
 *   - OM API: POST https://api.orange.com/orange-money-moneytransfer/v1/transfers
 *   - Disbursement mode: transfer from merchant account to client MSISDN
 *   - Requires OM merchant account credentials
 * 
 * Future Wave disbursement:
 *   - Wave API: POST https://api.wave.com/v1/transfers
 *   - Transfer from business balance to recipient phone number
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method, phoneNumber } = body as {
      amount?: number;
      method?: string;
      phoneNumber?: string;
    };

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    if (amount < 500) {
      return NextResponse.json({ error: 'Le montant minimum de retrait est de 500 FCFA' }, { status: 400 });
    }

    if (amount > 300000) {
      return NextResponse.json({ error: 'Le montant maximum de retrait est de 300 000 FCFA' }, { status: 400 });
    }

    // Validate method
    const validMethods = ['ORANGE_MONEY', 'WAVE', 'CARD'];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json({ error: 'Méthode de retrait invalide' }, { status: 400 });
    }

    // Validate phone number for mobile money
    if (method === 'ORANGE_MONEY' || method === 'WAVE') {
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return NextResponse.json({ error: 'Numéro de téléphone requis pour ce mode de retrait' }, { status: 400 });
      }
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      if (!/^(\+223|0)[0-9]{8}$/.test(cleanPhone)) {
        return NextResponse.json({ error: 'Numéro de téléphone invalide (format: +223 XX XX XX XX)' }, { status: 400 });
      }
    }

    // Get wallet
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

    // Check sufficient balance
    if (wallet.balance < amount) {
      return NextResponse.json({
        error: `Solde insuffisant. Votre solde : ${new Intl.NumberFormat('fr-FR').format(wallet.balance)} FCFA`,
      }, { status: 400 });
    }

    // Generate unique reference
    const txRef = `WDR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create PENDING transaction (balance deducted on completion)
    // Note: In production, balance would be deducted when OM/Wave confirms the transfer
    const transaction = await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        description: `Retrait via ${methodLabel(method)}`,
        status: 'PENDING',
        reference: txRef,
        method,
        metadata: JSON.stringify({
          method,
          phoneNumber: phoneNumber || null,
          initiatedAt: new Date().toISOString(),
        }),
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: auth.userId,
        title: 'Demande de retrait',
        message: `Votre demande de retrait de ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA via ${methodLabel(method)} a été soumise. Référence : ${txRef}`,
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
      message: `Demande de retrait de ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA soumise avec succès`,
    }, { status: 201 });
  } catch (error) {
    console.error('Wallet withdraw error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function methodLabel(method: string): string {
  const labels: Record<string, string> = {
    ORANGE_MONEY: 'Orange Money',
    WAVE: 'Wave',
    CARD: 'Carte bancaire',
  };
  return labels[method] || method;
}