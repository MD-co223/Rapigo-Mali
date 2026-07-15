import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const VALID_METHODS = ['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'VISA', 'MASTERCARD', 'QR_CODE', 'CASH'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const configs = await db.merchantPaymentConfig.findMany({
      where: { merchantId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Get payment configs error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const merchant = await db.merchant.findUnique({ where: { id } });
    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    if (merchant.userId !== auth.userId && auth.role !== 'ADMIN' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { method, isEnabled, phoneNumber, accountName, accountNumber, qrCode, instructions } = body;

    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 });
    }

    const config = await db.merchantPaymentConfig.upsert({
      where: {
        merchantId_method: { merchantId: id, method },
      },
      create: {
        merchantId: id,
        method,
        isEnabled: isEnabled ?? true,
        phoneNumber,
        accountName,
        accountNumber,
        qrCode,
        instructions,
      },
      update: {
        isEnabled: isEnabled ?? true,
        phoneNumber: phoneNumber ?? undefined,
        accountName: accountName ?? undefined,
        accountNumber: accountNumber ?? undefined,
        qrCode: qrCode ?? undefined,
        instructions: instructions ?? undefined,
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Create payment config error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: merchantId } = await params;
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (!configId) {
      return NextResponse.json({ error: 'configId requis' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ error: 'Marchand non trouvé' }, { status: 404 });
    }

    if (merchant.userId !== auth.userId && auth.role !== 'ADMIN' && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await db.merchantPaymentConfig.delete({
      where: { id: configId, merchantId },
    });

    return NextResponse.json({ message: 'Configuration supprimée' });
  } catch (error) {
    console.error('Delete payment config error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}