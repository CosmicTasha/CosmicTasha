import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken } from '@/lib/auth';
import { db } from '@/db';
import { intakeSessions } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing_token', req.url));
    }

    const result = await verifyMagicToken(token);

    if (!result) {
      return NextResponse.redirect(
        new URL('/?error=invalid_token', req.url),
      );
    }

    // Check if user has existing intake sessions
    const existing = await db.query.intakeSessions.findFirst({
      where: and(
        eq(intakeSessions.userId, result.userId),
        ne(intakeSessions.status, 'abandoned'),
      ),
    });

    if (existing) {
      return NextResponse.redirect(
        new URL('/intake?resumed=true', req.url),
      );
    }

    return NextResponse.redirect(new URL('/intake', req.url));
  } catch (error: unknown) {
    console.error('[auth] verify error:', error);
    return NextResponse.redirect(
      new URL('/?error=verification_failed', req.url),
    );
  }
}
