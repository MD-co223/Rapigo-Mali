import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const settings = await db.setting.findMany({
      orderBy: { group: 'asc' },
    });

    // Group settings
    const grouped: Record<string, Record<string, string>> = {};
    settings.forEach((s) => {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    });

    return NextResponse.json({ settings, grouped });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'settings (tableau) requis' }, { status: 400 });
    }

    const results = await Promise.all(
      settings.map(async (s: { key: string; value: string; type?: string; group?: string }) => {
        if (!s.key) return null;
        return db.setting.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            value: String(s.value),
            type: s.type || 'STRING',
            group: s.group || 'GENERAL',
          },
          update: {
            value: String(s.value),
            ...(s.type && { type: s.type }),
            ...(s.group && { group: s.group }),
          },
        });
      })
    );

    return NextResponse.json({ message: 'Paramètres mis à jour', results: results.filter(Boolean) });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}