import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken } from '@/lib/auth';
import { db } from '@/db';
import { intakeSessions } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.token ?? '').trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, message: 'Missing token' },
        { status: 400 },
      );
    }

    const result = await verifyMagicToken(token);

    if (!result) {
      return NextResponse.json(
        { ok: false, message: 'Invalid or expired token' },
        { status: 401 },
      );
    }

    // Check if user has existing intake sessions
    const existing = await db.query.intakeSessions.findFirst({
      where: and(
        eq(intakeSessions.userId, result.userId),
        ne(intakeSessions.status, 'abandoned'),
      ),
    });

    return NextResponse.json({
      ok: true,
      userId: result.userId,
      sessionId: result.sessionId,
      resumed: existing != null,
    });
  } catch (error: unknown) {
    console.error('[auth] verify error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
