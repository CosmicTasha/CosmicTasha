import { NextRequest, NextResponse } from 'next/server';
import { ollamaGenerate } from '@/lib/ollama/client';

// ---------------------------------------------------------------------------
// POST /api/docs/inference
// Generates prose for document sections via Ollama.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, system, temperature, max_tokens } = body as {
      prompt: string;
      system?: string;
      temperature?: number;
      max_tokens?: number;
    };

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 },
      );
    }

    const result = await ollamaGenerate({
      prompt,
      system,
      temperature: temperature ?? 0.4,
      max_tokens: max_tokens ?? 500,
    });

    const durationMs = result.total_duration
      ? Math.round(result.total_duration / 1_000_000) // nanoseconds to ms
      : 0;

    return NextResponse.json({
      text: result.response,
      model: result.model,
      duration_ms: durationMs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[docs/inference] Ollama inference failed: ${message}`);
    return NextResponse.json(
      { text: null, error: message },
      { status: 503 },
    );
  }
}
