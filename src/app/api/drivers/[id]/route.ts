import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const driver = await db.driver.findUnique({ where: { id } });
    if (!driver) {
      return NextResponse.json({ error: 'Chauffeur non trouvé' }, { status: 404 });
    }

    await db.driver.delete({ where: { id } });

    return NextResponse.json({ message: 'Chauffeur supprimé' });
  } catch (error) {
    console.error('Delete driver error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}