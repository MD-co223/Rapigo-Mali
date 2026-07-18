import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (auth.role !== 'MERCHANT' && auth.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Accès réservé aux commerçants et livreurs' }, { status: 403 });
    }

    const body = await request.json();
    const { proofImage } = body;

    if (!proofImage) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 });
    }

    // Save image to public/uploads/registration/
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'registration');
    await mkdir(uploadsDir, { recursive: true });
    const base64Data = proofImage.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${auth.userId}.png`;
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    const proofUrl = `/uploads/registration/${filename}`;

    // Notify SUPER_ADMIN users
    const superAdmins = await db.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true },
    });

    const user = await db.user.findUnique({ where: { id: auth.userId } });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
    const roleLabel = auth.role === 'MERCHANT' ? 'commerçant' : 'livreur';

    for (const admin of superAdmins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: `Nouvelle preuve de paiement — ${roleLabel}`,
          message: `${userName} (${user?.email}, ${user?.phone}) a envoyé une nouvelle preuve de paiement.`,
          type: 'PAYMENT',
          data: JSON.stringify({
            userId: auth.userId,
            userName,
            email: user?.email,
            phone: user?.phone,
            role: auth.role,
            proofUrl,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }

    return NextResponse.json({ success: true, proofUrl });
  } catch (error) {
    console.error('Upload proof error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}