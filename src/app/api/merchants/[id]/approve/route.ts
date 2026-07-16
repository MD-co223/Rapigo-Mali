import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    const isApproved = action === 'approve';

    await db.merchant.update({
      where: { id },
      data: { isApproved },
    });

    await db.notification.create({
      data: {
        userId: merchant.userId,
        title: isApproved ? 'Marchand approuvé' : 'Marchand rejeté',
        message: isApproved
          ? 'Félicitations ! Votre compte marchand a été approuvé. Vous pouvez maintenant gérer vos produits.'
          : 'Votre demande de marchand a été rejetée. Veuillez vérifier vos informations et réessayer.',
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({
      message: isApproved ? 'Marchand approuvé' : 'Marchand rejeté',
      isApproved,
    });
  } catch (error) {
    console.error('Approve merchant error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}