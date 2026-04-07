import { NextRequest, NextResponse } from 'next/server';
import { createMagicToken } from '@/lib/auth';
import { getEmailProvider } from '@/lib/auth/email/provider';

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

    const emailProvider = getEmailProvider();
    await emailProvider.sendMagicLink(email, token, magicLink);

    return NextResponse.json({ ok: true, message: 'Check your email' });
  } catch (error: unknown) {
    console.error('[auth] magic-link error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
