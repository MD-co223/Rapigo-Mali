/**
 * GET /api/payments/callback?ref={orderReference}
 * 
 * Callback URL after FedaPay payment.
 * The user is redirected here after completing (or cancelling) payment.
 * 
 * This page verifies the transaction status with FedaPay API
 * and redirects the user to the appropriate page in the app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFedaPayTransaction, mapFedaPayStatus } from '@/lib/fedapay';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      // No reference — redirect to home
      return NextResponse.redirect(new URL('/?payment=error', request.url));
    }

    // Find the payment by order reference
    const payment = await db.payment.findFirst({
      where: { transactionRef: ref },
      include: { order: true },
    });

    if (!payment) {
      // No payment found — redirect to home
      return NextResponse.redirect(new URL('/?payment=not_found', request.url));
    }

    // Check if already paid
    if (payment.status === 'PAID') {
      const params = new URLSearchParams({ payment: 'success' });
      if (payment.orderId) params.set('orderId', payment.orderId);
      return NextResponse.redirect(new URL(`/?${params}`, request.url));
    }

    // If we have a FedaPay transaction ID, verify with FedaPay API
    if (payment.providerRef) {
      try {
        const fedaTransaction = await getFedaPayTransaction(Number(payment.providerRef));
        const { paymentStatus } = mapFedaPayStatus(fedaTransaction.status);

        // Update payment status based on FedaPay's response
        if (paymentStatus !== payment.status) {
          const updateData: Record<string, unknown> = { status: paymentStatus };
          if (paymentStatus === 'PAID') {
            updateData.paidAt = new Date();
          }

          await db.payment.update({
            where: { id: payment.id },
            data: updateData,
          });

          // Update order status
          const { orderStatus } = mapFedaPayStatus(fedaTransaction.status);
          if (payment.order) {
            const orderUpdateData: Record<string, unknown> = {
              paymentStatus,
            };
            if (
              payment.order.status === 'PAYMENT_PENDING' ||
              payment.order.status === 'PENDING'
            ) {
              orderUpdateData.status = orderStatus;
            }
            await db.order.update({
              where: { id: payment.orderId! },
              data: orderUpdateData,
            });
          }
        }

        // Redirect based on final status
        if (paymentStatus === 'PAID') {
          const params = new URLSearchParams({ payment: 'success' });
          if (payment.orderId) params.set('orderId', payment.orderId);
          return NextResponse.redirect(new URL(`/?${params}`, request.url));
        } else {
          const params = new URLSearchParams({ payment: 'failed', status: paymentStatus });
          if (payment.orderId) params.set('orderId', payment.orderId);
          return NextResponse.redirect(new URL(`/?${params}`, request.url));
        }
      } catch (error) {
        console.error('[FedaPay Callback] Failed to verify transaction:', error);
        // Fall through to redirect with unknown status
      }
    }

    // Fallback — redirect to orders page
    const params = new URLSearchParams({ payment: 'pending' });
    if (payment.orderId) params.set('orderId', payment.orderId);
    return NextResponse.redirect(new URL(`/?${params}`, request.url));
  } catch (error: unknown) {
    console.error('[FedaPay Callback] Error:', error);
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}
