import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { intakeSessions } from '@/db/schema';

// POST — Create a new anonymous intake session
export async function POST() {
  try {
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h TTL

    const [session] = await db
      .insert(intakeSessions)
      .values({
        status: 'in_progress',
        currentStage: 0,
        expiresAt,
      })
      .returning({ id: intakeSessions.id });

    return NextResponse.json({ id: session.id }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — Resume a session by ID (?id=xxx)
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const session = await db.query.intakeSessions.findFirst({
      where: eq(intakeSessions.id, id),
      with: { answers: true, companyProfile: true, gaps: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check expiry
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
