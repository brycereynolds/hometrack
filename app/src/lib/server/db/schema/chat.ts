import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams, teamMembers } from './team.js';

export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => teamMembers.id, { onDelete: 'cascade' }),
    title: text('title'), // Auto-generated from first message
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('chat_conversations_user_id_idx').on(table.userId),
    index('chat_conversations_team_id_idx').on(table.teamId),
  ],
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id').notNull().references(() => chatConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    toolCalls: jsonb('tool_calls'), // Array of tool call objects
    thinking: text('thinking'), // Claude's thinking/reasoning
    metadata: jsonb('metadata'), // Token usage, model, etc.
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('chat_messages_conversation_id_idx').on(table.conversationId),
  ],
);

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  team: one(teams, { fields: [chatConversations.teamId], references: [teams.id] }),
  user: one(teamMembers, { fields: [chatConversations.userId], references: [teamMembers.id] }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, { fields: [chatMessages.conversationId], references: [chatConversations.id] }),
}));
