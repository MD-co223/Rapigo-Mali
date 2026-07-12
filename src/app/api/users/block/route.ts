import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/users/block - Block or unblock a user
export async function POST(request: NextRequest) {
  try {
    const { userId, block } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Protect admin accounts from being blocked
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === 'ADMIN') {
      return NextResponse.json({ error: 'Impossible de bloquer un administrateur' }, { status: 403 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isActive: !block },
    });

    // If blocking, also log it
    if (block) {
      await db.auditLog.create({
        data: {
          userId,
          action: 'BLOCK_USER',
          entity: 'User',
          entityId: userId,
          details: JSON.stringify({ blocked: true }),
        },
      });
    }

    return NextResponse.json({ success: true, isActive: user.isActive });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}