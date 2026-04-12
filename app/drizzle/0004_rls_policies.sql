-- ============================================================
-- 0004_rls_policies.sql
-- Enable Row Level Security on all tables with team-scoped
-- access policies for self-hosted Supabase + GoTrue auth.
-- ============================================================

-- 1. auth.uid() helper (self-hosted Supabase may not have it)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', TRUE)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  )
$$;

-- 2. FK from team_members.user_id → auth.users(id)
ALTER TABLE team_members
  ADD CONSTRAINT team_members_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. RLS helper: returns all team_ids for a given auth user
CREATE OR REPLACE FUNCTION public.get_team_ids_for_user(user_uuid uuid)
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = user_uuid::text
$$;

-- 4. Grant schema usage to Supabase roles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================
-- 5. Enable RLS + create policies
-- ============================================================

-- --------------------------------------------------------
-- Pattern A: Tables with direct team_id column
-- --------------------------------------------------------

-- teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON teams
  FOR ALL USING (id IN (SELECT get_team_ids_for_user(auth.uid())));

-- team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON team_members
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON listings
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON tasks
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON offers
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- showings
ALTER TABLE showings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON showings
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- activity_items
ALTER TABLE activity_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON activity_items
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- marketing_assets
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON marketing_assets
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON documents
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON vendors
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON quotes
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON contacts
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- comp_sales
ALTER TABLE comp_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON comp_sales
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON integrations
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- ai_insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON ai_insights
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON files
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- financial_budgets
ALTER TABLE financial_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON financial_budgets
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- pipeline_metrics
ALTER TABLE pipeline_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON pipeline_metrics
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- workflow_templates
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON workflow_templates
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- --------------------------------------------------------
-- Pattern B: Indirect via listing_id (no team_id column)
-- --------------------------------------------------------

-- analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON analytics_events
  FOR ALL USING (
    listing_id IN (
      SELECT id FROM listings WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- analytics_showings
ALTER TABLE analytics_showings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON analytics_showings
  FOR ALL USING (
    listing_id IN (
      SELECT id FROM listings WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- --------------------------------------------------------
-- Pattern C: Indirect via team_member_id
-- --------------------------------------------------------

-- team_performance
ALTER TABLE team_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON team_performance
  FOR ALL USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- --------------------------------------------------------
-- Pattern D: Grandchild tables (no team_id, join through parent)
-- --------------------------------------------------------

-- financial_categories (budget_id → financial_budgets.team_id)
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON financial_categories
  FOR ALL USING (
    budget_id IN (
      SELECT id FROM financial_budgets WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- quote_line_items (quote_id → quotes.team_id)
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON quote_line_items
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- ============================================================
-- 6. Grant table & sequence permissions to authenticated role
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
