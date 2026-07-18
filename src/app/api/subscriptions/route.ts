import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'MERCHANT') {
      return NextResponse.json({ error: 'Accès réservé aux marchands' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentMethod, paymentProof } = body;

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Méthode de paiement requise' }, { status: 400 });
    }

    // Find merchant
    const merchant = await db.merchant.findUnique({
      where: { userId: auth.userId },
      include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Profil marchand non trouvé' }, { status: 404 });
    }

    // Check if already has active subscription
    const hasActive = merchant.subscriptions.some(s => s.status === 'ACTIVE');
    if (hasActive) {
      return NextResponse.json({ error: 'Vous avez déjà un abonnement actif' }, { status: 400 });
    }

    // Find the premium lifetime plan
    const plan = await db.plan.findFirst({
      where: { slug: 'PREMIUM_LIFETIME', isActive: true },
    });

    let selectedPlan = plan;
    if (!selectedPlan) {
      // Fallback: find any active plan
      selectedPlan = await db.plan.findFirst({ where: { isActive: true } });
      if (!selectedPlan) {
        return NextResponse.json({ error: 'Aucun plan disponible' }, { status: 404 });
      }
    }

    // Calculate end date (plan.duration days from now, or 10 years for lifetime)
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (selectedPlan.slug === 'PREMIUM_LIFETIME' || selectedPlan.duration >= 3650) {
      endDate.setFullYear(endDate.getFullYear() + 10);
    } else {
      endDate.setDate(endDate.getDate() + (selectedPlan.duration || 30));
    }

    // Create the subscription
    const subscription = await db.subscription.create({
      data: {
        merchantId: merchant.id,
        planId: selectedPlan.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: false,
      },
      include: { plan: true },
    });

    // Create notification for the merchant with payment info
    await db.notification.create({
      data: {
        userId: auth.userId,
        title: 'Abonnement Premium activé',
        message: `Votre abonnement ${selectedPlan.name} est maintenant actif. Profitez de toutes les fonctionnalités premium !`,
        type: 'SUBSCRIPTION',
        data: JSON.stringify({
          subscriptionId: subscription.id,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: selectedPlan.price,
          paymentMethod,
          paymentProof: paymentProof || null,
        }),
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}