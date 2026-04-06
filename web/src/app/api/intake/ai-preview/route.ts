import { NextRequest, NextResponse } from 'next/server';
import { ollamaGenerate } from '@/lib/ollama/client';

// ---------------------------------------------------------------------------
// Mock preview generator (template-based SOC 2 language)
// ---------------------------------------------------------------------------

function generateMockPreview(
  description: string,
  companyName?: string,
  industry?: string[],
): string {
  const name = companyName || 'The Company';
  const industryText = industry?.length
    ? ` serving ${industry.join(', ')} customers`
    : '';

  // Strip leading "we " for a cleaner splice into the template
  const desc = description.trim();
  const normalizedDesc = desc.toLowerCase().startsWith('we ')
    ? desc.slice(3)
    : desc;

  return (
    `${name} provides ${normalizedDesc}${industryText}. ` +
    `The System processes, stores, and transmits data on behalf of its customers using cloud-based infrastructure. ` +
    `${name} has implemented controls to ensure the security, availability, and confidentiality of the data processed by the System, ` +
    `including access controls, encryption in transit and at rest, change management procedures, and incident response capabilities.`
  );
}

// ---------------------------------------------------------------------------
// POST /api/intake/ai-preview
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, companyName, industry } = body as {
      description: string;
      companyName?: string;
      industry?: string[];
    };

    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 },
      );
    }

    // --- Try Ollama inference first ---
    try {
      const result = await ollamaGenerate({
        prompt: `Rewrite the following company description as a SOC 2 Type II System Description. Use formal compliance language. Keep it to 2-3 sentences. Company: ${companyName || 'Unknown'}. Description: ${description}`,
        system: 'You are a SOC 2 compliance writer. Produce concise, formal system descriptions suitable for a SOC 2 Type II report. Output only the system description text, no preamble.',
        temperature: 0.4,
        max_tokens: 300,
      });

      return NextResponse.json({
        preview: result.response,
        source: 'ai' as const,
      });
    } catch (error: unknown) {
      // If Ollama is unreachable or errors, fall through to mock
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[ai-preview] Ollama unavailable, falling back to mock: ${message}`);
    }

    // --- Fallback: mock generator ---
    const preview = generateMockPreview(description, companyName, industry);
    return NextResponse.json({
      preview,
      source: 'mock' as const,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[ai-preview] request failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
