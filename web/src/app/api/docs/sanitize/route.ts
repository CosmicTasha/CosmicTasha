import { NextRequest, NextResponse } from 'next/server';
import { scanText } from '@/lib/sanitization/scanner';

// POST — Scan text for sensitive data (PII, credentials, financial, PHI)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, filename } = body as { text?: string; filename?: string };

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: text (string)' },
        { status: 400 },
      );
    }

    if (text.length > 500_000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length (500,000 characters)' },
        { status: 413 },
      );
    }

    const results = scanText(text);

    const stats = {
      total: results.length,
      critical: results.filter((r) => r.severity === 'critical').length,
      high: results.filter((r) => r.severity === 'high').length,
      medium: results.filter((r) => r.severity === 'medium').length,
      low: results.filter((r) => r.severity === 'low').length,
    };

    return NextResponse.json({ results, stats, filename });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
