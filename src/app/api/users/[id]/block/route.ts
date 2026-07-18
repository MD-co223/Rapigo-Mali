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
    const { action, reason } = await request.json();

    if (!action || !['block', 'unblock'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Prevent admin from blocking themselves or the super admin
    if (id === auth.userId) {
      return NextResponse.json({ error: 'Impossible de se bloquer soi-même' }, { status: 403 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.isSuperAdmin) {
      return NextResponse.json({ error: 'Impossible de bloquer un super administrateur' }, { status: 403 });
    }

    if (action === 'block') {
      await db.user.update({
        where: { id },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedReason: reason || null,
          isActive: false,
        },
      });

      await db.notification.create({
        data: {
          userId: id,
          title: 'Compte bloqué',
          message: `Votre compte a été bloqué. Contactez le support pour plus d'informations. Raison : ${reason || 'Non spécifiée'}`,
          type: 'SYSTEM',
        },
      });

      return NextResponse.json({ message: 'Utilisateur bloqué', isBlocked: true });
    } else {
      await db.user.update({
        where: { id },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockedReason: null,
        },
      });

      await db.notification.create({
        data: {
          userId: id,
          title: 'Compte débloqué',
          message: 'Votre compte a été débloqué. Vous pouvez maintenant vous connecter.',
          type: 'SYSTEM',
        },
      });

      return NextResponse.json({ message: 'Utilisateur débloqué', isBlocked: false });
    }
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}