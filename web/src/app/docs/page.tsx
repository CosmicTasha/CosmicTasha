'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  XCircle,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateSummary {
  id: string;
  name: string;
  priority: 1 | 2 | 3;
  sectionCount: number;
  tscCriteria: string[];
}

interface GeneratedDoc {
  id: string;
  templateId: string;
  name: string;
  sections: {
    id: string;
    title: string;
    content: string;
    hasReviewTag: boolean;
    reviewNote?: string;
    status: string;
  }[];
  status: string;
  generatedAt: string;
}

type DocStatus = 'idle' | 'generating' | 'done' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'Priority 1 — Highest Audit Risk';
    case 2:
      return 'Priority 2 — Required';
    case 3:
      return 'Priority 3 — Supporting';
    default:
      return `Priority ${priority}`;
  }
}

function getPriorityBadgeClass(priority: number): string {
  switch (priority) {
    case 1:
      return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
    case 2:
      return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    case 3:
      return 'bg-gray-500/15 text-gray-400 border-gray-500/25';
    default:
      return 'bg-gray-500/15 text-gray-400 border-gray-500/25';
  }
}

function loadAnswers(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem('cosmictasha_intake');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed.answers || {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [templates, setTemplates] = React.useState<TemplateSummary[]>([]);
  const [docStatuses, setDocStatuses] = React.useState<
    Record<string, DocStatus>
  >({});
  const [generatedDocs, setGeneratedDocs] = React.useState<
    Record<string, GeneratedDoc>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [expandedDoc, setExpandedDoc] = React.useState<string | null>(null);

  // Load templates and answers on mount
  React.useEffect(() => {
    const savedAnswers = loadAnswers();
    setAnswers(savedAnswers);

    fetch('/api/docs/templates')
      .then((res) => res.json())
      .then((data: { templates: TemplateSummary[] }) => {
        setTemplates(data.templates);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.warn('[docs] Failed to load templates:', err);
        setLoading(false);
      });
  }, []);

  // Group templates by priority
  const groupedTemplates = React.useMemo(() => {
    const groups: Record<number, TemplateSummary[]> = {};
    for (const t of templates) {
      if (!groups[t.priority]) groups[t.priority] = [];
      groups[t.priority].push(t);
    }
    return groups;
  }, [templates]);

  const priorities = Object.keys(groupedTemplates)
    .map(Number)
    .sort();

  // Generate a single document with simulated delay
  async function generateDoc(templateId: string) {
    setDocStatuses((prev) => ({ ...prev, [templateId]: 'generating' }));

    try {
      // Add a staggered delay for UX realism (1-3 seconds)
      const delay = 1000 + Math.random() * 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const res = await fetch('/api/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, answers }),
      });

      if (!res.ok) {
        throw new Error(`Generation failed: ${res.status}`);
      }

      const data = (await res.json()) as { document: GeneratedDoc };
      setGeneratedDocs((prev) => ({
        ...prev,
        [templateId]: data.document,
      }));
      setDocStatuses((prev) => ({ ...prev, [templateId]: 'done' }));
    } catch (err: unknown) {
      console.warn('[docs] Generation failed:', err);
      setDocStatuses((prev) => ({ ...prev, [templateId]: 'error' }));
    }
  }

  // Generate all Priority 1 documents
  async function generateAllPriority1() {
    const p1Templates = groupedTemplates[1] || [];
    // Stagger generation for UX effect
    for (let i = 0; i < p1Templates.length; i++) {
      const t = p1Templates[i];
      if (docStatuses[t.id] === 'done') continue;
      // Start each one with a slight delay between them
      setTimeout(() => generateDoc(t.id), i * 800);
    }
  }

  const p1Templates = groupedTemplates[1] || [];
  const allP1Done = p1Templates.every(
    (t) => docStatuses[t.id] === 'done',
  );
  const anyP1Generating = p1Templates.some(
    (t) => docStatuses[t.id] === 'generating',
  );

  const totalReviewTags = Object.values(generatedDocs).reduce(
    (count, doc) =>
      count + doc.sections.filter((s) => s.hasReviewTag).length,
    0,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ct-base">
        <Loader2 className="size-6 animate-spin text-ct-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ct-base">
      {/* Header */}
      <header className="border-b border-ct-border-subtle bg-ct-surface">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ct-text-tertiary hover:text-ct-text-secondary transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ct-text-primary">
                Generate Compliance Documents
              </h1>
              <p className="mt-1.5 text-sm text-ct-text-secondary">
                Based on your assessment, we&apos;ll generate{' '}
                <span className="font-medium text-ct-text-primary">
                  {templates.length} documents
                </span>{' '}
                tailored to your company
              </p>
            </div>
            {Object.keys(generatedDocs).length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ct-text-secondary">
                  {Object.keys(generatedDocs).length}/{templates.length}{' '}
                  generated
                </span>
                {totalReviewTags > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                    <AlertTriangle className="size-3" />
                    {totalReviewTags} review{totalReviewTags !== 1 ? 's' : ''}{' '}
                    needed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* No answers warning */}
        {Object.keys(answers).length === 0 && (
          <div className="mb-8 rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-ct-text-primary">
                  No intake data found
                </p>
                <p className="mt-1 text-sm text-ct-text-secondary">
                  Documents will use placeholder values. Complete the{' '}
                  <Link
                    href="/intake"
                    className="text-ct-accent hover:underline"
                  >
                    intake assessment
                  </Link>{' '}
                  first for personalized documents.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Priority groups */}
        {priorities.map((priority) => {
          const group = groupedTemplates[priority];
          return (
            <div key={priority} className="mb-10">
              {/* Group header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-ct-text-primary">
                    {getPriorityLabel(priority)}
                  </h2>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      getPriorityBadgeClass(priority),
                    )}
                  >
                    {group.length} document{group.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {priority === 1 && (
                  <button
                    type="button"
                    onClick={generateAllPriority1}
                    disabled={allP1Done || anyP1Generating}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50',
                      allP1Done
                        ? 'bg-[#34D399]/15 text-[#34D399] cursor-default'
                        : anyP1Generating
                          ? 'bg-ct-surface-raised text-ct-text-tertiary cursor-wait'
                          : 'bg-ct-accent text-white hover:bg-ct-accent/90',
                    )}
                  >
                    {allP1Done ? (
                      <>
                        <CheckCircle className="size-4" />
                        All Generated
                      </>
                    ) : anyP1Generating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Generate All Priority 1
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Template cards */}
              <div className="flex flex-col gap-3">
                {group.map((template) => {
                  const status = docStatuses[template.id] || 'idle';
                  const doc = generatedDocs[template.id];
                  const isExpanded = expandedDoc === template.id;
                  const reviewCount = doc
                    ? doc.sections.filter((s) => s.hasReviewTag).length
                    : 0;

                  return (
                    <div
                      key={template.id}
                      className="rounded-xl border border-ct-border-subtle bg-ct-surface overflow-hidden transition-all duration-200"
                    >
                      {/* Card main row */}
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-lg',
                              status === 'done'
                                ? 'bg-[#34D399]/15 text-[#34D399]'
                                : status === 'error'
                                  ? 'bg-red-500/15 text-red-400'
                                  : 'bg-ct-accent/15 text-ct-accent',
                            )}
                          >
                            {status === 'generating' ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : status === 'done' ? (
                              <CheckCircle className="size-4" />
                            ) : status === 'error' ? (
                              <XCircle className="size-4" />
                            ) : (
                              <FileText className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ct-text-primary truncate">
                              {template.name}
                            </p>
                            <p className="text-xs text-ct-text-tertiary">
                              {template.sectionCount} sections
                              {template.tscCriteria.length > 0 && (
                                <>
                                  {' '}
                                  &middot;{' '}
                                  {template.tscCriteria.slice(0, 3).join(', ')}
                                  {template.tscCriteria.length > 3 && (
                                    <> +{template.tscCriteria.length - 3}</>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {status === 'done' && reviewCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                              <AlertTriangle className="size-3" />
                              {reviewCount}
                            </span>
                          )}

                          {status === 'done' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDoc(
                                  isExpanded ? null : template.id,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-ct-border-subtle bg-ct-surface-raised px-3 py-1.5 text-xs font-medium text-ct-text-secondary hover:text-ct-text-primary hover:border-ct-border-default transition-all duration-200"
                            >
                              {isExpanded ? 'Collapse' : 'Review'}
                              <ChevronRight
                                className={cn(
                                  'size-3 transition-transform duration-200',
                                  isExpanded && 'rotate-90',
                                )}
                              />
                            </button>
                          ) : status === 'error' ? (
                            <button
                              type="button"
                              onClick={() => generateDoc(template.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all duration-200"
                            >
                              Retry
                            </button>
                          ) : status === 'generating' ? (
                            <span className="text-xs text-ct-text-tertiary">
                              Generating...
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => generateDoc(template.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-ct-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-ct-accent/90 transition-all duration-200"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded document preview */}
                      {isExpanded && doc && (
                        <div className="border-t border-ct-border-subtle bg-ct-surface-raised/50">
                          <div className="px-5 py-4 space-y-4">
                            {/* Section list */}
                            {doc.sections.map((section) => (
                              <div
                                key={section.id}
                                className="rounded-lg border border-ct-border-subtle bg-ct-surface p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Shield className="size-3.5 text-ct-accent" />
                                    <h4 className="text-sm font-medium text-ct-text-primary">
                                      {section.title}
                                    </h4>
                                  </div>
                                  {section.hasReviewTag && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                                      <AlertTriangle className="size-3" />
                                      Review needed
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-ct-text-secondary leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto font-mono text-xs">
                                  {section.content.slice(0, 500)}
                                  {section.content.length > 500 && (
                                    <span className="text-ct-text-tertiary">
                                      {'\n'}... ({section.content.length}{' '}
                                      characters total)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Meta */}
                            <div className="flex items-center justify-between text-xs text-ct-text-tertiary pt-2 border-t border-ct-border-subtle">
                              <span>
                                Generated{' '}
                                {new Date(
                                  doc.generatedAt,
                                ).toLocaleString()}
                              </span>
                              <span>
                                {doc.sections.length} sections &middot;{' '}
                                {doc.sections.reduce(
                                  (n, s) => n + s.content.length,
                                  0,
                                ).toLocaleString()}{' '}
                                characters
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
