import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { intakeSessions } from '@/db/schema';
import { withAuth } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/lib/auth/session-ownership';

// POST — Create a new anonymous intake session (public — no auth required)
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

// GET — Resume a session by ID (?id=xxx) — protected with auth + ownership
export const GET = withAuth(async (req: Request, session) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return Response.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    if (!(await verifyOwnership(id, session.userId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const intakeSession = await db.query.intakeSessions.findFirst({
      where: eq(intakeSessions.id, id),
      with: { answers: true, companyProfile: true, gaps: true },
    });

    if (!intakeSession) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check expiry
    if (intakeSession.expiresAt && new Date(intakeSession.expiresAt) < new Date()) {
      return Response.json({ error: 'Session expired' }, { status: 404 });
    }

    return Response.json(intakeSession);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
});
