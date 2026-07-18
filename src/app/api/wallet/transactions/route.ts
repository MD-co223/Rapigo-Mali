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
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    // Get wallet
    let wallet = await db.wallet.findUnique({
      where: { userId: auth.userId },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId: auth.userId, balance: 0 },
      });
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          description: true,
          status: true,
          reference: true,
          method: true,
          createdAt: true,
        },
      }),
      db.transaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
      hasMore: offset + transactions.length < total,
    });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}