import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ── Input validation helpers ──

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Malian phone: +223 XX XX XX XX or 0X XX XX XX (total 8-10 digits after prefix)
const PHONE_REGEX = /^(\+223|0)[0-9]{8,9}$/;

// Strip any HTML tags and trim
function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim().slice(0, 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password, firstName, lastName, role, paymentProof } = body;

    if (!email || !phone || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Sanitize text inputs (strip HTML tags)
    const cleanFirstName = sanitizeText(firstName);
    const cleanLastName = sanitizeText(lastName);

    if (!cleanFirstName || !cleanLastName) {
      return NextResponse.json({ error: 'Les noms sont requis' }, { status: 400 });
    }

    const validRoles = ['CLIENT', 'MERCHANT', 'DRIVER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
    }

    // Validate email format
    const cleanEmail = String(email).toLowerCase().trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
    }

    // Validate phone number (Mali format)
    const cleanPhone = String(phone).replace(/\s/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json({ error: 'Format de numéro invalide. Utilisez +223 XX XX XX XX ou 0X XX XX XX XX' }, { status: 400 });
    }

    // Validate business name for merchants (sanitize HTML)
    let cleanBusinessName: string | undefined;
    if (role === 'MERCHANT' && body.businessName) {
      cleanBusinessName = sanitizeText(body.businessName);
      if (!cleanBusinessName) {
        return NextResponse.json({ error: 'Le nom de l\'entreprise est requis' }, { status: 400 });
      }
    }

    const existingEmail = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    const existingPhone = await db.user.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const user = await db.user.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        firstName: cleanFirstName,
        lastName: cleanLastName,
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
          businessName: cleanBusinessName || `${cleanFirstName} ${cleanLastName}`,
          address: '',
          phone: cleanPhone,
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

    // Re-fetch user with profiles (created after user creation above)
    const userWithProfile = await db.user.findUnique({
      where: { id: user.id },
      include: { client: true, merchant: true, driver: true },
    });

    const { password: _, ...safeUser } = (userWithProfile || user);

    // Handle payment proof for MERCHANT / DRIVER registration
    let proofUrl: string | null = null;
    if ((role === 'MERCHANT' || role === 'DRIVER') && paymentProof) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'registration');
        await mkdir(uploadsDir, { recursive: true });
        const base64Data = paymentProof.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${user.id}.png`;
        const filePath = path.join(uploadsDir, filename);
        await writeFile(filePath, buffer);
        proofUrl = `/uploads/registration/${filename}`;
      } catch (imgErr) {
        console.error('Failed to save registration proof:', imgErr);
        // Non-blocking: registration still succeeds
      }
    }

    // Notify SUPER_ADMIN users about new registration payment
    if (role === 'MERCHANT' || role === 'DRIVER') {
      try {
        const superAdmins = await db.user.findMany({
          where: { isSuperAdmin: true },
          select: { id: true },
        });
        const roleLabel = role === 'MERCHANT' ? 'Commerçant' : 'Livreur';
        for (const admin of superAdmins) {
          await db.notification.create({
            data: {
              userId: admin.id,
              title: `Nouvelle inscription ${roleLabel}`,
              message: `${cleanFirstName} ${cleanLastName} (${cleanEmail}, ${cleanPhone}) s'est inscrit(e) comme ${roleLabel.toLowerCase()}. ${proofUrl ? 'Preuve de paiement jointe.' : 'Aucune preuve de paiement fournie.'}`,
              type: 'PAYMENT',
              data: JSON.stringify({
                userId: user.id,
                userName: `${cleanFirstName} ${cleanLastName}`,
                email: cleanEmail,
                phone: cleanPhone,
                role,
                proofUrl,
                timestamp: new Date().toISOString(),
              }),
            },
          });
        }
      } catch (notifErr) {
        console.error('Failed to create registration notification:', notifErr);
      }
    }

    return NextResponse.json({
      user: safeUser,
      token,
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: Record<string, unknown> };
      if (prismaError.code === 'P2002' && prismaError.meta?.target) {
        const target = prismaError.meta.target as string[];
        if (target.includes('email')) {
          return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
        }
        if (target.includes('phone')) {
          return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 });
        }
      }
    }
    return NextResponse.json({ error: 'Erreur serveur, veuillez réessayer' }, { status: 500 });
  }
}