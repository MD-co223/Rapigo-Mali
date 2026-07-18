import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { parsePagination } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { limit, offset } = parsePagination(searchParams);
    const entity = searchParams.get('entity') || '';
    const action = searchParams.get('action') || '';

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('List audit logs error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}