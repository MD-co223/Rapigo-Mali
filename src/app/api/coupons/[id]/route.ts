import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { code, type, value, minOrder, maxUses, startDate, endDate, isActive, merchantId } = body;

    const coupon = await db.coupon.update({
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

    return NextResponse.json(coupon);
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
    const auth = await requireAdmin(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;
    await db.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
