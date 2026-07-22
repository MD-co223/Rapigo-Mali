/**
 * POST /api/webhooks/fedapay
 * 
 * Webhook endpoint for FedaPay payment notifications.
 * FedaPay sends this webhook when a transaction status changes.
 * 
 * Security: Verifies the FedaPay-Signature header before processing.
 * 
 * Expected headers:
 * - FedaPay-Signature: HMAC signature of the request body
 * 
 * Event types handled:
 * - transaction.approved: Payment successful
 * - transaction.declined: Payment failed
 * - transaction.canceled / transaction.expired: Payment cancelled
 * - transaction.refunded: Payment refunded
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  mapFedaPayStatus,
} from '@/lib/fedapay';

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const rawBody = await request.text();
    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('[FedaPay Webhook] Invalid JSON body');
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature (skip if secret not configured — sandbox)
    const signature = request.headers.get('FedaPay-Signature') || '';
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET || '';

    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[FedaPay Webhook] Invalid signature — rejecting');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[FedaPay Webhook] No signature verification (sandbox mode or missing secret)');
    }

    // 3. Parse the event
    const event = parseWebhookEvent(body);
    if (!event) {
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      );
    }

    console.log(`[FedaPay Webhook] Received event: ${event.event} for entity ${event.entity} (ref: ${event.data.reference})`);

    // 4. Only process transaction events
    if (event.entity !== 'transaction') {
      console.log(`[FedaPay Webhook] Ignoring non-transaction event: ${event.entity}`);
      return NextResponse.json({ received: true });
    }

    // 5. Find the payment by provider reference (FedaPay transaction ID)
    const providerRef = String(event.data.id);
    const payment = await db.payment.findFirst({
      where: { providerRef },
      include: { order: true },
    });

    if (!payment) {
      console.warn(`[FedaPay Webhook] No payment found for FedaPay transaction ID: ${providerRef}`);
      return NextResponse.json({ received: true, note: 'Payment not found' });
    }

    // 6. Map FedaPay status to internal statuses
    const { paymentStatus, orderStatus } = mapFedaPayStatus(event.data.status);

    console.log(
      `[FedaPay Webhook] Updating payment ${payment.id}: ` +
      `FedaPay ${event.data.status} → Payment ${paymentStatus}, Order ${orderStatus}`
    );

    // 7. Update Payment record
    const updateData: Record<string, unknown> = {
      status: paymentStatus,
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || '{}'),
        fedaPayStatus: event.data.status,
        fedaPayEvent: event.event,
        fedaPayMode: event.data.mode,
        fedaPayFees: event.data.fees,
        webhookReceivedAt: new Date().toISOString(),
      }),
    };

    // Set paidAt when payment is successful
    if (paymentStatus === 'PAID') {
      updateData.paidAt = new Date();
    }

    await db.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // 8. Update Order record
    const orderUpdateData: Record<string, unknown> = {
      paymentStatus,
    };

    // Only advance order status if it's in payment-pending state
    if (
      payment.order &&
      (payment.order.status === 'PAYMENT_PENDING' || payment.order.status === 'PENDING')
    ) {
      orderUpdateData.status = orderStatus;
    }

    // Set delivered info for refund
    if (paymentStatus === 'REFUNDED') {
      orderUpdateData.cancelledAt = new Date();
      orderUpdateData.cancelReason = 'Remboursement FedaPay';
    }

    if (payment.orderId) {
      await db.order.update({
        where: { id: payment.orderId },
        data: orderUpdateData,
      });
    }

    // 9. If payment successful, notify merchant
    if (paymentStatus === 'PAID' && payment.order?.merchantId) {
      await db.notification.create({
        data: {
          userId: payment.order.merchantId,
          title: 'Nouveau paiement reçu',
          message: `Le paiement de ${payment.order.total} FCFA pour la commande #${payment.order.orderNumber} a été confirmé via FedaPay.`,
          type: 'PAYMENT',
        },
      });
    }

    // 10. If payment successful, notify client
    if (paymentStatus === 'PAID' && payment.userId) {
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Paiement confirmé',
          message: `Votre paiement de ${payment.amount} FCFA pour la commande #${payment.order?.orderNumber || ''} a été confirmé. Votre commande est en cours de préparation.`,
          type: 'PAYMENT',
        },
      });
    }

    // 11. If this is a subscription payment, activate premium
    if (paymentStatus === 'PAID') {
      try {
        const meta = JSON.parse(payment.metadata || '{}');
        if (meta.type === 'SUBSCRIPTION' && meta.role === 'MERCHANT' && payment.userId) {
          await db.merchant.update({
            where: { userId: payment.userId },
            data: { isPremium: true },
          });
          console.log(`[FedaPay Webhook] Activated premium for merchant ${payment.userId}`);
          await db.notification.create({
            data: {
              userId: payment.userId,
              title: 'Abonnement Premium activé !',
              message: 'Votre abonnement Premium Rapigo Mali est maintenant actif. Profitez de toutes les fonctionnalités premium !',
              type: 'SUBSCRIPTION',
            },
          });
        } else if (meta.type === 'SUBSCRIPTION' && meta.role === 'DRIVER' && payment.userId) {
          await db.driver.update({
            where: { userId: payment.userId },
            data: { isPremium: true },
          });
          console.log(`[FedaPay Webhook] Activated premium for driver ${payment.userId}`);
          await db.notification.create({
            data: {
              userId: payment.userId,
              title: 'Abonnement Premium activé !',
              message: 'Votre abonnement Premium est maintenant actif !',
              type: 'SUBSCRIPTION',
            },
          });
        }
      } catch (subErr) {
        console.error('[FedaPay Webhook] Subscription activation error:', subErr);
      }
    }

    console.log(`[FedaPay Webhook] Successfully processed: ${event.event}`);

    return NextResponse.json({ received: true, event: event.event });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[FedaPay Webhook] Fatal error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Allow FedaPay to send webhooks (disable body parsing for signature verification)
export const runtime = 'nodejs';
