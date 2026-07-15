import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { price: 'asc' }],
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('List plans error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, price, duration, features, maxProducts, maxOrders, maxCoupons, priority } = body;

    if (!name || !slug || price === undefined) {
      return NextResponse.json({ error: 'Nom, slug et prix requis' }, { status: 400 });
    }

    const existing = await db.plan.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 });
    }

    const plan = await db.plan.create({
      data: {
        name,
        slug,
        price: Math.round(price),
        duration: duration || 30,
        features: features ? JSON.stringify(features) : null,
        maxProducts: maxProducts ?? null,
        maxOrders: maxOrders ?? null,
        maxCoupons: maxCoupons ?? null,
        priority: priority ?? 0,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Create plan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, slug, price, duration, features, maxProducts, maxOrders, maxCoupons, priority, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const plan = await db.plan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan non trouvé' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) {
      if (slug !== plan.slug) {
        const existing = await db.plan.findUnique({ where: { slug } });
        if (existing) {
          return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 });
        }
      }
      data.slug = slug;
    }
    if (price !== undefined) data.price = Math.round(price);
    if (duration !== undefined) data.duration = duration;
    if (features !== undefined) data.features = JSON.stringify(features);
    if (maxProducts !== undefined) data.maxProducts = maxProducts;
    if (maxOrders !== undefined) data.maxOrders = maxOrders;
    if (maxCoupons !== undefined) data.maxCoupons = maxCoupons;
    if (priority !== undefined) data.priority = priority;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await db.plan.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const activeSubs = await db.subscription.count({ where: { planId: id, status: 'ACTIVE' } });
    if (activeSubs > 0) {
      return NextResponse.json({ error: 'Des abonnements actifs utilisent ce plan' }, { status: 400 });
    }

    await db.plan.delete({ where: { id } });

    return NextResponse.json({ message: 'Plan supprimé' });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}