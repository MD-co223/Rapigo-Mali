import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;

    const where: Record<string, unknown> = {};
    if (!isAdmin) {
      where.userId = auth.userId;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    if (status) where.status = status;

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('List tickets error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: 'Sujet et description requis' }, { status: 400 });
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId: auth.userId,
        subject,
        description,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}