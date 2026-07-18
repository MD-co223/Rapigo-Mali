import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { parsePagination } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unread = searchParams.get('unread');
    const { limit, offset } = parsePagination(searchParams);

    const where: Record<string, unknown> = { userId: auth.userId };
    if (unread === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where: { userId: auth.userId } }),
      db.notification.count({ where: { userId: auth.userId, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, total, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'ADMIN' && auth.role !== 'MERCHANT' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, title, message, type, data } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'userId, titre et message requis' }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'INFO',
        data: data ? JSON.stringify(data) : null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await db.notification.updateMany({
      where: { userId: auth.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}