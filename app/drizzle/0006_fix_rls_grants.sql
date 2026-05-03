-- Fix missing GRANTs, RLS, and policies for tables added in migrations 0001-0005
-- These tables were created after the initial GRANT ALL TABLES ran in 0000

-- ============================================================
-- 1. GRANT permissions to authenticated role
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_template_tasks TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON field_note_attachments TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON field_note_comments TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;--> statement-breakpoint

-- ============================================================
-- 2. Enable RLS on all tables
-- ============================================================
ALTER TABLE workflow_template_tasks ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE field_note_attachments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE field_note_comments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ============================================================
-- 3. Create RLS policies (matching existing patterns from 0000)
-- ============================================================

-- workflow_template_tasks: indirect via workflow_templates.team_id
CREATE POLICY "team_member_access" ON workflow_template_tasks
  FOR ALL USING (
    template_id IN (
      SELECT id FROM workflow_templates WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );--> statement-breakpoint

-- field_note_attachments: indirect via field_notes.team_id
CREATE POLICY "team_member_access" ON field_note_attachments
  FOR ALL USING (
    field_note_id IN (
      SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );--> statement-breakpoint

-- field_note_comments: indirect via field_notes.team_id
CREATE POLICY "team_member_access" ON field_note_comments
  FOR ALL USING (
    field_note_id IN (
      SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );--> statement-breakpoint

-- chat_conversations: direct team_id
CREATE POLICY "team_member_access" ON chat_conversations
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));--> statement-breakpoint

-- chat_messages: indirect via chat_conversations.team_id
CREATE POLICY "team_member_access" ON chat_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );