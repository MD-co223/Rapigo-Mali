import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, businessName: true, logo: true, address: true, city: true, isApproved: true } },
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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

    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    const isOwner = merchant && merchant.id === product.merchantId;
    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();

    const data: Record<string, unknown> = {};
    const updatableFields = [
      'name', 'categoryId', 'shortDescription', 'longDescription', 'price',
      'comparePrice', 'image', 'video', 'sku', 'barcode', 'weight',
      'brand', 'origin', 'stock', 'isAvailable', 'isFeatured', 'preparationTime',
    ] as const;

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Handle JSON fields
    if (body.images !== undefined) data.images = JSON.stringify(body.images);
    if (body.dimensions !== undefined) data.dimensions = JSON.stringify(body.dimensions);
    if (body.variants !== undefined) data.variants = JSON.stringify(body.variants);
    if (body.options !== undefined) data.options = JSON.stringify(body.options);
    if (body.supplements !== undefined) data.supplements = JSON.stringify(body.supplements);
    if (body.allergens !== undefined) data.allergens = JSON.stringify(body.allergens);
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);

    const updated = await db.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    const isOwner = merchant && merchant.id === product.merchantId;
    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Produit supprimé' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}