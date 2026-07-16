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

    if (!action || !['block', 'unblock'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.isSuperAdmin) {
      return NextResponse.json({ error: 'Impossible de bloquer un super administrateur' }, { status: 403 });
    }

    const isActive = action === 'unblock';

    await db.user.update({
      where: { id },
      data: { isActive },
    });

    await db.notification.create({
      data: {
        userId: id,
        title: isActive ? 'Compte débloqué' : 'Compte bloqué',
        message: isActive
          ? 'Votre compte a été débloqué. Vous pouvez maintenant vous connecter.'
          : 'Votre compte a été bloqué. Contactez le support pour plus d\'informations.',
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({
      message: isActive ? 'Utilisateur débloqué' : 'Utilisateur bloqué',
      isActive,
    });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}