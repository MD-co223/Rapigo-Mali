import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;

    // Check coupon exists and ownership
    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: 'Coupon non trouvé' }, { status: 404 });

    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;
    const isOwner = auth.role === 'MERCHANT' && coupon.merchantId
      ? (await db.merchant.findUnique({ where: { userId: auth.userId } }))?.id === coupon.merchantId
      : false;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { code, type, value, minOrder, maxUses, startDate, endDate, isActive, merchantId } = body;

    const updated = await db.coupon.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value: Number(value) }),
        ...(minOrder !== undefined && { minOrder: Number(minOrder) }),
        ...(maxUses !== undefined && { maxUses: maxUses ? Number(maxUses) : null }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive }),
        ...(merchantId !== undefined && { merchantId }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;

    // Check coupon exists and ownership
    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: 'Coupon non trouvé' }, { status: 404 });

    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;
    const isOwner = auth.role === 'MERCHANT' && coupon.merchantId
      ? (await db.merchant.findUnique({ where: { userId: auth.userId } }))?.id === coupon.merchantId
      : false;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await db.coupon.delete({ where: { id } });
    return NextResponse.json({ message: 'Coupon supprimé' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}