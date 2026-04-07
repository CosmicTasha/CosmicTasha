import { NextRequest, NextResponse } from 'next/server';
import { InferenceRouter } from '@/lib/inference/router';

// Singleton router — reused across requests within a server instance
const inferenceRouter = new InferenceRouter();

// ---------------------------------------------------------------------------
// POST /api/docs/inference
// Generates prose for document sections via InferenceRouter (LocalOllama → OllamaCloud → Mock).
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

    const result = await inferenceRouter.generate(
      prompt,
      system ?? '',
      {
        temperature: temperature ?? 0.4,
        maxTokens: max_tokens ?? 500,
      },
    );

    return NextResponse.json({
      text: result.text,
      model: result.model,
      duration_ms: result.duration_ms,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[docs/inference] inference failed: ${message}`);
    return NextResponse.json(
      { text: null, error: message },
      { status: 503 },
    );
  }
}
