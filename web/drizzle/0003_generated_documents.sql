CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES intake_sessions(id),
  user_id UUID REFERENCES users(id),
  template_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating',
  sections JSONB NOT NULL,
  score_snapshot JSONB,
  biged_profile_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_docs ON generated_documents
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);
