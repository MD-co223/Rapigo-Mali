import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parent = searchParams.get('parent');

    const where: Record<string, unknown> = { isActive: true };
    if (parent !== null) {
      where.parentId = parent || null;
    }

    const categories = await db.category.findMany({
      where,
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getAuthUser } = await import('@/lib/auth');
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, icon, image, parentId, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nom et slug requis' }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 });
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        icon: icon || null,
        image: image || null,
        parentId: parentId || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}