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

    if (!action || !['suspend', 'reactivate'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Prevent admin from suspending themselves or the super admin
    if (id === auth.userId) {
      return NextResponse.json({ error: 'Impossible de se suspendre soi-même' }, { status: 403 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.isSuperAdmin) {
      return NextResponse.json({ error: 'Impossible de suspendre un super administrateur' }, { status: 403 });
    }

    if (action === 'suspend') {
      await db.user.update({
        where: { id },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: reason || null,
        },
      });

      await db.notification.create({
        data: {
          userId: id,
          title: 'Compte suspendu',
          message: `Votre compte a été suspendu temporairement. Raison : ${reason || 'Non spécifiée'}`,
          type: 'SYSTEM',
        },
      });

      return NextResponse.json({ message: 'Utilisateur suspendu', isSuspended: true });
    } else {
      await db.user.update({
        where: { id },
        data: {
          isSuspended: false,
          suspendedAt: null,
          suspendedReason: null,
        },
      });

      await db.notification.create({
        data: {
          userId: id,
          title: 'Compte réactivé',
          message: 'Votre compte a été réactivé.',
          type: 'SYSTEM',
        },
      });

      return NextResponse.json({ message: 'Utilisateur réactivé', isSuspended: false });
    }
  } catch (error) {
    console.error('Suspend user error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}