import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const category = await db.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, icon, image, parentId, sortOrder, isActive } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) {
      if (slug !== category.slug) {
        const existing = await db.category.findUnique({ where: { slug } });
        if (existing) {
          return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 });
        }
      }
      data.slug = slug;
    }
    if (icon !== undefined) data.icon = icon;
    if (image !== undefined) data.image = image;
    if (parentId !== undefined) data.parentId = parentId;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await db.category.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const category = await db.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    // Check for children or products
    const [childCount, productCount] = await Promise.all([
      db.category.count({ where: { parentId: id } }),
      db.product.count({ where: { categoryId: id } }),
    ]);

    if (childCount > 0) {
      return NextResponse.json({ error: 'Supprimez d\'abord les sous-catégories' }, { status: 400 });
    }

    await db.category.delete({ where: { id } });

    return NextResponse.json({ message: 'Catégorie supprimée', productCount });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}