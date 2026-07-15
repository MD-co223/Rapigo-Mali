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

    const driver = await db.driver.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Chauffeur non trouvé' }, { status: 404 });
    }

    const isApproved = action === 'approve';

    await db.driver.update({
      where: { id },
      data: { isApproved },
    });

    await db.notification.create({
      data: {
        userId: driver.userId,
        title: isApproved ? 'Chauffeur approuvé' : 'Chauffeur rejeté',
        message: isApproved
          ? 'Félicitations ! Votre profil de chauffeur a été approuvé. Vous pouvez maintenant accepter des livraisons.'
          : 'Votre demande de chauffeur a été rejetée. Veuillez vérifier vos informations et réessayer.',
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({
      message: isApproved ? 'Chauffeur approuvé' : 'Chauffeur rejeté',
      isApproved,
    });
  } catch (error) {
    console.error('Approve driver error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}