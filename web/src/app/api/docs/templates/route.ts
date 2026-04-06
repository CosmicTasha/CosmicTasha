import { NextResponse } from 'next/server';
import { allTemplates } from '@/lib/doc-gen/templates';

// ---------------------------------------------------------------------------
// GET /api/docs/templates — list all available document templates
// ---------------------------------------------------------------------------

export async function GET() {
  const templates = allTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    priority: t.priority,
    sectionCount: t.sections.length,
    tscCriteria: t.tscCriteria,
  }));

  return NextResponse.json({ templates });
}
