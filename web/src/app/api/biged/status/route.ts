import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// GET /api/biged/status — proxies biged-rs fleet status for client components
// ---------------------------------------------------------------------------

export async function GET() {
  const bigedUrl = process.env.BIGED_URL || 'http://localhost:5555';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${bigedUrl}/api/status`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ connected: false });
    }

    const data = await res.json();
    return NextResponse.json({ connected: true, ...data });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
