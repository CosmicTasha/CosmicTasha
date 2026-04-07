import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { intakeSessions } from '@/db/schema';
import { withAuth } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/lib/auth/session-ownership';

// POST — Update session progress (called when completing a stage)
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const { sessionId, stage, readinessScore, persona, auditExperience, urgency, urgencyDeadline } = body;

    if (!sessionId || stage === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, stage' },
        { status: 400 },
      );
    }

    if (!(await verifyOwnership(sessionId, session.userId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      currentStage: stage,
      lastActivityAt: new Date(),
    };

    if (readinessScore !== undefined) updates.readinessScore = readinessScore;
    if (persona !== undefined) updates.persona = persona;
    if (auditExperience !== undefined) updates.auditExperience = auditExperience;
    if (urgency !== undefined) updates.urgency = urgency;
    if (urgencyDeadline !== undefined) updates.urgencyDeadline = urgencyDeadline;

    // Mark completed when all stages are done
    if (stage >= 6) {
      updates.status = 'completed';
    }

    await db
      .update(intakeSessions)
      .set(updates)
      .where(eq(intakeSessions.id, sessionId));

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
