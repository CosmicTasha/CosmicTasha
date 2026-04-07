import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/doc-gen/templates';
import { generateDocument } from '@/lib/doc-gen/generator';
import type { GeneratedDocument } from '@/lib/doc-gen/types';
import { soc2Templates, soc2Engine } from '@/lib/compliance-kb';
import { InferenceRouter } from '@/lib/inference/router';

// Shared inference router for compliance path
const complianceRouter = new InferenceRouter();

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

    // Extract company profile from answers
    const companyProfile: Record<string, string> = {
      name: (answers['q1.1'] as string) || 'Your Company',
      size: (answers['q1.3'] as string) || 'Unknown',
      description: (answers['q1.4'] as string) || '',
    };

    const answerMap = answers as Record<string, unknown>;

    // -----------------------------------------------------------------------
    // Compliance path — ComplianceTemplate + InferenceRouter + scoring
    // -----------------------------------------------------------------------
    const complianceTemplate = soc2Templates.find((t) => t.id === templateId);

    if (complianceTemplate) {
      // Score the intake answers
      const score = soc2Engine.score(answerMap);

      // Generate each section
      const sections: Array<{
        title: string;
        content: string;
        type: 'interpolate' | 'ai_generate';
        reviewTag?: boolean;
        provider?: string;
      }> = [];

      for (const section of complianceTemplate.sections) {
        if (section.type === 'interpolate' && section.template) {
          // Simple interpolation — replace {{key}} with companyProfile values
          let content = section.template;
          for (const [key, value] of Object.entries(companyProfile)) {
            content = content.replace(
              new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
              String(value ?? ''),
            );
          }
          sections.push({
            title: section.title,
            content,
            type: 'interpolate' as const,
          });
        } else if (section.type === 'ai_generate' && section.prompt) {
          // Build context from answers using prompt's requiredContext keys
          const contextData = section.prompt.requiredContext
            .map(
              (key) =>
                `${key}: ${JSON.stringify(answerMap[key] ?? 'not provided')}`,
            )
            .join('\n');

          const fullPrompt = `${section.prompt.instruction}\n\nContext:\n${contextData}`;

          const result = await complianceRouter.generate(
            fullPrompt,
            section.prompt.system,
            { temperature: 0.4, maxTokens: 800 },
          );

          sections.push({
            title: section.title,
            content: result.text,
            type: 'ai_generate' as const,
            reviewTag: section.reviewTag,
            provider: result.provider,
          });
        }
      }

      const doc = {
        id: crypto.randomUUID(),
        templateId,
        status: 'review',
        sections,
        scoreSnapshot: score,
      };

      return NextResponse.json({ document: doc, score });
    }

    // -----------------------------------------------------------------------
    // Fallback path — existing DocTemplate + mockProse pipeline (demo mode)
    // -----------------------------------------------------------------------
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: `Template not found: ${templateId}` },
        { status: 404 },
      );
    }

    const document = await generateDocument(template, answers, {
      name: companyProfile.name,
      size: companyProfile.size,
      description: companyProfile.description,
    });

    // Store in memory
    documentStore.set(document.id, document);

    return NextResponse.json({ document });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[docs/generate] request failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
