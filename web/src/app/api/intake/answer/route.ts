import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { intakeAnswers, intakeSessions } from '@/db/schema';
import { withAuth } from '@/lib/auth/middleware';
import { verifyOwnership } from '@/lib/auth/session-ownership';

// POST — Save/update a single answer (upsert on sessionId + questionId)
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const { sessionId, questionId, stage, value } = body;

    if (!sessionId || !questionId || stage === undefined || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, questionId, stage, value' },
        { status: 400 },
      );
    }

    if (!(await verifyOwnership(sessionId, session.userId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    // Upsert the answer
    await db
      .insert(intakeAnswers)
      .values({ sessionId, questionId, stage, value })
      .onConflictDoUpdate({
        target: [intakeAnswers.sessionId, intakeAnswers.questionId],
        set: { value, updatedAt: now },
      });

    // Update session lastActivityAt, and bump currentStage if this answer is ahead
    const [intakeSession] = await db
      .select({ currentStage: intakeSessions.currentStage })
      .from(intakeSessions)
      .where(eq(intakeSessions.id, sessionId));

    const updates: Record<string, unknown> = { lastActivityAt: now };
    if (intakeSession && stage > intakeSession.currentStage) {
      updates.currentStage = stage;
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
