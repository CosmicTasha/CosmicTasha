// ---------------------------------------------------------------------------
// Document generation pipeline types
// ---------------------------------------------------------------------------

export interface DocTemplate {
  id: string;
  name: string;
  priority: 1 | 2 | 3;
  sections: TemplateSection[];
  tscCriteria: string[]; // e.g., ["CC6.1", "CC6.2"]
}

export interface TemplateSection {
  id: string;
  title: string;
  type: 'static' | 'ai_generate' | 'conditional';
  content?: string; // static content or prompt for AI
  condition?: (answers: Record<string, unknown>) => boolean;
  reviewRequired?: boolean;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  name: string;
  sections: GeneratedSection[];
  status: 'generating' | 'generated' | 'in_review' | 'approved';
  generatedAt: string;
  approvedAt?: string;
}

export interface GeneratedSection {
  id: string;
  title: string;
  content: string; // Markdown
  hasReviewTag: boolean;
  reviewNote?: string;
  status: 'pending' | 'approved' | 'flagged';
}
