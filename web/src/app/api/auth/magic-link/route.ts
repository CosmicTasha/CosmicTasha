import { NextRequest, NextResponse } from 'next/server';
import { createMagicToken } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, message: 'Invalid email address' },
        { status: 400 },
      );
    }

    const token = await createMagicToken(email);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

    // TODO: send email in production (Resend / SES)
    // For now, log the link and return token in dev for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] Magic link for ${email}: ${magicLink}`);
      return NextResponse.json({
        ok: true,
        message: 'Check your email',
        token,
        magicLink,
      });
    }

    return NextResponse.json({ ok: true, message: 'Check your email' });
  } catch (error: unknown) {
    console.error('[auth] magic-link error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
