import { NextResponse } from 'next/server';
import { getSession, deleteSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
    });
  } catch (error: unknown) {
    console.error('[auth] session GET error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await deleteSession();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[auth] session DELETE error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
