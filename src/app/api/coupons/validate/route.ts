import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { code, merchantId, orderTotal } = body;

    if (!code || !orderTotal) {
      return NextResponse.json({ error: 'Code et montant de commande requis' }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Code invalide' });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: 'Code inactif' });
    }

    const now = new Date();
    if (coupon.startDate > now) {
      return NextResponse.json({ valid: false, error: 'Code pas encore valide' });
    }
    if (coupon.endDate < now) {
      return NextResponse.json({ valid: false, error: 'Code expiré' });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: 'Nombre maximum d\'utilisations atteint' });
    }

    if (coupon.minOrder && orderTotal < coupon.minOrder) {
      return NextResponse.json({
        valid: false,
        error: `Commande minimum de ${coupon.minOrder} FCFA requise`,
      });
    }

    // Check merchant-specific coupon
    if (coupon.merchantId && merchantId && coupon.merchantId !== merchantId) {
      return NextResponse.json({ valid: false, error: 'Code non valide pour ce marchand' });
    }

    // Check if client already used this coupon
    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    if (client) {
      const alreadyUsed = await db.couponUsage.findFirst({
        where: { couponId: coupon.id, clientId: client.id },
      });
      if (alreadyUsed) {
        return NextResponse.json({ valid: false, error: 'Code déjà utilisé' });
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.round(orderTotal * coupon.value / 100);
    } else if (coupon.type === 'FIXED') {
      discount = coupon.value;
    } else if (coupon.type === 'FREE_DELIVERY') {
      discount = 0; // Handled separately in order creation
    }

    // Ensure discount doesn't exceed order total
    if (coupon.type !== 'FREE_DELIVERY') {
      discount = Math.min(discount, orderTotal);
    }

    return NextResponse.json({
      valid: true,
      discount,
      type: coupon.type,
      couponId: coupon.id,
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}