import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const all = searchParams.get('all');

    const where: Record<string, unknown> = {};
    if (all !== 'true') {
      where.isAvailable = true;
    }
    if (merchantId) where.merchantId = merchantId;
    if (category) where.categoryId = category;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' as const };
    }

    const products = await db.product.findMany({
      where,
      include: { merchant: { select: { businessName: true } }, category: { select: { name: true, icon: true } } },
      orderBy: { totalSold: 'desc' },
      take: 100,
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.name || !data.price || !data.merchantId) {
      return NextResponse.json({ error: 'Nom, prix et merchantId requis' }, { status: 400 });
    }
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
        stock: parseInt(data.stock) || 0,
        merchantId: data.merchantId,
        categoryId: data.categoryId || null,
        image: data.image || null,
        images: data.images ? JSON.stringify(data.images) : null,
        isAvailable: data.isAvailable !== false,
        isFeatured: false,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = parseFloat(data.price) || 0;
    if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice ? parseFloat(data.comparePrice) : null;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock) || 0;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.images !== undefined) updateData.images = data.images ? JSON.stringify(data.images) : null;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

    const product = await db.product.update({
      where: { id: data.id },
      data: updateData,
    });
    return NextResponse.json(product);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }
    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}