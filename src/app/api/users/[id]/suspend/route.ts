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

    if (!action || !['suspend', 'reactivate'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.isSuperAdmin) {
      return NextResponse.json({ error: 'Impossible de suspendre un super administrateur' }, { status: 403 });
    }

    const isActive = action === 'reactivate';

    await db.user.update({
      where: { id },
      data: { isActive },
    });

    await db.notification.create({
      data: {
        userId: id,
        title: isActive ? 'Compte réactivé' : 'Compte suspendu',
        message: isActive
          ? 'Votre compte a été réactivé.'
          : 'Votre compte a été suspendu temporairement.',
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({
      message: isActive ? 'Utilisateur réactivé' : 'Utilisateur suspendu',
      isActive,
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}