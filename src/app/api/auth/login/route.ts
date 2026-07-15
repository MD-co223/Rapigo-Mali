import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        client: true,
        merchant: true,
        driver: true,
        wallets: { select: { id: true, balance: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Compte désactivé' }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    });

    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Ensure wallet exists
    const existingWallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (!existingWallet) {
      await db.wallet.create({
        data: { userId: user.id, balance: 0 },
      });
    }

    const { password: _, ...safeUser } = user;

    const response: Record<string, unknown> = {
      user: safeUser,
      token,
    };

    if (user.role === 'MERCHANT' && user.merchant) {
      response.merchant = user.merchant;
    }
    if (user.role === 'DRIVER' && user.driver) {
      response.driver = user.driver;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}