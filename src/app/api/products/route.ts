import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { parsePagination } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured');
    const available = searchParams.get('available');
    const { limit, offset } = parsePagination(searchParams);

    const where: Record<string, unknown> = {};

    if (merchantId) {
      where.merchantId = merchantId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortDescription: { contains: search } },
      ];
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }
    if (available !== 'false') {
      where.isAvailable = true;
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          merchant: { select: { id: true, businessName: true, logo: true, isApproved: true } },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, limit, offset });
  } catch (error) {
    console.error('List products error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'MERCHANT') {
      return NextResponse.json({ error: 'Accès réservé aux marchands' }, { status: 403 });
    }

    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
    }

    if (!merchant.isApproved) {
      return NextResponse.json({ error: 'Votre compte marchand n\'est pas encore approuvé' }, { status: 403 });
    }

    const body = await request.json();
    const { name, categoryId, shortDescription, longDescription, price, comparePrice,
      image, images, video, sku, barcode, weight, dimensions, variants,
      options, supplements, allergens, tags, brand, origin, stock,
      isAvailable, isFeatured, preparationTime } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ error: 'Nom et prix requis' }, { status: 400 });
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
    }

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const uniqueSuffix = Date.now().toString(36);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const product = await db.product.create({
      data: {
        merchantId: merchant.id,
        categoryId: categoryId || null,
        name,
        slug,
        shortDescription,
        longDescription,
        price,
        comparePrice,
        image,
        images: images ? JSON.stringify(images) : null,
        video,
        sku,
        barcode,
        weight,
        dimensions: dimensions ? JSON.stringify(dimensions) : null,
        variants: variants ? JSON.stringify(variants) : null,
        options: options ? JSON.stringify(options) : null,
        supplements: supplements ? JSON.stringify(supplements) : null,
        allergens: allergens ? JSON.stringify(allergens) : null,
        tags: tags ? JSON.stringify(tags) : null,
        brand,
        origin,
        stock: stock ?? 0,
        isAvailable: isAvailable ?? true,
        isFeatured: isFeatured ?? false,
        preparationTime,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}