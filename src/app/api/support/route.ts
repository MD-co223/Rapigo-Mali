import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.userId || !data.subject || !data.description) {
      return NextResponse.json({ error: 'Utilisateur, sujet et description requis' }, { status: 400 });
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId: data.userId,
        subject: data.subject,
        description: data.description,
        status: 'OPEN',
        priority: data.priority || 'MEDIUM',
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}