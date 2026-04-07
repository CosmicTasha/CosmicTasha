-- RLS policies for tenant isolation
-- Anonymous sessions are accessed via service-role connection (bypasses RLS)
-- RLS only applies to authenticated operations

ALTER TABLE intake_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_sessions_select ON intake_sessions
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::uuid);
CREATE POLICY user_sessions_update ON intake_sessions
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true)::uuid);
CREATE POLICY user_sessions_insert ON intake_sessions
  FOR INSERT WITH CHECK (true);

ALTER TABLE intake_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_answers_select ON intake_answers
  FOR SELECT USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));
CREATE POLICY user_answers_modify ON intake_answers
  FOR ALL USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_profiles ON company_profiles
  FOR ALL USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));

ALTER TABLE gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_gaps ON gaps
  FOR ALL USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));
