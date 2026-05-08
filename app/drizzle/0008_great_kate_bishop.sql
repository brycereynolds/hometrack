ALTER TABLE "chat_conversations" ADD COLUMN "source_context" jsonb;--> statement-breakpoint

-- ============================================================
-- RLS + Grants for chat_conversations and chat_messages
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;--> statement-breakpoint
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- chat_conversations: users can only see their own conversations
CREATE POLICY "user_own_conversations" ON chat_conversations
  FOR ALL USING (
    user_id IN (
      SELECT id FROM team_members
      WHERE user_id = auth.uid()
    )
  );--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;--> statement-breakpoint
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- chat_messages: users can see messages from conversations they own
CREATE POLICY "user_own_conversation_messages" ON chat_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id IN (
        SELECT id FROM team_members
        WHERE user_id = auth.uid()
      )
    )
  );