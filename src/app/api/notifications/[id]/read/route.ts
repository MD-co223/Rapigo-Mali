import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
    }

    if (notification.userId !== auth.userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}