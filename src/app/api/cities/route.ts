import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: { group: 'GENERAL', key: { startsWith: 'city_' } },
    });

    const cities = settings
      .map((s) => {
        try {
          return JSON.parse(s.value);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .map((c: { name: string; quartiers?: string }) => ({
        name: c.name,
        quartiers: c.quartiers ? JSON.parse(c.quartiers) : [],
      }));

    // Fallback if no cities in DB
    if (cities.length === 0) {
      cities.push(
        { name: 'Bamako', quartiers: ['Badalabougou', 'Baco Djicoroni', 'Banconi', 'Boulkassoumbougou', 'Daoudabougou', 'Djicoroni Para', 'Faladiè', 'Hamdallaye', 'Kalaban-Coura', 'Korofina', 'Lafiabougou', 'Mahamana', 'Missabougou', 'Niamakoro', 'Quinzambougou', 'Sabalibougou', 'Sekoro', 'Sotuba', 'Tokorou', 'Yirimadio'] },
        { name: 'Ségou', quartiers: ['Ségou ville', 'Sokolo', 'Markala', 'San'] },
      );
    }

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Get cities error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}