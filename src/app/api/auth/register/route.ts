import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, password, firstName, lastName, role } = await request.json();

    if (!email || !phone || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const exists = await db.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (exists) {
      return NextResponse.json({ error: 'Email ou téléphone déjà utilisé' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        email, phone, password: hashedPassword, firstName, lastName, role,
        isVerified: role === 'ADMIN',
      },
    });

    // Create role-specific profile
    if (role === 'CLIENT') {
      const referralCode = `RAPIGO${firstName.toUpperCase().slice(0, 3)}${Math.floor(Math.random() * 9000) + 1000}`;
      await db.client.create({ data: { userId: user.id, referralCode, city: 'Bamako' } });
      await db.wallet.create({ data: { userId: user.id } });
    } else if (role === 'MERCHANT') {
      await db.merchant.create({
        data: { userId: user.id, businessName: `${firstName} ${lastName}`, phone, address: 'Bamako', city: 'Bamako' },
      });
    } else if (role === 'DRIVER') {
      await db.driver.create({ data: { userId: user.id, vehicleType: 'MOTO' } });
      await db.wallet.create({ data: { userId: user.id } });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      token,
      user: {
        id: user.id, email: user.email, phone: user.phone,
        firstName: user.firstName, lastName: user.lastName, role: user.role, isVerified: user.isVerified,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}