import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const withTransactions = searchParams.get('withTransactions') === 'true';

    const wallet = await db.wallet.findUnique({
      where: { userId: auth.userId },
      include: withTransactions
        ? {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
          }
        : undefined,
    });

    if (!wallet) {
      const newWallet = await db.wallet.create({
        data: { userId: auth.userId, balance: 0 },
      });
      return NextResponse.json(withTransactions ? { ...newWallet, transactions: [] } : newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod, paymentReference } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const validMethods = ['ORANGE_MONEY', 'WAVE', 'CARD', 'QR_CODE'];
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 });
    }

    // Find or create wallet
    let wallet = await db.wallet.findUnique({
      where: { userId: auth.userId },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId: auth.userId, balance: 0 },
      });
    }

    // Create a pending CREDIT transaction for the deposit request
    const transaction = await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        currency: 'XOF',
        description: `Dépôt demandé via ${paymentMethod || 'non spécifié'}`,
        reference: paymentReference || null,
        metadata: JSON.stringify({ paymentMethod, paymentReference, status: 'PENDING' }),
      },
    });

    // Update wallet with payment info
    await db.wallet.update({
      where: { id: wallet.id },
      data: {
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null,
      },
    });

    return NextResponse.json({
      message: 'Demande de dépôt créée',
      transaction,
      wallet,
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}