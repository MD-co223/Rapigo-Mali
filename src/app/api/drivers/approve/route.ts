import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/drivers/approve - Verify or unverify a driver
export async function POST(request: NextRequest) {
  try {
    const { driverId, approve } = await request.json();
    if (!driverId) {
      return NextResponse.json({ error: 'driverId requis' }, { status: 400 });
    }

    const driver = await db.driver.update({
      where: { id: driverId },
      data: { isVerified: approve },
      include: { user: { select: { id: true, firstName: true, email: true } } },
    });

    // Notify the driver
    await db.notification.create({
      data: {
        userId: driver.userId,
        title: approve ? 'Documents vérifiés' : 'Documents rejetés',
        message: approve
          ? 'Vos documents ont été vérifiés. Vous pouvez maintenant accepter des courses.'
          : 'Vos documents n\'ont pas été validés. Veuillez les soumettre à nouveau.',
        type: 'SYSTEM',
      },
    });

    await db.auditLog.create({
      data: {
        userId: driver.userId,
        action: approve ? 'APPROVE_DRIVER' : 'REJECT_DRIVER',
        entity: 'Driver',
        entityId: driverId,
      },
    });

    return NextResponse.json({ success: true, isVerified: driver.isVerified });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}