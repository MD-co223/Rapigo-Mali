import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    if (!client) {
      return NextResponse.json({ error: 'Profil client non trouvé' }, { status: 404 });
    }

    const favorites = await db.favorite.findMany({
      where: { clientId: client.id },
      include: {
        product: {
          include: {
            merchant: { select: { id: true, businessName: true, logo: true } },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    if (!client) {
      return NextResponse.json({ error: 'Profil client non trouvé' }, { status: 404 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId requis' }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const existing = await db.favorite.findUnique({
      where: { clientId_productId: { clientId: client.id, productId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Déjà dans les favoris' }, { status: 409 });
    }

    const favorite = await db.favorite.create({
      data: { clientId: client.id, productId },
      include: { product: true },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    if (!client) {
      return NextResponse.json({ error: 'Profil client non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId requis' }, { status: 400 });
    }

    await db.favorite.delete({
      where: { clientId_productId: { clientId: client.id, productId } },
    });

    return NextResponse.json({ message: 'Favori supprimé' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}