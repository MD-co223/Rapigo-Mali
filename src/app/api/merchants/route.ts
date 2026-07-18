import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { parsePagination } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const businessType = searchParams.get('businessType') || '';
    const city = searchParams.get('city') || '';
    const approved = searchParams.get('approved') !== 'false';
    const featured = searchParams.get('featured');
    const showAll = searchParams.get('all') === 'true';
    const { limit, offset } = parsePagination(searchParams);

    // For admin all=true, auth is required
    if (showAll) {
      const auth = await getAuthUser(request);
      if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
    }

    const where: Record<string, unknown> = {};
    if (!showAll) {
      where.isApproved = approved;
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { shortDescription: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (businessType) {
      where.businessType = businessType;
    }
    if (city) {
      where.city = city;
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const [merchants, total] = await Promise.all([
      db.merchant.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true, email: true, phone: true, isActive: true } },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.merchant.count({ where }),
    ]);

    return NextResponse.json({ merchants, total, limit, offset });
  } catch (error) {
    console.error('List merchants error:', error);
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

    const existing = await db.merchant.findUnique({ where: { userId: auth.userId } });
    if (existing) {
      return NextResponse.json({ error: 'Profil marchand déjà existant' }, { status: 409 });
    }

    const body = await request.json();
    const {
      businessName, businessType, description, shortDescription,
      logo, coverImage, address, city, quartier, phone, email,
      website, operatingHours,
    } = body;

    if (!businessName || !address) {
      return NextResponse.json({ error: 'Nom du commerce et adresse requis' }, { status: 400 });
    }

    const merchant = await db.merchant.create({
      data: {
        userId: auth.userId,
        businessName,
        businessType: businessType || 'RESTAURANT',
        description,
        shortDescription,
        logo,
        coverImage,
        address,
        city: city || 'Bamako',
        quartier,
        phone: phone || '',
        email,
        website,
        operatingHours: operatingHours || '08:00-22:00',
        isApproved: false,
      },
    });

    return NextResponse.json(merchant, { status: 201 });
  } catch (error) {
    console.error('Create merchant error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}