/**
 * FedaPay Integration Library for Rapigo Mali
 * 
 * Handles SDK initialization, transaction creation,
 * and webhook signature verification for FedaPay payments.
 * 
 * Environment variables:
 * - FEDAPAY_SECRET_KEY: Server-side API key (NEVER exposed to client)
 * - FEDAPAY_PUBLIC_KEY: Client-side public key (safe for frontend)
 * - FEDAPAY_ENVIRONMENT: "sandbox" or "live"
 */

import { FedaPay, Transaction, Customer, WebhookSignature } from 'fedapay';

// ============================================
// TYPES
// ============================================

export interface FedaPayTransactionResult {
  /** FedaPay transaction ID */
  transactionId: number;
  /** Our internal reference (order number) */
  reference: string;
  /** Token used to open the FedaPay checkout */
  token: string;
  /** FedaPay payment URL to redirect the user to */
  paymentUrl?: string;
  /** Transaction status from FedaPay */
  status: string;
}

export interface FedaPayWebhookEvent {
  id: string;
  entity: string;
  event: string;
  data: {
    id: number;
    reference: string;
    description: string;
    amount: number;
    status: string;
    transaction_id?: string;
    customer?: {
      firstname: string;
      lastname: string;
      email: string;
      phone_number?: string;
    };
    mode?: string;
    created_at: string;
    updated_at: string;
    fees?: number;
    currency?: { iso: string };
    metadata?: Record<string, unknown>;
  };
  created_at: string;
}

export type FedaPayPaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'TRANSFERRED'
  | 'REFUNDED';

// ============================================
// SDK INITIALIZATION
// ============================================

let initialized = false;

/**
 * Initialize the FedaPay SDK with server-side credentials.
 * Must be called before any FedaPay operation.
 * Uses environment variables — never hardcode keys.
 */
export function initFedaPay(): void {
  if (initialized) return;

  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  const environment = process.env.FEDAPAY_ENVIRONMENT || 'sandbox';

  if (!secretKey) {
    throw new Error(
      'FEDAPAY_SECRET_KEY environment variable is required. ' +
      'Set it in .env (local) or Vercel project settings (production).'
    );
  }

  FedaPay.setApiKey(secretKey);
  FedaPay.setEnvironment(environment);
  initialized = true;
}

/**
 * Lazy initialization — safe to call multiple times.
 * Returns true if initialization succeeded.
 */
export function ensureFedaPayInitialized(): boolean {
  try {
    initFedaPay();
    return true;
  } catch {
    return false;
  }
}

// ============================================
// TRANSACTION CREATION
// ============================================

/**
 * Create a FedaPay transaction for an order.
 * 
 * @param params - Transaction parameters
 * @returns FedaPay transaction result with token for checkout
 * @throws Error if SDK not configured or FedaPay API fails
 */
export async function createFedaPayTransaction(params: {
  /** Unique order reference (used as FedaPay description/reference) */
  orderReference: string;
  /** Amount in XOF (smallest unit: 1 FCFA = 1) */
  amount: number;
  /** Customer information */
  customer: {
    firstname: string;
    lastname: string;
    email?: string;
    phone_number?: string;
  };
  /** URL to redirect after payment (mobile web) */
  callbackUrl?: string;
  /** Full app URL for building webhook/callback URLs */
  appUrl?: string;
}): Promise<FedaPayTransactionResult> {
  initFedaPay();

  const { orderReference, amount, customer, callbackUrl, appUrl } = params;
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://rapigo-mali.vercel.app';

  // Create the transaction on FedaPay
  const transaction = await Transaction.create({
    description: `Commande Rapigo Mali - ${orderReference}`,
    amount,
    currency: { iso: 'XOF' },
    callback_url: callbackUrl || `${baseUrl}/api/payments/callback?ref=${orderReference}`,
    customer: {
      firstname: customer.firstname || 'Client',
      lastname: customer.lastname || 'Rapigo',
      email: customer.email || 'client@rapigo.ml',
      phone_number: customer.phone_number,
    },
  });

  // Generate a payment token
  const tokenResult = await transaction.generateToken();

  return {
    transactionId: transaction.id,
    reference: transaction.reference || orderReference,
    token: (tokenResult as any).token || (tokenResult as any).item?.token || '',
    paymentUrl: `https://checkout.fedapay.com/${(tokenResult as any).token || ''}`,
    status: transaction.status,
  };
}

// ============================================
// TRANSACTION RETRIEVAL
// ============================================

/**
 * Retrieve a FedaPay transaction by its ID.
 * Useful for checking payment status after callback.
 */
export async function getFedaPayTransaction(transactionId: number): Promise<any> {
  initFedaPay();
  return Transaction.retrieve(transactionId);
}

/**
 * Map FedaPay status to our internal Payment status.
 */
export function mapFedaPayStatus(fedaStatus: string): {
  paymentStatus: string;
  orderStatus: string;
} {
  switch (fedaStatus) {
    case 'approved':
    case 'transferred':
      return { paymentStatus: 'PAID', orderStatus: 'CONFIRMED' };
    case 'declined':
      return { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' };
    case 'canceled':
    case 'expired':
      return { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' };
    case 'refunded':
    case 'partially_refunded':
    case 'approved_partially_refunded':
    case 'transferred_partially_refunded':
      return { paymentStatus: 'REFUNDED', orderStatus: 'REFUNDED' };
    case 'pending':
    default:
      return { paymentStatus: 'PENDING', orderStatus: 'PAYMENT_PENDING' };
  }
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

/**
 * Verify a FedaPay webhook signature.
 * 
 * @param payload - Raw request body as string
 * @param signature - Value of the FedaPay-Signature header
 * @param secret - Webhook secret from FedaPay dashboard
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.warn('[FedaPay] Webhook secret not configured — skipping signature verification');
    return false;
  }

  try {
    return WebhookSignature.verifyHeader(payload, signature, secret);
  } catch (error) {
    console.error('[FedaPay] Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Parse and validate a FedaPay webhook event.
 * 
 * @param body - Parsed JSON body from the webhook request
 * @returns Parsed webhook event or null if invalid
 */
export function parseWebhookEvent(body: unknown): FedaPayWebhookEvent | null {
  try {
    const event = body as FedaPayWebhookEvent;
    if (!event?.entity || !event?.event || !event?.data) {
      console.warn('[FedaPay] Invalid webhook event structure');
      return null;
    }
    return event;
  } catch (error) {
    console.error('[FedaPay] Failed to parse webhook event:', error);
    return null;
  }
}

// ============================================
// PUBLIC KEY HELPER (safe for client)
// ============================================

/**
 * Get the FedaPay public key.
 * This can be exposed to the client side via API.
 */
export function getPublicKey(): string {
  return process.env.FEDAPAY_PUBLIC_KEY || '';
}

/**
 * Get the FedaPay environment.
 */
export function getEnvironment(): string {
  return process.env.FEDAPAY_ENVIRONMENT || 'sandbox';
}