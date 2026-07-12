import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/merchants/approve - Approve or reject a merchant
export async function POST(request: NextRequest) {
  try {
    const { merchantId, approve } = await request.json();
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const merchant = await db.merchant.update({
      where: { id: merchantId },
      data: { isApproved: approve },
      include: { user: { select: { id: true, firstName: true, email: true } } },
    });

    // Notify the merchant
    await db.notification.create({
      data: {
        userId: merchant.userId,
        title: approve ? 'Commerçant approuvé' : 'Commerçant rejeté',
        message: approve
          ? 'Votre boutique a été approuvée. Vous pouvez maintenant recevoir des commandes.'
          : 'Votre demande de boutique a été rejetée. Veuillez contacter le support.',
        type: 'SYSTEM',
      },
    });

    await db.auditLog.create({
      data: {
        userId: merchant.userId,
        action: approve ? 'APPROVE_MERCHANT' : 'REJECT_MERCHANT',
        entity: 'Merchant',
        entityId: merchantId,
      },
    });

    return NextResponse.json({ success: true, isApproved: merchant.isApproved });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}