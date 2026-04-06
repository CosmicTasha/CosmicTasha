import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/doc-gen/templates';
import { generateDocument } from '@/lib/doc-gen/generator';
import type { GeneratedDocument } from '@/lib/doc-gen/types';

// ---------------------------------------------------------------------------
// In-memory document store (temporary — no DB persistence yet)
// ---------------------------------------------------------------------------

const documentStore = new Map<string, GeneratedDocument>();

// ---------------------------------------------------------------------------
// POST /api/docs/generate — generate a document from a template + answers
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, answers } = body as {
      templateId: string;
      answers: Record<string, unknown>;
    };

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 },
      );
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'answers object is required' },
        { status: 400 },
      );
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: `Template not found: ${templateId}` },
        { status: 404 },
      );
    }

    // Extract company profile from answers
    const companyProfile = {
      name: (answers['q1.1'] as string) || 'Your Company',
      size: (answers['q1.3'] as string) || 'Unknown',
      description: (answers['q1.4'] as string) || '',
    };

    const document = await generateDocument(template, answers, companyProfile);

    // Store in memory
    documentStore.set(document.id, document);

    return NextResponse.json({ document });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[docs/generate] request failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
