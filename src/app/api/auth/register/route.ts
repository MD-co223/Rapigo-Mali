import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password, firstName, lastName, role } = body;

    if (!email || !phone || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const validRoles = ['CLIENT', 'MERCHANT', 'DRIVER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
    }

    const existingEmail = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        isVerified: role === 'CLIENT',
      },
      include: {
        client: true,
        merchant: true,
        driver: true,
      },
    });

    // Create role-specific profile
    if (role === 'CLIENT') {
      await db.client.create({
        data: {
          userId: user.id,
          referralCode,
        },
      });
      await db.wallet.create({
        data: { userId: user.id, balance: 0 },
      });
    } else if (role === 'MERCHANT') {
      await db.merchant.create({
        data: {
          userId: user.id,
          businessName: `${firstName} ${lastName}`,
          address: '',
          phone,
          isApproved: false,
        },
      });
      await db.wallet.create({
        data: { userId: user.id, balance: 0 },
      });
    } else if (role === 'DRIVER') {
      await db.driver.create({
        data: {
          userId: user.id,
          isApproved: false,
        },
      });
      await db.wallet.create({
        data: { userId: user.id, balance: 0 },
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    });

    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      token,
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}